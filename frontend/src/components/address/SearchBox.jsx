import React, { useRef, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Autocomplete } from "@react-google-maps/api";
import { AUTOCOMPLETE_OPTIONS } from "../../services/googleMaps";

export default function SearchBox({
  onSelect,
  placeholder = "Search area, city, pincode, landmark...",
}) {
  const autoCompleteRef = useRef(null);
  const [value, setValue] = useState("");

  const handleLoad = (autocomplete) => {
    autoCompleteRef.current = autocomplete;
  };

  const handlePlaceChanged = () => {
    if (!autoCompleteRef.current) return;

    const place = autoCompleteRef.current.getPlace();

    if (
      !place ||
      !place.geometry ||
      !place.geometry.location
    ) {
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    setValue(place.formatted_address || "");

    onSelect({
      lat,
      lng,
      address: place.formatted_address,
      formattedAddress: place.formatted_address,
      place,
    });
  };

  return (
    <Autocomplete
      onLoad={handleLoad}
      onPlaceChanged={handlePlaceChanged}
      options={AUTOCOMPLETE_OPTIONS}
    >
      <div className="relative">

        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="
            w-full
            rounded-xl
            border
            border-gray-300
            bg-white
            py-3
            pl-11
            pr-10
            text-sm
            outline-none
            transition
            focus:border-pink-500
            focus:ring-2
            focus:ring-pink-100
          "
        />

        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          >
            ✕
          </button>
        )}

      </div>
    </Autocomplete>
  );
}