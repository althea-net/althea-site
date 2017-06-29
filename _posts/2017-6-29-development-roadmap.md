---
layout:     post
title:      Development Roadmap
summary:    "We are developing Althea incrementally over several stages. The first couple stages are not anywhere near the full capabilities that Althea will have. They are not even mesh networks. However, developing software in an incremental manner lets us test and prove out various elements of the system continously."
---

We are developing Althea incrementally over several stages. The first couple stages are not anywhere near the full capabilities that Althea will have. They are not even mesh networks. However, developing software in an incremental manner lets us test and prove out various elements of the system continously. Most development is happening in the [physical-node](https://github.com/althea-mesh/physical-node) and [exit-node](https://github.com/althea-mesh/exit-node) repos. These repos will also pull in various daemons that we are creating to run the network.

**Exit node to user node tunnel: (under development)** The exit node is basically a VPN server, and the physical node uses the VPN for internet access. Users of physical nodes can select an exit node to use and access the internet over a secure tunnel without having to mess with VPN clients on their personal devices. This does not have much to do with incentivized mesh yet, but it forms a base of security and privacy. It can also be useful for people who don't want ISPs selling their browsing history and don't mind setting up a VPN server themselves.

**Metering and payments:** The physical node and the exit node both keep track of how much traffic has been sent over the tunnel, and the physical node automatically pays for the traffic. This lets us start to build infrastructure around metering traffic, paying for it, and cutting off service in the case of non-payment. It can also be useful for people who want to set up VPN servers and charge others for the service.

**Unverified mesh:** Several physical nodes can form a mesh network, which routes traffic to one or more exit nodes, over the best and cheapest paths. Physical nodes meter traffic forwarded for their neighbors, and charge each other for it. This remains vulnerable to low-level attacks on the routing protocol, but will allow us to test the network in a controlled real-world environment, giving users internet access, and receiving payment.

**Verified mesh:** Physical nodes constantly test the routing metrics advertised by their neighbors, allowing them to verify the quality of the routes, and building a "local reputation" database about their neighbors. This starts to open the network up to secure participation by a wider range of operators, allowing it to grow quickly. Physical nodes still can't be that mobile though, because they need to open channels and verify the routes of other nodes they are paying to forward.

**Future evolution...:** The "Verified mesh" stage proves out the basic concept. But there's still a lot of work beyond that, some of which is not yet covered even in the white paper:
  - Rigorous security testing.
  - Multihop channels: Using hashlock techniques, nodes could transfer payments to their neighbors over a network of multihop channels, allowing them to move to a new physical location without waiting for a channel to open to pay for a connection to their new neighbors.
  - Transitive reputation: Nodes could also get information on the accuracy of new neighbors from other nodes that they trust on some level. This will also enable mobility.
  - On-device user node: Build a stripped down "physical node" app for laptops and mobile devices. This will allow users to pay for traffic and roam without carrying a physical OpenWRT node with them.

## How to help
Building this system out requires a large range of skills:

- Linux networking: Obviously a big part of the system.
- Cryptocurrency: We'll be using pretty basic payment channels to start out, so it's not like we need a huge amount of consensus and blockchain wonkery at first. However, the choices we make early on will have big effects, since the space is changing raidly. Multihop channels and transitive reputation will require a bit more expertise later on.
- Frontend design and development: The concept of paying per kilobyte on a cryptocurrency mesh network will be unfamiliar to most people. We'll need intuitive UX/UI design and solid cross-platform frontend code.

If you want to help, or just say hi, introduce yourself in our [Matrix chat](https://riot.im/app/#/room/#althea:matrix.org)