---
layout:     post
title:      Pay for forward v.s. pay for internet
summary:    "The proportional hashlock gives us the ability to build a sort of higher level micropayment channel that sits on top of a multihop payment which is released incrementally."
---

We've considered two main mechanisms for an incentivized mesh network so far. Pay for forward is the mechanism laid out in [Althea v1](http://altheamesh.com/blog/althea-paper/), and [Hocnet](https://www.reddit.com/r/hocnet/). Pay for internet is something I've been working on as Althea v2 and it is also kind of how ISPs work now. This is a brief summary of both approaches.

## Pay for forward
- A (secured) routing protocol propagates price along with the route quality metric.
  - The routing protocol makes routing decisions based on the price and the metric.
  - It is secured by running speedtests to destinations on the network and seeing how they match up to the advertised metrics.
  - Using a "circular ack" speedtests can be reused many times by all the nodes on a route to a given destination. This also works with asymmetric routes.

- Nodes tally up what they are owed their neighbors according to which destinations the neighbors are sending packets to.
  - Payments are settled with payment channels.
  - If payments are not made, a node can stop forwarding a neighbor's packets using tunnels.

- On top of the pay-for-forward system, there is a gateway discovery and payment system.
  - Somehow end-user nodes discover "gateway" nodes, nodes with a connection to the internet.
  - Gateway nodes charge a certain amount for the internet connection.
  - When a gateway is chosen by an end-user node, a payment channel is opened with that gateway.
  - The gateway is paid for the amount of data used from the internet, as well as the amount that it cost the gateway to pay-for-forward to send the packets back to the end-user node.
  - Gateways would need to be speedtested. Speedtests could be done between the end-user node and arbitrary servers on the internet.

## Pay for internet
- Nodes pay each other for access to the internet.
- Some secure source of routes is neccesary, but it remains completely separate and unspecified by this scheme.

- A node which is closer to the internet will be paid to both send and receive packets on behalf of a node which is further away (upstream and downstream connection).
- Nodes must discover and verify the quality of the internet access provided by their neighbors.
  - This somewhat mirrors the quality metric discovery and verification in a secure routing protocol.
  - To verify the upstream quality of a neighbor, a node sends traffic to a speedtest server on the internet.
  - To verify the downstream quality of a neighbor, a node has a speedtest server on the internet send it traffic.
  - In most routing protocols, there will only be one upstream neighbor and one downstream neighbor at once (and they will often be the same neighbor).
  - However, if there are multiple upstream or downstream neighbors, it would be very difficult to tell which one is responsible for the quality of a route.

- Nodes could tally up what they are owed by their downstream neighbors according to how much data they have sent or received on behalf of a given downstream neighbor.
  - Payments are settled with payment channels.
  - If payments are not made, a node can stop forwarding packets to or from a neighbor using tunnels.

- Instead of announcing an all-or nothing price for access, nodes could instead prioritize traffic to and from neighbors according to how much each neighbor was paying at a given time.
  - This might allow a natural range of quality/price options.
  - It makes access discovery and verification harder. How do you know how much a neighbor's quality will improve if you pay it more?