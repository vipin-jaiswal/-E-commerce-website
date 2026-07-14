// Google Maps Configuration

export const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Libraries to load
export const GOOGLE_MAPS_LIBRARIES = [
  "places",
];

// Default map location (India)
export const DEFAULT_CENTER = {
  lat: 20.5937,
  lng: 78.9629,
};

// Default zoom level
export const DEFAULT_ZOOM = 16;

// Google Map Options
export const MAP_OPTIONS = {
  disableDefaultUI: false,

  fullscreenControl: false,

  streetViewControl: false,

  mapTypeControl: false,

  rotateControl: false,

  scaleControl: false,

  clickableIcons: false,

  zoomControl: true,

  gestureHandling: "greedy",

  minZoom: 4,

  maxZoom: 20,
};

// Restrict autocomplete search to India
export const AUTOCOMPLETE_OPTIONS = {
  componentRestrictions: {
    country: ["in"],
  },
  fields: [
    "formatted_address",
    "geometry",
    "address_components",
    "name",
    "place_id",
  ],
};
// Reverse geocoding options
export const GEOCODER_OPTIONS = {
  language: "en",
  region: "IN",
};

// Default marker icon
export const MARKER_OPTIONS = {
  draggable: true,

  animation: 1,
};

// Current location accuracy options
export const LOCATION_OPTIONS = {
  enableHighAccuracy: true,

  timeout: 15000,

  maximumAge: 0,
};