import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import {
  fetchNearbyAddresses,
} from "../../services/placesService";  

import {
  GoogleMap,
  Marker,
} from "@react-google-maps/api";

import useGoogleMaps from "../../hooks/useGoogleMaps";

import {
  reverseGeocode,
  buildAddressObject,
} from "../../services/geocodingService";

import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_OPTIONS,
} from "../../services/googleMaps";

const containerStyle = {
  width: "100%",
  height: "100%",
};

export default function GoogleMapPicker({
  selectedLocation,
  setSelectedLocation,
  setNearbyAddresses,
}){
  const { isLoaded, loadError } = useGoogleMaps();

  const [map, setMap] = useState(null);

  const [markerPosition, setMarkerPosition] =
    useState(DEFAULT_CENTER);

  const center = useMemo(() => markerPosition, [markerPosition]);

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Update marker when selected location changes
  useEffect(() => {
    if (
      !selectedLocation?.lat ||
      !selectedLocation?.lng
    )
      return;

    const position = {
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
    };

    setMarkerPosition(position);

    if (map) {
      map.panTo(position);
      map.setZoom(18);
    }
  }, [selectedLocation, map]);

  // Convert Lat/Lng into Address
  const handleReverseGeocode = async (
  location
) => {
  try {
    const place = await reverseGeocode(
      location.lat,
      location.lng
    );

    const address =
      buildAddressObject(place);

    setSelectedLocation(address);

    if (setNearbyAddresses) {
      const nearby =
        await fetchNearbyAddresses(
          location.lat,
          location.lng
        );

      setNearbyAddresses(nearby);
    }
  } catch (error) {
    console.error(error);
  }
};

  // User clicks map
  const handleMapClick = (event) => {
    const location = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };

    setMarkerPosition(location);

    handleReverseGeocode(location);
  };

  // User drags marker
  const handleMarkerDragEnd = (event) => {
    const location = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };

    setMarkerPosition(location);

    handleReverseGeocode(location);
  };

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center text-red-600 font-semibold">
        Failed to load Google Maps.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center">
        Loading Google Maps...
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={DEFAULT_ZOOM}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
      options={MAP_OPTIONS}
    >
      <Marker
        position={markerPosition}
        draggable
        onDragEnd={handleMarkerDragEnd}
      />
    </GoogleMap>
  );
}