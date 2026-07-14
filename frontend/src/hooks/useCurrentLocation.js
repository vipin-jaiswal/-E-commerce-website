import { useCallback, useState } from "react";

export default function useCurrentLocation() {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const message = "Geolocation is not supported by this browser.";
        setError(message);
        reject(new Error(message));
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          };

          setLocation(currentLocation);
          setLoading(false);

          resolve(currentLocation);
        },

        (err) => {
          let message = "Unable to detect location.";

          switch (err.code) {
            case err.PERMISSION_DENIED:
              message =
                "Location permission denied. Please allow location access.";
              break;

            case err.POSITION_UNAVAILABLE:
              message = "Location information is unavailable.";
              break;

            case err.TIMEOUT:
              message = "Location request timed out.";
              break;

            default:
              message = "Unknown location error.";
          }

          setError(message);
          setLoading(false);

          reject(new Error(message));
        },

        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  const clearLocation = () => {
    setLocation(null);
    setError(null);
  };

  return {
    loading,
    location,
    error,
    getCurrentLocation,
    clearLocation,
  };
}