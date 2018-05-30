---
layout: paper
title: Althea governance paper
permalink: /governance-paper
---

**Jehan Tremback, Justin Kilpatrick, Deborah Simpier**

* **v0.5** May 2018

Althea is an “incentivized mesh” system- nodes pay each other for bandwidth. This can be used to create a decentralized internet access network serving towns and cities. More in the [network white paper](https://altheamesh.com/documents/whitepaper.pdf). Node-to-node bandwidth payments are settled by payment channels in Ether or a number of other tokens which we will refer to as payment tokens. The governance system described here is controlled by Althea validators who stake a token called Althea governance token (ALGT). Both payments and governance are running on the Althea [Cosmos zone](https://cosmos.network/resources/whitepaper), a public blockchain, which is maintained by the Althea validators. Althea validators can also stake their ALGT to vote and perform other functions within the governance system.

## Subnet registries

Althea subnet registries define local Althea networks. They are lists of Althea nodes, identified by an IP address and a blockchain address. They are meant to be maintained by local groups of Althea users. An Althea subnet registry is a decentralized organization with two types of participants:

* Nodes, which are identified by an IP address and a blockchain address. Nodes on a given subnet registry connect only to other nodes on that subnet registry.
* Organizers, who have the ability to vote on adding and removing nodes and other organizers.

Subnet registries have two main purposes:

* Reward people who take an active role in promoting the use of Althea in an area and make sure everything is running smoothly.
* Provide a mechanism for these people to control membership of a network by adding and removing nodes to mitigate attacks and bad behavior by nodes in the network.

Each node on a subnet registry pays a continuous (per block) renewal fee to its subnet registry, in addition to the payments for bandwidth it is making to its neighbors. This continuous fee is mediated through the [renewal fee escrow contract](#Renewal-fee-escrow-contract).

Nodes will most likely be added to a specific subnet registry because the organizers of that subnet registry have introduced the owner of the node to Althea (and possibly installed their node). Subnet registries are incentivized to add more happy customers to the system to receive the IP renewal fees. This dynamic is intended to incentivize the spread of Althea, by rewarding the people who help spread it, even if they don't own equipment earning bandwidth payments.

# Global TCR

Subnet registries themselves are curated by the Althea global TCR, a [Token Curated Registry](https://medium.com/@ilovebagels/token-curated-registries-1-0-61a232f8dac7). The Althea global TCR is a list of subnet registries. Its goal is to make sure that all subnet registries are being run responsibly and are providing a good experience to users. In general, if there are no complaints or controversy about a subnet registry it can be assumed that everything is going well and it should be on the global TCR.

The global TCR can be considered a sort of certification of subnet registries. This information can be used in different ways:

* Nodes with standard Althea firmware will not be able to join to subnet registries which are not on the global TCR.
* People wanting to try Althea can learn about subnet registries in their are from the global TCR (for example, a coverage map on a website could provide this information).

## TCR Voting process

Someone starting a subnet registry can stake any amount of ALGT and be included on this list. Someone who feels that a subnet registry should not be on the list can put down a matching deposit to initiate a vote to kick them off the list.

If the subnet registry being challenged loses the vote (because it is known to be blatantly scammy or provide a very poor experience), then that registry is removed from the list, and its deposit is split between the challenger and the token holders who voted to take it off the list.

If the challenger loses the vote, then the reverse happens. The challenger’s deposit is split between the token holders who voted to keep the subnet registry on the list, and the subnet registry itself.

Read more about this voting process in the [TCR 1.0 specification](https://medium.com/@ilovebagels/token-curated-registries-1-0-61a232f8dac7)

The ALGT holders have short term and long term incentives to do a good job curating the registry.

Short incentives come from the TCR voting process, since the winning voters get a portion of the deposit of the losing party.

Long term incentives from the price of ALGT:

* If the list is well-curated, it will be seen as a reliable list on which subnet registries are legitimate and good. People will want to use the standard Althea firmware, which will not show or join subnet registries which are not on the list.
* If the list is badly curated, then it will not be seen as a reliable list. People will make forks of the Althea firmware which use a different registry or none at all, and the ALGT tokens will drop in value.

# Subnet registry implementation

The Althea global TCR has a very general requirements for subnet registries. This means that it could potentially work with a lot of different types of subnet registries. However, we are working on a reference subnet registry implementation that will be suitable for most communities.

## Subnet registry requirements

* Subnet registries must have an associated IPv6 subnet of size /64 in the range fc00::/7, that is not used by any other registry on the list.
* Subnet registries must have a list of(IP address, blockchain address)pairs. The IP addresses must be allocated from the registry’s IPv6 subnet.
* Subnet registries must have a per-block renewal fee listed, compatible with the renewal fee escrow contract.

## Reference subnet registry implementation

The reference subnet registry implementation will use Aragon. Aragon is a platform for making decentralized organizations. It is intended for businesses and cooperatives but will work for Althea subnet registries as well.

If someone wants to start an Althea network in their area, they download the Althea subnet registry dApp, or visit a hosted version. A wizard takes them through the subnet registry setup process. A deposit is not immediately required.

### Node list

![](https://i.imgur.com/dMTIcbQ.png)

Routers on the network can be viewed on the “Node List” screen. Nodes are identified by a nickname and blockchain address, with more info such as IP address and notes available in a menu.

### Organizers

![](https://i.imgur.com/LuY9se4.png)

Organizers are visible on another screen. These are the people who make decisions about the subnet registry.

### Voting

![](https://i.imgur.com/nO33CCq.png)

Adding or removing a node or an organizer, or doing other actions like disbursing funds collected from renewal fees triggers a vote. If only one signature is required for a given operation, the vote is automatically approved.

By default, one signature is required to add a node, and two signatures are required to remove a node. A majority is required to add or remove an organizer.

# Renewal fee escrow contract

This contract allows subnet registries to charge a per-block renewal fee without the inconvenience or transaction fees of actually paying it every block. At the same time, it avoids the need for a node to trust a subnet registry with its money. Althea nodes add some money to this escrow contract ahead of time.

As mentioned above, a subnet registry on the global TCR must specify a per-block renewal fee in its contract. The fee is paid out by this escrow contract. When a node joins a subnet registry or leaves a subnet registry it calls the escrow contract as part of that transaction. Subnet registry organizers can call the escrow contract at any time to withdraw the money owed them.

A percentage of this fee is also sent to any address which has staked ALGT, whether for blockchain validation, or voting. This is to avoid a situation where ALGT holders are incentivized to cause unecessary votes just to earn more ALGT.

### When a node joins a subnet registry:

* Record that it has joined the registry, and the registry’s renewal fee at the time it joined.

### When a subnet registry signer calls this escrow contract to get money that is owed to the subnet registry:

* Get a list of all nodes which are currently on the subnet registry.
* For each of these accounts:
  * Figure out how much it owes the subnet registry, based on the renewal fee, the last block it paid the registry, the block it joined the registry, or the block it left the registry.
  * Calculate how much of the renewal fee goes to the global TCR and transfer it.
  * Transfer the remaining amount from the node’s escrow to the subnet registry.

### When a node leaves a subnet registry:

* Figure out how much it owes the subnet registry, based on the renewal fee, the last block it paid the registry, the block it joined the registry, or the block it left the registry.
* Transfer this amount from the node’s escrow to the subnet registry.
* Remove the node from the list of nodes which are on the subnet registry.

# Actors

This is a list of the different participants in this system and their economic and governance activities.

## Subnet organizers

Subnet organizers are excited about incentivized mesh and promote it in their area. They control a subnet registry and IP range, and the Aragon organization that administers it. Since the subnet registry receives a fee from each node using one of its IP addresses, they stand to gain from increased adoption of the service, even if they do not own a profitable intermediary node themselves. Subnet registry organizers are also responsible for dealing with attackers on the network by revoking their IP addresses. If they do not do a good job of this, they will be challenged and voted off the global TCR.

### Economic activity

* Subnet organizers control an Aragon organization which receives IP address renewal fees from end user and intermediary/gateway nodes.
* They stake Althea governance tokens on their listing on the global TCR to preserve their spot.

## End users

End users are using the network, and while they may be excited about the concept of incentivized mesh, they mostly just want it to work. They are receiving access from one or more intermediary nodes that they are within line of sight of, or have another kind of connection with (Ethernet, coaxial cable, DSL, fiber, etc). They were probably sold on the concept of incentivized mesh by the subnet organizers of their subnet.

### Economic activity

* Pay intermediary nodes for bandwidth.
* Pay IP address renewal fees to subnet registry.

### Governance activity

* Are allocated an IP address by subnet registry organizers.

## Intermediary node owners

Intermediary node owners own a node which connects end user nodes or other intermediary nodes to the network. They make the system work on a basic level and receive the payments for bandwidth which make up the bulk of economic activity in the system. The functioning of intermediary and end user nodes is what makes up most of the Althea [network white paper]().

### Economic activity

* Sell bandwidth to other Althea nodes.
* Either:
  * Buy bandwidth from another Althea node.
  * Pay for or otherwise procure bandwidth to the Internet in the conventional system.
* Pay IP address renewal fee to subnet registry.

### Governance activity

* Allocated an IP address by subnet registry organizers.
* Have a vested interest in the success of incentivized mesh in their area, but not necessarily any particular subnet registry.
* May have IP addresses on several subnet registries in order to connect to end user nodes on those registries.

## Althea validators

ALGT holders can stake tokens to participate in blockchain validation or voting and receive a percentage of the renewal fees paid to all subnet registries, plus normal blockchain transaction fees. While this percentage is fixed, the fees charged by each subnet registry can be changed by the subnet organizers.

### Economic activity

* If tokens are staked at all, receive a percentage of IP address renewal fees from subnet registries.
* If tokens are staked on validation, validators receive transaction fees and block rewards.
* If tokens are staked on TCR voting, validators have the opportunity to receive the deposit of either the listing or the challenger.
* If tokens are not staked, they will lose value from inflation at the rate of 7% per year.

### Governance activities

* Vote on challenges to subnet registries on the list. The best strategy for token holders to ensure the health of the network and thus the value of their tokens is to vote against challenges, unless they see a clear indication that a subnet registry is bing run badly.
