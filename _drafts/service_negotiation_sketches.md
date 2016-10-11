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

