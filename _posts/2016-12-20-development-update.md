If you've read my [whitepaper](/blog/althea-paper/) and watched my [presentations](/blog/ccc-lightning-talks/), you can see the general direction I've been pursuing for Althea. Since then, I've been getting deep into the implementation details. As I've worked, I've found several ways to simplify Althea and make it more realistic for use in real-world networks.

What I was trying to do was this: Nodes propagate pricing information to one another using a distance vector routing protocol (Babel), and then pay neighbors for data sent. They also pay the exit node (a node with internet access) of their choosing, who in turn pays to have the data sent back to them. They make sure that quality along the way is consistent with what is advertised by using speed tests. The service is binary: nodes pay each other an agreed-upon rate for connectivity, or they don't get service.

I'm now working on a new scheme that simplifies and tweaks some stuff:

- I'm not addressing routing at all. The ideal routing configuration for any given network depends on a lot of factors, and mandating a certain routing protocol will limit the usefulness in different scenarios. Anything from manually entered routes, to ad-hoc protocols, to centrally administered SDN could work.

- I no longer am making any distinction between normal nodes and exit servers. This distinction will still exist, of course, but Althea won't be involved with it.

- Nodes will pay for both upstream and downstream service, instead of the pay-for-forward model I was using before.

What's left is a piece of software that looks like this: 

- Nodes set up authenticated tunnels with all their neighbors. This is so that they can tell for sure that a specific packet was routed by a specific neighbor. These are TAP tunnels like the ones used for VPNs. Two promising options are [fastd](https://fastd.readthedocs.io/en/v18/) and [wireguard](https://www.wireguard.io)

- Nodes then prioritize traffic to and from their neighbors, depending on how much each neighbor is paying. Linux's `tc` tool should be able to do this. This way, purchasing service is a smooth continuum, instead of a binary state.

This is very simple, and will need to work together with a few other components to make a useful system.

- Routing is still necessary, and it still needs to be secure. Babel, and most other routing protocols will allow nodes to cheat and direct more traffic towards themselves than they should have. There are some ideas in the direction of securing distance vector protocols such as [SEAD](http://www.netsec.ethz.ch/publications/papers/sead-journal.pdf). Another option is using centrally determined routes or SDN. It might be easier to monitor and prevent cheating with a centralized system.

- Just because nodes can choose their desired level of prioritization and compete for service with the nodes around them, doesn't mean they know what prices to pay. The simplest option is to have the pricing manually controlled, but this will be too much of an annoyance for most people. An automatic pricing system is probably a necessity for wide adoption, but I am leaving it for later.

[Discuss this post on Reddit](https://www.reddit.com/r/altheamesh/comments/5mh5ur/development_update/)