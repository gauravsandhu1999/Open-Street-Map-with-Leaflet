const MAP_DIV_ID = 'map';  //    Define the id of div on which map will be rendered

// const MAP_URL = 'https://c4ee-115-240-126-90.ngrok-free.app'; //  this constant will contain the url or website address on which open street map server  is setup
const MAP_URL = 'https://tile.openstreetmap.org'; //  this constant will contain the url or website address on which open street map server  is setup

const NOMINATIM_API_URL = 'https://nominatim.org';   // this constant will contain the url or website address on which nominatim geocoder server is setup

const OSRM_API_URL = 'http://router.project-osrm.org';   // this constant will contain the url or website address on which Open Street Routing Machine  is setup


const MAP_INITIAL_LATITUDE = '20.5937';

const MAP_INITIAL_LONGITUDE = '78.9629';

const MAP_INITIAL_ZOOM = '4';   // this constant will contain the value of initial zoom in which the map will be opened

const SEARCH_INPUT_ID = 'search-input';

const ORIGIN_INPUT_ID = 'origin-input';

const DESTINATION_INPUT_ID = 'destination-input';

const ORIGIN_LAT_INPUT_ID = 'origin-lat';

const ORIGIN_LONG_INPUT_ID = 'origin-long';

const DESTINATION_LAT_INPUT_ID = 'destination-lat';

const DESTINATION_LONG_INPUT_ID = 'destination-long';

const SEARCH_BUTTON_ID = 'search-button';

const urlParams = new URLSearchParams(window.location.search);

// Api request params

const pickup = urlParams.get('pickup');

const dropoff = urlParams.get('dropoff');

const current_lat = urlParams.get('current_lat');

const current_lon = urlParams.get('current_lon');

const initial_zoom = urlParams.get('initial_zoom') ?? 10;

