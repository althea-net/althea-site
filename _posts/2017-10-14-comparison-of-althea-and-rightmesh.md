---
layout:     post
title:      Comparison of Althea and RightMesh
summary:    "Althea has made many careful design decisions to optimize performance and reduce overhead. In this post we compare Althea to a different incentivized mesh architecture and show how each of these choices impacts the final product."
---

We’ve been working on the architecture of Althea for nearly a year now, during that time we’ve made a lot of decisions that define how our network is structured with broad impacts on how it will perform in the real world. This post assumes you have already had a chance to read [our paper](http://altheamesh.com/documents/whitepaper.pdf) which contains our design for incentivizing mesh routing with cryptocurrency payments. It leverages existing technology, addresses major security concerns adequately and is expected to run on nearly any device, even off-the-shelf consumer routers.

A few weeks ago [Rightmesh](https://www.rightmesh.io/), a cell phone mesh product, published their [technical paper](https://www.rightmesh.io/wp-content/uploads/2017/07/RightMesh-Technical-Whitepaper1.pdf) which provides an interesting alternative architecture with very different focus from our own.

In this post we’ll be comparing our products and contrasting different vulnerabilities, performance, and implementation challenges that come inherent to each product. We will also identify several potential problems in both Althea and the version of RightMesh described in their paper and suggest how they could be addressed.

**Principles**

This commentary is somewhat limited by the fact that RightMesh publishes has yet to publish any cryptocurrency-related code on their  [Github](https://github.com/rightmesh). Unlike Althea, large components of the RightMesh software stack will be closed source. They will publish the cryptocurrency-related components while using a proprietary mesh networking protocol from their parent company [Left](https://left.io/).

We publish our code as we write it. The [Althea Github](https://github.com/althea-mesh) contains all the code we’ve written and everything you need to build the systems we are using from scratch. We are committed to open source. 

Regardless of our principles, without open source specifications we have to infer the capabilities of Left’s mesh protocol from off-hand claims made by RightMesh about its capabilities. We’ll try and be clear about the assumptions behind our descriptions below, pending feedback from RightMesh. 

**Target devices**

Althea’s primary goal is to lower the cost of bandwidth for everyone. To that end we’re very focused on home internet right now. While the mobile space is compelling, we’ve chosen to focus on bringing competition to the more stagnant home internet market first. Our software is designed to be run on Linux-based routers connected to [stationary high-bandwidth wifi transmitters](https://www.ubnt.com/products/#airfiber), or runs of cable and fiber.

On the other side of this decision is RightMesh. RightMesh has chosen to go all-in on smartphone software. Smartphones are not designed to route large amounts of traffic, so this focus naturally shapes the usage of their system. RightMesh is more about allowing dense swarms of cell phones to extend the range of a wifi hotspot or cell tower, while Althea is about changing the economic model of home and office internet service. A swarm of cell phones will be able to extend the range of a cell tower or wifi hotspot by a few hundred feet, while the high-bandwidth networking hardware Althea is designed for gets the internet connection from a data center to an entire town or city.

It’s this hardware decision that drives the design differences between RightMesh and Althea. A few examples:
Phones do not offer much access to the underlying system, and most of the networking code must be rewritten as comparatively inefficient “userspace” code. Routers typically can be programmed from scratch and offer access to the lower levels of the very high performance networking code in the Linux kernel.
Phones have omnidirectional antennas which cannot send signals as far in any particular direction, and in dense areas can interfere with each other. Much of RightMesh’s design deals with this fact, and they are forced to reimplement a lot of core networking code. Althea is designed to run on the kind of focused directional wifi beams, wires and fiber that provide internet service today, and will always be the best option for high bandwidth and low latency. Because of this, we’ve been able to leverage an enormous amount of existing, proven, and very fast networking code.

However, taking a phone-first approach is exciting, because it could bring access to very remote areas or disaster zones where nobody has had a chance or ability to install networking equipment.

**Routing security**

RightMesh uses Left’s proprietary mesh protocol. However, there is not a lot of information about how it works. We do know that it is a hop-count based protocol:

> Currently, RightMesh selects routes based on the least hop count path. At launch, it would be updated such that there is equal weight between the fewest hops and lowest cost.

They intend to one day add other metrics, such as latency, packet loss, etc. However, no details are given about how this will be accomplished.

> In time, this algorithm would become increasingly complex so that performance of the mesh may be fine tuned for individual users where a best path uses a combination of speed, cost, performance, and even reputation of participating nodes.

To securely use a metric other than hop count, RightMesh will have to add some kind of verification to their routing protocol. We’ve found this to be one of the more important challenges of incentivized mesh networking, but RightMesh has not shown any techniques to do it. We’ll explain in more depth after a bit about Althea’s routing.

Althea uses a modified version of the Babel routing protocol. You can find a number of papers about Babel performance and design on [Juliusz Chroboczek’s website](https://www.irif.fr/~jch/software/babel/). Babel already supports routing based on packet loss and latency. Babel is also [built to be extended](https://tools.ietf.org/html/rfc7557). We’re building a [Babel extension](https://github.com/althea-mesh/babeld) to route based on price as well, so at launch, Althea will route packets based on the best combination of price, packet loss, and latency.

Verification is very important in a decentralized context. Without a trusted entity running the entire network, routers cannot count on their neighbors honestly reporting routing metrics. Althea’s verification works quite simply. To learn the quality of all the routes they can service, routers first run a “link quality estimation” with their immediate neighbors. This tests packet loss and latency of the link. This information is gossiped to the network, and routing tables are built by summing the packet loss and latency of every link on a given route.

Althea opens encrypted tunnels with destinations that it is sending traffic to. Nodes forwarding this traffic cannot read it. Babel then runs a link quality estimation over this tunnel. If this turns out to be different than what the neighbor forwarding the traffic claims for the route quality, this neighbor is deemed to be somewhat less reliable. If this happens enough, the neighbor is not used to forward traffic any more. Additionally, new neighbors are not used to forward a lot of traffic until they have proven themselves to be reliable.

RightMesh routes based only on hop count. For hop count, they don’t really need verification, because of the way their payment system works. Their black-box routing protocol chooses routes based on the fewest number of hops, and a smart contract pays all the nodes that can prove they were along a path. The only way to spoof this system would be to generate fake hops in an effort to get a larger proportion of the payment, but then you’d be less likely to be chosen by the routing protocol.

However, hop count is not a very efficient way to route, because you could be choosing to send packets over routes that have few hops, but high latency or packet loss. If RightMesh chooses to use other metrics, they will need to have some way to verify them like Althea does, which their paper makes no mention of. The only other option would be to lean on the proprietary nature of their routing protocol for “security through obscurity”. Perhaps this is what they are counting on. But if there is money at stake, someone will figure out how to crack it, probably sooner rather than later.



**Userspace vs kernel implementation**

A machine’s networking code must handle every single packet the machine forwards, which can easily exceed thousands every second. The closer the routing operations are to the bare hardware the faster they can go. The Linux kernel has been honed over decades to eke out every last bit of performance when forwarding packets. It’s this code that Althea leans on. Althea uses Babel to populate the Linux kernel’s routing table, and the in-kernel encryption module Wireguard to handle all encryption. Because of this, machines using Althea will usually be able to forward packets at “line rate”- as fast as the transmission medium can handle them.

RightMesh is designed to be run on un-rooted phones, and it uses non-standard proprietary routing and network protocols designed for the “smartphone swarm” scenario they envision. Because of this, all packets forwarded by a RightMesh device will have to be copied out of the kernel, and into “userspace”- an area of the OS where regular apps are allowed to run. All this copying means higher latency, and more memory consumption for lower bandwidth forwarding.

This isn’t necessarily a bad thing though. While a RightMesh device will be limited in speed by the userspace implementation, most phone’s radios can’t handle high speeds anyway. Getting away from the longstanding patterns of traditional networking code will also let them try new techniques possibly better suited to the smartphone networks they are trying to create.

A third factor in this choice is that while Althea will carry any kind of internet traffic from any app, the RightMesh SDK will need to be integrated into every app that wants to use their mesh networking. This could hamper adoption, but might also let them sell more SDK licenses. 



**Payments**

Both Althea and RightMesh depend on either “super nodes” or “exit nodes” running full Ethereum clients and some mesh specialized software to provide peering for transactions to the blockchain and traffic to the internet. What differs is the amount of operations these elevated nodes are tasked to perform and the amount of reporting to them that is required. 

Althea’s design is based on the principle of [fast payment channels](http://altheamesh.com/blog/altheas-multihop-payment-channels/) between each hop. Payment for bandwidth is settled before any significant debt can be incurred.. Since the channel payments are so fast and granular, if a node does not pay for service it has received, it can immediately be cut off. This greatly reduces the trust needed in the system.

New nodes, or previously malicious nodes returning under new identities must work their way up a local trust system starting with very small channel balances and frequent transaction costs. By keeping the maximum cut and run gain smaller than the transaction costs incurred by working up the trust system nodes can be either rationally malicious or irrationally malicious at no great harm to the network.

Nodes pay each other in a supply chain model, the same as almost anything else that is bought and sold in our society. Alice pays Bob to forward her packets, then Bob pays the next hop slightly less, keeping some of Alice’s payment as profit.

In RightMesh, all operations of the protocol are on-chain. On any blockchain that exists today, this would make their protocol extremely slow. They introduce the concept of sidechains, which might be able to run their smart contracts more quickly. These sidechains are not specified at all in their paper, but there are several solutions being developed, such as plasma.io and Cosmos. RightMesh will not work until they are finished and deployed.

Instead of Althea’s supply chain model, RightMesh has sort of an auction model. We’re not going to get into all the ins and outs of this process here, but the important part is that every payment interaction in the protocol is mediated by the blockchain or sidechain. This means that the fastest that any routing decisions can happen is many seconds, if not minutes.

Because of this, we’ve had to conclude that RightMesh works on kind of a circuit-switched model. Circuit switching is where a single path or set of paths is chosen for a long lived connection. This is the way the old analog telephone system worked. The revolution of the internet was packet switching. Internet routers are able to decide where to send traffic on a packet by packet basis. No central entity needs to know the path that any given packet takes, and any router can choose to send packets on a different route at any time. Also, the request and response packets making up any given connection do not need to take the same path. It’s this fine-grained flexibility that allows the internet to route around damage and congestion without disruption.

Still, this is probably not an issue for RightMesh’s use case. Supplying internet access from a wifi hotspot to a phone over a few hops does not involve the demands or uptime expectations of a city-level infrastructure network. Their slower, sidechain-mediated model may be sufficient. 




**Conclusions**

We expect to see RightMesh’s protocol change a lot as they try to implement it. They’ll need some kind of route quality verification if they want to route based on anything other than hop count, and they could probably speed up their payments by orders of magnitude with payment channel and state channel concepts. All of Althea’s code is fully open source and permissively licensed, and RightMesh is free to make use of our [Babel extensions](https://github.com/althea-mesh/babeld) and our [state channel](https://github.com/jtremback/avocado) and [payment channel](http://altheamesh.com/blog/altheas-multihop-payment-channels/) libraries.

RightMesh’s marriage to a secret proprietary routing protocol is more concerning. In designing Althea, we found that the networking side of things is much more difficult than managing payments. There are a lot of exploits possible on routing protocols, because almost all routing protocols have been designed for use on friendly networks managed by one entity.

Proprietary network protocols historically not  been successful. The Internet is made up of billions of devices made by tens of thousands of manufacturers and it never could have been built without everyone working together on a standard and open protocol. Especially mesh software, based around cooperation, can not be chained to secrecy. Especially not if RightMesh needs viral growth to fuel the valuation of their token.

Once these issues are overcome, RightMesh will be complementary to Althea. Internet access can be supplied by Althea’s infrastructure-level networks, and distributed to groups of phones with RightMesh.
