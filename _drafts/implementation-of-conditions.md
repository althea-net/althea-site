I think it's important to start from the simplest and most capable model, and constrain capabilities and add complexity as needed. I think that having conditions included in update transactions is the conceptually simplest design.

Making all nodes ready to execute Turing-complete code, while conceptually elegant, presents some implementation challenges. One is hostile code and sandboxing. Something could break out of its sandbox or corrupt some memory and steal all your money. Still, all a condition needs to do is return a number between 1 and 0, so it's very easy to sandbox. Two is long-running code that is just going to stall out your box. This isn't as big of an issue as on a blockchain, because it will only stall out your box, and not the entire network. If your channel partner keeps sending you annoyingly resource intensive code, you could conceivably close the channel because they're being a jerk.

How to avoid putting untrusted code in conditions?

The defining feature of conditions is that they are signed by both parties, while fulfillments are signed by only one. Currently, UPC's definition of conditions include stuff that feels like "data". For example, in the hashlock condition, there is a hardcoded hash. The incremental hashlock has a hardcoded array of hashes.

This data needs to be signed by both parties. You could have a condition that takes this data as a parameter, but since it needs to be signed by both parties it would need to be passed in at the time that the update transaction containing the relevant condition is created.

I've thought of this before, but I kind of consider it an optimization so I didn't put it in the paper. Here's how it works:

Preset conditions take two objects, `definition` and `fulfillment`. `definition` must be supplied in the update transaction that defines the condition, and must be non-executable (in javascript, JSON).
`fulfillment` comes from the fulfillment, and takes the role of `argument` in my existing spec. Here's how it all looks put together:

    openingTransaction: {
      presetConditions: {
        hashlock: function (definitionData, fulfillmentData) {
          if (hashFunction(fulfillmentData.secret) === definitionData.hash) { return 1 }
          else { return 0 }
        }
      },
      ... // other stuff that goes in opening transaction
    }

    updateTransaction: {
      conditions: [
        {
          conditionName: "hashlock",
          definitionData: {
            hash: "xyz123"
          }
        }
      ],
      ... // other stuff that goes in update transaction
    }

    fulfillment: {
      condition: 1,
      fulfillmentData: {
        secret: "the secret string"
      }
    }

This is a way of defining conditions beforehand. In my examples, it's being defined in the opening transaction, but it could just as well be defined by the ledger provider, and they could only offer a small range of possible conditions. Big banks could do this, while developers would still have the freedom to experiment and develop new conditions.

It might also be useful to define a way for conditions to run outside of the UPC code. This way, a UPC implementation does not need to use a specific scripting language for its conditions. Both channel parties must be in agreement with the escrow provider on what code a certain condition will run. Instead of the code of a smart condition being preset in the opening transaction, it is understood to be present on the machines of both channel participants and the escrow provider. The UPC implementation could use a socket protocol, like Tendermint's TMSP. The UPC implementation, when needing to evaluate a smart condition, would output the condition name, the defintion data, and the fulfillment data. It would then wait for a response of a number between 1 and 0. As long as the channel participants and the escrow provider are in agreement about which code runs for a given condition name, this works as well as a built in scripting language. Note that this means that the escrow provider must be aware of all smart conditions that will be used beforehand. Channel participants can not supply new conditions.