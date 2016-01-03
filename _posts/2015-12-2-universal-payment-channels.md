---
layout:     post
title:      Universal Payment Channels
summary:    "Costless, instantaneous payments let us use money in a completely new way. Conventional payment processors impose arbitrary fees and delays, and cryptocurrencies can function only with inevitable confirmation times and blockchain bloat. Free from these constraints, we can create a new class of applications."
---

Costless, instantaneous payments let us use money in a completely new way. Conventional payment processors impose arbitrary fees and delays, and cryptocurrencies can function only with inevitable confirmation times and blockchain bloat. Free from these constraints, we can create a new class of applications.

For instance, incentivized mesh networks. These are networks of independently owned routers which are automatically compensated by the network. In an incentivized mesh network, individuals could invest in providing internet service to their neighbors without the overhead of an ISP business. Also, due to the fact that individual routers compete with one another in such networks, consumers would be free from the monopolistic pricing which characterizes existing ISPs.

Incentivized mesh networks function by having routers pay their neighbors to forward packets. Nodes could pay per packet, but this would normally impose a huge overhead. Processing these payments with conventional currencies would result in an at least an API call to the payment processor with every payment. It would also likely result in a database entry at the payment processor. Processing these payments with a cryptocurrency (saving each and every one to the blockchain) would quickly result in a very bloated blockchain. Payment packets would vastly outnumber data packets.

Nodes could keep a tally of payments to one another to reduce the total number of payments. This requires nodes to trust one another. If I am paying you to forward my packets, either I put a deposit down with you, or you extend me credit. In the former scenario, I need to trust you, while in the latter, you need to trust me. The less the amount of credit or deposit is, the larger the number payments will need to be sent.

## Payment Channels

What if there was a way to transfer money without trusting the other party, and without incurring the costs of a blockchain or conventional payment? Payment channels can do this. In a payment channel, two parties deposit money with a third entity that both trust. If the channel is to transfer conventional currency, a bank or payment processor plays the role of trusted third party and holds onto the money. Both parties must trust the integrity of that bank or payment processor. If the channel holds cryptocurrency, a contract on a blockchain locks the funds from both parties. Both parties must then trust the integrity of that blockchain.

![Step 1]({{ site.url }}/images/upc-step-1.png)

The bank or the blockchain will transfer the locked funds back to the channel participants upon receiving a message signed by both.

Upon receiving this message, the bank or blockchain also updates the amounts to be transfered back. If Alice and Bob both deposited $100 to open the channel, and close it with balances of $95 and $105, Alice has effectively given Bob $5. So, to pay Bob, Alice signs a message updating her balance to $95 and Bob's balance to $105. She sends this message only to Bob, without contacting the bank or the blockchain that the channel is open with. If Bob wants to get his money out, he simply posts the last signed message to the bank or the blockchain.

![Step 2]({{ site.url }}/images/upc-step-2.png)
![Step 3]({{ site.url }}/images/upc-step-3.png)

There's one issue though- someone could cheat. Let's say that Bob makes a payment to Alice and the balances are updated to Alice- $50 and Bob- $150. Then Alice makes a payment to Bob, reversing the balances to Alice- $150, Bob- $50. Bob could take the old message where he has $150 and post it, cheating Alice out of $100.

![Step 4]({{ site.url }}/images/upc-step-4.png)

How to prevent this? We need some way for the bank or the blockchain to find out whether a message represents the account balances that Alice and Bob most recently agreed on. If Alice and Bob put a sequence number on each message and increment it every message, either of them can prove if one message is more recent than another. If the bank or blockchain then waits a certain length of time (or "hold period") before transferring the money back, it gives either party a chance to prove that the other is cheating.

![Step 5]({{ site.url }}/images/upc-step-5.png)

What if Alice and Bob don't want to wait to get their money out? They can simply sign a message with a hold time of 0. This means that the bank or blockchain will immediately transfer the money to their accounts. The only situation in which the hold time will actually be a factor is a situation where one of the parties wants to close the channel and the other is unresponsive or uncommunicative.

![Step 6]({{ site.url }}/images/upc-step-6.png)

This is the foundation of Universal Payment Channels (technical details in the [white paper](#)).

## Multihop payments {#multihop}

Back to the incentivized mesh example: If Alice and Bob both have nodes in an incentivized mesh network, they can open a channel in whatever currency they wish, and exchange packets and payments to their heart's content. But what about mobile nodes? Alice has a cell phone, and happens to walk into range of Charlie's wifi hotspot. Charlie could forward Alice's packets through Bob and on to their destination, but he's going to need some payment from Alice. Charlie and Alice don't have a channel open- how will Alice pay Charlie?

What if both Alice and Charlie have channels open with Bob? Alice could send Bob a payment, who would then send Charlie a payment. But now Alice needs to trust Bob.

#### Smart conditions and hashlocks

We have to make sure that Bob can't steal the money. UPC allows us to make payments with pieces of code called "smart conditions". The bank or blockchain evaluates the smart condition, to find out whether it should transfer some money. We can make a type of smart condition called a hashlock which allows us to trustlessly route payments through one or more intermediary nodes. A hashlock basically says: "transfer this amount of money if you are given the string that hashes to this hash".

> A hashing function turns whatever value you give it into a random-looking string of characters, known as a "hash". For instance, the string "alfred" might be turned into "d8si32" by a hashing function. This has two interesting properties: the same hashing function will always turn "alfred" into "d8si32", and someone who has "d8si32" has no way of knowing that it was derived from "alfred". So, if Jim wants Gregory to be able to recognize that someone has the correct secret word, but Jim doesn't want to actually give Gregory the secret, Jim can give Gregory a hash of the secret. If someone gives Gregory a word they claim is the secret, Gregory can hash it and find out whether it is the correct word.

#### Trustless multihop payments with hashlocks

To route a payment through Bob, Alice sends Charlie a secret, and the amount of the payment. Alice then sends a payment to Bob, hashlocked with the secret she sent Charlie. Bob sends his own payment message to Charlie, hashlocked with the same secret, and containing a payment of the same amount.

![Step 7]({{ site.url }}/images/upc-step-7.png)

To unlock the payment from Bob, Charlie reveals the secret to him, which allows Bob to unlock the payment from Alice.

![Step 8]({{ site.url }}/images/upc-step-8.png)

This all happens as fast as packets can be forwarded, and doesn't store anything on the blockchain or bank servers. It's an ideal mechanism to handle the high volume of payments that need to be processed by an incentivized mesh network.

You may be wondering- how do we know that Bob is the best intermediary node to route payments from Alice to Charlie? Stay tuned for the next post, about Reactive Payment Routing, a routing protocol which finds the cheapest path for payments.

For a more complete overview of UPC, see the [white paper]({{ site.url }}/documents/universal-payment-channels.pdf).

Acknowledgement: Payment channels utilizing a hold period in this way were, to the best of my knowledge, first introduced in Zackary Hess's [Flying Fox](https://github.com/BumblebeeBat/FlyingFox).
