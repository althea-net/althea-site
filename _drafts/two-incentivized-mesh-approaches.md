So far, I know of two main approaches to incentivized mesh:
- pay-for-forward
- pay-for-service

## Pay for forward

Althea V1 (as appears in the [white paper]()) is an example of a pay-for-forward system. [Hocnet]() is working on a similar system as well. In this type of system, a distance vector routing protocol propagates prices along with route quality metrics. Nodes build up a table of the prices that their neighbors charge to get to any destination on the network, as well as the estimated quality of the link. Each node comes up with prices to charge their neighbors by adding the profit that they would like to make to what it costs them to send packets to that destination. They then pay each other to forward traffic to these destinations.

This type of system allows you to send packets anywhere on the network as long as you pay for it. To turn it into a system that you can use to get internet access, another payment needs to happen. If there's a node somewhere on the network that has a connection to the internet, you need to send them some kind of payment, first of all to pay for the internet access, and then also to pay for data from the internet to be sent back to you. Money is being sent towards the source(s) of internet access and then also back towards the consumers to pay for the data being sent back.

This requires that the routing protocol be secure to every destination on the network. There is an incentive for intermediary nodes to lie and say that they have better routes to other nodes than they really do. If they do this successfully, they can get paid more money than they deserve.

## Pay for service

In a network that is mostly being used for internet access, there are two main directions that data will flow. Upstream (from the end-user nodes to the gateway nodes), and downstream (vice versa). One thing to keep in mind is that the traffic upstream and downstream for any given node could be following two different paths.

If you think about it, it's a lot easier to verify the quality of a route in the upstream direction. You just have to check that your route to one node (the gateway node) is as good as advertised. Even better, check that your route to a server on the internet somewhere outside of the mesh is good.

Checking in the other direction is more complicated. Every gateway needs to verify its route to all of the end-user nodes using its services. Also, every intermediary node needs to do this same verification.

As you can see, the overhead of checking downstream routes is far larger than the overhead of checking upstream routes. But why do we have to check the downstream routes at all? In the above scenario, we only really need to do it because nodes are getting paid by upstream nodes to forward packets downstream.

What if we flip the perspective, and just have nodes pay each other for internet access? In this model, nodes that are further away from the internet pay nodes that are closer to it both for upstream and downstream traffic. This is generally how internet service works now.

Now, upstream nodes have no incentive to claim to have routes to nodes they are not connected to (or nodes that are not paying them for downstream traffic). If they do this, they will be receiving traffic that they will not be paid to forward. Since they are being paid by the nodes they send packets to, their incentive is to send out traffic to downstream nodes proportional to how much each downstream node is paying them.

Each node still needs to verify that its upstream routes are good. This verification can consist of a speedtest to various servers on the internet, testing for various things, such as throughput, latency, etc. If a given upstream node does not have a great connection, you can stop using them.

Let's say that there are 2 intermediary nodes in a neighborhood supplying internet to 4 end-user nodes. We start the scenario with both of them being paid equally by the end user nodes. Payment is per-second, not per-byte. If one of the intermediary nodes starts advertising artifically good routes to the end-user nodes, the other intermediary node will not receive any downstream traffic to those nodes.

This will harm the end-user nodes by granting the cheating node an undeserved monopoly. It is in the end-users interest to make sure that the routes advertised by the intermediary nodes to the gateway are accurate.

If there is some way to ensure that nodes are advertising routes publically, and there is some way for nodes to check that the throughput estimates of their neighbors *to them* are accurate, then nodes could penalize neighbors who are making inaccurate estimates.