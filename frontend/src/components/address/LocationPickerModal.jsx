import React, { useState } from "react";
import { X, MapPin, CheckCircle } from "lucide-react";

import GoogleMapPicker from "./GoogleMapPicker";
import SearchBox from "./SearchBox";
import NearbyAddressList from "./NearbyAddressList";
import CurrentLocationButton from "./CurrentLocationButton";

export default function LocationPickerModal({
  open,
  onClose,
  selectedLocation,
  setSelectedLocation,
  onConfirm,
}) {
  const [nearbyAddresses, setNearbyAddresses] = useState([]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">

          <div>
            <h2 className="text-2xl font-bold">
              Select Address
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Choose your delivery location
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X size={22} />
          </button>

        </div>

        {/* Body */}

        <div className="flex flex-1 overflow-hidden">

          {/* Left */}

          <div className="flex w-full flex-col border-r lg:w-2/3">

            <div className="space-y-4 p-5">

              <CurrentLocationButton
                onLocationFound={(location) =>
                  setSelectedLocation(location)
                }
              />

              <SearchBox
                onSelect={(location) =>
                  setSelectedLocation(location)
                }
              />

            </div>

            <div className="flex-1">

              <GoogleMapPicker
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
                setNearbyAddresses={setNearbyAddresses}
              />

            </div>

          </div>

          {/* Right */}

          <div className="hidden w-1/3 flex-col lg:flex">

            <div className="border-b p-5">

              <div className="flex items-center gap-2">

                <MapPin
                  size={20}
                  className="text-pink-600"
                />

                <h3 className="font-semibold">
                  Nearby Addresses
                </h3>

              </div>

            </div>

            <div className="flex-1 overflow-y-auto">

              <NearbyAddressList
                addresses={nearbyAddresses}
                selected={selectedLocation}
                onSelect={(address) =>
                  setSelectedLocation(address)
                }
              />

            </div>

          </div>

        </div>

        {/* Footer */}

        <div className="flex justify-end gap-3 border-t p-5">

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-6 py-3 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!selectedLocation}
            onClick={() => onConfirm(selectedLocation)}
            className="flex items-center gap-2 rounded-xl bg-pink-600 px-8 py-3 text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle size={18} />
            Use This Address
          </button>

        </div>

      </div>
    </div>
  );
}