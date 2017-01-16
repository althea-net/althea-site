---
layout:     post
title:      Reusable throughput tests
summary:    "Justin Kilpatrick, who is working on a similar project called Hocnet, came up with an interesting idea: reuse the results of a quality test along a route. As a simple example, let's say that the quality metric that is being used is percent packet loss. Alice is sending traffic to a Zack over the network. Zack keeps track of how many packets he receives over a certain time period, signs this, and sends it back. Now Alice can compare this information with her own statistics about how many packets she has sent out during the same time period to derive a a percent packet loss metric."
---

In the original design of Althea, in the [whitepaper](http://altheamesh.com/blog/althea-paper/), I call for verification of routes. That is, once a node has made a connection to another node that it cares about, it checks whether the route quality information propagated with the routing protocol is correct. This consists of the node doing some kind of route quality or throughput test with the destination node and seeing if it matches up to what was propagated. If the propagated information is incorrect, the node corrects its own routing information, and tells the node that gave it the bad route about the inaccuracy. Once the neighbor finds out about the inaccuracy, it could do its own quality test, and tell its neighbors about the results and so on. But having each node along a route doing a quality test to verify a route could be slow and result in a lot of overhead.

Justin Kilpatrick, who is working on a similar project called [Hocnet](https://www.reddit.com/r/hocnet/), came up with an interesting idea: reuse the results of a quality test along a route. As a simple example, let's say that the quality metric that is being used is percent packet loss. Alice is sending traffic to a Zack over the network. Zack keeps track of how many packets he receives over a certain time period, signs this, and sends it back. Now Alice can compare this information with her own statistics about how many packets she has sent out during the same time period to derive a a percent packet loss metric.

Let's say that the numbers don't match up, and the route is losing more packets than advertised. 

In Althea, Alice would just correct her own routes and notify Bob, the neighbor that gave her the route. Bob would then have to communicate with the destination himself to find out what the real quality is.

In Hocnet, Alice passes Zack's signed statement about how many packets he has received from her along to Bob. Now Bob compares Zack's statement just like Alice did to find out his own quality to Zack.

One additional requirement in this kind of scheme is that the quality test be done on normal traffic. Otherwise, nodes along the route could simply prioritize traffic that they recognize as part of a quality test, while dropping normal traffic.

Possible types of quality test:

### Packet loss percentage:

**Functionality:** Nodes find out how many packets are lost over links to their neighbors. When they get a route update message for a given destination, they multiply the total route packet loss by the packet loss of the link they received it on and forward it onwards.

**Verification:** The product of the packet loss of every link in a route should equal the packet loss of the whole route. Destination sends a signed message with the number of packets received from a source during a certain time period. Nodes along the route can compare this with how many packets from that source they have forwarded to the destination during this time period to find the route's total packet loss. Babel and Batman IV use this type of metric.

### Throughput:

**Functionality:** Nodes find the maximum throughput of links to their neighbors. When they get a route update message for a given destination, they set the total route throughput to equal the throughput of the link they received the message on, if the throughput of the link is lower.

**Verification:** The lowest throughput link along the route should equal the maximum throughput of the route as a whole. Destination sends a signed message with the number of bytes received from a source during a certain time period. An important caveat here is that the route must be saturated to the maximum throughput to get an accurate estimate. This could waste bandwidth and also tip off nodes along the route that a quality test is happening. Batman V uses this type of metric.

### Latency:

**Functionality:** Nodes measure the average latency of links to their neighbors. When they get a route update message for a given destination, they add the latency of the link they received it on to the total route latency before forwarding it onwards.

**Verification:** The sum of the latencies of all the links on a route should equal the latency of the route as a whole. Destination sends a signed message with the hashes of various packets and their time of receipt. Nodes on the route compare this time of receipt with the time that they received each packet.
