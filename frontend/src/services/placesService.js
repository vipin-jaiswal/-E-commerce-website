/**
 * Google Places Service
 * Finds nearby addresses/places around a selected location.
 */

export function getNearbyPlaces(lat, lng, radius = 100) {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error("Google Maps not loaded."));
      return;
    }

    const map = new window.google.maps.Map(document.createElement("div"));

    const service = new window.google.maps.places.PlacesService(map);

    service.nearbySearch(
      {
        location: new window.google.maps.LatLng(lat, lng),
        radius,
      },
      (results, status) => {
        if (
          status ===
            window.google.maps.places.PlacesServiceStatus.OK &&
          results
        ) {
          resolve(results);
        } else {
          reject(new Error("No nearby places found."));
        }
      }
    );
  });
}

export function formatNearbyPlace(place) {
  return {
    id: place.place_id,

    title: place.name,

    address:
      place.vicinity ||
      place.formatted_address ||
      "",

    lat: place.geometry.location.lat(),

    lng: place.geometry.location.lng(),

    rating: place.rating || null,

    userRatings:
      place.user_ratings_total || 0,

    types: place.types || [],

    icon: place.icon || "",

    place,
  };
}

export async function fetchNearbyAddresses(
  lat,
  lng,
  radius = 100
) {
  const places = await getNearbyPlaces(
    lat,
    lng,
    radius
  );

  return places.map(formatNearbyPlace);
}