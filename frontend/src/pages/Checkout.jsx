import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import OrderSummary from "../components/checkout/OrderSummary";
import PaymentMethod from "../components/checkout/PaymentMethod";
import { useCart } from "../hooks/useCart";
import { cartService } from "../services/cartService";
import { isFormValid, sanitizeAddressData, validateAddressForm } from "../utils/addressValidation";

const ADDRESS_KEY = "dyvaCheckoutAddress";
const PAYMENT_KEY = "dyvaCheckoutPayment";
const initialAddress = { name: "", phone: "", address1: "", address2: "", landmark: "", city: "", state: "", pincode: "" };
const getSavedDefaultAddress = () => JSON.parse(localStorage.getItem("dyvaSavedAddresses") || "[]").find((savedAddress) => savedAddress.default) || initialAddress;
const inputClass = "mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black";

export default function Checkout() {
  const { items, cartId } = useCart();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("address");
  const [address, setAddress] = useState(() => JSON.parse(sessionStorage.getItem(ADDRESS_KEY) || "null") || getSavedDefaultAddress());
  const [payment, setPayment] = useState(() => sessionStorage.getItem(PAYMENT_KEY) || "card");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  if (!localStorage.getItem("token")) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent("/checkout")}`} replace />;
  }

  const updateAddress = (event) => {
    setAddress((current) => ({ ...current, [event.target.name]: event.target.value }));
    setErrors((current) => ({ ...current, [event.target.name]: "" }));
  };

  const continueToPayment = async (event) => {
    event.preventDefault();
    const nextErrors = validateAddressForm(address);
    setErrors(nextErrors);
    if (!isFormValid(address) || !cartId) return;
    setLoading(true);
    try {
      await cartService.validateInventory(cartId);
      sessionStorage.setItem(ADDRESS_KEY, JSON.stringify(sanitizeAddressData(address)));
      setStep("payment");
    } catch (error) {
      toast.error(error.response?.data?.message || "Some products are no longer available in the requested quantity.");
    } finally {
      setLoading(false);
    }
  };

  const startCheckout = async () => {
    if (!items.length || !cartId) {
      toast.error("Your Shopify cart is empty.");
      return;
    }

    setLoading(true);
    try {
      const cleanAddress = sanitizeAddressData(address);
      await cartService.checkout(cartId, cleanAddress);
      sessionStorage.setItem(ADDRESS_KEY, JSON.stringify(cleanAddress));
      sessionStorage.setItem(PAYMENT_KEY, payment);
      const { checkoutUrl } = await cartService.getCartCheckoutUrl(cartId);
      if (!checkoutUrl) throw new Error("Shopify checkout URL was not returned");
      window.location.assign(checkoutUrl);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-950">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-8 shadow-lg dark:bg-slate-900">
          <h1 className="mb-2 text-3xl font-bold dark:text-white">{step === "address" ? "Delivery Address" : "Payment Method"}</h1>
          <p className="mb-8 text-gray-500 dark:text-slate-400">{step === "address" ? "Enter your delivery details to continue." : "Shopify will show and process the payment methods available for this checkout."}</p>

          {step === "address" ? (
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={continueToPayment}>
              {[["name", "Full Name"], ["phone", "Mobile Number"], ["address1", "House / Flat / Building"], ["address2", "Street / Area"], ["landmark", "Landmark"], ["city", "City"], ["state", "State"], ["pincode", "Pincode"]].map(([name, label]) => (
                <label key={name} className="text-sm font-medium text-gray-700">
                  {label}
                    <input className={inputClass} name={name} value={address[name]} onChange={updateAddress} required={name !== "landmark"} inputMode={name === "phone" || name === "pincode" ? "numeric" : undefined} />
                  {errors[name] && <span className="mt-1 block text-xs text-red-600">{errors[name]}</span>}
                </label>
              ))}
              <button type="submit" disabled={loading || !items.length} className="sm:col-span-2 w-full rounded-xl bg-black px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-400">
                {loading ? "Checking stock..." : "Continue to Payment"}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <PaymentMethod selected={payment} onSelect={setPayment} />
              <p className="text-sm text-gray-500">Card, UPI, COD, and other payment options are ultimately controlled by Shopify checkout. No payment details are collected here.</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep("address")} className="w-1/3 rounded-xl border px-4 py-3 font-semibold">Back</button>
                <button type="button" onClick={startCheckout} disabled={loading || !items.length} className="w-2/3 rounded-xl bg-black px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-400">
                  {loading ? "Processing..." : "Continue to Shopify Checkout"}
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => navigate("/cart")}
            className="mt-3 w-full rounded-xl border px-6 py-3 font-semibold"
          >
            Back to cart
          </button>
        </section>
        <OrderSummary />
      </div>
    </div>
  );
}
