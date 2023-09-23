
# Open Source Routing Machine Setup 

##### OSRM (Open Source Routing Machine) is a super fast routing engine for OpenStreetMap (OSM) road networks.

[https://www.linuxbabe.com/ubuntu/install-osrm-ubuntu-22-04-open-source-routing-machine](https://www.linuxbabe.com/ubuntu/install-osrm-ubuntu-22-04-open-source-routing-machine)

If the Above Link  doesn't work then use the below documentation for the setup.

## Step 1: Build OSRM From Source
##### Install dependency packages.

```
sudo apt update

sudo apt install build-essential git cmake pkg-config doxygen libboost-all-dev libtbb-dev lua5.2 liblua5.2-dev libluabind-dev libstxxl-dev libstxxl1v5 libxml2 libxml2-dev libosmpbf-dev libbz2-dev libzip-dev libprotobuf-dev
```

#### Create the osrm user. (No need to create a password for this user.)

```
sudo useradd -d /srv/osrm -s /bin/bash -m osrm
```

#### Grant permissions to your own user account. Replace username with your real Linux username.

```
sudo apt install acl

sudo setfacl -R -m u:username:rwx /srv/osrm/
```
#### Change to the /srv/osrm/ directory.
```
cd /srv/osrm/
```
#### Download the OSRM source code from its Github repository.

```
git clone https://github.com/Project-OSRM/osrm-backend.git
```
#### Create the build directory.
```
mkdir build
```
#### Change to this directory and configure the build environment.
```
cd build

cmake /srv/osrm/osrm-backend/
```
#### Compile the source code. (If you see some TBB warning: deprecated message, you can ignore them.)
```
make
```

#### Install the binaries.
```
sudo make install
```
#### The following binaries will be installed.

- /usr/local/bin/osrm-extract:
- /usr/local/bin/osrm-partition:
- /usr/local/bin/osrm-customize:
- /usr/local/bin/osrm-contract:
- /usr/local/bin/osrm-datastore:
- /usr/local/bin/osrm-routed:

## Step 2: Generate OSRM Routing Data

#### Use the same pbf data file which is used to import the data for openstreet map .If you do not have that file  go to http://download.geofabrik.de.  and download it.

#### Make sure you are in the /srv/osrm/osrm-backend/ directory.
```
cd /srv/osrm/osrm-backend/
```

#### Extract a graph out of the OpenStreetMap data.
```
osrm-extract britain-and-ireland-latest.osm.pbf --threads=8
```

####  Once it’s finished, there will be a file with the same filename but with the .osrm extension. Run the following command to partition this graph recursively into cells.

```
osrm-partition britain-and-ireland-latest.osrm
```

#### Customize the cells by calculating routing weights for all cells.
```
osrm-customize britain-and-ireland-latest.osrm
```

#### Now you can start the routing engine.
```
osrm-routed --algorithm=MLD britain-and-ireland-latest.osrm
```
##### it listens on TCP port 5000.


## Step 3: Creating a systemd service

#### We can manually run the OSRM routing engine with osrm-routed --algorithm=MLD britain-and-ireland-latest.osrm, but it’s more convenient to run osrm-routed as a systemd service in the background.

#### Press Ctrl+C to stop the current osrm-routed process and create a systemd service unit file for osrm-routed with the following command.
```
sudo nano /etc/systemd/system/osrm-routed.service
```
#### Put the following lines into the file.
```
[Unit]
Description=Open Source Routing Machine
Wants=network-online.target
After=network.target network-online.target

[Service]
ExecStart=/usr/local/bin/osrm-routed --algorithm=MLD /srv/osrm/osrm-backend/britain-and-ireland-latest.osrm
User=osrm
Group=osrm
Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
```
#### Save and close the file. Change the ownership of the /srv/osrm/osrm-backend/ directory.
```
sudo chown osrm:osrm /srv/osrm/osrm-backend/ -R
```
#### Now we can start and enable the osrm-routed systemd service.
```
sudo systemctl start osrm-routed

sudo systemctl enable osrm-routed
```
#### Check status.
```
systemctl status osrm-routed
```

#### If the osrm-routed service isn’t active (running), you can run the following command to see what’s wrong.
```
sudo journalctl -eu osrm-routed
``` 
## Step 4: Set Up Reverse Proxy

#### We can configure Apache web server as a reverse proxy for the osrm-routed service, so we will be able to use a domain name to access the routing service and also enable HTTPS encryption.

#### Install Apache web server.
```
sudo apt install apache2
```
#### To use Apache as a reverse proxy, we need to enable the proxy, proxy_http and rewrite module.
```
sudo a2enmod proxy proxy_http rewrite
```
#### Then create a virtual host file for OSRM.
```
sudo nano /etc/apache2/sites-available/osrm.conf
```
#### Add the following texts into the file. Replace osrm.your-domain.com with your actual domain name and don’t forget to create DNS A record for it.
```
<VirtualHost *:80>
    ServerName osrm.your-domain.com

    ProxyPass / http://127.0.0.1:5000/
    ProxyPassReverse / http://127.0.0.1:5000/
</VirtualHost>
```
#### Save and close the file. Then enable this virtual host.
```
sudo a2ensite osrm.conf
```
#### Reload Apache for the changes to take effect.
```
sudo systemctl reload apache2
```
#### Now you can remotely access OSRM by entering the domain name (osrm.your-domain.com ) in browser address bar.
## Step 5: Enable HTTPS

#### We can enable HTTPS by installing a free TLS certificate issued from Let’s Encrypt. In the OSM tile server setup tutorial, we have already installed the Let’s Encrypt client (certbot) from the Snap store. So we just need to run the following command to obtain and install TLS certificate.

#### Apache
```
sudo /snap/bin/certbot --apache --agree-tos --redirect --hsts --staple-ocsp --email you@example.com -d osrm.your-domain.com
```


## Step 6: Integrate OSRM with a Slippy Map

#### To integrate OSRM with a slippy map, we can use a plugin called Leaflet Routing Machine. First, include the Leaflet routing machine JavaScript and CSS file to your slippy map. Note that they should be placed after the main Leaflet JavaScript and the Leaflet Control Geocoder JavaScript.
```
<html>
  <head>
     ....
     ....
     <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css" />
     <script src="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js"></script>
 </head>
 <body>
 ....
 ....
 </body>
</html>
```
#### Next, add the following lines to the <script>...</script> snippet in the HTML body.
```
     L.Routing.control({
         serviceUrl: 'https://osrm.your-domain.com/route/v1',
         geocoder: L.Control.Geocoder.nominatim({serviceUrl:'https://tile.your-domain.com/nominatim/'}),
         routeWhileDragging: true
       }).addTo(map);
       ```
#### Like this:
```
<html>
  <head>
     ....
     ....
     <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css" />
     <script src="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js"></script>
 </head>
 <body>
   <div id="map"></div>
     <script>
     ....
     ....


     L.Routing.control({
         serviceUrl: 'https://osrm.your-domain.com/route/v1',
         geocoder: L.Control.Geocoder.nominatim({serviceUrl:'https://tile.your-domain.com/nominatim/'}),
         routeWhileDragging: true
       }).addTo(map);

    </script>

  </body> 
</html>
```
#### Save and close the file. Then reload the map in your web browser, you should see a control panel on the upper-right corner, where you can enter the starting address and destination address.
#### You can drag the waypoints on the map and OSRM will automatically recalculate the route.

