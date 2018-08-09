---
layout: paper
title: Althea governance paper
permalink: /governance-paper
---

**Jehan Tremback, Justin Kilpatrick, Deborah Simpier**

- **v0.5** May 2018

Althea is an “incentivized mesh” system- nodes pay each other for bandwidth. This can be used to create a decentralized internet access network serving towns and cities. More in the [network paper](https://altheamesh.com/network-paper). Node-to-node bandwidth payments are settled by payment channels in Ether or a number of other tokens which we will refer to as payment tokens. The governance system described here is controlled by Althea validators who stake a token called Althea governance token (ALGT). Both payments and governance are running on the Althea [Cosmos zone](https://cosmos.network/resources/whitepaper), a public blockchain, which is maintained by the Althea validators. Althea validators can also stake their ALGT to vote and perform other functions within the governance system.

## Subnet DAOs

Althea subnet DAOs define local Althea networks. They are lists of Althea nodes, identified by an IP address and a blockchain address. They are meant to be maintained by local groups of Althea users. An Althea subnet DAO is a decentralized organization with two types of participants:

- Nodes, which are identified by an IP address and a blockchain address. Nodes on a given subnet connect only to other nodes on that subnet.
- Organizers, who have the ability to vote on adding and removing nodes and other organizers.

Subnet DAOs have two main purposes:

- Reward people who take an active role in promoting the use of Althea in an area and make sure everything is running smoothly.
- Provide a mechanism for these people to control membership of a network by adding and removing nodes to mitigate attacks and bad behavior by nodes in the network.

Each node on a subnet pays a continuous (per block) renewal fee to its subnet DAO, in addition to the payments for bandwidth it is making to its neighbors. This continuous fee is mediated through the [renewal fee escrow contract](#renewal-fee-escrow-contract).

Nodes on a subnet check their subnet DAO on the blockchain before connecting to other nodes. If a node is not on the same subnet, they do not connect.

Nodes will most likely be added to a specific subnet because the organizers of that subnet DAO have introduced the owner of the node to Althea (and possibly installed their node). Subnet DAOs are incentivized to add more happy customers to the system to receive the IP renewal fees. This dynamic is intended to incentivize the spread of Althea, by rewarding the people who help spread it, even if they don't own equipment earning bandwidth payments.

# Global TCR

Subnet DAOs themselves are curated by the Althea global TCR, a [Token Curated Registry](https://medium.com/@ilovebagels/token-curated-registries-1-0-61a232f8dac7). The Althea global TCR is a list of subnet DAOs. Its goal is to make sure that all subnet DAOs are being run responsibly and are providing a good experience to users. In general, if there are no complaints or controversy about a subnet DAO it can be assumed that everything is going well and it should be on the global TCR.

Placement the global TCR can be considered a sort of certification of subnet DAOs. This information can be used in different ways:

- Nodes with standard Althea firmware will not be able to join to subnet DAOs which are not on the global TCR.
- People wanting to try Althea can learn about subnet DAOs in their area from the global TCR (for example, a coverage map on a website could provide this information).

## TCR Voting process

Someone starting a subnet DAO can stake any amount of ALGT and be included on this list. Someone who feels that a subnet DAO should not be on the list can put down a matching deposit to initiate a vote to kick them off the list.

If the subnet DAO being challenged loses the vote (because it is known to be blatantly scammy or provide a very poor experience), then that subnet DAO is removed from the list, and its deposit is split between the challenger and the token holders who voted to take it off the list.

If the challenger loses the vote, then the reverse happens. The challenger’s deposit is split between the token holders who voted to keep the subnet DAO on the list, and the subnet DAO itself.

Read more about this voting process in the [TCR 1.0 specification](https://medium.com/@ilovebagels/token-curated-registries-1-0-61a232f8dac7)

The ALGT holders have short term and long term incentives to do a good job curating the registry.

Short incentives come from the TCR voting process, since the winning voters get a portion of the deposit of the losing party.

Long term incentives from the price of ALGT:

- If the list is well-curated, it will be seen as a reliable list on which subnet DAOs are legitimate and good. People will want to use the standard Althea firmware, which will not show or join subnet DAOs which are not on the list.
- If the list is badly curated, then it will not be seen as a reliable list. People will make forks of the Althea firmware which use a different registry or none at all, and the ALGT tokens will drop in value.

# Subnet DAO implementation

The Althea global TCR has a very general requirements for subnet DAOs. This means that it could potentially work with a lot of different types of subnet DAOs. However, we are working on a reference subnet DAO implementation that will be suitable for most communities.

## Subnet DAO requirements

- Subnet DAOs must have an associated IPv6 subnet of size /64 in the Althea IPv6 range, that is not used by any other subnet on the list.
- Subnet DAOs must have a list of(IP address, blockchain address) pairs. The IP addresses must be allocated from the subnet DAO's IPv6 subnet.
- Subnet DAOs must have a per-block renewal fee listed, compatible with the renewal fee escrow contract.

## Reference subnet DAO implementation

The reference subnet DAO implementation will use [Aragon](https://aragon.one). Aragon is a platform for making decentralized organizations. It is intended for businesses and cooperatives but will work for Althea subnet DAOs as well.

If someone wants to start an Althea network in their area, they download the Althea subnet DAO dApp, or visit a hosted version. A wizard takes them through the subnet DAO setup process. A deposit is not immediately required.

### Node list

![](https://i.imgur.com/dMTIcbQ.png)

Routers on the network can be viewed on the “Node List” screen. Nodes are identified by a nickname and blockchain address, with more info such as IP address and notes available in a menu.

### Organizers

![](https://i.imgur.com/LuY9se4.png)

Organizers are visible on another screen. These are the people who make decisions about the subnet DAO.

### Voting

![](https://i.imgur.com/nO33CCq.png)

Adding or removing a node or an organizer, or doing other actions like disbursing funds collected from renewal fees triggers a vote. If only one signature is required for a given operation, the vote is automatically approved.

By default, one signature is required to add a node, and two signatures are required to remove a node. A majority is required to add or remove an organizer.

# Renewal fee escrow contract

This contract allows subnet DAOs to charge a per-block renewal fee without the inconvenience or transaction fees of actually paying it every block. At the same time, it avoids the need for a node to trust a subnet DAO with its money. Althea nodes add some money to this escrow contract ahead of time.

As mentioned above, a subnet DAO on the global TCR must specify a per-block renewal fee in its contract. The fee is paid out by this escrow contract. When a node joins a subnet or leaves a subnet it calls the escrow contract as part of that transaction. Subnet DAO organizers can call the escrow contract at any time to withdraw the money owed them.

A percentage of this fee is also sent to any address which has staked ALGT, whether for blockchain validation, or voting. This is to avoid a situation where ALGT holders are incentivized to cause unecessary votes just to earn more ALGT.

### When a node joins a subnet DAO:

- Record that it has joined the subnet DAO, and the subnet DAO's renewal fee at the time it joined.

### When a subnet DAO signer calls this escrow contract to get money that is owed to the subnet DAO:

- Get a list of all nodes which are currently on the subnet DAO.
- For each of these accounts:
  - Figure out how much it owes the subnet DAO, based on the renewal fee, the last block it paid the subnet DAO, the block it joined the subnet DAO, or the block it left the subnet DAO.
  - Calculate how much of the renewal fee goes to the Althea validators and curators and transfer it.
  - Transfer the remaining amount from the node’s escrow to the subnet DAO.

### When a node leaves a subnet:

- Figure out how much it owes the subnet DAO, based on the renewal fee, the last block it paid the subnet DAO, the block it joined the subnet DAO, or the block it left the subnet DAO.
- Transfer this amount from the node’s escrow to the subnet DAO.
- Remove the node from the list of nodes which are on the subnet DAO.

# Actors

This is a list of the different participants in this system and their economic and governance activities.

## Subnet organizers

Subnet organizers are excited about incentivized mesh and promote it in their area. They control a subnet DAO and IP range, and the Aragon organization that administers it. Since the subnet DAO receives a fee from each node using one of its IP addresses, they stand to gain from increased adoption of the service, even if they do not own a profitable intermediary node themselves. Subnet DAO organizers are also responsible for dealing with attackers on the network by revoking their IP addresses. If they do not do a good job of this, they will be challenged and voted off the global TCR.

### Economic activity

- Subnet organizers control an Aragon organization which receives IP address renewal fees from end user and intermediary/gateway nodes.
- Stake Althea governance tokens on their listing on the global TCR to preserve their spot.
- Spend money doing things to promote Althea, and their subnet.

### Governance activity

- Add new nodes to their subnet
- Remove attackers from the subnet.

## End users

End users are using the network, and while they may be excited about the concept of incentivized mesh, they mostly just want it to work. They are receiving access from one or more intermediary nodes that they are within line of sight of, or have another kind of connection with (Ethernet, coaxial cable, DSL, fiber, etc). They were probably sold on the concept of incentivized mesh by the subnet organizers of their subnet.

### Economic activity

- Pay intermediary nodes for bandwidth.
- Pay IP address renewal fees to subnet DAO.

### Governance activity

- Are allocated an IP address by subnet DAO organizers.

## Intermediary node owners

Intermediary node owners own a node which connects end user nodes or other intermediary nodes to the network. They make the system work on a basic level and receive the payments for bandwidth which make up the bulk of economic activity in the system. The functioning of intermediary and end user nodes is what makes up most of the Althea [network paper](https://altheamesh.com/network-paper).

### Economic activity

- Sell bandwidth to other Althea nodes.
- Either:
  - Buy bandwidth from another Althea node.
  - Pay for or otherwise procure bandwidth to the Internet in the conventional system.
- Pay IP address renewal fee to subnet DAO.

### Governance activity

- Allocated an IP address by subnet DAO organizers.
- Have a vested interest in the success of incentivized mesh in their area, but not necessarily any particular subnet DAO.
- May have IP addresses on several subnet DAOs in order to connect to end user nodes on those DAOs.

## Althea validators

ALGT holders can stake tokens to participate in blockchain validation or voting and receive a percentage of the renewal fees paid to all subnet DAOs, plus normal blockchain transaction fees. While this percentage is fixed, the fees charged by each subnet DAO can be changed by the subnet organizers.

### Economic activity

- If their tokens are staked at all, receive a percentage of IP address renewal fees from subnet DAOs.
- If their tokens are staked on validation, validators receive transaction fees and block rewards.
- If their tokens are staked on TCR voting, validators have the opportunity to receive the deposit of either the listing or the challenger.
- If their tokens are not staked, they will lose value from inflation at the rate of 7% per year.

### Governance activities

- Vote on challenges to subnet DAOs on the list. The best strategy for token holders to ensure the health of the network and thus the value of their tokens is to vote against challenges, unless they see a clear indication that a subnet DAO is being run badly.
