
let markers = [];

let routingControl = null;

let startMarker = null;

let endMarker = null;

const LeafletMapLibrary =
{

    initializeMap() {
    var map = L.map(MAP_DIV_ID).setView([MAP_INITIAL_LATITUDE, MAP_INITIAL_LONGITUDE], MAP_INITIAL_ZOOM);
    var tileLayer = L.tileLayer(MAP_URL + '/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution:
        '© <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    return map;
    },
    addMarker(map, location) {
      L.marker(location).addTo(map);
    },
  async handleMapClick(event) {
    try {
      var clickedLatLng = event.latlng;
      var latitude = clickedLatLng.lat;
      var longitude = clickedLatLng.lng;

      const response = await fetch(NOMINATIM_API_URL + `/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      const data = await response.json();

      // Retrieve the OSM IDs from the Nominatim response
      var osmIds = [];

      if (data.hasOwnProperty('osm_id')) {
        osmIds.push(data.osm_type.charAt(0).toUpperCase() + data.osm_id);
      } else if (data.hasOwnProperty('extratags')) {
        Object.keys(data.extratags).forEach(key => {
          if (key.endsWith(':id')) {
            osmIds.push(data.extratags[key]);
          }
        });
      }

      for (const osmId of osmIds) {
        const lookupResponse = await fetch(NOMINATIM_API_URL + `/lookup?osm_ids=${osmId}&format=json`);
        const lookupData = await lookupResponse.json();

        const place = lookupData[0];

        var placeId = place.place_id;
        var lat = place.lat;
        var lon = place.lon;
        var displayName = place.display_name;

        console.log('Map click data:', place);
      }
      } catch (error) {
        console.log('Error:', error);
      }
     },


  async createRoute(startCoordinates, endCoordinates, map) {
    try {

      if (startMarker !== null) {
        startMarker.remove();
      }
      if (endMarker !== null) {
        endMarker.remove();
      }
          
      startMarker = L.marker(startCoordinates).addTo(map);
      endMarker = L.marker(endCoordinates).addTo(map);

      if (routingControl !== null) {
        routingControl.remove();
      }
      await new Promise((resolve, reject) => {
        routingControl =   L.Routing.control({
          serviceUrl: OSRM_API_URL + '/route/v1',
          waypoints: [
            startCoordinates, 
            endCoordinates 
          ],
          lineOptions: {
            styles: [
              { color: '#3366ff', opacity: 0.7, weight: 10 } 
            ]
          },
          instructions: true
        }).on('routesfound', function (event) {
          resolve(event.routes);
        }).on('routingerror', function (error) {
          reject(error);
        }).addTo(map);
      });

    } catch (error) {
      console.log(error);
    }
  },



  async getCurrentUserLocation(map) {
    
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function (position) {
            var latitude = position.coords.latitude;
            var longitude = position.coords.longitude;

            var userMarker = L.marker([latitude, longitude]).addTo(map);

            map.setView([latitude, longitude], 13);

            resolve();
          },
          function (error) {
            reject(new Error('Error retrieving location: ' + error.message));
          }
        );
      } else {
        reject(new Error('Geolocation is not supported by this browser.'));
      }
    });
  },
    addCurrentLocationIcon(map) {
      var CurrentLocationControl = L.Control.extend({
        options: {
            position: 'topright'
        },

        onAdd: function (map) {
            var container = L.DomUtil.create('div', 'leaflet-control-current-location');
            var icon = L.DomUtil.create('i', 'fa-solid fa-location-crosshairs fa-2xl');
            icon.style.color = '#19579a';
            container.appendChild(icon);


            container.addEventListener('click', function () {
              LeafletMapLibrary.getCurrentUserLocation(map);
            });

            return container;
        }
    });
    map.addControl(new CurrentLocationControl());

    },

  addSearchControl(map) {
    const searchControl = L.control();

    searchControl.onAdd = function (map) {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      container.innerHTML = `
        <input type="text" id="search-input" placeholder="Search">
        <button id="search-button">Search</button>
      `;

      const input = container.querySelector('#search-input');
      const button = container.querySelector('#search-button');

      function performSearch() {
        const query = input.value;
        LeafletMapLibrary.search(query);
      }

      button.addEventListener('click', performSearch);

      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && input.value.trim() !== '') {
          performSearch();
          event.preventDefault();
        }
      });


      return container;
    };

    searchControl.addTo(map);
  },
  async search(query) {
    if (!query) {
      return Promise.reject(new Error('Empty query. Please enter a search term.'));
    }

    try {
      const url = NOMINATIM_API_URL + `/search?format=json&q=${encodeURIComponent(query)}&dedupe=0&limit=20`;
      const response = await fetch(url);
      const data = await response.json();

      // Remove previous markers
      markers.forEach(marker => {
        map.removeLayer(marker);
      });
      markers = []; 

      if (data.length > 0) {
        const latlng = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        const marker = L.marker(latlng).addTo(map);
        markers.push(marker); 
        map.setView(latlng, 10);
      } else {
        console.log('No results found.');
      }

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  },
  Autocomplete(inputSelector, latSelector, lonSelector) {
    $(inputSelector).autocomplete({
      source: function (request, response) {
        $.ajax({
          url: NOMINATIM_API_URL + '/search',
          data: {
            q: '*' + request.term + '*',
            format: 'json',
            limit: 20,
            dedupe: 0,
          },
          dataType: 'json',
          success: function (data) {
            var results = data.map(function (item) {
              return {
                label: item.display_name,
                lat: item.lat,
                lon: item.lon
              };
            });

            response(results);
          }
        });
      },
      minLength: 2,
      select: function (event, ui) {
        var currentID = event.target.id;

        $(latSelector).val(ui.item.lat);
        $(lonSelector).val(ui.item.lon);

      }
    });
  }

}
var customMarkerIcon = L.icon({
  iconUrl: '/leaflet_openstreetmap_library/leaflet/images/marker-icon.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

