Hi, thanks for taking a look. The current state of Althea is incomplete, as I've been working on it only since August. I'm about 75% done with an implementation of the payment channel system, UPC.

The other part of Althea is the Babel extension which routes over cheapest, as well as highest quality/lowest hop count paths. If you're familiar with Babel, this will consist of adding a cost metric alongside the existing quality metric for each link. This will probably be more work, plus there's always a lot of fine-tuning to be done. Then there's also all the glue code to have the routers request payment from neighbors, getting everything running on actual hardware etc.

The scenario in which I see Althea being used in the short term is similar to the use-case of a local community mesh network or small commercial wireless ISP.

With a commercial wireless ISP, an entrepreneur gets a loan, then spends the money on transmission equipment and installation costs. He then owns and configures all the network hardware. He also hooks the whole thing up to one or several uplinks, where he pays a certain amount of money for a guaranteed bandwidth to the rest of the internet. He goes out and signs people up for subscriptions, typically at a much higher cost than their portion of the uplink bandwidth cost him.

He uses this extra money to pay back his investments in the equipment and installation, and also to make a profit. But even after the money is paid back, if there are no competitors, he probably won't lower his rates.

It's tough for a competitor to get started, because of the large amount of investment and expertise that it takes to start an ISP. Therefore, many places are served by a single ISP charging a high rate for substandard service.

Community mesh networks provide an alternative. "Mesh" routing protocols allow network equipment to self configure, with all the routers talking to one another to determine where to forward packets to get them to their destination. In many commercial ISPs, on the other hand, the paths that packets will take are calculated by a central server or even by hand.

Because the they self configure, mesh routing protocols allow a network to be set up with much less technical expertise. A small group of technically skilled volunteers can distribute routers to a larger group of people who are willing to install them on their property. The routers are owned by the people hosting them on their property, and the network is configured by the volunteers, with the technical load lightened by the self configuring mesh protocol. These projects are usually done on an altruistic basis by everyone involved. The owners of the land or buildings that transmission equipment is installed on are usually not charging a fee, the people setting up routers are volunteering, and the upstream bandwidth and hardware is often covered by donations or grants.

This is an inspiring effort by everyone involved. However, a purely altruistic model can have downsides. The most active people are working on a voluntary basis, and usually must have some other source of income (a "full time job"). This naturally limits the time they can spend developing the mesh network. The transmission site owners often own the equipment. They are donating the site and equipment out of a combination of altruism and a desire to have internet service themselves. The desire to have internet themselves is satisfied by their connection to a node which is closer to the uplink. Their altruism takes the form of offering their connection to those nodes further downstream.





Hi, thanks for taking a look. The current state of Althea is incomplete. I'm about 75% done with an implementation of the payment channel system, UPC. This will transfer the payments, but I think you're asking more about the data routing part.

The scenario in which I see Althea being used in the short term is similar to the use-case of a local community mesh network or small commercial wireless ISP.

Althea will work on a principle of pay-to-forward. I think it will be easiest to implement as an extension to Babel. A router running Babel builds up a routing table with the added-up quality metrics of all the links between it and any given destination. It uses this to decide where to send packets (you probably already know this).

Althea will allow each router to advertise a monetary cost per bit forwarded for each destination in addition to a link quality metric, which will then be taken into consideration when setting up the routing table.

This basically means that the originator of a packet needs to pay to get that packet to its destination. The further away the destination, generally, the more they will need to pay. Let's say Bob is some kind of content provider, and Alice wants Bob to send her data. She will have to pay her neighbors to forward the request along, and she will need to include a payment in the request to cover the cost to Bob of sending the response back to her. The payment could also be for more than the cost of forwarding the data, so that Bob can make some money.

How will this work in a last mile network? In the last mile network, Bob is an exit node. The data he is providing is access to addresses outside of the network. So Alice is sending requests through the network to Bob, along with payment. Some of the money that Alice pays goes to intermediary nodes to get requests to Bob, some of it goes to Bob to provide the exit node service, and some of it Bob pays back into the network to forward the responses to Alice.

Babel automatically routes around more expensive intermediary nodes, and Alice can choose another exit node if Bob is charging too much (maybe this can also be automated). This is a network that makes money, but the money does not go to a business. It is distributed by the protocol among all the nodes providing a service in the network. The individuals running the hardware can then use this money to buy more hardware and strengthen the network. There is also competitive pressure for them to do so.

I'd like Althea to become a system that can provide high performance, while funding itself and growing without businesses, government, or donations.

I also think it could be easier to start an Althea network than an ISP, because an ISP requires monetary investment to build a network. In an Althea network, people would be investing time, equipment, and installations. It would probably be good to have some kind of local association or group, but all the participants would be competing with each other instead of working for a corporation owned by somebody else. All the tasks of collecting subscriptions and making agreements normally done by a corporate ISP are handled by the protocol. The protocol replaces the ISP.

Whether or not Althea is "net-neutral", I'm not sure. I've always understood net neutrality to be a prohibition on discriminating between packets based on their source. So for instance, Google can't pay the ISPs to have them move packets from YouTube more quickly. Althea will discriminate between packets based on their destination, but so does any routing protocol. In Althea there's money being sent. This is already the case on the internet. Subscribers pay last-mile ISPs, and ISPs pay transit providers and peer with other ISPs. Althea simply takes the last-mile ISP out of the picture.

Hopefully this wasn't too much of a wall of text!

-Jehan

On Thu, Jan 21, 2016 at 4:56 AM, Valent Turkovic <valent@otvorenamreza.org> wrote:
Hi,
I understand your goals, and I have been building community mesh
networks for over 10 years... but I see this being much more
interesting to ISPs that would like to break net netutrality than for
community mesh networks.

I mean I would love to use Alther in our networks, but I'm afraid what
will happen when ISPs start using something similar.

On other thought, they probably already have everything ready, just
waiting for regulators to be corrupt enought and take their money that
then they can take even more money from their customers...

How far it Althero from being usable?

Is any network already using it?

If I have multiple exit nodes to internet how can I make babel router
users over one or the other exit node?

