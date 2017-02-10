---
title: "Scrooge development: Running code"
layout:     post
summary: "I've been focusing my efforts on Scrooge, a piece of software that will implement the tunnel-based traffic control scheme I've written about previously."
---

I've been focusing my efforts on [Scrooge](https://github.com/incentivized-mesh-infrastructure/scrooge), a piece of software that will implement the tunnel-based traffic control scheme I've written about [here](/blog/dev-update-2/). To recap, I'm trying to build somethign that:

> - Establishes authenticated tunnels with each of its neighbors. This is so that nodes can reliably tell each others traffic apart. Simply relying on MAC addresses would allow any node to spoof the traffic of another node to get free service.
> - Blocks packets that have not come over one of the authenticated tunnels from being forwarded.
> - Prioritizes traffic from some neighbors more highly than others. This will ultimately be linked to payment, but for now I'll just pass it in manually.
> - Allows nodes to choose what proportion of their total bandwidth they will share/sell.

In the previous post, I wrote about doing this with shell scripts. These were fast and easy to write, and a good way to test the technique. Now I am working on doing the same thing with a robust, configurable, and well-tested piece of software that does not rely on manual tweaking.

I've been writing it in Go. The first thing that needs to be done is discovery. Neighbors must be able to establish an initial contact with one another. I've been doing this by sending UDP packets to a specific port on the IPv6 multicast address. Nodes send "hello" messages on this port. The hello messages contain the node's public key and "control address", where messages can be sent to communicate with the node.

### Scrooge hello message

This is sent on the multicast port to discover neighbors. It can also be sent directly to a neighbor to notify them of an update of the control address. 

`scrooge_hello <publicKey> <control address> <seq num> <signature>`

- PublicKey: base64 encoded ed25519 public key. This is used by neighbors to identify each other and sign messages, including the `scrooge_hello` message.
- Control address: The IP address and port where one can send out of band control information.
- Sequence number: Incremented with each hello to prevent playback attacks
- Signature: The signature of the publicKey over the fields of this message, concatenated as byte strings with no spaces (we may want to tweak this?)

When a node receives one of these messages: 
- It first checks the signature, and adds a record of this Neighbor if it does not already exist (neighbors are identified by public key). 
- It checks the SeqNum to prevent replay attack.
- It updates the ControlAddress of the neighbor with the given PublicKey.
- It sends a `scrooge_hello_confirm` message to the neighbor’s control address

### Scrooge hello confirm message
`scrooge_hello_confirm <publicKey> <control address> <seq num> <signature>`

When a node receives one of these messages: 
- It first checks the signature, and adds a record of this Neighbor if it does not already exist (neighbors are identified by public key). 
- It checks the SeqNum to prevent replay attack.
- It updates the ControlAddress of the neighbor with the given PublicKey.
- It may start a tunnel and send a scrooge tunnel message as described below.

### Scrooge tunnel message

Sometimes a node wants to establish a tunnel with one of its neighbor nodes. Maybe it has just received a hello_confirm from this neighbor after it has broadcasted a hello, or maybe it needs to refresh the tunnel for some reason.

- It first stops and removes any existing tunnel with the neighbor. 
- It then starts a new tunnel on an available port and sends the message.

`scrooge_tunnel <publicKey> <tunnel publicKey> <tunnel endpoint> <seq num> <signature>`

When a node receives this message,
- It adds the tunnel publicKey and endpoint to the tunnel record for that node and starts a tunnel listening on an available port.
- It then sends a `scrooge_tunnel_confirm` message back.

### Scrooge tunnel confirm message

`scrooge_tunnel_confirm <publicKey> <tunnel publicKey> <tunnel endpoint> <seq num> <signature>`

This is the same as the `scrooge_tunnel` message, except that when a node receives it, it does not send a message back. This is to stop an infinite loop of `scrooge_tunnel` messages from occurring.

The parsing and handling of these messages is all unit tested, and I'm currently working on integration tests, running in [CORE](/blog/using-core-for-network-simulation/). 
