import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Phone,
  ShoppingBag,
  MapPin,
  KeyRound,
  LogOut,
  Edit3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  Plus,
  ExternalLink,
} from "lucide-react";
import api from "../services/api";
import { formatCurrency } from "../utils/currency";
import { isFormValid, sanitizeAddressData, validateAddressForm } from "../utils/addressValidation";

const ADDRESS_KEY = "dyvaSavedAddresses";
const emptyAddress = {
  name: "",
  phone: "",
  address1: "",
  address2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  type: "Home",
  default: false,
};

const displayName = (customer) =>
  [customer?.firstName, customer?.lastName].filter(Boolean).join(" ") ||
  customer?.displayName ||
  customer?.email?.split("@")[0] ||
  "Member";

export default function Account() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Profile Edit State
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // Address State
  const [addresses, setAddresses] = useState(() =>
    JSON.parse(localStorage.getItem(ADDRESS_KEY) || "[]")
  );
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [addressErrors, setAddressErrors] = useState({});

  // Password Recovery inside Account
  const [resetRequested, setResetRequested] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login?returnTo=/account", { replace: true });
      return;
    }

    setLoading(true);
    api
      .get("/auth/me")
      .then((response) => {
        const nextCustomer = response.data?.data?.customer;
        if (!nextCustomer) {
          throw new Error("Unable to retrieve customer profile");
        }
        setCustomer(nextCustomer);
        setProfileForm({
          name: [nextCustomer.firstName, nextCustomer.lastName].filter(Boolean).join(" "),
          phone: nextCustomer.phone || "",
        });

        // Initialize addresses from Shopify default/saved if local is empty
        const savedLocal = JSON.parse(localStorage.getItem(ADDRESS_KEY) || "[]");
        if (!savedLocal.length && nextCustomer.addresses?.nodes?.length) {
          const shopifyAddresses = nextCustomer.addresses.nodes.map((addr) => ({
            id: addr.id || crypto.randomUUID(),
            name: [addr.firstName, addr.lastName].filter(Boolean).join(" ") || displayName(nextCustomer),
            phone: addr.phone || nextCustomer.phone || "",
            address1: addr.address1 || "",
            address2: addr.address2 || "",
            landmark: "",
            city: addr.city || "",
            state: addr.province || "",
            pincode: addr.zip || "",
            type: "Home",
            default: addr.id === nextCustomer.defaultAddress?.id,
          }));
          setAddresses(shopifyAddresses);
          localStorage.setItem(ADDRESS_KEY, JSON.stringify(shopifyAddresses));
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || err.message || "Session expired";
        setError(msg);
        localStorage.removeItem("token");
        navigate("/login?returnTo=/account", { replace: true });
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const saveAddresses = (nextAddresses) => {
    setAddresses(nextAddresses);
    localStorage.setItem(ADDRESS_KEY, JSON.stringify(nextAddresses));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const response = await api.patch("/auth/profile", profileForm);
      const updated = response.data?.data?.customer;
      if (updated) {
        setCustomer((prev) => ({ ...prev, ...updated }));
      }
      setEditingProfile(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    const errors = validateAddressForm(addressForm);
    setAddressErrors(errors);
    if (!isFormValid(addressForm)) return;

    const cleaned = sanitizeAddressData(addressForm);
    const isFirst = addresses.length === 0;
    const isDefault = isFirst || Boolean(addressForm.default);

    let updatedList;
    if (editingAddressId) {
      updatedList = addresses.map((item) =>
        item.id === editingAddressId
          ? { ...cleaned, id: editingAddressId, default: isDefault }
          : isDefault
          ? { ...item, default: false }
          : item
      );
      toast.success("Address updated");
    } else {
      const newEntry = {
        ...cleaned,
        id: crypto.randomUUID(),
        default: isDefault,
      };
      updatedList = isDefault
        ? [...addresses.map((a) => ({ ...a, default: false })), newEntry]
        : [...addresses, newEntry];
      toast.success("New address added");
    }

    saveAddresses(updatedList);
    setAddressForm(emptyAddress);
    setEditingAddressId(null);
    setShowAddressForm(false);
    setAddressErrors({});
  };

  const startEditAddress = (addr) => {
    setAddressForm(addr);
    setEditingAddressId(addr.id);
    setShowAddressForm(true);
  };

  const deleteAddress = (id) => {
    const next = addresses.filter((a) => a.id !== id);
    if (next.length > 0 && !next.some((a) => a.default)) {
      next[0].default = true;
    }
    saveAddresses(next);
    toast.success("Address removed");
  };

  const handleSendResetLink = async () => {
    if (!customer?.email) return;
    setSendingReset(true);
    try {
      await api.post("/auth/forgot-password", { email: customer.email });
      setResetRequested(true);
      toast.success("Password reset instructions sent to your email");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to send password reset link");
    } finally {
      setSendingReset(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("account");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-black dark:border-slate-800 dark:border-t-white" />
        <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
          Loading your account...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <AlertCircle size={40} className="text-red-500" />
        <h2 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-100">
          Account Error
        </h2>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
        <button
          onClick={() => navigate("/login")}
          className="mt-6 rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white"
        >
          Sign In
        </button>
      </div>
    );
  }

  const orders = customer?.orders?.nodes || [];

  return (
    <div className="min-h-screen bg-white py-10 px-4 sm:px-6 lg:px-8 dark:bg-[#090909] transition-colors">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Top Header Card */}
        <section className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-white/10 dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-2xl font-bold text-white shadow-md dark:bg-white dark:text-black">
                {displayName(customer).charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {displayName(customer)}
                  </h1>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Active
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} />
                    {customer?.email || "No email"}
                  </span>
                  {customer?.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={14} />
                      {customer.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-red-600 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-red-400 transition"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-8 flex gap-2 border-t border-slate-100 pt-6 dark:border-white/5 overflow-x-auto">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === "profile"
                  ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                  : "text-slate-600 hover:text-black dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <User size={16} />
              Profile Details
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === "orders"
                  ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                  : "text-slate-600 hover:text-black dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <ShoppingBag size={16} />
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("addresses")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === "addresses"
                  ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                  : "text-slate-600 hover:text-black dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <MapPin size={16} />
              Saved Addresses ({addresses.length})
            </button>
          </div>
        </section>

        {/* TAB 1: Profile & Security */}
        {activeTab === "profile" && (
          <div className="grid gap-8 md:grid-cols-2">
            
            {/* Profile Info Card */}
            <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-white/10 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Personal Details
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Manage your account information</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProfile((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold hover:border-black dark:border-slate-800 dark:hover:border-slate-500 transition"
                >
                  <Edit3 size={14} />
                  {editingProfile ? "Cancel" : "Edit"}
                </button>
              </div>

              {editingProfile ? (
                <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Full Name
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-black dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Mobile Number
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+91"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-black dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </label>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-black"
                    >
                      {savingProfile ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProfile(false)}
                      className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold dark:border-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-6 divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="py-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Full Name
                    </span>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {displayName(customer)}
                    </p>
                  </div>
                  <div className="py-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Email Address
                    </span>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {customer?.email || "Not specified"}
                    </p>
                  </div>
                  <div className="py-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Phone Number
                    </span>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {customer?.phone || "Not specified"}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Password & Security Card */}
            <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-white/10 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Password & Security
                  </h2>
                  <p className="text-xs text-slate-500">Shopify account credentials</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your account is secured via Shopify Storefront authentication. If you need to change or reset your password, you can request a secure reset link.
                </p>

                {resetRequested ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-600" />
                      <p className="text-sm font-semibold">Reset Link Sent</p>
                    </div>
                    <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-300/80">
                      Please check your inbox at <strong>{customer?.email}</strong> and follow the link to choose a new password.
                    </p>
                  </div>
                ) : (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSendResetLink}
                      disabled={sendingReset}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
                    >
                      <KeyRound size={16} />
                      {sendingReset ? "Sending link..." : "Request Password Reset Link"}
                    </button>
                  </div>
                )}

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <Link
                    to="/forgot-password"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 underline underline-offset-4 hover:text-black dark:hover:text-white"
                  >
                    Forgot password page
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* TAB 2: Order History */}
        {activeTab === "orders" && (
          <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Order History
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  View your past purchases and delivery statuses
                </p>
              </div>
              <Link
                to="/products"
                className="text-xs font-semibold underline underline-offset-4 text-slate-900 dark:text-white"
              >
                Browse Products
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
                <Package size={36} className="mx-auto text-slate-400" />
                <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
                  No orders yet
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  When you place an order, it will appear here with live tracking and fulfillment details.
                </p>
                <Link
                  to="/products"
                  className="mt-6 inline-block rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const isFulfilled =
                    String(order.fulfillmentStatus).toUpperCase() === "FULFILLED";
                  const isPaid =
                    String(order.financialStatus).toUpperCase() === "PAID";

                  return (
                    <article
                      key={order.id}
                      className="rounded-2xl border border-slate-200/80 p-5 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-base text-slate-900 dark:text-white">
                              Order #{order.orderNumber}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                isFulfilled
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                              }`}
                            >
                              {order.fulfillmentStatus || "Processing"}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                isPaid
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                              }`}
                            >
                              {order.financialStatus || "Payment Pending"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            Placed on {new Date(order.processedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-xs uppercase text-slate-400">Total</span>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">
                            {formatCurrency(Number(order.currentTotalPrice?.amount || 0))}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                          Items
                        </p>
                        <div className="space-y-1.5">
                          {order.lineItems?.nodes?.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300"
                            >
                              <span>
                                {item.title} <span className="text-slate-400">× {item.quantity}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: Saved Addresses */}
        {activeTab === "addresses" && (
          <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Delivery Addresses
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage addresses used during checkout
                </p>
              </div>
              {!showAddressForm && (
                <button
                  type="button"
                  onClick={() => {
                    setAddressForm(emptyAddress);
                    setEditingAddressId(null);
                    setShowAddressForm(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-black transition"
                >
                  <Plus size={14} />
                  Add Address
                </button>
              )}
            </div>

            {showAddressForm && (
              <form
                onSubmit={handleAddressSubmit}
                className="mb-8 rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
                  {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["name", "Full Name"],
                    ["phone", "Mobile Number"],
                    ["address1", "House / Flat / Building"],
                    ["address2", "Street / Area"],
                    ["landmark", "Landmark (Optional)"],
                    ["city", "City"],
                    ["state", "State"],
                    ["pincode", "PIN Code"],
                  ].map(([key, label]) => (
                    <label key={key} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {label}
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-black dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        value={addressForm[key] || ""}
                        onChange={(e) => setAddressForm({ ...addressForm, [key]: e.target.value })}
                        required={key !== "landmark"}
                        inputMode={key === "phone" || key === "pincode" ? "numeric" : undefined}
                      />
                      {addressErrors[key] && (
                        <span className="text-xs text-red-600 mt-1 block">{addressErrors[key]}</span>
                      )}
                    </label>
                  ))}

                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Address Type
                    <select
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-black dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                      value={addressForm.type}
                      onChange={(e) => setAddressForm({ ...addressForm, type: e.target.value })}
                    >
                      <option>Home</option>
                      <option>Work</option>
                    </select>
                  </label>

                  <div className="flex items-center sm:col-span-2 pt-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(addressForm.default)}
                        onChange={(e) => setAddressForm({ ...addressForm, default: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      Set as default delivery address
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-black"
                  >
                    Save Address
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddressId(null);
                    }}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold dark:border-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {addresses.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                No delivery addresses added yet. Add one to speed up checkout.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {addresses.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800 bg-white dark:bg-slate-900 relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {item.type || "Address"}
                        </span>
                        {item.default && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => startEditAddress(item)}
                          className="font-medium text-slate-700 underline dark:text-slate-300"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAddress(item.id)}
                          className="font-medium text-red-600 underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      <strong>{item.name}</strong> · {item.phone}
                      <br />
                      {item.address1}
                      {item.address2 ? `, ${item.address2}` : ""}
                      {item.landmark ? ` (${item.landmark})` : ""}
                      <br />
                      {item.city}, {item.state} - {item.pincode}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
