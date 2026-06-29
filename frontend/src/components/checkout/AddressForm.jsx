import React, { useState } from "react";
import { MapPin, Home, Building2, Pencil } from "lucide-react";

function InputField({
  name,
  placeholder,
  type = "text",
  autoComplete,
  value,
  onChange,
  error,
}) {
  return (
    <div>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`w-full p-4 rounded-xl border outline-none transition ${
          error
            ? "border-red-500"
            : "border-gray-300 focus:border-pink-500"
        }`}
      />

      {error && (
        <p className="text-red-500 text-sm mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

export default function AddressForm({
  data,
  onChange,
  errors = {},
}) {
  const [showSelector, setShowSelector] = useState(true);

  const handleChange = (e) => {
    onChange({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log(position.coords);

        onChange({
          ...data,
          city: "Detected City",
          state: "Detected State",
        });

        setShowSelector(false);
      },
      () => alert("Unable to get location")
    );
  };

  const useHomeAddress = () => {
    onChange({
      ...data,
      firstName: "Vipin",
      lastName: "Jaiswal",
      address1: "Home Address",
      city: "Bhilai",
      state: "Chhattisgarh",
      pincode: "490001",
    });

    setShowSelector(false);
  };

  const useOfficeAddress = () => {
    onChange({
      ...data,
      address1: "Office Address",
      city: "Raipur",
      state: "Chhattisgarh",
      pincode: "492001",
    });

    setShowSelector(false);
  };

  if (showSelector) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={useCurrentLocation}
          className="w-full border rounded-2xl p-4 flex items-center gap-4 hover:border-pink-500 transition"
        >
          <MapPin className="text-pink-500" />
          <div className="text-left">
            <h3 className="font-semibold">Use Current Location</h3>
            <p className="text-sm text-gray-500">
              Detect address using GPS
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={useHomeAddress}
          className="w-full border rounded-2xl p-4 flex items-center gap-4 hover:border-pink-500 transition"
        >
          <Home className="text-pink-500" />
          <div className="text-left">
            <h3 className="font-semibold">Home Address</h3>
            <p className="text-sm text-gray-500">
              Use saved home address
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={useOfficeAddress}
          className="w-full border rounded-2xl p-4 flex items-center gap-4 hover:border-pink-500 transition"
        >
          <Building2 className="text-pink-500" />
          <div className="text-left">
            <h3 className="font-semibold">Office Address</h3>
            <p className="text-sm text-gray-500">
              Use saved office address
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setShowSelector(false)}
          className="w-full border rounded-2xl p-4 flex items-center gap-4 hover:border-pink-500 transition"
        >
          <Pencil className="text-pink-500" />
          <div className="text-left">
            <h3 className="font-semibold">Enter Address Manually</h3>
            <p className="text-sm text-gray-500">
              Fill address details yourself
            </p>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <InputField
        name="firstName"
        placeholder="First Name"
        autoComplete="given-name"
        value={data.firstName || ""}
        onChange={handleChange}
        error={errors.firstName}
      />

      <InputField
        name="lastName"
        placeholder="Last Name"
        autoComplete="family-name"
        value={data.lastName || ""}
        onChange={handleChange}
        error={errors.lastName}
      />

      <InputField
        name="email"
        placeholder="Email"
        type="email"
        autoComplete="email"
        value={data.email || ""}
        onChange={handleChange}
        error={errors.email}
      />

      <InputField
        name="phone"
        placeholder="Phone Number"
        autoComplete="tel"
        value={data.phone || ""}
        onChange={handleChange}
        error={errors.phone}
      />

      <div className="md:col-span-2">
        <InputField
          name="address1"
          placeholder="Street Address"
          autoComplete="street-address"
          value={data.address1 || ""}
          onChange={handleChange}
          error={errors.address1}
        />
      </div>

      <InputField
        name="city"
        placeholder="City"
        autoComplete="address-level2"
        value={data.city || ""}
        onChange={handleChange}
        error={errors.city}
      />

      <InputField
        name="state"
        placeholder="State"
        autoComplete="address-level1"
        value={data.state || ""}
        onChange={handleChange}
        error={errors.state}
      />

      <InputField
        name="pincode"
        placeholder="Pincode"
        autoComplete="postal-code"
        value={data.pincode || ""}
        onChange={handleChange}
        error={errors.pincode}
      />
    </div>
  );
}
