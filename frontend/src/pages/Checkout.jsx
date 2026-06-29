import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

import AddressForm from "../components/checkout/AddressForm";
import PaymentMethod from "../components/checkout/PaymentMethod";
import OrderSummary from "../components/checkout/OrderSummary";
import { useCart } from "../hooks/useCart";
import { orderService } from "../services/orderService";

const STEPS = ["Delivery", "Payment", "Review"];

const toShippingAddress = (address) => ({
  street: address.address1 || "",
  city: address.city || "",
  state: address.state || "",
  zip: address.pincode || "",
  country: address.country || "India",
});

export default function Checkout() {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState({});
  const [payment, setPayment] = useState("card");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { items, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const validateAddress = () => {
    const required = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address1",
      "city",
      "pincode",
      "state",
    ];

    const newErrors = {};

    required.forEach((field) => {
      if (!address[field]) {
        newErrors[field] = "Required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const next = () => {
    if (step === 0 && !validateAddress()) return;
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const placeOrder = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    setLoading(true);

    try {
      await orderService.create({
        shippingAddress: toShippingAddress(address),
        paymentMethod: payment,
      });

      await clearCart();

      toast.success("Order placed successfully!");
      navigate("/orders");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-pink-50 min-h-screen py-10">
      <div className="max-w-[1500px] mx-auto px-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-10">Checkout</h1>

        <div className="flex items-center gap-2 mb-10 max-w-lg mx-auto">
          {STEPS.map((item, index) => (
            <React.Fragment key={item}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                    index < step
                      ? "bg-pink-500 text-white"
                      : index === step
                      ? "bg-pink-100 text-pink-600 border-2 border-pink-500"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index < step ? <CheckCircle size={18} /> : index + 1}
                </div>

                <span
                  className={`mt-2 text-sm font-medium ${
                    index === step ? "text-pink-600" : "text-gray-500"
                  }`}
                >
                  {item}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 rounded-full ${
                    index < step ? "bg-pink-500" : "bg-gray-300"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 0 && (
              <div className="bg-white rounded-3xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Delivery Address</h2>
                <AddressForm data={address} onChange={setAddress} errors={errors} />
              </div>
            )}

            {step === 1 && (
              <div className="bg-white rounded-3xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Method</h2>
                <PaymentMethod selected={payment} onSelect={setPayment} />
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-3xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Review Order</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm uppercase tracking-wider text-pink-500 font-semibold mb-2">
                      Delivery Address
                    </h3>

                    <p className="text-gray-700 leading-7">
                      {address.firstName} {address.lastName}
                      <br />
                      {address.address1}
                      <br />
                      {address.city} - {address.pincode}
                      <br />
                      {address.state}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm uppercase tracking-wider text-pink-500 font-semibold mb-2">
                      Payment Method
                    </h3>

                    <p className="text-gray-700 capitalize">{payment}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-8">
              {step > 0 ? (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-100 transition-all duration-300 shadow-sm"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < STEPS.length - 1 ? (
                <button
                  onClick={next}
                  className="px-8 py-3 rounded-xl bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-all duration-300 shadow-lg"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={placeOrder}
                  disabled={loading}
                  className="px-8 py-3 rounded-xl bg-pink-500 text-white font-semibold hover:bg-pink-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
                >
                  {loading ? "Placing Order..." : "Place Order"}
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="sticky top-24">
              <OrderSummary />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
