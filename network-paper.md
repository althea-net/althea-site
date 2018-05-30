---
layout: paper
title: Althea network paper
permalink: /network-paper
---

**Jehan Tremback, Justin Kilpatrick**

* **v0.5** May 2017
* **v1** May 2018

As the number of connected individuals and devices expands, the "last mile" continues to be the greatest challenge both in the connected and developing worlds, representing a disproportionate portion of the cost and difficulty of connecting the world ("Last mile" refers to the distance between an internet exchange and a user, often less than 10 miles).

Althea is meant to operate on the last mile, from a source of internet connectivity (such as an internet exchange or tier-1 or -2 network connection, or even a business grade ISP connection) to the end user, and creates a decentralized ISP. The last mile is currently an inefficient market and [many areas only have one ISP](http://transition.fcc.gov/Daily_Releases/Daily_Business/2017/db0503/DOC-344499A1.pdf). Althea aims to replace centralized ISPs with a competitive market of individuals and businesses participating in one decentralized network.

Althea’s goal is for any person to be able to install a piece of equipment, participate in the decentralized ISP, and receive payment for the service.

* Switching costs within the system are reduced, as nodes switch between connectivity providers to find a route with the best combination of reliability, bandwidth, and low cost.

* Advertising and marketing costs for people running nodes are eliminated, as the only advertisements in this system are the automatic advertisements of price and route quality between nodes. This makes things easy for new entrants.

* Contract and billing costs are eliminated by payment channels. Payment channels allow one to make micropayments with very low overhead.

# Overview

Althea allows routers to pay each other for bandwidth using cryptocurrency payment channels. An important architectural detail is that nodes only pay neighbors for forwarding packets. On top of this pay-for-forward network, we build a system allowing consumers to pay for internet access. Althea is intended to be used in local ["mesh"](https://www.cs.columbia.edu/~vpk/papers/wcn.commag11.pdf) networks.

## Network overview

To simplify the explanation of Althea's network architecture we present several roles that devices may perform. Note that these are logical roles, not physical ones. So a single device may perform several or even all of these roles simultaneously:

* **User nodes** are installed by people who want to buy internet access on Althea. You can think of a user node as being similar to the router and/or modem that is installed by a traditional ISP. The difference is that it is independent of any one ISP. User nodes bridge traffic from non-Althea devices into the Althea network by providing Wifi hotspots and/or wired LAN ports.

* **Intermediary nodes** are installed by people who want to earn money by forwarding internet traffic. These will often be more powerful and may be placed in advantageous locations with good line of sight to other nodes. Note that most nodes will be acting as both intermediary nodes and user nodes. The software to buy and sell bandwidth as a user node is necessary and sufficient to be an intermediary node. Sufficiently well placed and powerful home routers may carry a significant amount of traffic and generate nontrivial revenue.

* **Gateway nodes** are intermediary nodes, but they are also connected to a source of cheap internet bandwidth such as an internet exchange, an internet backbone connection, or even a business-grade connection from a conventional ISP. They act as connection from Althea’s physical layer to the outside internet. However, they are shielded from having to take legal responsibility for traffic on the network by the exit nodes.

* **Exit nodes** are not necessarily part of the local physical network, but can be hosted in a datacenter reachable over the internet. They are connected to gateway nodes over VPN tunnels. Exit nodes provide an endpoint to verify quality metrics propagated by nodes in the network. This enables automatic selection of gateway nodes by the routing protocol. Exit nodes also take on the legal role of an ISP, performing network address translation to route requests onto the public internet and dealing with copyright complaints etc. This allows gateway nodes to act as pure providers of bandwidth, without having to take on any legal risk resulting from the use of their service.

Read more about the network architecture in [Network](#network).

## Routing overview

In [Routing](#routing), we define a couple of extensions to the Babel routing protocol. Babel was selected because it has several useful properties for our purpose. However, any distance vector routing protocol could be modified to exhibit the properties Althea requires. Distance vector protocols are already used extensively on the internet. One well-known distance vector protocol is [BGP](https://tools.ietf.org/html/rfc4271).

Routing in distance vector protocols is based on an advertised connection quality metric. Nodes send an announcement packet stating their identity and existence to the network once every predetermined period. These announcement packets are then passed from node to node. Each node updates the metric to reflect the connection quality between it and the neighbor it got the announcement from. Using this information, each node is able to build up a routing table of the best neighbors to forward packets in order to reach any destination on the network in only O(n) time on each node.

We propose two main additions to distance vector routing:

* A verifiable quality metric.
* A price metric.

A verifiable quality metric is a connection quality metric that can be verified by a node and the destination that it is sending packets to. Our first extension to Babel allows nodes to verify the metrics advertised by their neighbors.

To advertise prices a second metric is added to the routing advertisements, this time containing a ‘price’ value for some arbitrary but agreed upon amount of data transfer. When passing advertisements each node updates the price field with their bid for passing data. Routes are then selected by optimizing the quality metric vs the price metric and paying the selected the full sum required to route all the way to the destination.

## Payments overview

Each node on the network establishes payment channels with each of its neighbors. A payment channel is a method for two parties to exchange payments trustlessly by signing transactions that alter the balance of an escrow account held by a bank or blockchain. More detail about the functioning of our payment channels can be found in [Payments](#payments).

The important thing about a payment channel is that after the channel has been opened, and funds have been placed in escrow, individual payments can be made directly between the two parties without submitting anything to the bank or blockchain. This means that the entire payment can be completed in one packet. Most payment systems need to send another transmission to a bank or blockchain, and wait for it to be confirmed.

Using payment channels, nodes can pay each other in very small increments (on the order of cents or less). This allows them to pay their neighbors to forward data without having to place a lot of trust in their neighbors. User nodes also open a payment channel with an exit node of their choice. This channel is used to pay the exit node for routing data onto the internet, as well as paying for return traffic back to the node. Read more about exit nodes in [Network](#network).

## Metering overview

Nodes keep track of data they have forwarded for their neighbors, and how much they have been paid. If these two amounts do not match up, they must having some way of cutting off access to the delinquent neighbor. Blocking the neighbor’s MAC address could be one way to accomplish this, but MAC addresses are easily changed and spoofed. Similarly, exit nodes must be able to protect and identify traffic from user nodes.

In [Authentication](#authentication), we cover the use of tunnels to allow neighbors to verify traffic between one another, as well as allowing exit nodes to authenticate traffic from user nodes.

# Routing

Routing in Althea is based on the [Babel routing protocol](https://tools.ietf.org/html/rfc6126). Babel is a distance vector protocol which has proven to be robust and performant. All distance vector protocols are based on a distributed form of the [Bellman-Ford](https://en.wikipedia.org/wiki/Bellman–Ford_algorithm) pathfinding algorithm. Nodes first perform some kind of link quality test on the connections to their neighbors. This is known as the "link cost". They then share information about which destinations they can reach at which quality (this starts out being only their immediate neighbors).

Whenever a node receives information about a destination, it combines this information with the link cost of the neighbor it received this information from (we will use the word "destination" to refer to the destination of data packets. Babel refers to this as "source", because it is the source of routing packets). This composite score is known as the "route metric", and represents the quality with which the destination can be reached across several hops. The neighbor offering the best metric for a given destination is selected as the next hop. All packets being sent to the destination will go through this neighbor. Babel implements this selection by adding and remove routes from the Linux kernel routing table.

From the Babel specification:

> As many routing algorithms, Babel computes costs of links between any two neighbouring nodes, abstract values attached to the edges between two nodes.
>
> [..]
>
> Given a route between any two nodes, the metric of the route is the sum of the costs of all the edges along the route. The goal of the routing algorithm is to compute, for every source S, the tree of the routes of lowest metric to S.

## Route metric verification

All current distance vector protocols, including Babel, have a major weakness. All information about link cost and route metrics is provided on a completely trusted and unverified basis. There is nothing stopping any node from claiming that it has the best route to any destination. This is usually not a problem, since most networks today are owned by one entity. In Althea, nodes are owned by many people and entities, all competing to provide the best service. Leaving this vulnerability unaddressed would allow financially-motivated attacks, such as nodes claiming to have better routes than they actually do in an effort to get more business.

We propose a modification to the Babel protocol to allow for verification of routes. Our modification involves the addition of a "verifiable metric". We define a "verifiable metric" as a distance vector metric that remains the same when observed end-to-end or by individual nodes. For example round trip time (rtt) as a metric can be summed along the route or computed purely by the source and destination. Using a verifiable metric user nodes and exit nodes can get an independent sample of the connection metric over an encrypted tunnel between them. The tunnel keeps nodes from cheating by prioritizing route verification packets. This technique is known as [stealth probing](ftp://ftp.cs.princeton.edu/techreports/2005/730.pdf).

The metric calculated is expected to be close to the overall metric advertised for the destination by the neighbor currently forwarding packets to the destination. This gives us a way to verify the accuracy of advertised routes. If the metric does not match the metric advertised by the selected neighbor, the neighbor’s [accuracy score](#acccuracy-score) is affected, and the metric through this neighbor is [adjusted](#route-metric-adjustment).

## Verification scheduling

We have the ability to test and verify the routes advertised by neighbors, but we need some way of deciding which routes to verify. Verification runs on a timer. Each verification cycle a node follows this procedure to choose a route `r` to verify:

* Start with the set of all destinations that have been used in the past `x` seconds. `x` will be set at a reasonable constant, or it could be adjusted to control verification focus.
* Select a destination `d` from this set at random.
* Get the set of all routes that are feasible and have a destination of `d`.
* Select a route `r` from this set at random.

To test the route, we send the destination "Remote Hello" packets for some amount of time. The Remote Hello packets are similar to Babel’s local Hello packets, but they also carry information about which neighbor they were sent through. Destinations periodically send "Remote IHU" packets to those nodes they have recently received Remote Hello packets from. Similar to Babel’s link cost calculation, the Remote Hello packets are used by the destination to calculate a route cost, and the Remote IHU packets carry this information back. Remote IHU packets also carry back the information about which neighbor the Remote Hello was sent through.

## Accuracy score

When we get a new verified route metric, we update the neighbor’s accuracy score `s` with the following procedure:

```
d = destination
n = neighbor
c = route cost over tunnel to d
m = route metric advertised for d by n
A = accuracy scores of n, indexed by destination
S = lowest allowed average accuracy score

a = minimum(m/c, 1)
A[d] = (A[d] + a) / 2
s = average(A)

if s < S
    n's routes removed from routing table
```

A per-destination accuracy score `a` is calculated as the proportion of the verified route cost `c` to the route metric `m` advertised by the neighbor `n`. It is then averaged with the current accuracy score for that destination `A[d]`, and `A[d]` is set to the new value. We then take `s`, the average of all active destination accuracy scores for the neighbor. If `s` drops below some adjustable value `S`, the neighbor’s routes are taken off of the kernel routing table.

## Route metric adjustment

The above system is used to weed out chronically inaccurate neighbors, but it also supplies us with a stream of correct route metrics. We can use these metrics to improve our routing table even before a given inaccurate neighbor is dropped. When we receive the route cost `c` above, we can start using it instead of the neighbor’s advertised metric when selecting routes. We continue using `c` for a duration `D`.

How long to make `D`? If `D` is too short, then nodes will go right back to trusting an inaccurate metric that they recently had to correct. If `D` is too long, then nodes will miss out on legitimate updates about newly improved routes.

To strike the right balance, exponentially increasing time-out will be used for bandwidth corrections beyond a small tolerance. A node that has participated in a correction will calculate the duration `d`, how long ago it last performed a correction for a given route and the size of the correction `s`. When participating in another correction on the same route the duration `D` to apply the bandwidth correction will be determined as:

```
D = (C1 / d) ^ C2
```

Where `C1` and `C2` are constants to be adjusted and hardcoded. This formula will make it take longer to go back to using a neighbor’s advertised metrics if the advertised metrics needed to be corrected recently, and/or required a large correction.

## Price metric

We also need a way to propagate a price for each route, and take this price into account when making forwarding decisions. Babel already includes a mechanism for adding arbitrary "External Sources of Willingness". This works by having nodes add a number to the metric they have calculated for a route. This doesn’t work for us for two reasons:

* First, the route metric in our system is verified. Modifying it arbitrarily would break this verification.
* Second, the price must be distinct from the route metric, because it will be used to determine payment amounts. For these reasons, we use a separate price metric.

The requirements of this price metric are very simple, compared to other parts of Althea. It consists of an additional 16 bit price field in each Babel update TLV and in each route in a node’s routing table.

As update packets are propagated through the network, each node increases the route’s price by a certain amount. The simplest way to determine how much to add to the route price is with a constant set by the node’s operator. However, there could be many different types of automated price-setting algorithms to adjust the price based on demand or competition.

Babel’s route selection procedure is extended to take this price field into account. Instead of selecting routes based purely on route metric, an extended metric `m'` is calculated with

```
m'= m+pn
```

Where `m` is the route metric, `p` is the price, and `n` is a constant multiplier. Routes are then chosen based on `m'`. By adjusting `n`, nodes can determine how much weight to give price in the calculation. A node with a lower value for `n` will tend to prefer expensive but higher quality routes.

It would even be possible to populate multiple routing tables with routes selected at different values of `n`, and propagate routes from these tables under different router IDs. This or a similar mechanism could be used to allow neighbors to choose from among a range of price-quality tradeoffs.

# Payments

Nodes in Althea must be able to pay their neighbors to forward packets. It’s advantageous for these payments to be made in very small increments. This prevents nodes from having to trust their neighbors to provide service for a longer amount of time. This allows nodes to securely get service from other nodes that they don’t necessarily know or trust. This is why we use payment channels. Payment channel messages can be very small, around 100-500 bytes. This allows payments to be made in very small increments while incuring almost no overhead.

Even though payments are being made in very small increments, they are still being made incrementally. This implies some small level of trust, and we need to decide whether nodes will pay for forwarding service before receiving and verifying access or after. If they pay before, it would be possible for a malicious node to take the money and provide no service. If they pay after, it would be possible for a malicious node to use the service and then not pay.

We’ve chosen for nodes to pay after receiving service. This is because if nodes pay before, it would be possible for a malicious node to repeatedly accept payment and not provide service (possibly switching identities each time). They could save up their ill-gotten gains and make money with this strategy. On the other hand, if nodes pay after receiving service, malicious nodes that repeatedly receive service and don’t pay will get nothing but a bad connection (you can't save up stolen bandwidth).

## Smart contract

Althea uses [Connext's virtual payment channel contract](https://github.com/ConnextProject/VC-monorepo/blob/8b5c6e6da7be3798d4d48899e402f0952cf9efb5/packages/virtual-channel-ledger-manager/contracts/ChannelManager.sol). This contract is simple and works for Althea's needs.

# Authentication

We’ve set up a system where nodes are able to pay for traffic, but what happens if they don’t pay? There needs to be some control over which neighbors receive internet access. It’s easy to spoof a MAC address, so we need some kind of cryptographic authentication. One way to do cryptographic authentication of packets on radio is [WPA](https://ieeexplore.ieee.org/document/4248378/), but we need something that can be done on wired links too. The best solution for now is to use an encrypted and authenticated tunneling software like [Wireguard](https://www.wireguard.io/papers/wireguard.pdf). A small optimization would be to include authentication information in an IPv6 header extension, instead of encapsulation in tunnel packets with Wireguard. However, Wireguard is already highly optimized, so this is an adequate solution for now.

Nodes create tunnels with each of their neighbors and can allow, block, or shape traffic on each tunnel, depending on payment. Wireguard creates a virtual interface for each tunnel. The virtual interfaces created by the tunnels of all the neighbors on one physical interface are bridged together into another virtual interface for Babel to run on. This preserves some per-interface optimizations made by Babel.

If payment over a neighbor’s payment channel stops, their packets are blocked by the firewall and are no longer forwarded.

Metering from the exit node to the user node is accomplished in the same way. There is also a Wireguard tunnel from the exit node to the user node for other reasons, namely privacy and as a way to use IPv6 on the mesh network, similar to [Lightweight 4over6](https://tools.ietf.org/html/rfc7596). This tunnel provides a good control point for the exit node to cut service to the user node in the case of non-payment.

# Network

The base primitive that Althea is built on is a pay-for-forward network. If all the mechanisms in the preceding sections work correctly, we have a network where nodes can pay each other very granularly for the service of forwarding data, and verify that the forwarding is happening correctly. This section deals with using such a network to provide the one of the most popular network services, internet access.

![](/images/topology.svg)

For a network to provide internet access, there must be at least one node that has a connection to the internet. Hopefully, there will be many. We call such a node a gateway node. A gateway node connects to an exit node over a tunnel. The tunnel creates a virtual interface which Babel is run on, treating it like any other link. The [gateway node/exit node topology](https://sudoroom.org/wiki/Mesh/Network_topology) is used by [WLAN Slovenija](https://wlan-si.net), [PeoplesOpen.net](https://peoplesopen.net), and other community mesh networks.

![](/images/node-diagram-v2.svg)

Babel routes to destinations over tunnel connections just as well as it does over real connections. This means that the nodes do not have to do any kind of explicit gateway selection. Gateway nodes set a price and receive payment for routes to the exit node just like any other route. User nodes are connected to chosen exit nodes over encrypted tunnels, and receive internet access over these tunnels. The only thing that gateway and intermediary nodes see is encrypted traffic between user nodes and exit nodes.

## Exit nodes

Exit nodes perform almost all the functions of an ISP, except for actually carrying packets. This lets the other nodes in the network focus only on connectivity, while exit nodes get paid for interfacing Althea to the rest of the internet, and to the business and legal worlds. Exit nodes fuse Althea’s pseudonymous, trustless, cyptocurrency powered physical layer with our current internet and society. People who are good at providing connectivity can focus on providing connectivity, while exit nodes deal with everything else.

Exit nodes:

**Deal with public IP addresses:**
Exit nodes have public IP addresses and use them to route traffic for connected user nodes to and from the internet. They either perform NAT for user nodes or provision them with public IP addresses if the user nodes are performing NAT themselves (such as in schemes like [Lightweight 4over6](https://tools.ietf.org/html/rfc7596)).

**Provide encrypted tunnels:**
All traffic between user nodes and exit nodes is encapsulated in a tunnel and encrypted. This means that users of a Althea network only have to trust the exit node with their browsing history and unencrypted traffic. Neighbors who are routing traffic for them will only see encrypted packets going to an exit node.

**Verify routes:**
Our extensions to Babel allow nodes to verify routes between themselves and a destination. Exit nodes are the destination for a user node’s outbound traffic, and the user nodes are destinations for the return traffic. User nodes and exit nodes work together to keep the nodes on the Althea network between them accurate. User nodes are implicitly trusting exit nodes to perform route verification accurately.

**Deal with legal considerations:**
We want it to be as easy as possible for someone to set up a gateway node. Part of this is relieving them of any legal worries related to the use of their connection. Any legal complaints related to the use of an Althea network can only be directed the exit nodes, as they are the only ones routing traffic onto the internet and making it visible to the world. Gateway and intermediary nodes only ever see encrypted packets.

**Pay for return traffic:**
User nodes pay their neighbors to forward traffic to the exit node they are using and onto the internet, but someone needs to pay for the traffic coming back. User nodes give exit nodes some money which the exit nodes use to pay their neighbors for the return traffic. Payments from the user node to the exit node are done with payment channels.
