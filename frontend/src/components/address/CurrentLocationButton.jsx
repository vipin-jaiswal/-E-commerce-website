import React, { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import useCurrentLocation from "../../hooks/useCurrentLocation";
import {
  reverseGeocode,
  buildAddressObject,
} from "../../services/geocodingService";

export default function CurrentLocationButton({
  onLocationFound,
}) {
  const [loading, setLoading] = useState(false);

  const reverseGeocode = (lat, lng) => {
   try {
  const place =
    await reverseGeocode(
      location.lat,
      location.lng
    );

  onLocationFound(
    buildAddressObject(place)
  );
} catch (err) {
  alert(err.message);
}

    geocoder.geocode(
      {
        location: { lat, lng },
      },
      (results, status) => {
        setLoading(false);

        if (status !== "OK" || !results.length) {
          alert("Unable to find address.");
          return;
        }

        const place = results[0];

        onLocationFound({
          lat,
          lng,
          address: place.formatted_address,
          formattedAddress: place.formatted_address,
          place,
        });
      }
    );
  };

  const {
  loading,
  getCurrentLocation,
} = useCurrentLocation();

const detectLocation = async () => {
  try {
    const location = await getCurrentLocation();

    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode(
      {
        location: {
          lat: location.lat,
          lng: location.lng,
        },
      },
      (results, status) => {
        if (
          status === "OK" &&
          results &&
          results.length > 0
        ) {
          const place = results[0];

          onLocationFound({
            ...location,
            address: place.formatted_address,
            formattedAddress: place.formatted_address,
            place,
          });
        }
      }
    );
  } catch (err) {
    alert(err.message);
  }
};

  return (
    <button
      type="button"
      onClick={detectLocation}
      disabled={loading}
      className="
      w-full
      flex
      items-center
      justify-center
      gap-2
      rounded-xl
      bg-pink-600
      py-3
      text-white
      font-medium
      hover:bg-pink-700
      transition
      disabled:opacity-60
      "
    >
      {loading ? (
        <>
          <Loader2
            size={18}
            className="animate-spin"
          />
          Detecting Location...
        </>
      ) : (
        <>
          <MapPin size={18} />
          Use Current Location
        </>
      )}
    </button>
  );
}