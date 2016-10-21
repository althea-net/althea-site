Nodes must be able to arrange payment for internet service with a minimum of human intervention and a minimum of trust. This means that the human operator of a node must be able to input parameters about the desired quality of service goals and pricing limits, and the node's service negotiation software must be able to fulfill these goals as best it can. Another goal is for this service negotiation not to involve guarantees of service over a long period of time, or involve nodes making prior representations about their quality of service, both of which involve trust. The reason for these goals is that involving trust complicates a lot of things. The concept of trust directly implies some kind of consequence for bad actions, or at the very least a reputation system. Both of these things are very complicated to implement in software, and very expensive to implement in court.

As much as possible, Althea's service negotiation framework operates without the possibility of bad actions. Let's see how this could work. 

Alice is connected to an uplink which provides her upstream and downstream bandwidth to the internet. She wants to sell this bandwidth to her neighbors using Althea. Alice turns on her Althea node and it connects securely to her neighbors (there's more detail on how these connections are secured in [1.2]). One of her neighbors is Bob. Once a connection is established, Alice's node (node A) sends a message to Bob's node (node B), stating that it will provide an upstream and downstream connection at a certain price per megabyte (we may look at the possible advantages of node purchasing upstream and downstream connections separately in the future, but for now they will be bundled). Note that node A makes no representation about the maximum bandwidth, latency, or any other quality of service metrics.

If the price per megabyte is within Bob's acceptable range, node B begins paying node A. At first, node B does not have any knowledge about the quality of node A's service. As node B uses the service, it is able to build this knowledge. If the QoS drops below what node B is willing to accept at the price per megabyte that it is paying, node B stops paying. If node B stops paying node A, it takes steps to throttle or cut off the connection.

In the above example, it is taken for granted that node A is the one with connectivity, while node B is purchasing bandwidth. Further into the network, nodes making contact may both have connections to the internet, of varying quality. In this case the negotiation plays out similarly. Node B and node C connect, and send each other their price per megabyte. As above, each node makes a decision about whether they will accept the price at all. Then they begin to build up information about each other's QoS.  

----

Suppose that Alice and Bob both have connectivity. However, Alice's connectivity is better than Bob's. They exchange $ per mb and open connections with one another. We'll assume that routing is optimal. Each of them is paying the other for upstream and downstream. Bob uploads a large file through Alice (because the routing protocol finds that her connection is better than any other available to him).

If Alice is paying Bob the same amount for upstream as Bob is paying Alice for downstream, then Alice will not make any money.

If Bob is paying Alice the same amount for upstream as Alice is paying Bob for downstream, then neither will make any money and Bob will get his file uploaded for free.

If Bob is paying Alice more for upstream than Alice is paying Bob for downstream, then Alice will make money for uploading Bob's file. This is what we want.

Let's say that Bob (or someone downstream from Bob) receives a large download. If Bob is paying Alice more for downstream than Alice is paying Bob for upstream, then Alice makes money.

Alternately, Alice could refuse to pay Bob for upstream or downstream. This is pretty much the same thing as them paying each other different amounts though, because as elaborated above, the amounts cancel each other out.

We need a system of service negotiation that will result in nodes closer to the core of the network being paid more for service than nodes further towards the edge. Since this is in the best interests of everyone involved, it should be possible.

A node builds up information about the QoS of all the nodes around it. This is gathered by using some kind of trusted speedtesting server out on the internet to test each peer. It would probably be good to hide the speedtesting activity or integrate it into normal use, but we won't cover that here. 

On the upstream side, the routing protocol is what decides where a packet for a certain destination gets sent. Routing protocols are complicated and difficult to secure. The same goes for centralized SDN routing. Althea needs to stop attacks on vulnerabilities in routing protocols. A simple attack on distance-vector routing protocols is if a node claims to have much better connectivity than it actually does. This causes other nodes to route more traffic through it, increasing the money earned. Most routing protocols have absolutely no defense against inaccurate route quality metrics. 

The distance vector routing protocol that routes traffic on the highest level of the internet is called BGP. It defends against this type of attack by having intelligent human operators who spend their days watching it. Still, a lot of attacks (and mistakes) happen. http://www.bgpmon.net/blog/

The speedtesting mentioned earlier gives us monitoring capability. We need to allow whichever routing protocol is in use to do the complicated work of routing packets to destinations far away while still ostracizing nodes who are making themselves look better than they are. 

One way of doing this is for nodes to keep a table of relative node quality or priority. For any given route, the node that does best on a speed test will be chosen. The simplest way to do this is to have a global QoS ranking of all  neighbors, and if the routing table has a route that is advertised by more than one neighbor, to choose the neighbor that does best on the global ranking.

More fine-grained control can be added in by getting QoS information for particular IPs, subnets, or ranges of IPs. A simple example is if a node knows that it will be exchanging a lot of data with some IP, it could run a speedtest cooperatively with a computer at that IP. Then, when choosing a which neighbor to route packets going to that IP through, it could favor the node that does best on this specialized speedtest instead of the node that does best on the generalized global speedtest. 

On the downstream side, a potential attack would be for the upstream node to send a lot of junk packets to a node downstream, and then receive payment for the traffic. If the packets are addressed to the downstream node, this attack is trivially preventable. Packets arriving at this node can be dropped, and the connection can be cut off for blatant spamming.   

If a node receives a lot of packets that it must drop, it should start taking steps against the node that sent them. One reason for a node to drop packets is if they are addressed to it, but it did not request the packets and does not want them. This is known as spam. Another reason to drop packets is if the node is not able to route them to their destination.

Another situation is if the node is simply not a good choice to route the packets. Imagine this scenario: 

A-B-C-D 
  \ /
   E
   |
   F

D has an uplink, B is paying C for upstream and downstream. Ideally, B makes this money back because A is paying B. So in a good scenario, C sends B a lot of traffic which B forwards to A. A pays B and B pays C, as well as making a profit. But let's say that B and C are also connected to E, who is connected to F. B pays C more than E for receiving packets. So, although the more direct route to F would be sending the packets directly through E, C chooses to send the packets to B first. However, B is not going to be forwarding packets to E at all unless E is paying B more than B is paying C (otherwise B would not be making any money). So, with an optimal negotiation system, it is in E's interest to pay C this money instead.

--- OPTION 1: 

Bargaining on each node is directed by some simple parameters input by humans- a maximum price and a minimum profit percentage. The maximum price is mostly relevant to nodes that are acting as consumers. It corresponds to the maximum price paid for bandwidth to be used by the node itself- traffic with that node as the source or the destination. The minimum profit is relevant to nodes that are mostly transmitting traffic for others. For a given price, the percentage of profit is calculated by comparing that price to a weighted average of prices paid for access to the internet in the past X minutes.

A node will not pay a price above the set maximum, and it will not allow other nodes to pay it prices with a profit percentage below the minimum. These numbers are input by the humans operating the node. It may be possible to invent an automated negotiation system where nodes bargain among themselves to obtain outcomes that are acceptable to their operators without guidance, but we won't go into that here.

Alice enters these numbers into her node:

A:
  maximum price: $5 per kb
  minimum profit: 10%


Bob enters these numbers:

B:
  maximum price: $3 per kb
  minimum profit: 15%
  

A and B connect to one another. Each one calculates a minimum asking price which is derived from the minimum profit percentage and the average of prices paid to it during the last X minutes. They exchange their minimum asking price and maximum paying price.

--- OPTION 2:

A and B connect to one another. They tell each other what they are willing to pay for access. Based on this, they prioritize each other's traffic. For instance, if Alice is connected to Bob and Charlie, and Charlie is paying her more, Alice may prioritize Charlie's traffic over Bob's traffic. Let's look at the network:

A---B---C---D

A has an uplink. We want to arrive at an equilibrium where A is not paying peers for prioritization, and payment level increases as we move towards D at the edge of the network. 

A----B----C----D
   <-5 <-10 <-15

In this scenario, D pays "retail" prices, and A, B, and C each earn 5 for their efforts in maintaining the network.

Lets say that E joins the network. E connects to B and C, and sets its payment level to 10. When sending traffic through C, it has a hard time competing with D's payment of 15, and so if the network is saturated, it will see dropped packets. This will cause the link to look worse to the routing protocol, and will cause packets to be routed through B instead. Packets sent and received through B will receive a priority equal to the packets from C (including packets originally to and from D)  
     
       10
       E
      /  \
A----B----C----D
     5   10   15



Send prioritization is when Alice pays her neighbors to prioritize packets that are received from another node and are destined to be routed through Alice. To be clear, no distinction is made between packets that are destined to a Alice IP address, and packets that have been chosen by the routing protocol to be routed onwards through Alice.

Receive prioritization is when Alice pays her neighbors to prioritize packets that are received from Alice. No distinction is made between packets that Alice originated and packets that she is passing on from another node.

For obvious reasons, receive prioritization is easier to implement. It could look like this:

Alice is paying Bob 5 for receive prioritization. This is higher than what any of Bob's neighbors are paying, so when Bob is overloaded, he drops other node's packets to make way for Alice's packets. If a packet comes in from Alice it is placed on a higher priority queue than other neighbors.

To implement send prioritization, we must find out from the routing protocol where a packet should be sent and prioritize it accordingly. It could look like this:

Alice is paying Bob 5 for send prioritization. When a packet comes in, the routing table is consulted to find out where to send it. Packets that are to be routed through Alice are placed on a higher priority queue than other packets.

A good way to implement this is to create a queue for every send/receive pair of neighbors. For instance, if B has neighbors A, C, and D, it will have queues:

A->C
A->D
C->D
C->A
D->C
D->A

Let's say 
A is paying receive: 5, send: 5,
C is paying receive: 3, send: 4, and
D is paying receive: 2, send: 1

A->C: 5+3= 8
A->D: 5+2= 7
C->D: 4+2= 6
C->A: 4+5= 9
D->C: 1+3= 4
D->A: 1+5= 6

Let's sort:

C->A: 9
A->C: 8
A->D: 7
C->D: 6
D->A: 6
D->C: 4

Now each pair of neighbors has a separate queue with a prioritization relative to the other queues. There are many different traffic shaping strategies that we won't cover here, which can be used to actually prioritize the traffic.  

Use of the network can be metered by amount of data or by duration of use. 

In existing networks, the benefit of metering by data is that it makes it easy to use a block of data from one transaction a little bit at a time. When you use a cell phone with a data cap, you can use it all month with a smaller amount of data if you use it intermittently. A time-based contract to get a 5mbs connection all month would cost a lot more, which would be a waste of money if it you only use it intermittently. Also, it's a natural way to allow people to pay for differing levels of reception across a network, since less data is used when reception is bad.

The benefit of metering by time in traditional networks is that it's simple to measure. You just connect everyone, collect monthly payments, and make sure the network is working OK.

A disadvantage of metering by data in Althea is that it creates an opportunity for nodes to cheat each other in a way that is hard to stop. Let's say that Bob is buying data from Alice and selling it to Charlie, who then sells it on. Alice can try to cheat Bob by sending bogus traffic that is hard to tell apart from good traffic. If Bob does a speedtest on traffic that he is sending through Alice, it won't show any evidence of the bogus traffic that Alice is sending him. He is selling data to Charlie and then on to some unkown destination, and there's no way to know how much of it anyone actually wants. Meanwhile, Bob's data (and money) is being used up more quickly.

Metering by time, this is not a problem. Alice has no incentive to send bogus traffic to Bob. No matter how much bogus data she sends, Bob's time (and money) won't be used up more quickly.

In metering by time, a limiting factor is transaction cost. If it is expensive and involved to negotiate a contract and pay for it, contracts will have to have longer durations. One effect of this is that is that it's not worth it to arrange contracts with nodes that are not a good source of data all the time.

Lowering the cost of negotiation and transaction lessens this effect. Althea uses payment channels, which makes the cost of transaction very low. Also there is no negotiation, since fees pay for prioritization instead of all-or-nothing access. Nodes pay in very small increments, and can quickly stop payment if a connection to a certain neighbor gets spotty. 






Tiny, granular payments


Metering by data looks like this:

Alice sends Bob a payment packet to pay for prioritization of 1 mb of data. Bob starts prioritizing Alice's traffic relative to the rate she is paying. When this allotment is used up, Alice sends another payment packet, or Bob stops prioritizing her traffic.

Metering by time looks like this:

Alice sends Bob a payment packet to pay for prioritization of 1 second of access. Bob starts prioritizing Alice's traffic relative to the rate she is paying. When the second is over, Alice sends another payment packet, or Bob stops prioritizing her traffic.



