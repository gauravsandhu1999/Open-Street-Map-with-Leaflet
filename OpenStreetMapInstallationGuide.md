#    Open Street Map Server Setup 

## Documentation


[https://www.linuxbabe.com/ubuntu/openstreetmap-tile-server-ubuntu-20-04-osm](https://www.linuxbabe.com/ubuntu/openstreetmap-tile-server-ubuntu-20-04-osm
)


If the Above Link  doesn't work then use the below documentation for the setup.


## Step 1: Upgrade Software

 
```
  sudo apt update
```
```
  sudo apt upgrade
```
## Step 2: Install PostgreSQL Database Server and the PostGIS Extension



#####  We will use PostgreSQL to store map data.
##### Run the following 4 commands to install the latest version of PostgreSQL.


```
echo "deb [signed-by=/etc/apt/keyrings/postgresql.asc] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
```
```
sudo mkdir -p /etc/apt/keyrings/

```
```
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo tee /etc/apt/keyrings/postgresql.asc
```

```
sudo apt update

```

```
sudo apt install -y postgresql postgresql-contrib postgresql-15 postgresql-client-15

```
#### Then install PostGIS, which is a geospatial extension to PostgreSQL.

```
sudo apt install postgis postgresql-15-postgis-3
```

#### PostgreSQL database server will automatically start and listens on 127.0.0.1:5432. The postgres user will be created on the OS during the installation process. It’s the super user for PostgreSQL database server. By default, this user has no password and there’s no need to set one because you can use sudo to switch to the postgres user and log into PostgreSQL server.

```
sudo -u postgres -i
```

#### Now you can create a PostgreSQL database user osm.

```
createuser osm
```

#### Then create a database named gis and at the same time make osm as the owner of the database. Please don’t change the database name. Other tools like Renderd and Mapnik assume there’s a database named gis.

```
createdb -E UTF8 -O osm gis
```

#### Next, create the postgis and hstore extension for the gis database.

```
psql -c "CREATE EXTENSION postgis;" -d gis

psql -c "CREATE EXTENSION hstore;" -d gis

```

#### Set osm as the table owner.

```
psql -c "ALTER TABLE spatial_ref_sys OWNER TO osm;" -d gis

```
#### Exit from the postgres user.
```
exit
```
#### Create osm user on your operating system so the tile server can run as osm user. The following command will create a system user without password.

```
sudo adduser --system --group osm

```


## Step 3: Download Map Stylesheet and Map Data

#### Change to osm’s home directory.

```
cd /home/osm/
```

#### Download the latest CartoCSS map stylesheets to the osm user’s home directory with git.

```
sudo apt install git

git clone https://github.com/gravitystorm/openstreetmap-carto.git

```
##### If you see “permission denied” error while running the above command, then you can grant permissions with the following command. Replace username with your real username.

```
sudo apt install acl
sudo setfacl -R -m u:username:rwx /home/osm/

```
#### Then Download the map data from the following websites below

If you want other map of individual country/state/province/city, go to http://download.geofabrik.de. Also, BBBike.org provides extracts of more than 200 cities and regions worldwide in different formats.


## Step 4: Optimize PostgreSQL Server Performance

#### The import process can take some time. To speed up this process, we can tune some PostgreSQL server settings to improve performance. Edit PostgreSQL main configuration file.

```
sudo nano /etc/postgresql/15/main/postgresql.conf
```

#### First, we should change the value of shared_buffer. The default setting is:

```
shared_buffers = 128MB
```

#### This is too small. The rule of thumb is to set it to 25% of your total RAM (excluding swap space). For example, if you have 60G RAM, then set it to:

```
shared_buffers = 15GB
```

#### Find the following line.

```
work_mem = 4MB
maintenance_work_mem = 64MB
```
#### Again, the value is too small. I use the following settings.

```
work_mem = 1GB
maintenance_work_mem = 8GB
```
#### Then find the following line.

```
effective_cache_size = 4GB
```
#### If you have lots of RAM , you can set a higher value for the effective_cache_size like 20G.

```
effective_cache_size = 20GB
```
#### Save and close the file. Restart PostgreSQL for the changes to take effect.
```
sudo systemctl restart postgresql
```
## Step 5: Import the Map Data to PostgreSQL

#### To import map data, we need to install osm2pgsql which converts OpenStreetMap data to postGIS-enabled PostgreSQL databases.
```
sudo apt install osm2pgsql
```
#### Grant permissions to the postgres user.

```
sudo setfacl -R -m u:postgres:rwx /home/osm/
```
#### Switch to the postgres user.

```
sudo -u postgres -i
```
#### Run the following command to load map stylesheet and map data into the gis database. Replace great-britain-latest.osm.pbf with your own map data file.

```
osm2pgsql --slim -d gis --hstore --multi-geometry --number-processes 10 --tag-transform-script /home/osm/openstreetmap-carto/openstreetmap-carto.lua --style /home/osm/openstreetmap-carto/openstreetmap-carto.style -C 32000 /home/osm/great-britain-latest.osm.pbf
```
#### where


- ```--slim```: run in slim mode rather than normal mode. This option is needed if you want to update the map data using OSM change files (OSC) in the future.
- ```-d gis```: select database.

- ```--hstore```: add tags without column to an additional hstore (key/value) column to PostgreSQL tables

- ```--multi-geometry```: generate multi-geometry features in postgresql tables.

- ```--style```: specify the location of style file

- ```--number-processes```: number of CPU cores on your server. I have 10.

- ```-C``` flag specifies the cache size in MegaBytes. It should be around 70% of the free RAM on your machine. Bigger cache size results in faster import speed. 
For example, my server has 60GB free RAM, so I can specify -C 32000. Be aware that PostgreSQL will need RAM for shared_buffers. Use this formula to calculate how big the cache size should be: (Total RAM - PostgreSQL shared_buffers) * 70%


- Finally, you need to specify the location of map data file.

#### If you are going to import the full planet map data, then use the --drop option and the --flat-nodes option to increase the import speed. Note that the --flat-nodes option isn’t suitable for small maps.

```
osm2pgsql --slim -d gis --drop --flat-nodes /home/osm/nodes.cache --hstore --multi-geometry --number-processes 10 --tag-transform-script /home/osm/openstreetmap-carto/openstreetmap-carto.lua --style /home/osm/openstreetmap-carto/openstreetmap-carto.style -C 32000 /home/osm/planet-latest.osm.pbf

```
##### RAM usage will gradually increase during the importing process.

#### Once the import is complete, grant all privileges of the gis database to the osm user.

```
psql -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO osm;" -d gis
```
#### Exit from the postgres user.

```
exit
```

## Step 6: Install Renderd and mod_tile

- ```renderd``` is a daemon for rendering OpenStreetMap tiles from the PostgreSQL database.
- ```mod_tile``` is an Apache module that is used to serve tiles to clients (e.g. web browsers)

#### The default Ubuntu repository does not include mod_tile and renderd, but we can install them from the OSM PPA.

```
sudo apt install software-properties-common

sudo add-apt-repository ppa:osmadmins/ppa

sudo apt install apache2 libapache2-mod-tile renderd

```
#### The Apache web server will be installed and a config file for renderd will also be created at /etc/apache2/conf-available/renderd.conf.

#####  Enable the ```tile``` module.

```
sudo a2enmod tile
```

#### Next, create a virtual host for the tile server.

```
sudo nano /etc/apache2/sites-available/tileserver_site.conf
```

#### Add the following lines in this file. Replace tile.your-domain.com with your real domain name. Don’t forget to DNS A record.

```
<VirtualHost *:80>
    ServerName tile.your-domain.com
    LogLevel info
    Include /etc/apache2/conf-available/renderd.conf

</VirtualHost>
```
#### Save and close the file. Enable this virtual host.
```
sudo a2ensite tileserver_site.conf
```
#### Restart Apache for the changes to take effect.

```
sudo systemctl restart apache2
```
#### The render daemon will automatically start, as can be seen with:

```
systemctl status renderd
```




## Step 7: Generate Mapnik Stylesheet

#### Install the required packages.

```
sudo apt install curl unzip gdal-bin mapnik-utils libmapnik-dev python3-pip
```
#### We also need to install nodejs and npm from the upstream repository with the following commands.

```
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs

```
#### Then install the carto package with npm.

```
sudo npm install -g carto
```
#### Install the psycopg2 Python module.

```
sudo -H pip3 install psycopg2==2.8.5
```

#### Switch to the ```postgres``` user.

```
sudo -u postgres -i
```

#### Cd into the carto style directory.

```
cd /home/osm/openstreetmap-carto/
```
#### Get shapefiles.
```
scripts/get-external-data.py
```

#### If you encounter the following error message while running the above command, then you have DNS issues. Simply wait for several minutes and run the Python script again.

##### Failed to establish a new connection: [Errno -3] Temporary failure in name resolution
#### Now build the Mapnik XML stylesheet with the carto map stylesheet compiler.

```
carto project.mml > style.xml
```
#### Grant all privileges of the gis database to the osm user.

```
psql -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO osm;" -d gis
```
#### Exit from the postgres user.

```
exit
```


## Step 8: Install Fonts

#### You need to install the ```ttf-dejavu``` package.

```
sudo apt install ttf-dejavu
```
#### To display non-Latin characters, install the following packages.

```
sudo apt install fonts-noto-cjk fonts-noto-cjk-extra fonts-noto-hinted fonts-noto-unhinted ttf-unifont
```
## Step 9: Configure renderd

#### Edit ```renderd``` config file.

```
sudo nano /etc/renderd.conf
```

#### In the ```[renderd]``` section, change the number of threads according to the number of CPU cores on your server.

```
num_threads=10
```
#### Add a ```default layer```. Lines beginning with semicolons (;) are comments.

```
; ADD YOUR LAYERS:
[default]
URI=/osm/
XML=/home/osm/openstreetmap-carto/style.xml
HOST=tile.your-domain.com

```
#### By default, renderd allows a max zoom level of 18. If you need zoom level 19, add the following line in the ```[default]``` section.

```
MAXZOOM=19
```
#### Save and close the file.  Then create a new directory for the renderd service.

```
sudo mkdir /etc/systemd/system/renderd.service.d/
```
#### Create a custom config file under this directory.

```
sudo nano /etc/systemd/system/renderd.service.d/custom.conf
```
#### Add the following lines in this file.

```
[Service]
User=osm
```
#### Save and close the file. Change the ownership of ```/run/renderd/``` and  ```/var/cache/renderd/tiles/``` directory.
```
sudo chown osm /run/renderd/ -R
sudo chown osm /var/cache/renderd/tiles/ -R
```


#### Then restart renderd service.

```
sudo systemctl daemon-reload

sudo systemctl restart renderd
```

#### You need to check the log of renderd.

```
sudo journalctl -eu renderd
```

##### Make sure renderd does not produce any error in the log after the restart, or the map won’t be displayed.


## Step 10: Test

#### In your web browser address bar, type

```
tile.your-domain.com/osm/0/0/0.png
```
#### You should see the tile of the world map.

#### If you see the 404 not found error, simply wait a few minutes, refresh the page in your browser and it should be able to load the tile of world map. If it still won’t load, then restart renderd service ```(sudo systemctl restart renderd)```. 

## Step 11: Display Your Tiled Web Map

#### Now you have a working OSM tile server, you need to use a JavaScript map library to display the map on your other servers.

###  Leaflet

#### To display your slippy map with Leftlet, download JavaScript and CSS from leftletjs.com and extract it to the webroot folder.

```
 cd /var/www/html/
```
```
sudo wget http://cdn.leafletjs.com/leaflet/v1.7.1/leaflet.zip

sudo unzip leaflet.zip
```
#### Next, create the ```index.html```  file. If there is already an index.html file, then delete the original content.

```
sudo nano /var/www/html/index.html

```
#### Paste the following HTML code in the file. Replace http://tile.your-domain.com  text with your domain  and adjust the longitude, latitude and zoom level according to your needs.


```
<html>
<head>
<meta charset="UTF-8">
<title>My first osm</title>
<link rel="stylesheet" type="text/css" href="leaflet.css"/>
<script type="text/javascript" src="leaflet.js"></script>
<style>
   #map{width:100%;height:100%}
</style>
</head>

<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([55,0.8],6);
    L.tileLayer('http://tile.your-domain.com/osm/{z}/{x}/{y}.png',{maxZoom:18}).addTo(map);
</script>
</body>
</html>
```

#### Save and close the file. Now you can view your slippy map by typing your server IP address in browser.

```
tile.your-domain.com
```
##### or

```
tile.your-domain.com/index.html
```