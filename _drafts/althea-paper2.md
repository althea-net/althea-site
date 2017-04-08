---
layout:     post
title:      Althea white paper
summary:    "I'm working on the white paper for the full Althea system. This post is subject to frequent changes."
---

Althea is a set of protocols for a decentralized point-to-point radio network providing connectivity to an area, where participants in the network are able to pay for connectivity, and receive payment for their contributions to the network, without a centralized ISP collecting subscriptions and owning equipment. It combines the commercial viability of a wireless ISP with the decentralized nature of a community mesh network. There are two main components- payments and routing.

## [0] Overview
Althea is meant to operate on the last mile, i.e. from an uplink (or transit provider) to the end user, and creates something like a "distributed ISP". The last mile is an inefficient market- many areas only have one ISP. The reason for this is that there is a very high barrier to entry. Currently, if you want to compete with your local ISP, you first get a subscription to an uplink, which will sell you a lot of bandwidth "in bulk". You then have to build out a local network which is large enough to service enough end users to pay for the operation of your ISP business. You have to hire a staff to administer the network along with businesspeople and lawyers to run the business, and its billing and contractual infrastructure.

You then have to go out and find those end users and convince them to sign up to your service, usually as a monthly subscription. This marketing and advertising can be very expensive, and you will probably want to hire someone to administer the effort, along with marketing and advertising consultants to execute the campaign. This heavily favors firms that are able to make large investments, have name recognition, or have existing subscribers for a related service (like cable television or telephone services).

Once the ISP is self-sustaining, it's time to take profit. End users are unlikely to switch providers, as the barriers to entry discussed above make it difficult for competitors to gain a foothold. Many end users are locked into contracts with a provider, and will almost certainly not switch. Service and maintenance are often considered cost centers to be eliminated. This results in much of the dissatisfaction felt by many end users towards their ISP.

Althea is an attempt to create a much more fluid and competitive model, by removing the distinction between end user, ISP, and uplink. The goal is for any person to be able to set up an intermediary node that can route traffic for others, and receive payment for the service. Switching costs within the system are completely eliminated, as nodes switch between neighbors automatically according to a routing protocol which finds a route with the best combination of reliability, bandwidth, and low cost.

Advertising and marketing costs for the new entrant are eliminated, as the only advertisements in this system are the automatic advertisements of price and route quality between nodes. Contract and billing costs are eliminated by payment channels. Payment channels are a technology from the blockchain world, which allow one to make micropayments with very low overhead. In a payment channel, each payment is a message under a few hundred bytes, sent directly between the sender and the receiver, with no contact of a third party bank or payment processor, and no need to wait for payments to clear. The use of a public blockchain (i.e. Bitcoin or Ethereum), means that participants are able to send and receive these payments without having to pay fees to a payment processor or procuring expensive money transmitter licenses.

Our goal is to reduce the costs associated with providing paid internet access (other than equipment and property costs), by moving most of the nonessential functions of an ISP business into the underlying protocol. Our thesis is that this will result in a market with a much higher degree of competitiveness and efficiency. This will translate into lower prices to the end user for better access to the internet. Another benefit is that of a more equitable marketplace, where money paid for internet access goes directly to members of a local community instead of being captured by multinational corporations. This could play a small part in stimulating local economies and distributing wealth more fairly in the world.



## [1] Principle of operation
Althea's operation is inspired by the way ISPs work already. You could think of it as creating an ISP in every router. Internet service is generally provided on a "best effort" basis. You pay someone to forward your packets to any destination IP (upstream), and forward you packets from any source IP (downstream). They make their best effort to do this. You can verify this with a speed test, or more likely by whether you are satisfied with the service as a user. If you're not happy with their best effort, you are free to find another provider.

As discussed in the overview, Althea is essentially an effort to increase the number of available internet providers, and to make finding another provider easier. Effectively, every router on the network becomes its own ISP. To do this, most of the functions of an ISP are automated, and take place within individual routers.



## [1.1] Service negotiation
Nodes must be able to arrange payment for internet service with a minimum of human intervention and a minimum of trust. This means that the human operator of a node must be able to input parameters about the desired quality of service goals and pricing limits, and the node's service negotiation software must be able to fulfill these goals as best it can. Another goal is for this service negotiation not to involve guarantees of service over a long period of time, or involve nodes making prior representations about their quality of service, both of which involve trust. The reason for these goals is that involving trust complicates a lot of things. The concept of trust directly implies some kind of consequence for bad actions, or at the very least a reputation system. Both of these things are very complicated to implement in software, and very expensive to implement in court.

As much as possible, Althea's service negotiation framework operates without the possibility of bad actions. Let's see how this could work. 

Alice is connected to an uplink which provides her upstream and downstream bandwidth to the internet. She wants to sell this bandwidth to her neighbors using Althea. Alice turns on her Althea node and it connects securely to her neighbors (there's more detail on how these connections are secured in [1.2]). One of her neighbors is Bob. Once a connection is established, Alice's node (node A) sends a message to Bob's node (node B), stating that it will provide an upstream and downstream connection at a certain price per megabyte (we may look at the possible advantages of node purchasing upstream and downstream connections separately in the future, but for now they will be bundled). Note that node A makes no representation about the maximum bandwidth, latency, or any other quality of service metrics.

If the price per megabyte is within Bob's acceptable range, node B begins paying node A. At first, node B does not have any knowledge about the quality of node A's service. As node B uses the service, it is able to build this knowledge. If the QoS drops below what node B is willing to accept at the price per megabyte that it is paying, node B stops paying. If node B stops paying node A, node A takes steps to throttle or cut off the connection.

In the above example, it is taken for granted that node A is the one with connectivity, while node B is purchasing bandwidth. Further into the network, nodes making contact may both have connections to the internet, of varying quality. In this case the negotiation plays out similarly. Node B and node C connect, and send each other their price per megabyte. As above, each node makes a decision about whether they will accept the price at all. Then they begin to build up information about each others QoS.

## [1.2] Access control
Althea is designed to work in large part over wireless 802.11 networks, and ethernet. Routers must be able to offer and deny their physical neighbors service, as well as possibly throttling or prioritizing traffic depending on a neighbor's level of payment. In the conventional networking world, ISPs provide and limit connectivity by plugging and unplugging cables in data centers or internet exchange points, and by running traffic shaping software on individual network interfaces. 

In 802.11 networks, computers can connect to one another freely and send each other packets to be forwarded, unless the network has wireless security like WPA in place. Even with WPA, access to a given router is predicated on a shared secret (also known as a wifi password). In normal usage of WPA, access is provided on an all-or-nothing basis, and is available to anyone who has the password.

Hardwired Ethernet connections have even less in the way of access control. Generally, if a computer is connected to the network, it is given the ability to forward packets as needed over any routers on the network.

There is a great deal of tooling built up around filtering based on source and destination IPs. Most firewalls and traffic shaping software make this easy. However, it's not that useful for an incentivized mesh network. Consider this network:

```
A--B--C--D
```

Let's say that D has a connection to the internet. C is paying D for the connection, B is paying C, and A is paying B. A is the end user, accessing the internet. B and C are sending packets back and forth with source and destination addresses of A and D. Let's say that B stops paying C for access. C needs to stop forwarding packets from or to B, no matter their original source or eventual destination.

One way to allow C to do this is with tunnels. A tunnel is when one packet is wrapped inside of another packet in place of a data payload. If nodes establish tunnels with all of their neighbors, and only allow forwarding of packets over these tunneled connections, it gives them the ability to control connections to particular neighbors. In C's case, the tunnel with B can be throttled or cut off until B pays enough.

Another thing provided by a lot of tunneling software is cryptographic authentication. This is critical as well. Without authentication, another node could come within range of C, spoof B's IP address and claim to be B, effectively stealing the bandwidth that B paid for. In an authenticated tunnel, every packet is cryptographically signed by B, making this attack impossible.

The advantage of tunneling is that it is a widely implemented, mature technology. The disadvantage is that it adds some overhead. Since each packet must be wrapped in another packet, a tunnel will add 20-60 bytes per packet (the maximum size packet on most networks is 1500 bytes). Also, it may result in the packet being copied more times in the router's memory, which could also slow down forwarding.


### [1.1] Routing
Althea is built to work with an ad-hoc routing protocol which has been modified to propagate pricing information along with route quality information. This allows nodes to choose the best and lowest price routes to a given destination. Any distance vector or link state routing protocol could be used, but we will be modifying Babel because of its simplicity, extendability, and performance.

What nodes end up with is a routing table for each of their neighbors. It contains the full list of IPs that neighbor can forward packets to, along with the quality of the connection and the price. From this information, the node chooses which neighbor to forward packets for a certain destination to, updates its own routing table, and propagates the information on.

As packets are routed, each node is able to see how much it owes to and is owed by each of its neighbors, according to the routing table. How these payments are made is covered in 1.2.

Unfortunately, most routing protocols including Babel are currently vulnerable to a pretty fundamental attack that will need to be addressed. It is impossible to stop a node from misreporting its quality to a destination. This hasn't been a problem with routing protocols so far because they are used on networks that are owned by one entity, or between entities that have trust or legal relationships.

### [1.2] Payments
Each node on the network establishes payment channels with each of its neighbors. A payment channel is a method for two parties to exchange payments trustlessly by signing transactions that alter the balance of an escrow account held by a bank or blockchain (we may use the Ethereum blockchain for Althea).

The important thing about a payment channel is that after the channel has been opened, and funds have been placed in escrow, individual payments can be made directly between the two parties without submitting anything to the bank or blockchain. This means that the entire payment can be completed in one packet. Most payment systems need to send another transmission to a bank or blockchain, and wait for it to be confirmed. This would be too much overhead for use with Althea, which is why payment channels are used instead.

### [1.3] Gateway discovery
With the routing and payments described above, nodes can pay to have packets forwarded to destinations on the network. Other services can be built on top of this network. It's like the postal service. You attach an address and payment to a package and it gets delivered to its destination. If you order something that will be shipped to you, you have to pay for the item, plus the cot of sending it to you.

One very important service is providing a gateway to the internet. Nodes acting as gateways advertise a price and a quality metric for a connection to the internet. This information needs to be advertised to the rest of the network so that other nodes can choose which gateway to use. When a node has chosen a gateway, it pays for the service with a payment channel in the same way it pays its neighbors.

It's important to note that this involves the gateway paying to forward the response packets back to the end user. Like the mail-order example above, this means that an end user must send the gateway enough money to cover the price of the internet service, plus the price of sending the response packets back.

We haven't written the protocol around this yet. There are several other systems in development, so we may use one of them. In any case, the concept can be tested with the protocols in 1.1 and 1.2.

## [3] Vulnerabilities
As you may have noticed, this system is vulnerable. Babel makes no provision for hostile nodes. Under this protocol, any node can advertise a cost of 0 to every destination on the network, and have all traffic from its neighbors routed through it, and receive payment (while dropping the packets, or offering worse than advertised performance and reliability). There are also other, more subtle exploits.

There is some work on securing Babel and other distance vector routing protocols. However, this work tends to focus on the vulnerabilities that could occur in a network without monetary incentives. There are mitigations for DOS, impersonation of other nodes, and blackhole attacks. For now, we will consider these attacks to be outside of the scope of Althea. Satisfactory solutions need to be found, but this research is specific to Babel. 

Many of these mitigations assume a threat model where an adversary is attempting to disrupt or censor a network. We are more concerned about the treat model of many unscrupulous adversaries who are simply trying to defraud the network to get some incrementally higher total payment than they would otherwise.

Let's say that Alice and Bob are neighbors. Bob learns that he can reach Doris with a quality of 4. However, he tells Alice that he can reach Doris with a quality of 3. Alice routes her packets to Doris through Bob and pays him, although Bob is not the best route. This type of "false advertisement" attack is specific to Althea, because the adversary's motivation is monetary.

#### [3.1] Cost metric validation
For Alice to catch Bob attempting a false advertisement attack, she must be able to check that the quality metric that Bob is reporting for a destination is truthful. Distance vector functions by summing the quality metric that nodes report about their neighbors.

![](/images/honest-metric.png)
The distance vector cost to D seen by A is the summation of the link costs of all the links along the best route. Depending on the link quality metric used, it should be possible for this summation to be roughly equal to the overall link cost computed by A between it and D.

This overall link cost can be computed in the same way that the individual link quality costs are computed, by analyzing percentage of succesfully acknowledged transmissions over a given time period.

![](/images/dishonest-metric.png)
If someone on the route is advertising a lower (better) quality metric than they are actually able to provide, the distance vector cost seen by A will differ from the overall link cost.

From these primitives, it should be possible to build an anti-cheating protocol. The simplest implementation would be to compute an honesty score for each neighbor, and let a human operator choose to disconnect from a neighbor with an especially bad score.