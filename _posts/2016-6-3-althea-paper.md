---
layout:     post
title:      Althea in-progress white paper
summary:    "I'm working on the white paper for the full Althea system. This post is subject to frequent changes."
---

Althea is a set of protocols for a decentralized point-to-point radio network providing connectivity to an area, where participants in the network are able to pay for connectivity, and receive payment for their contributions to the network, without a centralized ISP collecting subscriptions and owning equipment. It combines the commercial viability of a wireless ISP with the decentralized nature of a community mesh network. There are two main components- payments and routing.

## [1] Routing
Nodes route packets using an ad-hoc “mesh” routing protocol. This protocol must take price as well as link quality into account. We define several extensions to Babel, a popular and performant ad-hoc routing protocol.

Here’s an excerpt to give you an idea of how Babel works:

>2.1. Costs, Metrics, and Neighbourship
>
>As many routing algorithms, Babel computes costs of links between any two neighbouring nodes, abstract values attached to the edges between two nodes. We write C(A, B) for the cost of the edge from node A to node B.
>
>Given a route between any two nodes, the metric of the route is the sum of the costs of all the edges along the route.  The goal of the  routing algorithm is to compute, for every source S, the tree of the routes of lowest metric to S.
>
>Costs and metrics need not be integers.  In general, they can be values in any algebra that satisfies two fairly general conditions (Section 3.5.2).
>
>A Babel node periodically broadcasts Hello messages to all of its neighbours; it also periodically sends an IHU ("I Heard You") message to every neighbour from which it has recently heard a Hello.  From the information derived from Hello and IHU messages received from its neighbour B, a node A computes the cost C(A, B) of the link from A to B.

Babel provides a mechanism for extensibility, which is the basis for the modifications defined in this paper.

### [1.2] Babel extension: Price-aware routing

Babel is a good fit for routing based on payments because of its method of operation, known as "distance vector". 

![]({{ site.url }}/images/pir1.png)

Distance vector routing works by assigning a quality metric to the links between nodes, where higher is worse. Nodes then gossip information about which nodes they can reach at which quality. From this information, each node is able to build up a routing table containing the all destinations in the network, along with their composite quality metric, and the neighbor to forward packets for a destination.

![]({{ site.url }}/images/pir2.png)

This extension allows a Babel router to attach information about monetary price to the routes that it maintains. The router also propagates this information to its neighbors, who use it to determine their own prices. The price is taken into account for metric computation and route selection. It is also used by a payment protocol external to Babel (defined below in “Payments”) to pay neighbors to forward data.

#### [1.2.1] Changes to data structures

A router implementing price-aware routing has one additional field in each route table entry:

- A price field, denoting how much the router charges to forward packets along this route. 

#### [1.2.3] Receiving updates

When a node receives an Update TLV, it creates or updates a routing table entry according to Babel, section 3.5.4.  A node that performs price-aware routing extends that procedure by setting the routing table entry price field to `p'`, where: 

    p'=p+l

Let `p` be the price attached to the received Update TLV. Let `l` be the price per kilobyte charged by the Babel router to forward packets along the update’s route. Determination of `l` is implementation-dependent, but for a simple implementation, a single `l` can be used for all routes.

#### [1.2.4] Route selection

Route selection is discussed in Babel, section 3.6. The exact procedure is left as an implementation detail but a simple example is:

>routes with a small metric should be preferred over routes with a   large metric;

Similarly, in price-aware routing, routes with a low price should be preferred over routes with a high price. These two criteria both need to factor into the selection. For example, a combined metric m` could be defined as:

    m'=m+(p*n)

where `m` is the metric, `p` is the price, and `n` is a constant multiplier.

Aside: It was hard to choose whether to make this a route selection procedure, extending section 3.6, or a metric computation, extending section 3.5.2. We chose to make it a route selection procedure, as metrics computed by section 3.5.2 are propagated to a node’s neighbors. Since the price is already propagated by this extension, it seems like a bad idea to propagate it again as a factor in the route metric. There is a possibility that this decision will need to be revisited.

## [2] Payments
Each node on the network establishes payment channels with each of its neighbors. A payment channel is a method for two parties to exchange payments trustlessly by signing transactions that alter the balance of an escrow account held by a bank or blockchain (we may use the Ethereum blockchain for Althea).

The important thing about a payment channel is that after the channel has been opened, and funds have been placed in escrow, individual payments can be made directly between the two parties without submitting anything to the bank or blockchain. This means that the entire payment can be completed in one packet. Most payment systems need to send another transmission to a bank or blockchain, and wait for it to be confirmed. This would be too much overhead for use with Althea, which is why payment channels are used instead.

When Alice wishes to send a packet to a destination (Charlie) on the network, she consults her routing table to find the best neighbor to forward it to. This routing table was built up by Babel, taking link quality and price (as computed in [section 1.2]({{ site.url }}/blog/althea-paper/#payments) above) into account, so the neighbor will be the one judged to have the best and cheapest route to the destination. Alice then appends a state update for her payment channel with Bob to the packet which pays him the rate that he is advertising for that destination. When Bob receives the packet and the payment, he forwards the packet on to his best neighbor, paying them the fee they charge to get a packet to that destination. Since Bob has set his fee to slightly higher that what his neighbor is charging to get to that destination, he will make a profit. This process continues until the packet reaches its destination.

![]({{ site.url }}/images/payment-flow.png)

In this way, Alice can send packets to any packet in the network, while transmitters along the way are compensated.


## [3] Vulnerabilities
As you may have noticed, this system is vulnerable. Babel makes no provision for hostile nodes. Under this protocol, any node can advertise a cost of 0 to every destination on the network, and have all traffic from its neighbors routed through it, and receive payment (while dropping the packets, or offering worse than advertised performance and reliability). There are also other, more subtle exploits.

There is some work on securing Babel and other distance vector routing protocols. However, this work tends to focus on the vulnerabilities that could occur in a network without monetary incentives. There are mitigations for DOS, impersonation of other nodes, and blackhole attacks. For now, we will consider these attacks to be outside of the scope of Althea. Satisfactory solutions need to be found, but this research is specific to Babel. 

Many of these mitigations assume a threat model where an adversary is attempting to disrupt or censor a network. We are more concerned about the treat model of many unscrupulous adversaries who are simply trying to defraud the network to get some incrementally higher total payment than they would otherwise.

Let's say that Alice and Bob are neighbors. Bob learns that he can reach Doris with a quality of 4. However, he tells Alice that he can reach Doris with a quality of 3. Alice routes her packets to Doris through Bob and pays him, although Bob is not the best route. This type of "false advertisement" attack is specific to Althea, because the adversary's motivation is monetary.

#### [3.1] Cost metric validation
For Alice to catch Bob attempting a false advertisement attack, she must be able to check that the quality metric that Bob is reporting for a destination is truthful. Distance vector functions by summing the quality metric that nodes report about their neighbors.

![]({{ site.url }}/images/honest-metric.png)
The distance vector cost to D seen by A is the summation of the link costs of all the links along the best route. Depending on the link quality metric used, it should be possible for this summation to be roughly equal to the overall link cost computed by A between it and D.

This overall link cost can be computed in the same way that the individual link quality costs are computed, by analyzing percentage of succesfully acknowledged transmissions over a given time period.

![]({{ site.url }}/images/dishonest-metric.png)
If someone on the route is advertising a lower (better) quality metric than they are actually able to provide, the distance vector cost seen by A will differ from the overall link cost.

From these primitives, it should be possible to build an anti-cheating protocol. The simplest implementation would be to compute an honesty score for each neighbor, and let a human operator choose to disconnect from a neighbor with an especially bad score.