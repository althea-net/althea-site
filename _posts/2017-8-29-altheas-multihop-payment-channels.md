---
layout:     post
title:      Althea's multihop payment channels
summary:    "Althea's payment channels are key to how it works, but they are also one of the simpler parts to implement and explain. Payment channels allow payments to be made with a minimum of overhead. In the simple case, a payment can be made between two neighbors in the network with only one packet."
---

Althea's payment channels are key to how it works, but they are also one of the simpler parts to implement and explain. Payment channels allow payments to be made with a minimum of overhead. In the simple case, a payment can be made between two neighbors in the network with only one packet. The catch is that the neighbors need to have deposited money into the a payment channel contract beforehand to "open the channel". However, channels can also be chained together using something called a "hashlock" to allow nodes to transact trustlessly over linked payment channels, without needing to be directly linked by a channel.

There are already several channel implementations for Ethereum. The best-known one is Raiden. We found Raiden to be very monolithic and tied to a large Python offchain codebase. We cannot use Python on our routers. We need to use a language suited to embedded device programming, so we are using Rust (however, this blog post is only about the Solidity contract). Raiden also includes a lot of functionality we don't need, and is very complex in general. For example, they implement their own Merkel tree in Solidity. Maybe the complexity is warranted because it's intended to be a payment channel for every use case. Our application has relatively simple needs and payment channels are a concept that is well understood, so we decided it would be more expedient to use our own simple solution. 

There's also Machinomy. Machinomy is pretty clean, but it is a unidirectional channel. This means that money can only ever flow in one direction. You could set up two unidirectional channels, but this is still not as good as a bidirectional channel. To illustrate why, let's say Alice and Bob have both put 100 Ether in a bidirectional channel. If Alice sends Bob 100 Ether, and then Bob sends Alice 100 Ether, the channel will be back in the state it started at and ready to be used some more. If instead there are 2 unidirectional channels, then both participants sending each other 100 Ether over their 2 channels will result in both channels being exhausted. New channels will then need to be created, resulting in more blockchain transaction fees and waiting for confirmations. You could get into some stuff like letting unidirectional channels refill each other, but this is more complex than a bidirectional channel.

We developed the theory underlying our payment channels based on some of Zack Hess's work back in 2015. You can read an explanation of the theory [here](/blog/universal-payment-channels). For this blog post I'm going to be focusing specifically on the Solidity payment channel contract in the current implementation of Althea.

This code has not been audited, and may have obvious or subtle exploits that we are not aware of. Don't just copy and paste this and put a lot of money in it. If you do see an issue, let us know because we will gladly update this blog post to credit you and discuss the vulnerability.

## Imports

```
pragma solidity ^0.4.11;
import "./ECVerify.sol";
import "zeppelin-solidity/contracts/token/MintableToken.sol";
```
First, we import a couple of other contracts. `./ECVerify.sol` is a piece of code written by Alex Beregszaszi (@axic). The type of signatures used by Ethereum normally consist of 3 values, `R`, `S`, and `V`. ECVerify takes a byte array which consists of these three values concatenated. This keeps us from having to pass around 3 extra variables all over the place (the EVM can have issues with too many local variables) and is just cleaner. It also smoothes out some other quirks in the Ethereum signature scheme which are too ridiculous to get into.

`MintableToken.sol` is an ERC20 token contract provided by Open Zeppelin. It's probably more secure than if we were to try to make our own ERC20 token. None of the stuff in this contract deals with the ERC20 token functionality much, so we could probably plug in lots of different ERC20 variations if we wanted to.

## Data structures

```
contract PaymentChannels is ECVerify, MintableToken {
    struct Channel {
        bytes32 channelId;
        address address0;
        address address1;
        uint256 totalBalance;

        uint256 balance0;
        uint256 balance1;
        bytes hashlocks;
        uint256 sequenceNumber;

        uint256 settlingPeriodLength;
        bool settlingPeriodStarted;
        uint256 settlingPeriodEnd;
        bool closed;
    }

    mapping (bytes32 => Channel) public channels;
    mapping (bytes32 => bool) seenPreimage;
...
```

Now we get into the actual contract. We inherit from the other contracts we imported above, so that we can use their functionalities. We also declare the channel data structure:

- `channelID` is a unique identifier for the channel.
- `address0` and address1 are the two Ethereum addresses that will be transacting over the channel.
- `totalBalance` is the total amount of money that both participants are putting in the channel. It needs to be the sum of balance0 and balance1
- `balance0` and balance1 are the amounts that address0 and address1 are putting in the channel.
- `hashlocks` is a byte array encoding any hashlocks that are active in the channel. There's parsing logic later in the contract that parses the hashlocks out of the byte array, since passing arrays of structs is not currently supported by Solidity.
- `sequenceNumber` is incremented with every channel update transaction, allowing this contract to only honor the latest valid update.

- `settlingPeriodLength` is the amount of time after a channel's settling period has started that must elapse before the channel can be closed and the money can be taken out.
- `settlingPeriodStarted`: whether the channel's settling period has started.
- `closed`: whether the channel has been closed.
- `settlingPeriodEnd` is the block height after which the channel can be closed.

We also declare 2 mappings. `channels` is for storing channels that have been created with the contract. `seenPreimage` is a mapping of hashes that records whether the contract has already been shown the preimage of the hash. This is used to implement the hashlocks. Making it global allows the reveal of one preimage to unlock hashlocked funds in several different channels, and uses less storage space. 



## Modifiers

Next come the modifiers. They are not declared with the `modifier` keyword, because for some reason it causes the Solidity compiler to complain about too many local variables. However, they have the exact same effect as modifiers when they are declared as functions and called at the top of a function body.

### Lifecycle modifiers

These deal with the various lifecycle phases of the channel. This is to prevent functions getting called in phases of the lifecycle they are not allowed.

```
function channelDoesNotExist (bytes32 _channelId) {
    require(channels[_channelId].channelId != _channelId);
}

function channelExists (bytes32 _channelId) {
    require(channels[_channelId].channelId == _channelId);
}

function channelSettlingPeriodStarted (bytes32 _channelId) {
    require(channels[_channelId].settlingPeriodStarted);
}

function channelSettlingPeriodNotStarted (bytes32 _channelId) {
    require(!channels[_channelId].settlingPeriodStarted);
}

function channelIsNotClosed (bytes32 _channelId) {
    require(!channels[_channelId].closed);
}

function channelIsSettled (bytes32 _channelId) {
    require(
        channels[_channelId].settlingPeriodStarted && // If the settling period has started
        block.number >= channels[_channelId].settlingPeriodEnd // And ended
    );
}

function channelIsNotSettled (bytes32 _channelId) {
    require(!( // Negate the below
        channels[_channelId].settlingPeriodStarted && // If the settling period is started
        block.number >= channels[_channelId].settlingPeriodEnd // And ended
    ));
}
```

### State validity modifiers

These deal with making sure that state updates are valid. For a state update to be accepted, the new balances have to equal the total that was put in the channel, and it has to have the highest sequence number of all the updates that have been submitted.

```
function balancesEqualTotal (bytes32 _channelId, uint256 _balance0, uint256 _balance1) {
    require(_balance0.add(_balance1) == channels[_channelId].totalBalance);
}

function sequenceNumberIsHighest (bytes32 _channelId, uint256 _sequenceNumber) {
    require(_sequenceNumber > channels[_channelId].sequenceNumber);
}
```

### Signature modifiers

These check that the signatures submitted with function calls are correct. Some functions need signatures from both participants, and some only need signatures from one. Some functions only need one specific signature.

```
function signedByBoth (
    bytes32 _fingerprint, 
    bytes _signature0, 
    bytes _signature1, 
    address _address0,
    address _address1
) {
    require(
        ecverify(_fingerprint, _signature0, _address0) &&
        ecverify(_fingerprint, _signature1, _address1)
    );
}

function signedByOne (
    bytes32 _fingerprint,
    bytes _signature,
    address _address0,
    address _address1
) {
    require(
        ecverify(_fingerprint, _signature, _address0) ||
        ecverify(_fingerprint, _signature, _address1)
    );
}
```

## ERC20 balance adjustment

```
function incrementBalance(address _addr, uint _value)
    internal
{
    balances[_addr] = balances[_addr].add(_value);
}

function decrementBalance(address _addr, uint _value)
    internal
{
    balances[_addr] = balances[_addr].sub(_value);
}
```

These functions increment and decrement the ERC20 balances. These could be used to create money out of thin air, so they must be handled carefully. They are used to put money into channels and take it out. It might have been possible to give each channel its own address in the ERC20 `balances` mapping to avoid doing this, but it would have had a lot more complexity and moving parts. The safe math functions (`.add` and `.sub`) supplied by the Zeppelin framework prevent any issues like balances going lower than 0.

## Creating a channel

```
function newChannel(
    bytes32 _channelId,

    address _address0,
    address _address1,

    uint256 _balance0,
    uint256 _balance1,

    uint256 _settlingPeriodLength,

    bytes _signature0,
    bytes _signature1
) {
    channelDoesNotExist(_channelId);
    bytes32 fingerprint = sha3(
        "newChannel",
        _channelId,

        _address0,
        _address1,

        _balance0,
        _balance1,

        _settlingPeriodLength
    );

    signedByBoth(
        fingerprint,
        _signature0,
        _signature1,
        _address0,
        _address1
    );

    decrementBalance(_address0, _balance0);
    decrementBalance(_address1, _balance1);

    channels[_channelId] = Channel(
        _channelId,                  // bytes32 channelId;
        _address0,                   // address address0;
        _address1,                   // address address1;
        _balance0.add(_balance1),    // uint256 totalBalance;
        
        _balance0,                   // uint256 balance0;
        _balance1,                   // uint256 balance1;
        new bytes(0),                // bytes hashlocks
        0,                           // uint256 sequenceNumber;

        _settlingPeriodLength,       // uint256 settlingPeriodLength;
        false,                       // bool settlingPeriodStarted;
        0,                           // uint256 settlingPeriodEnd;
        false                        // bool closed;

    );
}
```

To create a new channel, someone needs to call `newChannel()` with the signatures of both participants. We first check that a channel with that `channelId` does not already exist. Then we check the signatures and attempt to withdraw the money from the accounts of both participants. Finally, we create a record of the channel.

## Updating channel state

```
function updateState(
    bytes32 _channelId,
    uint256 _sequenceNumber,

    uint256 _balance0,
    uint256 _balance1,

    bytes _hashlocks,

    bytes _signature0,
    bytes _signature1
) {
    channelExists(_channelId);
    channelIsNotSettled(_channelId);
    channelIsNotClosed(_channelId);
    sequenceNumberIsHighest(_channelId, _sequenceNumber);

    bytes32 fingerprint = sha3(
        "updateState",
        _channelId,
        _sequenceNumber,
        _balance0,
        _balance1,
        _hashlocks
    );

    signedByBoth(
        fingerprint,
        _signature0,
        _signature1,
        channels[_channelId].address0,
        channels[_channelId].address1
    );

    updateStateInternal(
        _channelId,
        _sequenceNumber,

        _balance0,
        _balance1,

        _hashlocks
    );
}

function updateStateInternal (
    bytes32 _channelId,
    uint256 _sequenceNumber,

    uint256 _balance0,
    uint256 _balance1,

    bytes _hashlocks
)
    internal
{
    channels[_channelId].sequenceNumber = _sequenceNumber;
    channels[_channelId].balance0 = _balance0;
    channels[_channelId].balance1 = _balance1;
    channels[_channelId].hashlocks = _hashlocks;
}
```

To pay each other, participants send payments in the form of channel updates that can be passed into this function. We check that the channel exists, that it is not settled, that it is not closed, and that the sequence number of this update is the highest of any received. We then check that all the arguments were signed by both participants. We've broken the actual update logic out into `updateStateInternal`, because it is called by other functions in the contract. You might notice that we don't check here if the amounts are correct. Someone could submit an update where the balances exceed the total that was put into the channel. We check the balances later, when the channel is closed, after all the hashlocks have been added up.

## State update bounties


```
function updateStateWithBounty(
    bytes32 _channelId,
    uint256 _sequenceNumber,

    uint256 _balance0,
    uint256 _balance1,

    bytes _hashlocks,

    bytes _signature0,
    bytes _signature1,

    uint256 _bountyAmount,
    bytes _bountySignature
) {
    channelSettlingPeriodStarted(_channelId);

    bytes32 fingerprint = sha3(
        "updateStateWithBounty",
        _channelId,
        _sequenceNumber,
        _balance0,
        _balance1,
        _hashlocks,
        _signature0,
        _signature1,
        _bountyAmount
    );

    address bountyPayer = ecrecovery(fingerprint, _bountySignature);

    decrementBalance(bountyPayer, _bountyAmount);
    incrementBalance(msg.sender, _bountyAmount);

    updateState(
        _channelId,
        _sequenceNumber,

        _balance0,
        _balance1,

        _hashlocks,

        _signature0,
        _signature1
    );
}
```

`updateStateWithBounty()` allows channel participants to incentivize third parties to protect against cheating. Remember, the settling period gives anyone a chance to submit a signed update that has a higher sequence number than the currently accepted update. This prevents dishonest participants from submitting old updates where they have a higher balance. However, someone needs to be online to check whether the settling period has been started with an old update. This function allows the participants to reward someone who is online and stops them from being cheated. The participant simply sends the third party the state update and signatures and their signature on those values and a bounty amount. The third party can now watch the blockchain for an attempt to start the settling period with an old update. If it sees this, it can submit the correct update and collect the bounty.

## Submitting preimages

```
function submitPreimage (
    bytes32 _hashed,
    bytes32 _preimage
) {
    require(_hashed == sha3(_preimage));
    seenPreimage[_hashed] = true;
}

function submitPreimages (
    bytes pairs
) {
    bytes32 hashed;
    bytes32 preimage;

    for (uint256 i = 0; i < pairs.length; i += 64) {
        uint256 hashedOffset = i + 32;
        uint256 preimageOffset = i + 64;

        assembly {
            hashed := mload(add(pairs, hashedOffset))
            preimage := mload(add(pairs, preimageOffset))
        }

        submitPreimage(hashed, preimage);
    }
}
```

As you will soon see, Guac's hashlocks follow a simple rule: if anyone has submitted the preimage of the hash, the associated money is unlocked. These functions are for submitting preimages. Preimages are not associated with any one channel. This makes the contract simpler, as well as allowing the reveal of a preimage motivated by money locked in any one particular channel to unlock the money in all the channels participating in that multihop transaction.

## Starting the settling period

```
function startSettlingPeriod (
    bytes32 _channelId,
    bytes _signature
) {
    channelExists(_channelId);
    channelSettlingPeriodNotStarted(_channelId);

    bytes32 fingerprint = sha3(
        "startSettlingPeriod",
        _channelId
    );

    signedByOne(
        fingerprint,
        _signature,
        channels[_channelId].address0,
        channels[_channelId].address1
    );

    channels[_channelId].settlingPeriodStarted = true;
    channels[_channelId].settlingPeriodEnd = block.number + channels[_channelId].settlingPeriodLength;
}
```

This only happens when one participant wants to close the channel without the participation of the other. After the settling period is over, the channel can be closed and the money can be taken out. We check that the channel exists and that the settling period has not already been started. We then check for a signature from one of the channel participants, and set `settlingPeriodStarted` to true and settlingPeriodEnd to the current block plus the settling period length.

## Closing the channel

```
function closeChannel (
    bytes32 _channelId
) {
    channelExists(_channelId);
    channelIsSettled(_channelId);
    channelIsNotClosed(_channelId);

    closeChannelInternal(_channelId);
}
```

If the channel is settled and has not yet been closed, it can be closed. This checks if the channel is settled and has not already been closed, then calls `closeChannelInternal()`, which contains the real business logic.

## Skipping the settling period

```
function closeChannelFast (
    bytes32 _channelId,

    uint256 _sequenceNumber,
    uint256 _balance0,
    uint256 _balance1,
    bytes _hashlocks,

    bytes _signature0,
    bytes _signature1
) {
    channelExists(_channelId);
    sequenceNumberIsHighest(_channelId, _sequenceNumber);

    bytes32 fingerprint = sha3(
        "closeChannelFast",
        _channelId,
        _sequenceNumber,
        _balance0,
        _balance1,
        _hashlocks
    );

    signedByBoth(
        fingerprint,
        _signature0,
        _signature1,
        channels[_channelId].address0,
        channels[_channelId].address1
    );

    updateStateInternal(
        _channelId,
        _sequenceNumber,
        _balance0,
        _balance1,
        _hashlocks
    );

    closeChannelInternal(_channelId);
}
```

If both participants agree to close the channel, they can skip the settling period with `closeChannelFast()`. They include the final state of the channel, and this function both applies the final update and closes the channel.

## Channel closing business logic

```
function closeChannelInternal (
    bytes32 _channelId
)
    internal
{
    channels[_channelId].closed = true;

    int256 adjustment = getHashlockAdjustment(channels[_channelId].hashlocks);

    uint256 balance0;
    uint256 balance1;
    (balance0, balance1) = applyHashlockAdjustment(
        _channelId,
        channels[_channelId].balance0,
        channels[_channelId].balance1,
        adjustment
    );

    incrementBalance(channels[_channelId].address0, balance0);
    incrementBalance(channels[_channelId].address1, balance1);
}
```

This is the real meat of the payment channel logic. It figures out how much money to transfer back to each participant, while taking hashlocks into account. First, `closed` is set to true. Then the amount of all the hashlocks is calculated by `getHashlockAdjustment()`, and applied to the balances by `applyHashlockAdjustment()`. Then the balances of the participants are incremented by the proper amounts, releasing the money from the channel.

### Calculating hashlocks

```
function getHashlockAdjustment (
    bytes _hashlocks
) 
    internal
    returns (int256)
{
    bytes32 hashed;
    int256 adjustment;
    int256 totalAdjustment;

    for (uint256 i = 0; i < _hashlocks.length; i += 64) {
        uint256 hashedOffset = i + 32;
        uint256 adjustmentOffset = i + 64;

        assembly {
            hashed := mload(add(_hashlocks, hashedOffset))
            adjustment := mload(add(_hashlocks, adjustmentOffset))
        }

        if (seenPreimage[hashed]) {
            totalAdjustment += adjustment;
        }
    }

    return totalAdjustment;
}
```
`getHashlockAdjustment()` calculates what effect the hashlocks in the last update have on the balances. We loop through and parse hashes and adjustments out of the hashlock array. There is a `totalAdjustment` that is added to if the preimage for the hash corresponding to a given hashlock's adjustment has been seen.

### Applying hashlocks

```
function applyHashlockAdjustment (
    bytes32 _channelId,
    uint256 _currentBalance0,
    uint256 _currentBalance1,
    int256 _totalAdjustment
)
    internal
    returns (uint256, uint256)
{
    uint256 balance0;
    uint256 balance1;

    if (_totalAdjustment > 0) {
        balance0 = _currentBalance0.add(uint256(_totalAdjustment));
        balance1 = _currentBalance1.sub(uint256(_totalAdjustment));
    }

    if (_totalAdjustment < 0) {
        balance0 = _currentBalance0.sub(uint256(-_totalAdjustment));
        balance1 = _currentBalance1.add(uint256(-_totalAdjustment));
    }

    if (_totalAdjustment == 0) {
        balance0 = _currentBalance0;
        balance1 = _currentBalance1;
    }

    balancesEqualTotal(_channelId, balance0, balance1);
    return (balance0, balance1);
}
```

A hashlock's adjustment, and by extension the summed `totalAdjustment` of all valid hashlocks, is a signed integer that is added to `balance0` and subtracted from `balance1`. Because of peculiarities in Solidity's number types, it seemed safer and clearer to handle the case of negative and positive adjustments separately. A positive adjustment is straight forward. We cast it to an unsigned integer and do the math. However, when the adjustment is negative casting in Solidity doesn't work correctly. So we invert the sign to ensure that the number is positive and also subtract from balance0 instead of adding and vice versa for balance1. We then check that the balances still equal the total amount that was placed into the channel at the beginning and return the new balances.