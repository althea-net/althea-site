---
layout:     post
title:      The free option problem
summary:    "The free option problem is an apparently inescapable problem in state channels. However, it can be mitigated. I'll cover 3 possible mitigations in this blog post. It's a variant of the fair exchange problem, which is a known concept in the field of cryptography as a whole."
---

The free option problem is an apparently inescapable problem in state channels. However, it can be mitigated. I'll cover 3 possible mitigations in this blog post. It's a variant of the fair exchange problem, which is a known concept in the field of cryptography as a whole. Let's review the fair exchange problem: 

> Alice and Bob wish to exchange signatures. If Bob sends his first, Alice could simply refuse to send hers and walk away. If Alice sends first, the situation is reversed.

Here's a [good overview](https://crypto.stackexchange.com/questions/35828/is-it-possible-for-alice-and-bob-to-both-sign-a-message-simultaneously) from a question I asked on a Q&A site.

This applies very directly to state channels. Let's review how a state channel works:

> Alice and Bob agree on some state, give it an incrementing sequence number, and sign it. Either Alice or Bob can now prove that the other agreed to that state, and that it is the most recent state that they have agreed to. If either one tries to falsely claim that an older state is the most recent state, the other can show a signed state with a higher sequence number and disprove the claim.

Most current state channel implementations also include the concept of a challenge period. This is a period of time after which it is not possible to disprove an older update by submitting a newer one. This gives a distinct cutoff point after which actions can be taken on the state.

This mechanism has found use in payment channels, which allow Alice and Bob to keep a running tally of how much they owe each other, updating it to make payments with extremely low overhead. This tally is backed up by money escrowed by one or both of them on a blockchain or with a trusted third party. When either one wants to pull the money out, they submit the most recent state. After the challenge period ends, the money is released.

In theory it can also be used for a wide range of other interactions [including pong](http://altheamesh.com/blog/state-channel-pong/).

## Example

The free option problem is just the fair exchange problem in the context of state channels. It's called the free option problem because it first presented itself in the use of state channels for trading assets against each other. Let's say a state channel is being used by Alice and Bob to trade silver against gold. The state records Alice's balance of silver and gold, and Bob's balance of silver and gold. This is backed up by bars of metal stored with an escrow service. When Alice wishes to trade some silver from some gold, she creates a new state with her balance of silver decreased and her balance of gold increased, and Bob's balances vice-versa. She increments the sequence number, signs it, and sends it to Bob.

If Bob refuses to send his signature back, he now has a free option. If he wants to, he can submit the state that Alice just sent him and receive more silver, or submit the previous state and receive more gold. He might choose differently based on how the market moves. Alice has given him a free option.

The free option problem also has another effect. Let's call it an "unjust punishment". Some state channel implementations have a mechanism where someone attempting to close a channel must submit a deposit along with their closing state. If a later state overrides it, the deposit is taken as punishment. This is meant to dissuade people from dishonestly submitting old states. In the example above, if Alice wants to close the channel, she must submit the latest state that she has. However, Bob has a later state with a higher sequence number. If Alice submits her latest state, Bob can submit his later state and take her deposit.

## Mitigations

There are at least 3 mitigations of the free option problem. They all basically consist of eliminating a single point in time where one party has a fully valid state and the other does not.

### Incremental transfer amount

This applies mostly to channels recording balances of assets. More broadly, it works for channels where a state update can be broken into many smaller updates to achieve an equivalent effect. For instance, a trade of 100 grams of silver for 10 grams of gold can be broken into 100 trades of 1 gram of silver for 0.1 gram of gold. In the example above, if Alice did this she would only ever be giving Bob a much smaller free option. However, this only really works for divisible numerical transfers, and it does nothing to protect against an unjust punishment.

### Incremental transfer validity time

A solution used by [Gnosis](https://gnosis.pm/) is to make state updates that expire after some time. Alice sends Bob an update transferring the full amount that expires very soon. When Bob has sent her a signature on that update, she sends an update that is valid for longer. This way, Alice and Bob are giving each other free options that are not useful for very long. This is especially well suited for exchanges, where the value of a free option is determined by how much the market has moved. It is also a partial solution to the unjust punishment problem discussed above. If Alice wants to close the channel, but Bob has a later update, she can just wait until Bob's update is no longer valid.

### Incremental transfer probability 

This is an interesting solution that I came up with, which to my knowledge is not implemented anywhere. Alice and Bob each have a number of separate keypairs that they sign updates with (let's say 100 for now). Alice sends Bob an update that is signed by 1 of the keypairs. When Bob has responded with the signature from 1 of his keypairs, Alice sends a signature from her next keypair. This continues until the update has 100 signatures from each Alice and Bob. When one of them wants to close the channel, the blockchain or escrow service chooses a random number. This is used to derive the number of signatures required to consider the update valid. For instance, if the escrow chooses 0.34 as the random number, 34 signatures from Alice and Bob are required. Of course, if the process has been followed correctly and completed, the chance of validity is always 100%. 

If one of them breaks the process off early, they will only have a 1% higher chance of having a valid state update. This obviously is not great if one party has a much more at stake or a much lower tolerance for risk than the other. I think this mechanism could also be used to mitigate the unjust punishment problem, if there is also a punishment for updates that fail validation for not having enough signatures.
