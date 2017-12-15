---
layout:     post
title:      State channel pong
summary:    "How can a blockchain enforce honest behavior during a game of pong?"
---

This is a quick writeup of some ideas that were discussed by myself, Ameen Soleimani, and Zaki Manian.

Ameen is actively researching state channels and was looking for project ideas. I suggested pong, as it is a very fast paced game that really emphasizes the scalability and speed of state channels. Playing pong on a state channel is somehow much more impressive than tic tac toe or chess. Thinking about state channels in terms of pong also loosened up my thinking around channels in general. We talked with Zaki for about an hour to find a good way to do it.

Alice and Bob send frames back and forth, both signing each valid frame. For example:

```
Alice -> Bob
Frame:
    Sequence: 88
    Ball: 11,23
    Alice's paddle: 15
    Bob's paddle: 3

Bob -> Alice
Frame:
    Sequence: 89 // Bump the sequence number
    Ball: 12,24 // The ball has moved according to pong "physics"
    Alice's paddle: 15
    Bob's paddle: 4 // Bob has moved his paddle
```

Alice will sign the frame that Bob has given her if it is valid, i.e. if the sequence number is correctly incremented and if the ball has obeyed the laws of pong physics. The frame also contains an update of Bob's paddle position.

They set up a contract on the blockchain that also understands the state transition from one frame to another. If given a frame signed by both Alice and Bob, the contract can of course establish that it is valid. The contract can also establish that a frame signed by only one of the participants is valid, given the frame before it signed by both. Also, as is the norm in state channels, frames with a higher sequence number override those with a lower sequence number. There is a challenge period of some length as well. After a frame is submitted, the contract waits for this amount of time before taking action on it (i.e. paying out some money to the winner).

In addition to frames, the contract accepts a notice of forfeit, signed by only one of the participants. For instance, Alice can claim "Bob forfeited". This can be overriden by a frame of any sequence number. If Bob does not post any valid frames during the challenge period, he forfeits the game.

Let's say that Bob sees that Alice is about to win, and he would like to end the game without forfeiting the money that he has locked up in the contract as a bet or whatever. I will prove that it is not possible for Bob to do this.

If Bob simply disconnects and stops signing frames, Alice can send a notice of forfeiture to the contract. If Bob doesn't send a valid frame before the hold period is up, Alice gets the money.

If Bob does send a valid frame, it's now up to Alice to send the next frame before the challenge period is over, otherwise she has forfeited. Alice and Bob could go back and forth like this until the end of the game, but this would be a very slow game, and very expensive because they would have to pay gas each time they submitted a frame.

If Alice sends a notice of forfeiture and then refuses to sign any more frames, Bob can submit a frame signed only by him, which is a valid transition from the frame signed by both him and Alice. Now it's up to Alice to send the next valid frame.

It's in both of their interests to play honestly and keep all frames except for the last one off the chain, but the slow and inefficient frame-by-frame process is always there as a fallback to keep the players honest.