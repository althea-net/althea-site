---
layout:     post
title:      Using C.O.R.E. to work on mesh network routing protocols
summary:    "C.O.R.E. may sound like the name of a 1980's superhero team, but it is actually a tool that simulates wired and wifi networks, right down to the radio waves. For this reason I am using it to test my modifications to Babel, an ad-hoc 'mesh' routing protocol."
---

C.O.R.E. may sound like the name of a 1980's superhero team, but it is actually a tool that simulates wired and wifi networks, right down to the radio waves. For this reason I am trying to use it to test my modifications to Babel, an ad-hoc "mesh" routing protocol.

First, let's look at the alternatives that I evaluated before settling on CORE.

#### Simple container network
The first thing I tried was just using some containers in a network, and then using the Linux tools `iptables` and/or `tc` to selectively drop and delay packets between pairs of nodes to simulate a lossy radio network. This would obviously not uncover complex real-world network dynamics, but no simulation will do this perfectly.

The advantage of this approach could be simplicity (maybe). It's also a good way to improve my chops with the Linux network utilities.

One example of this is [mlc](https://github.com/axn/mlc), written by Axel Neuman, the creator of the BMX6 routing protocol. Unfortunately, this package requires a lot of manual setup, and hasn't been updated in a few years. It's still something I will get familiar with, but I may evaluate some other more polished tools first. This technique starts to lose its simplicity the further you try to take it.

#### Mininet
Mininet is a more polished tool that sees a lot of use in the software defined networking (SDN) community. It can create networks of virtual computers connected to SDN-controlled OpenFlow switches.

Mininet looks nice, because it is relatively lightweight, with all functionality programmable through a REPL or a nice Python API. The API is pretty well documented and there are many examples.

I'm intending to revisit Mininet, but to use it effectively I think that I would need to get pretty familiar with OpenFlow and the concepts of SDN, and then use it to simulate a mesh network. No doubt that these are interesting and valuable skills, but maybe it would be better to spend time learning something actually targeted at the wireless mesh use-case.

##### Mininet-wifi
Mininet wifi adds WLAN simulation capability to mininet, with what looks like some pretty slick packet loss simulation stuff. However, it appears to be geared towards simulation of access points in a centrally-configured SDN network, not use in an ad-hoc mesh network.

#### CORE
CORE intimidated me with complexity at first, in addition it is not as well documented as Mininet. However, after getting it started (with the help of a very convenient VM), I found that it seems to be a capable toolkit. You get a window where you can drop nodes and link them together to form connections. Or, you can create a WLAN network and allow it to calculate connectivity based on the node's positions on the screen. CORE also integrates EMANE, which is a much more full-featured wifi simulation suite. Finally, CORE can also import mobility scripts, which allow you to automate the movement of nodes on the canvas to see how well routing protocols do with mobility.

#### IMUNES
CORE is built on top of IMUNES, which is another network simulator with a visual interface. It looks good, and is under more active development, but CORE seems simpler to get going for a mesh simulation.

### Using CORE
CORE has a pre-built VM image available to make it easy to get going. I installed VirtualBox to run the image, and started it up. 

![](/images/hello_boeing.png)

Clicking on the icon, you're greeted with a blank canvas with some toolbars to the side. Click on the toolbar button with the router symbol (network-layer virtual nodes), select the "MDR" type, and place a few of them on the canvas. Then click on the button below it (link-layer nodes) and place a WLAN node, which looks like a little cloud. Right clicking the WLAN node brings up a menu that has the option "Link to all routers". Clicking this links all nodes to the WLAN network and gives them IP addresses.

![](/images/wlan_setup.png)

Clicking the play button starts the simulation. If the nodes are close enough together, green lines will form, representing the connections between them. If you double click on one of the nodes, it opens up a terminal. From here, you can try to ping other nodes. To get a quick overview of connection health, I like to use the command `ping -f <ip address>`. The `-f` flag formats the output in a special way. Each time it sends a ping, it prints a dot. Each time it receives a response, it prints a backspace, deleting the prior dot. This effectively means that dots correspond to timed-out pings. If the line of dots grows rapidly, a lot of packets are being dropped. If it grows slowly or not at all, most packets are arriving at their destination.

![](/images/pinging.png)

You can move nodes around while the ping command is running. If you move two nodes far enough away from each other that the green line between them disappears, all packets will suddenly start being dropped. If the green line is there, all packets are received. This is obviously not a very sophisticated simulation. This will not work for testing routing protocols, which must be able to find the best route among links of varying reliability.

![](/images/hello_emane.png)

Luckily the CORE emulator includes [EMANE](http://www.nrl.navy.mil/itd/ncs/products/emane), which simulates the lower-level networking stack (tcp, wifi, and below), and the physical layer (radio waves). With EMANE, moving nodes further away from each other increases the drop rate and the latency. I didn't necessarily need the level of physical accuracy that it provides, but hey, it's pretty cool. Right click on the WLAN node, and select one of the EMANE models.

![](/images/running_babel.png)

Ok, let's run Babel on our nodes. Clone the Babel repo, and make and install it etc. Now double click on one of the router nodes to bring up the terminal. You should be able to type something like `/home/core/babeld/babeld eth0 -d 1` to start babel. The `-d 1` flag puts it into debug mode so that it prints logs to the terminal, and we can verify that it is running. 

Next, we need to set up a custom service to make Babel start automatically on new nodes. Go to `~/.core/myservices` and read README.txt. I'm not going to duplicate what it says there, but my Babel service looks like this:

babel.py

    ''' Babel service
    '''

    import os

    from core.service import CoreService, addservice
    from core.misc.ipaddr import IPv4Prefix, IPv6Prefix

    class BabelMod(CoreService):
        ''' This is for babel
        '''
        # a unique name is required, without spaces
        _name = "BabelMod"
        # you can create your own group here
        _group = "Routing"
        # this controls the starting order vs other enabled services
        _startindex = 50
        # list of startup commands, also may be generated during startup
        _startup = ('sh /home/core/myservices/babel.sh',)
        # list of shutdown commands
        _shutdown = ('rm log')

    # this line is required to add the above class to the list of available services
    addservice(BabelMod)


babel.sh

    #!/bin/sh

    touch log
    /home/core/babeld/babeld eth0 -d 1 > log


Restart CORE to install the new service.

![](/images/new_node_type.png)

Let's make a new node type which will only route using your new Babel service. First, click on the network-layer nodes button and select "edit node types". In this window, there's an "add new node type" button under the list of existing node types. I called mine "babel", and gave it a purple icon. Click on the "Services" button and make sure that only the "IPForward", and the new "BabelMod" services are selected.

![](/images/default_services.png)

Now you should be able to place nodes on the canvas, and have their babel instances start talking to each other. Since we piped the output of Babel to the `log` file, we can get some insight into its operation. Double click on a node to open its terminal and type `tail -f log` to see what Babel is logging.

![](/images/babel_running.png)

Now that we have Babel running, we can try to see if we can get it to do some routing. Place 4 babel nodes on the canvas, 2 far apart from each other and 2 in the middle. Make one of the middle nodes a much better route than the other (closer to the 2 end nodes). Wait a few seconds, and you will see that the end nodes have routes to each other going through the better-placed middle node (you can check with Widgets->Observer Widgets->IPv4 Routes). You can also ping from one end node to the other to monitor packet loss.

![](/images/babel_routing.png)

Now switch the positions of the middle nodes. You will see the packet loss jump, as the end nodes attempt to route packets through the middle node which is now in a bad position. After around 30 seconds, you will see throughput improve again as the new route is learned. If you check the routing tables of the end nodes, you will see that they contain the new and better route.