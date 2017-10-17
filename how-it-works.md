---
layout: page
title: How it works
permalink: /how-it-works
---

Althea is a system that lets routers pay each other for bandwidth. We call this “incentivized mesh.” Our vision is a world where your device automatically buys bandwidth from whichever provider is cheaper and faster, whether that’s your neighbor, an independent wireless ISP, or even a conventional ISP or cellular network.

Any high performance network will be made up of fast, high capacity, long range links that carry traffic most of the way to its destination, along with lower performance hops that take it the rest of the way there. Althea networks will be no exception to this rule. Inside of an Althea network, there will be house-to-house links, along with higher capacity networks owned and operated by professionals. Althea takes traffic from your house, over the “last mile” to the nearest internet exchange. Then goes onto the internet backbone to be taken across the world.

We are working on firmware that we will ship on branded routers. The physical connections will be made according to whatever works best for the site. That could mean an inexpensive directional wifi antenna aimed across the street, an outdoor ethernet cable across the yard, or more professional equipment mounted on a radio tower.

# Technical architecture

![Neighbor discovery]({{ site.url }}/images/neighbor-discovery.png)

First, a router finds its neighbors. These are other routers with which it has a direct physical connection. It then creates authenticated connections with each of these neighbors. These connections can be throttled or shut off. Packets not coming over an authenticated connection will not be forwarded to their destination.

![Metering]({{ site.url }}/images/metering.png)

The router also keeps track of how much data has been forwarded for each of its neighbors (how much data they have used). The router has a certain price per megabyte set. This can be set directly by the user, but will usually be adjusted automatically according to a pricing algorithm. Other routers need to pay for their packets to be forwarded, or their authenticated connection will be shut off and their packets will no longer be forwarded.

# Payments

![Pay for forward]({{ site.url }}/images/pay-for-forward.png)

Payments are made through payment channels. A payment channel is an extremely low overhead method of payment. Routers place cryptocurrency tokens in escrow in a contract on a blockchain. They can then release that money to their neighbors in small increments using signed messages of only a few hundred bytes. Because these messages are so small, payments can be made on a per-megabyte increment, meaning that routers do not have to trust their neighbors to deliver service or payment.

# Routing

![Price metric]({{ site.url }}/images/price-metric.png)

How do routers know which of their neighbors to use to forward their packets? We use a mesh routing protocol, Babel, to which we have added a price metric. A routing protocol is a distributed program that tells each router where to send packets to get them to their destination with the lowest latency and packet loss. By adding a price metric, our routers also take the price of the route into account. Users can even adjust the tradeoff they would like their router to make between route quality and price.

# Route verification

![Route verification]({{ site.url }}/images/route-verification.png)

We also extend Babel with a mechanism for route verification. Routers compare the route quality advertised by their neighbors with the actual quality they see to a destination. This makes sure that every router is being honest about the quality of its routes.

# Paying for response traffic

With the above mechanisms, we’ve created a system where routers can pay to send packets to any destination on the network, and be assured that they will get there with a certain quality of service. It's sort of like the postal service. You pay some money, and your package gets to its destination. But we still need some way of paying to receive data. Think about ordering something online. You also pay for the item to be shipped back to you. Althea operates on a similar principle.

![Network architecture]({{ site.url }}/images/network-arch.png)

Gateway nodes are routers on the network that have a connection to the internet. Over the internet, they have tunnels (virtual connections) to exit nodes. This allows the routing protocol to choose the best gateway node to get to a given exit node using the same method that it uses to find routes on the physical network.

![Response payments]({{ site.url }}/images/response-payments.png)

Exit nodes pay to send response traffic back to users. They are sent the tokens to do this on the same kind of payment channel that routers use to pay their neighbors.

Exit nodes have encrypted tunnels to user’s routers. Over this connection, they send and receive traffic going to sites on the internet. This has several purposes: First, it keeps routers in the network from seeing people’s browsing history and other confidential information. Second, it protects gateway nodes from the legal liability of other people’s internet use. The exit node appears to be the origin of all traffic and takes legal liability for it. This allows people to monetize internet connections by running gateway nodes with no strings attached. Third, it helps with the route verification described above by hiding verification traffic.