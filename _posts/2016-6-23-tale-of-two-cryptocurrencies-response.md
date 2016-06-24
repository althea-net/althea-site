---
layout:     post
title:      Response to "A tale of two cryptocurrencies"
---

I just read Tony Ascieri's [A tale of two cryptocurrencies](https://tonyarcieri.com/a-tale-of-two-cryptocurrencies) and while it's generally a pleasant overview of what's going on in cryptocurrency today, it has a few big misconceptions, and is missing a lot of detail on some other fronts.

The essay adopts a tone that has been common in the week since the DAO hack, a conviction that Turing-complete languages are doomed to fail, and that anyone who would use them for anything is stupid. I don't think this is the case. There's a huge amount of critical code in the world which is Turing-complete, and things are OK. Do software vulnerabilities exist? Yes. But they do not stop us writing complex and sensitive systems. 

Tony's piece makes the distinction that the really dangerous thing is to have Turing-complete _input_ languages. In my reading of some of the langsec material that he cites, this distinction is made because so many programs are written with the mentality that their input is simple and is not worth treating as a language. A lot of bugs have arisen because of a program acting more like a parser, and its input acting more like a language than the programmer suspected. I don't feel that Ethereum's EVM bytecode qualifies as an _input_ language under this criteria. It's intended to be a language, and it's intended to be Turing complete. It has come, and continues to come under the scrutiny appropriate to such a role.

The idea is that Turing complete languages are undecidable, and thus, that it is impossible to prove that they are secure. Indeed, one cannot prove that a Turing complete program will ever stop running (the halting problem). This doesn't stop us from using Turing complete code in critical applications. It's impossible to formally verify that your airplane isn't going to crash into the ocean, but that doesn't stop you getting on a plane. Because of the dangers of unexpected behavior, we make sure to test carefully, and use programming patterns that prevent bugs.

Turing complete EVM bytecode has all the same vulnerabilities of the software surrounding us, flying airplanes, running bank servers, and even driving cars. In the case of self-driving cars, neural networks perform a lot of their logic. Neural networks are far beyond any kind of static analysis or formal proof. The only way to verify that they are correct (and indeed the only way to program them) is to test them many times with many different inputs and make sure that they behave as expected. This doesn't stop us from making use of them.

The vulnerability that killed the DAO was very simple in nature. When you send money to an Ethereum contract, it has the option to run some code upon receiving the money. The mistake made by the authors of the DAO was to debit the account of the sender _after_ sending the money. The attacker's contract called the DAO's sending function again, triggering another send before debiting the attackers account for the first send. This vulnberability was actually quite similar to the vulnerabilities that can exist in databases that do not implement transactions (like MonogDB). These are bad vulnerabilities, but they are well understood and it is easy to mitigate them with mechanisms such as 2 phase commits, mutexes, etc. 

While the vulnerability would have been caught in a formal proof, it also would have been caught by a code review. In fact, it was caught by a code review. Least Authority caught this vulnerability 2 years ago when they audited Ethereum, and there were several papers and blog posts written about it in the weeks before the hack. I think that mitigation strategies will take the form of [defense in depth](https://blog.ethereum.org/2016/06/19/thinking-smart-contract-security/), with contract developers learning best practices and using frameworks to automate sensitive procedures, much like most databases come with the ability to do transactions, and avoid SQL injection.

Maybe there is a non Turing complete language out there that strikes the best balance between decidability and expressiveness. When it emerges, it will be possible to implement it on top of Turing-complete languages such as Solidity or EVM bytecode. It is not possible to go the other way. Like getting a haircut, it's a lot easier to take expressiveness away than to add it back. If language research progresses to such a point that it becomes easy to formally verify any program, while retaining the productivity of today's languages, it will greatly benefit all of computing. Until then, in smart contracts as in other areas, people will use code that *runs* and does what it needs to do with some reasonable assurance of safety.

## Lightning

Another topic that Tony touches on is the Bitcoin Lightning network. The Lightning network is a network of payment channels using hashlock reveals to trustlessly move payments across intermediary nodes without posting any transactions to the blockchain. Tony feels that the Lightning network is overly complex and possibly insecure. I agree with this assessment, but not in the way Tony thinks. I actually think that the Lightning network is complicated because of the non Turing complete language that it is programmed in- Bitcoin script. Allow me to explain.

Once you get past the complications introduced by Bitcoin script, the concept of channels and hashlocks is simple. A channel is an escrow arrangement that allows two participants to exchange payments directly between each other without having to contact a bank or blockchain to process and clear the payment. Let's say that Alice and Bob want to open a channel. They go to the bank and open a special escrow account and each put in $100. They tell the bank 

> "Give this money back to us when you receive a note signed by both of us, with updated balances"

If Alice now wants to pay Bob $5, she writes a note that says 

> "Alice: $95, Bob: $105"

She signs this and sends it to Bob. Now Bob can consider himself paid. If he wants to get his money out of the channel, he signs the note as well, and gives it to the bank. The bank pays him $105 and Alice $95, and Bob is $5 ahead.

There's a problem: Someone can cheat. Let's say that Alice and Bob have been exchanging these notes back and forth for a while, and the last note read 

> "Alice: $195, Bob: $5".

If Bob wants to cheat, he could just take the first note to the bank and receive $105. To combat this, we use a sequence number and a "challenge period". When Alice or Bob take a note to the bank, the challenge period starts. If during this challenge period, a signed note with a higher sequence number is submitted, the bank honors this note instead. This way, as long as Alice and Bob check in with the bank at least once every hold period, they can stop each other from cheating.

This mechanism lets Alice and Bob exchange as many payments as they want, as fast as they can send notes back and forth, within the amount that they have placed in escrow, without having to trust each other. But what if Alice wants to send a payment to someone she doesn't have a channel open with? Let's say that she wants to send a payment to Charlie, and Charlie has a channel open with Bob. She could send Bob a payment, and trust him to send Charlie a payment of the same amount. What if Alice wants to send Charlie a payment without having to trust Bob? This is possible with something called a hashlock.

Alice sends Bob a note with balances updated to give Bob a payment which says

> "Only honor this note if Bob presents the preimage to this hash: 2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b"

She sends the preimage to Charlie. Now Bob can only get his money if he can find the preimage. To get Charlie to give him the preimage, he prepares a note like the one that Alice sent him, locked with the same hash. For Charlie to unlock this payment, he must reveal the preimage to either the bank (if he's going to close the channel at this step) or to Bob. Once Bob's got the preimage, he can do the same to get his payment from Alice. Payment setup goes forward, payment authorization goes backward. At each step, incentives are aligned so that participants do not need to trust each other. This kind of payment can go over an arbitrary number of intermediary nodes, and if there is a large enough network, one can theoretically get a payment to anyone on the network.

This is how the Lightning network is supposed to operate. Of course, in the case of Lightning, the actual procedures are much more complex. This is not because the creators of Lightning were being intentionally obtuse. It is because Lightning needs to work with Bitcoin script, a non Turing complete language. This same type of network is far simpler to implement on Ethereum. Turing complete languages allow humans to express a series of steps in a way that makes sense to us. Non Turing complete languages force the programmer to jump through a lot of hoops, and work around the language. Tony's complaints about the complexity of Lightning actually disprove his take on Turing complete languages from the previous section!

Tony asks "what if one of the hubs on the Lightning network gets popped?" Absolutely nothing happens to anyone using the hub for payments, although the operator of the hub could lose a lot of money. The entire system is premised upon the being able to move payments across nodes that one does not trust. 