import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

import AddressSelector from "../components/address/AddressSelector";
import PaymentMethod from "../components/checkout/PaymentMethod";
import OrderSummary from "../components/checkout/OrderSummary";
import { useCart } from "../hooks/useCart";
import { orderService } from "../services/orderService";
import { useAuth } from "../hooks/useAuth";
import { useAddress } from "../context/AddressContext";

const STEPS = ["Delivery", "Payment"];

export default function Checkout() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [payment, setPayment] = useState("card");
  const [loading, setLoading] = useState(false);

  const { items, cartTotal, clearCart } = useCart();
  const { addresses, defaultAddress } = useAddress();
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // If user is not logged in, redirect them to the login page
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  const getAddressId = (address) => String(address?._id || address?.id || '');
  const activeAddressId = selectedAddressId || getAddressId(defaultAddress);
  const selectedAddress = addresses.find((address) => getAddressId(address) === String(activeAddressId));

  const handleSelectAddress = (id) => {
    setSelectedAddressId(id);
  };

  const next = (addressToUse = selectedAddress) => {
    if (step === 0 && !addressToUse) {
      toast.error("Please select a delivery address.");
      return;
    }
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const placeOrder = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    setLoading(true);

    try {
      const createdOrder = await orderService.create({
        addressId: getAddressId(selectedAddress),
        paymentMethod: payment,
        items,
      });

      if (payment === 'cod') {
        await clearCart();
        toast.success("Order placed successfully!");
        navigate("/orders");
      } else {
        // For other payment methods, redirect to a payment page
        // In a real app, this would be the payment gateway
        navigate(`/payment/${createdOrder.id}`, { state: { order: createdOrder } });
      }
    } catch (err) {
      console.error("Order placement error:", err);
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-pink-50 dark:bg-gray-950 min-h-screen py-10">
      <div className="max-w-[1500px] mx-auto px-6">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-slate-100 mb-10">Checkout</h1>

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
                      : "bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-slate-400"
                  }`}
                >
                  {index < step ? <CheckCircle size={18} /> : index + 1}
                </div>

                <span
                  className={`mt-2 text-sm font-medium dark:text-slate-400 ${
                    index === step ? "text-pink-600" : "text-gray-500"
                  }`}
                >
                  {item}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 rounded-full dark:bg-slate-700 ${
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
              <AddressSelector selectedId={activeAddressId} onSelectAddress={handleSelectAddress} onSaveAndContinue={(address) => next(address)} />
            )}

            {step === 1 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-6">Payment Method</h2>
                <PaymentMethod selected={payment} onSelect={setPayment} />
              </div>
            )}

            <div className="flex items-center justify-between mt-8">
              {step > 0 ? (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="px-6 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-300 shadow-sm"
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
