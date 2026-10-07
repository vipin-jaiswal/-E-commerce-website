import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import OrderSummary from "../components/checkout/OrderSummary";
import PaymentMethod from "../components/checkout/PaymentMethod";
import { useCart } from "../hooks/useCart";
import { cartService } from "../services/cartService";
import { isFormValid, normalizeIndianPhone, sanitizeAddressData, validateAddressForm } from "../utils/addressValidation";
import api from "../services/api";

const ADDRESS_KEY = "dyvaCheckoutAddress";
const PAYMENT_KEY = "dyvaCheckoutPayment";
const initialAddress = { name: "", phone: "", alternativePhone: "", address1: "", address2: "", landmark: "", city: "", state: "", pincode: "" };
const getSessionAddress = () => {
  const owner = localStorage.getItem("dyvaAddressOwner");
  if (!owner || localStorage.getItem("dyvaCheckoutAddressOwner") !== owner || sessionStorage.getItem("dyvaCheckoutAddressOwner") !== owner) return null;
  try { return JSON.parse(sessionStorage.getItem(ADDRESS_KEY) || "null"); } catch { return null; }
};
const getSavedDefaultAddress = () => {
  let record = null;
  try { record = JSON.parse(localStorage.getItem("dyvaSavedAddresses") || "null"); } catch { localStorage.removeItem("dyvaSavedAddresses"); }
  const owner = String(localStorage.getItem("dyvaAddressOwner") || "").toLowerCase();
  return record?.owner === owner ? record.addresses.find((savedAddress) => savedAddress.default) || initialAddress : initialAddress;
};
const inputClass = "mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

export default function Checkout() {
  const { items, cartId, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [codError, setCodError] = useState("");
  const [step, setStep] = useState("address");
  const [address, setAddress] = useState(() => getSessionAddress() || getSavedDefaultAddress());
  const [payment, setPayment] = useState(() => sessionStorage.getItem(PAYMENT_KEY) || "card");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  React.useEffect(() => {
    let active = true;
    api.get('/auth/me').then(({ data }) => {
      const customer = data?.data?.customer;
      const owner = String(customer?.id || customer?.email || '').toLowerCase();
      if (!active || !owner) return;
      const currentOwner = localStorage.getItem('dyvaCheckoutAddressOwner');
      if (currentOwner !== owner) {
        sessionStorage.removeItem(ADDRESS_KEY);
        sessionStorage.removeItem(PAYMENT_KEY);
        localStorage.removeItem(ADDRESS_KEY);
        const shopifyAddresses = customer.addresses?.nodes || [];
        const mappedAddresses = shopifyAddresses.map((savedAddress) => ({
          name: [savedAddress.firstName, savedAddress.lastName].filter(Boolean).join(" ") || [customer.firstName, customer.lastName].filter(Boolean).join(" "),
          phone: savedAddress.phone || customer.phone || "",
          alternativePhone: savedAddress.alternativePhone || "",
          address1: savedAddress.address1 || "",
          address2: savedAddress.address2 || "",
          landmark: "",
          city: savedAddress.city || "",
          state: savedAddress.province || "",
          pincode: savedAddress.zip || "",
          default: savedAddress.id === customer.defaultAddress?.id,
        }));
        if (mappedAddresses.length) {
          const addressRecord = { owner, addresses: mappedAddresses };
          localStorage.setItem("dyvaSavedAddresses", JSON.stringify(addressRecord));
          setAddress(mappedAddresses.find((item) => item.default) || mappedAddresses[0]);
        } else {
          setAddress(initialAddress);
        }
        setPayment('card');
      }
      localStorage.setItem('dyvaAddressOwner', owner);
      localStorage.setItem('dyvaCheckoutAddressOwner', owner);
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  const getActiveCartId = () => cartId || localStorage.getItem("shopifyCartId");
  const isValidCartId = (value) =>
    typeof value === "string" && value.startsWith("gid://shopify/Cart/");

  const handlePaymentSelect = (method) => {
    setPayment(method);
    sessionStorage.setItem(PAYMENT_KEY, method);
  };

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
    const activeCartId = getActiveCartId();
    if (!isFormValid(address) || !activeCartId) return;
    setLoading(true);
    try {
      await cartService.validateInventory(activeCartId);
      sessionStorage.setItem(ADDRESS_KEY, JSON.stringify(sanitizeAddressData(address)));
      sessionStorage.setItem("dyvaCheckoutAddressOwner", localStorage.getItem("dyvaAddressOwner") || "");
      setStep("payment");
    } catch (error) {
      toast.error(error.response?.data?.message || "Some products are no longer available in the requested quantity.");
    } finally {
      setLoading(false);
    }
  };

  const startCheckout = async () => {
    if (loading) return;
    setCodError("");
    const activeCartId = getActiveCartId();
    if (payment === "cod" && !isValidCartId(activeCartId)) {
      console.info(`[COD][frontend] cartId: ${activeCartId || null}`);
      toast.error("Your cart session has expired. Please refresh your cart and try again.");
      return;
    }
    if (!items.length || !activeCartId) {
      toast.error("Your Shopify cart is empty.");
      return;
    }

    setLoading(true);
    try {
      const cleanAddress = sanitizeAddressData(address);
      if (payment === "cod") {
        const normalizedPhone = normalizeIndianPhone(cleanAddress.phone);
        if (!normalizedPhone) {
          toast.error("Please enter a valid 10-digit Indian mobile number.");
          return;
        }
        const account = JSON.parse(localStorage.getItem("account") || "null");
        const nameParts = String(cleanAddress.name || "").trim().split(/\s+/).filter(Boolean);
        const payload = {
          cartId: activeCartId,
          customer: {
            firstName: nameParts.shift() || "",
            lastName: nameParts.join(" "),
            email: account?.email || "",
            phone: normalizedPhone,
          },
          shippingAddress: {
            address1: cleanAddress.address1,
            address2: [cleanAddress.address2, cleanAddress.landmark].filter(Boolean).join(", "),
            city: cleanAddress.city,
            state: cleanAddress.state,
            postalCode: cleanAddress.pincode,
            country: "IN",
            phone: normalizedPhone,
            alternativePhone: cleanAddress.alternativePhone || "",
          },
        };
        console.info(`[COD][frontend] cartId: ${activeCartId}`);
        console.info(`[COD] phone received: ******${normalizedPhone.slice(-4)}`);
        console.info(`[COD] COD request payload cartId: ${payload.cartId}`);
        const result = await cartService.createCodOrder(payload);
        const confirmed = result?.order;
        if (!result?.success || !confirmed?.id) {
          throw new Error(result?.message || "Unable to place your order. Please try again.");
        }
        sessionStorage.setItem(ADDRESS_KEY, JSON.stringify(cleanAddress));
        sessionStorage.setItem("dyvaCheckoutAddressOwner", localStorage.getItem("dyvaAddressOwner") || "");
        const confirmedOrder = {
          success: true,
          ...confirmed,
          id: confirmed.id,
          orderId: confirmed.orderId,
          orderNumber: confirmed.orderNumber,
          paymentStatus: confirmed.paymentStatus || "PENDING",
          fulfillmentStatus: confirmed.fulfillmentStatus || "UNFULFILLED",
          customerFacingStatus: "ORDERED",
        };
        sessionStorage.setItem("dyvaCodOrder", JSON.stringify(confirmedOrder));
        try {
          await clearCart();
        } catch {
          // The order is already confirmed; the next cart fetch will reconcile it.
        }
        navigate(`/order-success?orderId=${encodeURIComponent(confirmed.orderId)}`, { replace: true });
        return;
      }
      const checkout = await cartService.checkout(activeCartId, cleanAddress);
      sessionStorage.setItem(ADDRESS_KEY, JSON.stringify(cleanAddress));
      sessionStorage.setItem("dyvaCheckoutAddressOwner", localStorage.getItem("dyvaAddressOwner") || "");
      const { checkoutUrl, cartId: checkoutCartId } = checkout || {};
      if (!checkoutUrl) throw new Error("Shopify checkout URL was not returned");
      if (checkoutCartId && checkoutCartId !== activeCartId) {
        throw new Error("Shopify returned a checkout URL for a different cart");
      }
      const parsedCheckoutUrl = new URL(checkoutUrl);
      if (parsedCheckoutUrl.protocol !== "https:") {
        throw new Error("Shopify returned a checkout URL that does not use HTTPS");
      }
      window.location.assign(checkoutUrl);
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Unable to place your order. Please try again.";
      if (payment === "cod") setCodError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10 dark:bg-[#090909]">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
        <section className="ui-card p-8">
          <h1 className="mb-2 text-3xl font-bold dark:text-white">{step === "address" ? "Delivery Address" : "Payment Method"}</h1>
          <p className="mb-8 text-gray-500 dark:text-slate-400">{step === "address" ? "Enter your delivery details to continue." : "Shopify will show and process the payment methods available for this checkout."}</p>

          {step === "address" ? (
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={continueToPayment}>
              {[["name", "Full Name"], ["phone", "Mobile Number"], ["alternativePhone", "Alternative Mobile Number"], ["address1", "House / Flat / Building"], ["address2", "Street / Area"], ["landmark", "Landmark"], ["city", "City"], ["state", "State"], ["pincode", "Pincode"]].map(([name, label]) => (
                <label key={name} className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {label}
                    <input className={inputClass} name={name} value={address[name] || ""} onChange={updateAddress} required={name !== "landmark" && name !== "alternativePhone"} inputMode={name === "phone" || name === "alternativePhone" || name === "pincode" ? "numeric" : undefined} />
                  {errors[name] && <span className="mt-1 block text-xs text-red-600">{errors[name]}</span>}
                </label>
              ))}
              <button type="submit" disabled={loading || !items.length} className="ui-primary sm:col-span-2 w-full disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? "Checking stock..." : "Continue to Payment"}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <PaymentMethod selected={payment} onSelect={handlePaymentSelect} />
              <p className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                {payment === "cod"
                  ? "Your order will be created securely with Cash on Delivery. No online payment is required."
                  : "Shopify will show the final item total, discounts, shipping, and available payment methods before you place the order."}
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep("address")} className="w-1/3 rounded-xl border px-4 py-3 font-semibold">Back</button>
                <button type="button" onClick={startCheckout} disabled={loading || !items.length} className="ui-primary w-2/3 disabled:cursor-not-allowed disabled:opacity-50">
                  {loading ? payment === "cod" ? "Placing your order..." : "Processing..." : payment === "cod" ? "Place COD Order" : "Continue to Shopify Checkout"}
                </button>
              </div>
              {codError && payment === "cod" && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <p className="font-semibold">Order could not be placed</p>
                  <p className="mt-1">{codError}</p>
                </div>
              )}
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
