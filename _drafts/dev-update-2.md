---
layout:     post
---

I'm now trying to build a piece of software that does a few things:

- Establishes authenticated tunnels with each of its neighbors. This is so that nodes can reliably tell each others traffic apart. Simply relying on MAC addresses would allow any node to spoof the traffic of another node to get free service. An authenticated tunnel effectively includes a signature with each packet to prevent this. Another way to do this would be to use the authentication built into the wifi standard by establishing a new password-protected wifi network (SSID) between each pair of nodes. This might be faster than using tunnels, but it won't work over ethernet or other kinds of links other than wifi, and some wifi chipsets can only support a limited number of separate SSIDs.
- Blocks packets that have not come over one of the authenticated tunnels from being forwarded.
- Prioritizes traffic from some neighbors more highly than others. This will ultimately be linked to payment, but for now I'll just pass it in manually.
- Allows nodes to choose what proportion of their total bandwidth they will share/sell.

I've been experimenting in [CORE]() with some shell scripts to make this stuff happen. I'm going to write the actual software in Go, but shell is great for prototyping. You can call other programs from within the language and shell's jankiness and disposable feel keeps you from getting too fixated on the minor details.

## Tunnels
I'm using [fastd]() for tunnels because it is easy to use and has a lot of options for customization. It's in userspace, which means that each packet will be copied out of kernel memory and back in several times. This greatly limits bandwidth, so I'll switch to something more efficient like Wireguard at some point.

Right now I'm using this shell script to set up each peer:

    #!/bin/sh
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

    ip route add $peer_ip dev $peer_iface

Fastd uses a `peers/` folder to keep track of its peers. Each peer has a file that contains its public key, address, and other information. Here I'm creating the file for a given peer. I'm copying the public key from a central folder.

To set up a network that looks like `1--2--3`, I run these commands:

On node 1:
`1 $ addpeer 2 10.0.0.2 eth0`

On node 2: 
`2 $ addpeer 1 10.0.0.1 eth0`
`2 $ addpeer 3 10.0.0.3 eth0`

On node 3:
`3 $ addpeer 2 10.0.0.2 eth0`

Then I run this script on each node to get things started:

    #!/bin/sh
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

This sets up each node's private key and other fastd settings, including the `tunnel_ip`. The `tunnel_ip` is different from the IP that the node has on the physical network. It is only accessible over the authenticated tunnels. I might actually be able to just use the node's normal IP for this, but having it be a different address is a good sanity check.

I also have to set up routes on each node manually. This will be done by the routing protocol, but for these tests I am doing it manually to eliminate any uncertainty.

## Firewall
Nodes do not want to forward any packet that has not come over one of the authenticated tunnels. This is actually pretty easy to set up with nftables, once you understand the syntax and how it operates.

