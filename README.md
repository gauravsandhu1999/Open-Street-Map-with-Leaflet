# Leaflet OpenStreetMap Setup

This guide will walk you through the setup process for integrating Leaflet and OpenStreetMap into your project. Please follow the steps below:

## Step 1: OpenStreetMap Setup

1. Follow the installation guide provided in the [OpenStreetMap Installation Guide](https://bitbucket.org/codebrew_web/leaflet_openstreetmap_library/src/master/OpenStreetMapInstallationGuide.md) to set up OpenStreetMap.

## Step 2: Open Source Routing Machine (OSRM) Setup

1. Set up OSRM by following the instructions in the [OSRM Setup Guide](https://bitbucket.org/codebrew_web/leaflet_openstreetmap_library/src/master/OSRM_installation_guide.md).

## Step 3: Setup OSM Nominatim Geocoding Server

1. Set up Nominatim geocoding server using the following link [Set Up OSM Nominatim Geocoding Server on Ubuntu 22.04](https://www.linuxbabe.com/ubuntu/osm-nominatim-geocoding-server-ubuntu-22-04).

## Step 4: Leaflet Map Function Usage

1. Clone the repository using the following command:
```
git clone https://your_username@bitbucket.org/codebrew_web/leaflet_openstreetmap_library.git
```

2. Include all the necessary CSS and JS files from the repository into your project, where you want to add the map functionality.

3. Define a `<div>` element with the `id` attribute set to "map". This is where the map will be rendered:
```html
	<div id="map"></div>
```

4. To render the map, use the following function. Replace `url` with the URL where your OpenStreetMap instance is set up, for example, "http://tile.openstreetmap.com/":
```javascript
var map = LeafletMapLibrary.initializeMap('map', url);
```

5. To add search functionality to the map, use the following function:
```javascript
LeafletMapLibrary.addSearchControl(map);
```

6. To get the current user location on the map, use the following function:
```javascript
LeafletMapLibrary.getCurrentUserLocation(map);
```

7. To add autocomplete functionality to an input field, use the following function. Provide your Mapbox Access Token and the ID or class of the input field where you want to add autocomplete functionality:
```javascript
LeafletMapLibrary.setupAutocomplete(accessToken, '#origin-input');
```

Follow these steps to integrate Leaflet and OpenStreetMap into your project. If you encounter any issues, refer to the respective installation guides or seek further assistance.
