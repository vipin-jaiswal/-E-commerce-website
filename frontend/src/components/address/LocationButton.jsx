import React, { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { getCurrentPosition, reverseGeocode } from "../../utils/geocoding";

export default function LocationButton({ onLocate }) {
  const [loading, setLoading] = useState(false);

  const detectCurrentLocation = () => {
    setLoading(true);
    getCurrentPosition()
      .then((coords) => reverseGeocode(coords.latitude, coords.longitude))
      .then((address) => {
        onLocate(address);
        toast.success("Location detected!");
      })
      .catch((err) => {
        console.error("Location detection failed:", err);
        toast.error(err.message || "Could not get your location.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <button
      type="button"
      onClick={detectCurrentLocation}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-pink-300 bg-pink-50 px-4 py-3 text-sm font-semibold text-pink-600 transition hover:bg-pink-100 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin" />
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