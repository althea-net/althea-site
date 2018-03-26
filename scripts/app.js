// @ts-check

const map = new google.maps.Map(document.getElementById("map"), {
  center: {
    lat: 15,
    lng: 180
  },
  zoom: 2
});

fetch("https://still-dusk-61923.herokuapp.com/nodes")
  .then(res => res.json())
  .then(function(nodes) {
    nodes.forEach(node => {
      var marker = new google.maps.Marker({
        icon: {
          url: node.active
            ? "/images/active_pointer.png"
            : "/images/inactive_pointer.png",
          scaledSize: new google.maps.Size(30, 48)
        },
        zIndex: node.active ? 1 : 0,
        position: node
      });
      marker.setMap(map);
    });
  });
