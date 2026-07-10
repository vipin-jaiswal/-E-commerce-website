// Thin wrapper around OpenStreetMap's free Nominatim API.
// Docs: https://nominatim.org/release-docs/latest/api/Overview/
// Note: Nominatim's public instance asks for reasonable usage (no more
// than ~1 req/sec); the 300ms debounce in AddressSearch keeps us well
// within that for a single user typing.

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

function mapNominatimAddress(item) {
  const a = item.address || {};
  return {
    address1: [a.house_number, a.road].filter(Boolean).join(' ') || item.display_name?.split(',')[0] || '',
    area: a.suburb || a.neighbourhood || a.residential || '',
    city: a.city || a.town || a.village || a.county || '',
    state: a.state || '',
    country: a.country || 'India',
    pincode: a.postcode || '',
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
    label: item.display_name,
  };
}

/** Forward search — used by the "Search Address" typeahead (Feature 3). */
export async function searchAddress(query, { limit = 5 } = {}) {
  if (!query || query.trim().length < 3) return [];

  const url = `${NOMINATIM_BASE}/search?format=jsonv2&addressdetails=1&limit=${limit}&countrycodes=in&q=${encodeURIComponent(
    query
  )}`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Address search failed');

  const results = await res.json();
  return results.map(mapNominatimAddress);
}

/** Reverse geocode — used by the "Use Current Location" button (Feature 2). */
export async function reverseGeocode(latitude, longitude) {
  const url = `${NOMINATIM_BASE}/reverse?format=jsonv2&addressdetails=1&lat=${latitude}&lon=${longitude}`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Reverse geocoding failed');

  const result = await res.json();
  return mapNominatimAddress({ ...result, lat: latitude, lon: longitude });
}

/**
 * Wraps navigator.geolocation.getCurrentPosition in a promise with
 * friendly, distinguishable error reasons for the UI to branch on.
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ code: 'UNSUPPORTED', message: 'Geolocation is not supported by this browser.' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject({ code: 'PERMISSION_DENIED', message: 'Location permission denied. Please enable it in your browser settings.' });
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          reject({ code: 'POSITION_UNAVAILABLE', message: 'Location unavailable right now. Please try again.' });
        } else if (err.code === err.TIMEOUT) {
          reject({ code: 'TIMEOUT', message: 'Location request timed out. Please try again.' });
        } else {
          reject({ code: 'UNKNOWN', message: 'Could not fetch your location.' });
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}
