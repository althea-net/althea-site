---
layout:     post
title:      Incremental multihop channel payments
---

Instead of having smart conditions return either true or false we can have them return a fraction (see [Flying Fox](https://github.com/BumblebeeBat/FlyingFox)). The transfer amount of the hashlock is multiplied by the fraction. This way, smart conditions have fine grained control over what fraction of a payment gets transfered. This gives us the option to build more sophisticated smart conditions. One of these is the "multi-hashlock" which gives us the ability to build a sort of higher level micropayment channel that sits on top of several payments, with smart conditions that can be fulfilled slowly.

What am I talking about, and why would you need it? Let's use the example of an incentivized mesh network. We can set up payment channels between the stationary nodes, and they can pay one another with those. But what about mobile nodes who may only be within range of another for short amounts of time? A payment channel takes at least a few minutes to set up, if we're going to wait for a sufficient number of confirmations. Also, setting up a new payment channel is going to add bloat to the blockchain. This is why we have multihop payments. By routing a payment across several existing payment channels, we don't add anything to the blockchain or talk to the bank.

Still, multihop payments can result in a lot of network traffic if the route is unknown. Depending on the routing protocol, there may be a search of the network for every multihop payment channel route (RPR currently floods the network for every route request). We need some way to allow for many payments with only one route request. We can do this with a multi-hashlock:

```
condition(fulfillment)
  // An array of 1000 hashed secrets
  hashes = [xyz123, abc789, ... ]
  numerator = 0

  // A 'for' loop that will run 1000 times
  for i in 0..1000:
    // If the hashed secret is correct
    if sha3(fulfillment[i]) === hashes[i]:
      // Add 1 to the numerator
      numerator++

  // Return the fraction of secrets that were correct
  // (the total transfer amount will be proportional to this)
  return numerator / 1000
```

With a multi-hashlock, progressively more of the payment is unlocked depending on how many correct secrets are passed in through the fulfillment.

A multihop payment for the full amount of the multi-hashlock is routed, using whichever inefficient routing protocol. Once the route is found, multi-hashlocked payments are made along the entire route. As the source of the payment wishes to pay the destination, it releases successive secrets to the destination. These can be cached by the destination, or immediately passed to the next node in line.