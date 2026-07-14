/**
 * Convert Google Address Components
 * into AddressForm format
 */

export function getComponent(components, type) {
  const component = components.find((item) =>
    item.types.includes(type)
  );

  return component ? component.long_name : "";
}

export function buildAddress(place) {
  if (!place) return null;

  const components = place.address_components || [];

  const streetNumber = getComponent(
    components,
    "street_number"
  );

  const route = getComponent(
    components,
    "route"
  );

  const locality =
    getComponent(
      components,
      "sublocality_level_1"
    ) ||
    getComponent(
      components,
      "sublocality"
    ) ||
    getComponent(
      components,
      "neighborhood"
    );

  const city =
    getComponent(
      components,
      "locality"
    ) ||
    getComponent(
      components,
      "administrative_area_level_2"
    );

  const state = getComponent(
    components,
    "administrative_area_level_1"
  );

  const country = getComponent(
    components,
    "country"
  );

  const pincode = getComponent(
    components,
    "postal_code"
  );

  return {
    type: "Home",

    name: "",

    phone: "",

    address1: `${streetNumber} ${route}`.trim(),

    address2: "",

    landmark: "",

    area: locality,

    city,

    state,

    country,

    pincode,

    latitude:
      place.geometry.location.lat(),

    longitude:
      place.geometry.location.lng(),

    formattedAddress:
      place.formatted_address,

    place,
  };
}

export function fillAddressForm(
  location,
  existing = {}
) {
  return {
    ...existing,

    address1:
      location.address1 ||
      existing.address1,

    address2:
      location.address2 ||
      existing.address2,

    landmark:
      location.landmark ||
      existing.landmark,

    area:
      location.area ||
      existing.area,

    city:
      location.city ||
      existing.city,

    state:
      location.state ||
      existing.state,

    country:
      location.country ||
      "India",

    pincode:
      location.pincode ||
      existing.pincode,

    latitude:
      location.latitude,

    longitude:
      location.longitude,
  };
}