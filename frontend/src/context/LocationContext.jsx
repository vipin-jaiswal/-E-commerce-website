import React, {
  createContext,
  useContext,
  useState,
  useMemo,
} from "react";

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [nearbyAddresses, setNearbyAddresses] = useState([]);

  const [mapCenter, setMapCenter] = useState(null);

  const [markerPosition, setMarkerPosition] = useState(null);

  const [searchValue, setSearchValue] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  const [locationModalOpen, setLocationModalOpen] =
    useState(false);

  const clearLocation = () => {
    setSelectedLocation(null);
    setNearbyAddresses([]);
    setMapCenter(null);
    setMarkerPosition(null);
    setSearchValue("");
    setError(null);
  };

  const value = useMemo(
    () => ({
      selectedLocation,
      setSelectedLocation,

      nearbyAddresses,
      setNearbyAddresses,

      mapCenter,
      setMapCenter,

      markerPosition,
      setMarkerPosition,

      searchValue,
      setSearchValue,

      loading,
      setLoading,

      error,
      setError,

      locationModalOpen,
      setLocationModalOpen,

      clearLocation,
    }),
    [
      selectedLocation,
      nearbyAddresses,
      mapCenter,
      markerPosition,
      searchValue,
      loading,
      error,
      locationModalOpen,
    ]
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error(
      "useLocationContext must be used inside LocationProvider"
    );
  }

  return context;
}