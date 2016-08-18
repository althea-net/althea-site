Nodes continually advertise their price to peers, for upstream (I forward a packet for you) and downstream (I forward a packet from you). They also run a speedtest to the internet through each neighbor. From this information, they make a yes/no decision on whether to forward packets to a neighbor and whether to forward packets from a neighbor.

// How could this be implemented? 
// The decision of whether or not to forward packets to a neighbor is implemented with a whitelist of next-hop IPs. If a next hop is not on the whitelist, no packets are forwarded to it. 

// The decision of whether or not to forward packets from a neighbor is implemented with a  

Speed testing- It is assumed that there is a reliable way to test the quality of service to and from the internet (upstream and downstream). You can imagine some service like [speedtest.net](speedtest.net). This involves nodes participating in a quality of service benchmarking process with servers outside of the local network using this system. Of course, an attacker to could identify test traffic by looking at destination or even content or timing. The system described here presupposes a secure speed testing scheme, which is a challenge in and of itself.

Each node advertises its price per kb for routing traffic from 

Alice runs a speedtest to and from the internet over each of her neighbors. This information could also be gathered from useful traffic. Alice ranks her neighbors against each other on upstream and downstream bandwidth.

Alice makes an agreement with her neighbor Bob, who has the best combination of **upstream** QOS and price. This agreement states that Alice will pay the advertised price for all packets that she sends to the Bob, with the understanding that Bob will forward them on to the internet. 

Alice makes an agreement with her neighbor Charlie, who has the best combination of **downstream** QOS and price. This agreement states that Alice will pay a certain rate for all packets forwarded to her, with the understanding that they are packets that she wants to receive.

If Bob is not receiving payment from Alice for the packets she is sending him, he will not forward packets from her.

If Charlie is not receiving payment for the packets he is sending Alice from the internet, he will not forward packets to her. 



Alice is now paying to both send and receive packets. 

It is assumed that, in most neighbor relationships, one neighbor will be closer to the internet than the other. 


Rule:

Receive packet from interface.
Determine next hop from routing table.
Determine previous hop from MAC address of Ethernet frame.
Forward packet if next hop is paying for downstream bandwidth OR previous hop is paying for upstream bandwidth.

iptables -F
iptables -P INPUT DROP
iptables -P FORWARD DROP

iptables -A FORWARD 


Do I want to forward packets from people who are paying me for upstream to people who are paying me for downstream? Will one of these other rules stop me?

I want to forward packets from people who are paying me for upstream to people who I am paying for upstream. I am delivering a service (it is assumed that my most expensive upstream provider will be cheaper than my cheapest upstream customer).

I want to forward packets from people who are paying me for downstream to people who I am paying for downstream. I am delivering a service (it is assumed that my most expensive downstream provider will be cheaper than my cheapest downstream customer).

I want to forward packets from people who are paying me for upstream to people who are paying me for downstream.
