---
layout:     post
title:      Proportional hashlocks
summary:    "The proportional hashlock gives us the ability to build a sort of higher level micropayment channel that sits on top of a chain of multihop payments which are released incrementally."
---

In an incentivized mesh network, some nodes will be stationary, and some will move. We can set up payment channels between the stationary nodes, and they can pay one another with those. But what about mobile nodes who may only be within range of one another for short amounts of time? A payment channel takes at least a few minutes to set up, if we're going to wait for a sufficient number of confirmations (or even longer if it's a conventional currency and we're dealing with a bank). This is why we have multihop payments. By routing a payment across several existing payment channels, we don't have to wait for a new channel to be set up.

Multihop payments can result in a lot of network traffic if we don't know what route the payment will take. Depending on the payment routing protocol, there may be a search of the network for every multihop payment (RPR, a payment channel routing protocol, currently does this).

Instead of having smart conditions return either true or false we can have them return a fraction (see [Flying Fox](https://github.com/BumblebeeBat/FlyingFox)). The transfer amount of the hashlock is multiplied by the fraction. This way, smart conditions have fine grained control over what fraction of a payment gets transfered. This gives us the option to build more sophisticated smart conditions.

The proportional hashlock gives us the ability to build a sort of higher level micropayment channel that sits on top of a chain of multihop payments which are released incrementally. Its properties are similar to a low level payment channel in that individual payments are very cheap, and either participant can leave at any time and get all the money they are entitled to. However, this channel only goes one way.

#### Proportional hashlock smart condition:

    condition(secrets)
      // An array of 1000 hashed secrets
      hashes = [xyz123, abc789, ... ]
      numerator = 0

      // A 'for' loop that will run 1000 times
      for i in 0..1000:
        // If the hashed secret is correct
        if sha3(secrets[i]) === hashes[i]:
          // Add 1 to the numerator
          numerator++

      // Return the fraction of secrets that were correct
      // (the total transfer amount will be proportional to this)
      return numerator / 1000

(roughly translates as)

    List of 1000 hashes: xyz123, abc789, ...

    Numerator: 0

    Take this list of hashes and compare them to a list of secrets that you will be given. Hash each secret in the secrets list, and compare it to the corresponding hash from the hash list. If they match, add 1 to Numerator.

    return Numerator / 1000

With a proportional hashlock, the amount of payment released is proportional to the number of correct secrets that are supplied when the condition is evaluated. Here's how to use it to make an incremental multihop payment:

`Alice -- Bob -- Charlie -- Doris -- Erin`

Alice would like to pay Erin.

- A large multihop payment is set up from Alice to Erin, using payments with proportional hashlocks.

- Alice sends Erin secrets proportional to the amount that she wishes to pay. For instance, with the example smart condition above, a single $1000 payment could be released in $1 increments.

- Each time Alice wants to pay a dollar, she sends the Erin one of the secrets. Erin checks whether it works to unlock a fraction of the payment.

- If it does, it considers the payment complete (At this point, the channel could be closed and Erin would be able to redeem 1 1/1000 of the channel amount, or $1).

##### Caching

What if Erin caches secrets without passing them on to Doris? If Doris then sends Erin another payment on that channel that would result in Doris not having enough liquidity to honor the cached secrets, Erin must refuse that payment (and possibly request that Doris close out the channel and open a new channel with more liquidity).

##### Closing the proportional hashlock

What happens if Alice and Erin never make another payment? Doris can request that Erin sign an update transaction eliminating the proportional hashlock. Once this is done, Alice can send the secrets to Doris, but this will only serve to have Alice pay Doris the remainder.

What if Charlie wants to close the proportional hashlock? He can let Doris know that he wants to do this. At this point Doris can request that Erin sign an update transaction eliminating the proportional hashlock. If Doris does not do this, then Charlie can simply close the channel between him and Doris.

##### Possible exploit? Alice sends the secrets to Charlie:

What if Alice sends secrets to Charlie instead of Erin? Charlie will be able to redeem the proportion of the payment that Alice sent him the secrets for, and so will Bob. In effect, Alice is paying Charlie. Now, if Alice sends those same secrets to Erin, Erin can use them to get a payment from Doris. Doris can use them to get a payment from Charlie.

So Charlie can't trust a payment from Alice, unless he can get Doris to agree to close their proportional hashlock immediately afterwards. But this doesn't matter, because Charlie is not supposed to be receiving the secrets from Alice anyway.

##### What is it good for?

The actions taken in this scenario, and the incentives, are similar to a scenario where Alice sends Erin a series of separate normal multihop payments over the same set of intermediary nodes. The difference is that a payment of a certain size can be set up beforehand and then released slowly, with secrets flowing in one direction, without new payments needing to be set up. The secrets are also cache-able, and can be released in blocks. Also, the payment can be routed as one payment, which can reduce routing traffic. A lot of these goals could probably be accomplished in the routing protocol, but depending on how it was done, they could compromise the strong anonymity guarantees offered by routing protocols such as RPR.

