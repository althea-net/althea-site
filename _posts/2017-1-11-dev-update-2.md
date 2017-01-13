---
title: "Dev Update 2: Shell Scripts"
layout:     post
summary: "I've been experimenting in CORE with some shell scripts to allow nodes to prioritize traffic to and from their peers."
---

I'm now trying to build a piece of software that does a few things:

- Establishes authenticated tunnels with each of its neighbors. This is so that nodes can reliably tell each others traffic apart. Simply relying on MAC addresses would allow any node to spoof the traffic of another node to get free service.
- Blocks packets that have not come over one of the authenticated tunnels from being forwarded.
- Prioritizes traffic from some neighbors more highly than others. This will ultimately be linked to payment, but for now I'll just pass it in manually.
- Allows nodes to choose what proportion of their total bandwidth they will share/sell.

I've been experimenting in [CORE](/blog/using-core-for-network-simulation/) with some shell scripts to make this stuff happen. I'm going to write the actual software in Go, but shell is great for prototyping. You can call other programs from within the language and shell's jankiness and disposable feel keeps you from getting too fixated on the minor details.

## Tunnels
I'm using [fastd](https://fastd.readthedocs.io/en/v18/) for tunnels because it is easy to use and has a lot of options for customization. It's in userspace, which means that each packet will be copied out of kernel memory and back in several times. This greatly limits bandwidth, so I'll switch to something more efficient like Wireguard at some point.

Right now I'm using this shell script to set up each peer:

```shell
# usage: addpeer <peer_number> <peer_ip> <peer_iface>

mkdir -p peers

peer_number=$1
peer_ip=$2
peer_iface=$3

touch peers/peer$peer_number

echo '
  key "'$(cat /home/jehan2/host/fastd-test/publickey$peer_number)'";
  interface "%n";
  remote "'$peer_ip'" port 1234;
' > peers/peer$peer_number
```

ip route add $peer_ip dev $peer_iface

Fastd uses a `peers/` folder to keep track of its peers. Each peer has a file that contains its public key, address, and other information. Here I'm creating the file for a given peer. I'm copying the public key from a central folder.

To set up a network that looks like `1--2--3`, I run these commands:

On node 1:

```
$ addpeer 2 10.0.0.2 eth0
```

On node 2:

```
$ addpeer 1 10.0.0.1 eth0
$ addpeer 3 10.0.0.3 eth0
```

On node 3:

```
$ addpeer 2 10.0.0.2 eth0
```

Then I run this script on each node to get things started:

```shell
# usage: start <my_number> <my_tunnel_ip>

touch fastd.conf
echo \
'
  bind any:1234; # UDP Port 1234 auf allen Interfaces
  mode multitap;
  method "xsalsa20-poly1305"; # Verschlüsselungsalgorithmus festlegen
  mtu 1426;
  secret "'$(cat /home/jehan2/host/fastd-test/privatekey$1)'";

  include peers from "peers";

  on up "
    ip link set up $INTERFACE
    ip addr add '$2' dev $INTERFACE
    echo interface $INTERFACE | nc ::1 8481
  ";
' > fastd.conf

fastd -d -c fastd.conf
```

This sets up each node's private key and other fastd settings, including the `tunnel_ip`. The `tunnel_ip` is different from the IP that the node has on the physical network. It is only accessible over the authenticated tunnels. I might actually be able to just use the node's normal IP for this, but having it be a different address is a good sanity check.

I also have to set up routes on each node manually. This will be done by the routing protocol, but for these tests I am doing it manually to eliminate any uncertainty.

## Firewall
Nodes do not want to forward any packet that has not come over one of the authenticated tunnels, because this packet has not been paid for. This is actually pretty easy to set up with [nftables](https://wiki.nftables.org/wiki-nftables/index.php/Main_Page), once you understand the syntax and how it operates.

```shell
# usage: addrules <peer_number> ...

nft flush ruleset
nft add table althea
nft add chain althea fwd "{ type filter hook forward priority 0; policy drop; }"

for iif in "$@"
do
  for oif in "$@"
  do
    if [ $iif != $oif ]; then
      nft add rule althea fwd meta iifname "peer$iif" oifname "peer$oif" mark set $iif$oif accept
    fi
  done
done

nft list ruleset -a
```

This script sets up a table and a chain (these are both just containers for organizing the firewall rules). The chain is set up with a default policy of just blocking everything, and it is attached to the `forward` hook which means that it applies to packets that are about to be forwarded by the system. By itself, this chain will prevent the system from forwarding any packets. In the loop the script makes a rule to accept packets for every pair of nodes, and adds a unique mark to them. This will allow us to identify which nodes packets are coming from and going to in the next step.

Running the script

```
$ sh addrules.sh 2 3 4
```

results in this ruleset:

```
table ip althea {
	chain fwd {
		type filter hook forward priority 0; policy drop;
		iifname "peer2" oifname "peer3" mark set 0x00000017 accept 
		iifname "peer2" oifname "peer4" mark set 0x00000018 accept 
		iifname "peer3" oifname "peer2" mark set 0x00000020 accept 
		iifname "peer3" oifname "peer4" mark set 0x00000022 accept 
		iifname "peer4" oifname "peer2" mark set 0x0000002a accept 
		iifname "peer4" oifname "peer3" mark set 0x0000002b accept 
	}
}
```

## Traffic Shaping
Now it is time to prioritize traffic depending on how much nodes are paying. I'm using [tc](http://www.lartc.org/manpages/tc.txt), which is a tool in linux for this purpose. Traffic shaping is a very subtle process and I don't fully understand all the ins and outs yet. Also, tc's syntax is frankly quite cumbersome. Tc lets you set up qdiscs- (short for queueing discipline). There are also filters which can put packets into different classes inside the qdisc depending on different criteria. The qdisc then enqueues packets into the different classes, and either dequeues them to the network or drops them to accomplish its traffic shaping goals.

I'll start with a diagram to explain the shaping setup that I have made, because the tc scripts are hard to follow.

```
qdisc htb- limits all traffic to 10mbit/s
 |
qdisc drr- splits traffic into classes to be prioritized,
based on the marks we added to packets with nftables
 |                            |
filter fw 23                 filter fw 24
 |                            |
class drr quantum 1400        class drr quantum 700       ...etc
 |                            |
qdisc fq_codel               qdisc fq_codel
```

First, the htb qdisc limits all traffic to 10mbit/s. This will allow nodes to choose how much of their bandwidth they wish to sell, and it is necessary for the drr qdisc to function (I'm not entirely sure why).

The drr qdisc has filters attached which put the traffic into its child classes based on the marks we attached to the packets in the firewall step above. Drr operates in a round robin fashion and basically allows each class to transmit "quantum" bytes each round. A class with quantum 1400 should be able to transmit twice as much data as one with quantum 700.

The fq_codel qdisc drops packets that hang around in each queue for too long. It also fairly queues traffic within each class so that, for instance, a large download won't slow down other traffic in the class too much. Without this packets will stay in the queues forever resulting in the system slowing to a crawl.

In the above setup, traffic going from peer 2 to peer 3 will have twice as much bandwidth as traffic going from peer 2 to peer 4.

Here are the scripts:

```shell
# usage: setup <network interface>
dev=$1

# Remove root qdisc (clean slate)
tc qdisc del dev $dev root

# Add root shaping qdisc and class
tc qdisc add dev $dev root handle 1: htb
tc class add dev $dev parent 1: classid 1:1 htb rate 10mbit ceil 10mbit

# Add root drr qdisc
tc qdisc add dev $dev handle 2: parent 1:1 drr

# Add default class
tc class add dev $dev parent 2: classid 2:1 drr

# Send traffic to default class
tc filter add dev $dev parent 1: protocol all prio 2 u32 match u32 0 0 classid 1:1
tc filter add dev $dev parent 2: protocol all prio 2 u32 match u32 0 0 classid 2:1

tc -s class show dev $dev
tc -s filter show dev $dev
```

This sets things up and adds the htb qdisc and the root drr qdisc.

```shell
# usage: addqueue <network interface> <firewall mark> <quantum>
dev=$1
handle=$2
quantum=$3

# Get traffic with a certain fw mark and direct it to the corresponding DRR class
tc filter add dev $dev parent 2: protocol ip prio 1 handle $handle fw classid 2:$handle
tc class add dev $dev parent 2: classid 2:$handle drr quantum $quantum

# This acts to actually drop traffic, making DRR take effect
tc qdisc add dev $dev parent 2:$handle fq_codel

tc -s class show dev $dev
tc -s filter show dev $dev
```

I run this for every child class of the drr qdisc that I want to create. This will typically be once for every rule I set up in the firewall script above.

Using this setup, I am able to prioritize traffic coming from and going to a node's different peers. The next step, which I am working on now, is to automate this all. I'm writing that code in Go.

[Discuss this post on Reddit](https://www.reddit.com/r/altheamesh/comments/5nehvj/dev_update_2_shell_scripts/)