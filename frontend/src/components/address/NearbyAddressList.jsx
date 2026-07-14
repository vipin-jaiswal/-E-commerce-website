import React from "react";
import { MapPin, CheckCircle2 } from "lucide-react";

export default function NearbyAddressList({
  addresses = [],
  selected,
  onSelect,
}) {
  if (!addresses.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center">
        <MapPin
          size={45}
          className="text-pink-500 mb-4"
        />

        <h3 className="text-lg font-semibold text-gray-800">
          No Nearby Addresses
        </h3>

        <p className="text-sm text-gray-500 mt-2">
          Use your current location or search an address to see nearby
          places.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">

      {addresses.map((address, index) => {

        const active =
          selected &&
          selected.lat === address.lat &&
          selected.lng === address.lng;

        return (
          <button
            key={`${address.lat}-${address.lng}-${index}`}
            onClick={() => onSelect(address)}
            className={`w-full text-left p-4 transition-all duration-200 hover:bg-pink-50
            ${
              active
                ? "bg-pink-50 border-l-4 border-pink-600"
                : ""
            }`}
          >
            <div className="flex gap-3">

              <div className="mt-1">

                {active ? (
                  <CheckCircle2
                    size={20}
                    className="text-pink-600"
                  />
                ) : (
                  <MapPin
                    size={20}
                    className="text-gray-400"
                  />
                )}

              </div>

              <div className="flex-1">

                <h4 className="font-semibold text-gray-800">
                  {address.title || "Selected Address"}
                </h4>

                <p className="text-sm text-gray-500 mt-1 leading-6">
                  {address.address ||
                    address.formattedAddress}
                </p>

                {address.distance && (
                  <p className="text-xs text-pink-600 mt-2 font-medium">
                    {address.distance}
                  </p>
                )}

              </div>

            </div>

          </button>
        );

      })}

    </div>
  );
}