// @ts-check

console.log("js loaded");

function recaptchaCallback() {
  document.getElementById("submit").removeAttribute("disabled");
}

document.getElementById("althea-in-my-area").addEventListener("click", () => {
  document.getElementById("map-form").style.display = "block";
});

var Module = (function() {
  var config = {
    apiKey: "AIzaSyC4gjBacGp12q20Q_I_EbG4agDCZEfcaDo",
    authDomain: "althea-node-map.firebaseapp.com",
    databaseURL: "https://althea-node-map.firebaseio.com",
    projectId: "althea-node-map",
    storageBucket: "althea-node-map.appspot.com"
  };

  firebase.initializeApp(config);

  var emailAddr = document.getElementById("user_email_input");
  var firstName = document.getElementById("user_fname_input");
  var lastName = document.getElementById("user_lname_input");
  var country = document.getElementById("user_country_menu");
  var city = document.getElementById("user_city_input");
  var zipCode = document.getElementById("user_zip_code_input");

  function initMap() {
    // Initialize blank map with markers
    const map = resetView();

    geocoder = new google.maps.Geocoder();

    document.getElementById("submit").addEventListener("click", function() {
      geocodeAddress(
        city.value + " " + zipCode.value + " " + country.value,
        geocoder,
        map
      );
    });
  }

  function resetView() {
    const map = new google.maps.Map(document.getElementById("map"), {
      center: {
        lat: 15,
        lng: 0
      },
      zoom: 2
    });

    readFromFirebase(map);

    return map;
  }

  function readFromFirebase(map) {
    markerArr = [];

    // Query data base for stored location
    var fireDataBase = firebase
      .database()
      .ref()
      .child("Markers/");

    fireDataBase.on("child_added", function(snapshot) {
      var node = snapshot.val();
      console.log("node: ", node);

      // Updates map with stored marker
      var marker = new google.maps.Marker({
        icon: {
          url: node.Active
            ? "/images/active_pointer.png"
            : "/images/inactive_pointer.png",
          scaledSize: new google.maps.Size(30, 48)
        },
        zIndex: node.Active ? 1 : 0,
        position: {
          lat: parseFloat(node.GPS_Coordinates.Latitude),
          lng: parseFloat(node.GPS_Coordinates.Longitude)
        }
      });
      marker.setMap(map);
    });
  }

  // Convert address to Lat/ Lng
  function geocodeAddress(address, geocoder, resultsMap) {
    geocoder.geocode(
      {
        address
      },
      function(results, status) {
        console.log("Geocode results:", results);
        if (status === "OK") {
          resultsMap.setCenter(results[0].geometry.location);
          resultsMap.setZoom(14);
          var marker = new google.maps.Marker({
            icon: {
              url: "/images/inactive_pointer.png",
              scaledSize: new google.maps.Size(30, 48)
            },
            position: results[0].geometry.location,
            map: resultsMap
          });
        } else {
          alert(
            "Geocode was not successful for the following reason: " + status
          );
        }
      }
    );
  }

  return {
    initMap: initMap,
    resetView: resetView
  };
})();
