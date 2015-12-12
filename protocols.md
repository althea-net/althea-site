---
layout: page
permalink: /protocols/
title: Protocols
---

## Universal Payment Channels

UPC provides the mechanism by which clients pay routers, and routers pay each other to transmit data. Payment channels enable nodes to exchange an unlimited number of payments with one another, after having placed money in escrow on a blockchain, or with a bank. Stationary routers in the network set up payment channels with one another to pay for packets forwarder.

- Anonymous- no record is created of individual payments.
- Individual payments do not add anything to a blockchain, or involve participation of a bank. The bank or blockchain is only involved to open or close a channel.
- Payments are created simply by cryptographically signing a message.
- Instant- the system does not need to wait for a payment to clear, or for a certain number of blocks to confirm.

[Read the white paper]({{ site.url }}/blog/universal-payment-channels/)

## Reactive Payment Routing

RPR routes payments across several payment channels, temporarily combining them into a multihop payment. RPR gossips routing messages between nodes, tracing a path for a payment to take. Clients and mobile routers in the network are able to pay the nodes they are temporarily connecting to over multihop channels. This avoids the time and expense of setting up a direct payment channel

- Anonymous- there's no way of telling whether a node is the sender or receiver of a payment or just another intermediary node.
- Finds the cheapest path through the network (nodes can take a variable fee for processing the payment).
- Can automatically convert from one type of currency to another. No exchanges involved.


## Proactive Incentivized Routing

PIR is the heart of the network. It routes packets, using both link quality and cost as metrics when deciding where to forward a packet. Nodes pay each other based on the amount of traffic they forward to different destinations. PIR is an extension to Babel, a well-tested and performant mesh routing protocol.

- Routes packets based on both route quality and route cost.
- Nodes pay to forward packets, making DDOS impossible (or at least very expensive).
