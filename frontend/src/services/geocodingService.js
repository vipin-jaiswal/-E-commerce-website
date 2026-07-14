/**
 * Google Maps Geocoding Service
 */

export function reverseGeocode(lat, lng) {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error("Google Maps not loaded"));
      return;
    }

    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode(
      {
        location: { lat, lng },
      },
      (results, status) => {
        if (
          status === "OK" &&
          results &&
          results.length > 0
        ) {
          resolve(results[0]);
        } else {
          reject(
            new Error(
              "Unable to find address for this location."
            )
          );
        }
      }
    );
  });
}

export function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error("Google Maps not loaded"));
      return;
    }

    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode(
      {
        address,
      },
      (results, status) => {
        if (
          status === "OK" &&
          results &&
          results.length > 0
        ) {
          resolve(results[0]);
        } else {
          reject(
            new Error("Address not found.")
          );
        }
      }
    );
  });
}

export function getAddressComponents(place) {
  const components = place.address_components || [];

  const get = (type) =>
    components.find((item) =>
      item.types.includes(type)
    )?.long_name || "";

  return {
    address1: [
      get("street_number"),
      get("route"),
    ]
      .filter(Boolean)
      .join(" "),

    area:
      get("sublocality") ||
      get("sublocality_level_1") ||
      get("neighborhood"),

    city:
      get("locality") ||
      get("administrative_area_level_2"),

    state: get("administrative_area_level_1"),

    country: get("country"),

    pincode: get("postal_code"),
  };
}

export function buildAddressObject(place) {
  const location = place.geometry.location;

  return {
    lat: location.lat(),
    lng: location.lng(),

    formattedAddress:
      place.formatted_address,

    address:
      place.formatted_address,

    place,

    ...getAddressComponents(place),
  };
}