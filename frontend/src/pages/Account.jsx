import React, { useEffect, useMemo, useState } from "react";
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
  AlertCircle,
  Package,
  Plus,
  ExternalLink,
  Heart,
  Settings,
  ChevronRight,
  ArrowRight,
  CalendarDays,
  Box,
} from "lucide-react";

import api from "../services/api";
import { formatCurrency } from "../utils/currency";
import {
  isFormValid,
  sanitizeAddressData,
  validateAddressForm,
} from "../utils/addressValidation";

const ADDRESS_KEY = "dyvaSavedAddresses";
const WISHLIST_KEY = "lumiere_wishlist";

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

  // Profile
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState(() =>
    JSON.parse(localStorage.getItem(ADDRESS_KEY) || "[]")
  );
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [addressErrors, setAddressErrors] = useState({});

  // Password
  const [resetRequested, setResetRequested] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  // Wishlist
  const [wishlistCount, setWishlistCount] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]").length;
    } catch {
      return 0;
    }
  });

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
          name: [nextCustomer.firstName, nextCustomer.lastName]
            .filter(Boolean)
            .join(" "),
          phone: nextCustomer.phone || "",
        });

        const savedLocal = JSON.parse(
          localStorage.getItem(ADDRESS_KEY) || "[]"
        );

        if (!savedLocal.length && nextCustomer.addresses?.nodes?.length) {
          const shopifyAddresses = nextCustomer.addresses.nodes.map(
            (addr) => ({
              id: addr.id || crypto.randomUUID(),
              name:
                [addr.firstName, addr.lastName]
                  .filter(Boolean)
                  .join(" ") || displayName(nextCustomer),
              phone: addr.phone || nextCustomer.phone || "",
              address1: addr.address1 || "",
              address2: addr.address2 || "",
              landmark: "",
              city: addr.city || "",
              state: addr.province || "",
              pincode: addr.zip || "",
              type: "Home",
              default: addr.id === nextCustomer.defaultAddress?.id,
            })
          );

          setAddresses(shopifyAddresses);
          localStorage.setItem(
            ADDRESS_KEY,
            JSON.stringify(shopifyAddresses)
          );
        }
      })
      .catch((err) => {
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Session expired";

        setError(msg);
        localStorage.removeItem("token");

        navigate("/login?returnTo=/account", {
          replace: true,
        });
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const saveAddresses = (nextAddresses) => {
    setAddresses(nextAddresses);
    localStorage.setItem(
      ADDRESS_KEY,
      JSON.stringify(nextAddresses)
    );
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const response = await api.patch(
        "/auth/profile",
        profileForm
      );

      const updated = response.data?.data?.customer;

      if (updated) {
        setCustomer((prev) => ({
          ...prev,
          ...updated,
        }));
      }

      setEditingProfile(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Unable to update profile"
      );
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
    const isDefault =
      isFirst || Boolean(addressForm.default);

    let updatedList;

    if (editingAddressId) {
      updatedList = addresses.map((item) =>
        item.id === editingAddressId
          ? {
              ...cleaned,
              id: editingAddressId,
              default: isDefault,
            }
          : isDefault
          ? {
              ...item,
              default: false,
            }
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
        ? [
            ...addresses.map((a) => ({
              ...a,
              default: false,
            })),
            newEntry,
          ]
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

    if (
      next.length > 0 &&
      !next.some((a) => a.default)
    ) {
      next[0].default = true;
    }

    saveAddresses(next);
    toast.success("Address removed");
  };

  const handleSendResetLink = async () => {
    if (!customer?.email) return;

    setSendingReset(true);

    try {
      await api.post("/auth/forgot-password", {
        email: customer.email,
      });

      setResetRequested(true);

      toast.success(
        "Password reset instructions sent to your email"
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Unable to send password reset link"
      );
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

  const orders = customer?.orders?.nodes || [];

  const stats = useMemo(
    () => [
      {
        label: "Total Orders",
        value: orders.length,
        icon: Package,
      },
      {
        label: "Wishlist",
        value: wishlistCount,
        icon: Heart,
      },
      {
        label: "Saved Addresses",
        value: addresses.length,
        icon: MapPin,
      },
    ],
    [orders.length, wishlistCount, addresses.length]
  );

  if (loading) {
    return (
      <div className="account-dashboard min-h-[70vh] flex flex-col items-center justify-center bg-[#080808] px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-[#F52B87]" />

        <p className="mt-4 text-sm font-medium text-white/50">
          Loading your account...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="account-dashboard min-h-[70vh] flex flex-col items-center justify-center bg-[#080808] px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F52B87]/10">
          <AlertCircle
            size={32}
            className="text-[#F52B87]"
          />
        </div>

        <h2 className="mt-4 text-xl font-bold text-white">
          Account Error
        </h2>

        <p className="mt-2 text-sm text-white/50">
          {error}
        </p>

        <button
          onClick={() => navigate("/login")}
          className="mt-6 rounded-xl bg-[#F52B87] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ff3d93]"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="account-dashboard min-h-screen bg-[#080808] px-4 py-8 text-white transition-colors sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px]">

        {/* PAGE HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-white/35">
              <span>Home</span>
              <ChevronRight size={13} />
              <span className="text-[#F52B87]">
                Account
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              My{" "}
              <span className="text-[#F52B87]">
                Account
              </span>
            </h1>

            <p className="mt-2 text-sm text-white/45">
              Manage your profile, orders and preferences.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">

          {/* SIDEBAR */}
          <aside className="h-fit overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111111]">

            {/* Profile */}
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#F52B87] text-2xl font-bold text-white shadow-[0_0_30px_rgba(245,43,135,0.18)]">
                  {displayName(customer)
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-white">
                    {displayName(customer)}
                  </h2>

                  <p className="mt-1 truncate text-xs text-white/40">
                    {customer?.email ||
                      "No email"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("profile");
                  setEditingProfile(true);
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#F52B87] bg-transparent px-4 py-3 text-sm font-semibold text-[#F52B87] transition hover:bg-[#F52B87] hover:text-white"
              >
                <Edit3 size={15} />
                Edit Profile
              </button>
            </div>

            <div className="h-px bg-white/[0.06]" />

            {/* Navigation */}
            <div className="p-3">

              <SidebarButton
                active={activeTab === "profile"}
                icon={User}
                title="My Profile"
                subtitle="Personal information"
                onClick={() => setActiveTab("profile")}
              />

              <SidebarButton
                active={activeTab === "orders"}
                icon={ShoppingBag}
                title="My Orders"
                subtitle="Track your orders"
                onClick={() => setActiveTab("orders")}
              />

              <SidebarButton
                active={false}
                icon={Heart}
                title="Wishlist"
                subtitle={`${wishlistCount} saved products`}
                onClick={() => navigate("/wishlist")}
              />

              <SidebarButton
                active={activeTab === "addresses"}
                icon={MapPin}
                title="Addresses"
                subtitle="Manage delivery addresses"
                onClick={() =>
                  setActiveTab("addresses")
                }
              />

              <SidebarButton
                active={false}
                icon={Settings}
                title="Account Settings"
                subtitle="Password & preferences"
                onClick={() =>
                  setActiveTab("profile")
                }
              />
            </div>

            <div className="mx-5 h-px bg-white/[0.06]" />

            {/* Logout */}
            <div className="p-5">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#F52B87] transition hover:bg-[#F52B87]/10"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </aside>

          {/* MAIN */}
          <main className="min-w-0">

            {/* WELCOME BANNER */}
            <section className="relative mb-5 overflow-hidden rounded-3xl border border-[#F52B87]/25 bg-[#180d14]">

              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#F52B87]/10 blur-3xl" />

              <div className="absolute -bottom-28 right-20 h-72 w-72 rounded-full bg-[#F52B87]/5 blur-3xl" />

              <div className="relative z-10 p-7 sm:p-9">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#F52B87]">
                  Welcome Back 👋
                </p>

                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                  Hello,{" "}
                  <span className="text-[#F52B87]">
                    {displayName(customer)
                      .split(" ")[0]}
                  </span>
                  !
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">
                  Check your recent orders, manage your
                  account and discover something new from
                  DYVA.
                </p>

                <Link
                  to="/products"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#F52B87] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ff3d93]"
                >
                  Continue Shopping
                  <ArrowRight size={17} />
                </Link>
              </div>
            </section>

            {/* STATS */}
            <div className="mb-5 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/[0.08] bg-[#111111] p-5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#F52B87]/10">
                        <Icon
                          size={24}
                          className="text-[#F52B87]"
                        />
                      </div>

                      <div>
                        <p className="text-xs text-white/40">
                          {stat.label}
                        </p>

                        <p className="mt-1 text-2xl font-bold text-white">
                          {stat.value}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PROFILE */}
            {activeTab === "profile" && (
              <div className="grid gap-5 md:grid-cols-2">

                {/* Personal Details */}
                <section className="rounded-3xl border border-white/[0.08] bg-[#111111] p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Personal Details
                      </h2>

                      <p className="mt-1 text-xs text-white/40">
                        Manage your account information
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingProfile(
                          (prev) => !prev
                        )
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-[#F52B87] hover:text-[#F52B87]"
                    >
                      <Edit3 size={13} />
                      {editingProfile
                        ? "Cancel"
                        : "Edit"}
                    </button>
                  </div>

                  {editingProfile ? (
                    <form
                      onSubmit={handleProfileSubmit}
                      className="mt-6 space-y-4"
                    >
                      <label className="block text-sm font-medium text-white/70">
                        Full Name

                        <input
                          type="text"
                          value={profileForm.name}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              name: e.target.value,
                            })
                          }
                          required
                          className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-white outline-none transition focus:border-[#F52B87]"
                        />
                      </label>

                      <label className="block text-sm font-medium text-white/70">
                        Mobile Number

                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              phone: e.target.value,
                            })
                          }
                          placeholder="+91"
                          className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-white outline-none transition focus:border-[#F52B87]"
                        />
                      </label>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={savingProfile}
                          className="rounded-xl bg-[#F52B87] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ff3d93] disabled:opacity-50"
                        >
                          {savingProfile
                            ? "Saving..."
                            : "Save Changes"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setEditingProfile(false)
                          }
                          className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/5"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-6 divide-y divide-white/[0.06]">
                      <InfoRow
                        label="Full Name"
                        value={displayName(customer)}
                      />

                      <InfoRow
                        label="Email Address"
                        value={
                          customer?.email ||
                          "Not specified"
                        }
                      />

                      <InfoRow
                        label="Phone Number"
                        value={
                          customer?.phone ||
                          "Not specified"
                        }
                      />
                    </div>
                  )}
                </section>

                {/* Security */}
                <section className="rounded-3xl border border-white/[0.08] bg-[#111111] p-6 sm:p-7">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F52B87]/10">
                      <KeyRound
                        size={20}
                        className="text-[#F52B87]"
                      />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Password & Security
                      </h2>

                      <p className="text-xs text-white/40">
                        Shopify account credentials
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <p className="text-sm leading-6 text-white/50">
                      Your account is secured via Shopify
                      Storefront authentication. If you need
                      to change or reset your password, you can
                      request a secure reset link.
                    </p>

                    {resetRequested ? (
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            size={18}
                            className="text-emerald-400"
                          />

                          <p className="text-sm font-semibold text-emerald-400">
                            Reset Link Sent
                          </p>
                        </div>

                        <p className="mt-2 text-xs leading-5 text-emerald-400/70">
                          Please check your inbox at{" "}
                          <strong>
                            {customer?.email}
                          </strong>{" "}
                          and follow the link to choose a new
                          password.
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendResetLink}
                        disabled={sendingReset}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#F52B87] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ff3d93] disabled:opacity-50"
                      >
                        <KeyRound size={16} />

                        {sendingReset
                          ? "Sending link..."
                          : "Request Password Reset"}
                      </button>
                    )}

                    <div className="border-t border-white/[0.06] pt-4">
                      <Link
                        to="/forgot-password"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 transition hover:text-[#F52B87]"
                      >
                        Forgot password page
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ORDERS */}
            {activeTab === "orders" && (
              <section className="rounded-3xl border border-white/[0.08] bg-[#111111] p-6 sm:p-7">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Recent Orders
                    </h2>

                    <p className="mt-1 text-xs text-white/40">
                      Your latest purchases
                    </p>
                  </div>

                  <Link
                    to="/products"
                    className="flex items-center gap-1 text-xs font-semibold text-[#F52B87]"
                  >
                    Browse Products
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {orders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
                    <Package
                      size={38}
                      className="mx-auto text-white/20"
                    />

                    <h3 className="mt-4 font-semibold text-white">
                      No orders yet
                    </h3>

                    <p className="mt-2 text-sm text-white/40">
                      When you place an order, it will appear
                      here.
                    </p>

                    <Link
                      to="/products"
                      className="mt-6 inline-flex rounded-xl bg-[#F52B87] px-6 py-3 text-sm font-semibold text-white"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => {
                      const isFulfilled =
                        String(
                          order.fulfillmentStatus
                        ).toUpperCase() === "FULFILLED";

                      const isPaid =
                        String(
                          order.financialStatus
                        ).toUpperCase() === "PAID";

                      return (
                        <article
                          key={order.id}
                          className="rounded-2xl border border-white/[0.07] bg-[#0d0d0d] p-4 transition hover:border-[#F52B87]/30 sm:p-5"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-4">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F52B87]/10">
                                <Box
                                  size={21}
                                  className="text-[#F52B87]"
                                />
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-white">
                                    #{order.orderNumber}
                                  </span>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                      isFulfilled
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : "bg-yellow-500/10 text-yellow-400"
                                    }`}
                                  >
                                    {order.fulfillmentStatus ||
                                      "Processing"}
                                  </span>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                      isPaid
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : "bg-white/5 text-white/40"
                                    }`}
                                  >
                                    {order.financialStatus ||
                                      "Payment Pending"}
                                  </span>
                                </div>

                                <p className="mt-1 flex items-center gap-1.5 text-xs text-white/35">
                                  <CalendarDays size={12} />

                                  {new Date(
                                    order.processedAt
                                  ).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="sm:text-right">
                              <span className="text-[10px] uppercase tracking-wider text-white/30">
                                Total
                              </span>

                              <p className="mt-1 text-lg font-bold text-white">
                                {formatCurrency(
                                  Number(
                                    order.currentTotalPrice
                                      ?.amount || 0
                                  )
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 border-t border-white/[0.06] pt-4">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                              Items
                            </p>

                            <div className="space-y-1.5">
                              {order.lineItems?.nodes?.map(
                                (item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between text-sm text-white/55"
                                  >
                                    <span>
                                      {item.title}{" "}
                                      <span className="text-white/25">
                                        × {item.quantity}
                                      </span>
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* ADDRESSES */}
            {activeTab === "addresses" && (
              <section className="rounded-3xl border border-white/[0.08] bg-[#111111] p-6 sm:p-7">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Delivery Addresses
                    </h2>

                    <p className="mt-1 text-xs text-white/40">
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
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#F52B87] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#ff3d93]"
                    >
                      <Plus size={14} />
                      Add Address
                    </button>
                  )}
                </div>

                {showAddressForm && (
                  <form
                    onSubmit={handleAddressSubmit}
                    className="mb-8 rounded-2xl border border-white/[0.08] bg-[#0b0b0b] p-5 sm:p-6"
                  >
                    <h3 className="mb-5 text-base font-bold text-white">
                      {editingAddressId
                        ? "Edit Delivery Address"
                        : "Add New Delivery Address"}
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        ["name", "Full Name"],
                        ["phone", "Mobile Number"],
                        [
                          "address1",
                          "House / Flat / Building",
                        ],
                        ["address2", "Street / Area"],
                        [
                          "landmark",
                          "Landmark (Optional)",
                        ],
                        ["city", "City"],
                        ["state", "State"],
                        ["pincode", "PIN Code"],
                      ].map(([key, label]) => (
                        <label
                          key={key}
                          className="block text-sm font-medium text-white/60"
                        >
                          {label}

                          <input
                            className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none transition focus:border-[#F52B87]"
                            value={
                              addressForm[key] || ""
                            }
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                [key]: e.target.value,
                              })
                            }
                            required={
                              key !== "landmark"
                            }
                            inputMode={
                              key === "phone" ||
                              key === "pincode"
                                ? "numeric"
                                : undefined
                            }
                          />

                          {addressErrors[key] && (
                            <span className="mt-1 block text-xs text-red-400">
                              {addressErrors[key]}
                            </span>
                          )}
                        </label>
                      ))}

                      <label className="block text-sm font-medium text-white/60">
                        Address Type

                        <select
                          className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#F52B87]"
                          value={addressForm.type}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              type: e.target.value,
                            })
                          }
                        >
                          <option>Home</option>
                          <option>Work</option>
                        </select>
                      </label>

                      <div className="flex items-center pt-2 sm:col-span-2">
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-white/60">
                          <input
                            type="checkbox"
                            checked={Boolean(
                              addressForm.default
                            )}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                default:
                                  e.target.checked,
                              })
                            }
                            className="h-4 w-4 accent-[#F52B87]"
                          />

                          Set as default delivery address
                        </label>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        type="submit"
                        className="rounded-xl bg-[#F52B87] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ff3d93]"
                      >
                        Save Address
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowAddressForm(false);
                          setEditingAddressId(null);
                        }}
                        className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/60 transition hover:bg-white/5"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {addresses.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                    <MapPin
                      size={35}
                      className="mx-auto text-white/20"
                    />

                    <p className="mt-3 text-sm text-white/40">
                      No delivery addresses added yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {addresses.map((item) => (
                      <div
                        key={item.id}
                        className="relative rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-5 transition hover:border-[#F52B87]/30"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">
                              {item.type ||
                                "Address"}
                            </span>

                            {item.default && (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-400">
                                Default
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs">
                            <button
                              type="button"
                              onClick={() =>
                                startEditAddress(item)
                              }
                              className="font-medium text-white/50 transition hover:text-[#F52B87]"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteAddress(item.id)
                              }
                              className="font-medium text-red-400 transition hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-white/50">
                          <strong className="text-white/80">
                            {item.name}
                          </strong>{" "}
                          · {item.phone}
                          <br />
                          {item.address1}
                          {item.address2
                            ? `, ${item.address2}`
                            : ""}
                          {item.landmark
                            ? ` (${item.landmark})`
                            : ""}
                          <br />
                          {item.city}, {item.state} -{" "}
                          {item.pincode}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------
   Small UI Components
----------------------------- */

function SidebarButton({
  active,
  icon: Icon,
  title,
  subtitle,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left transition ${
        active
          ? "bg-[#F52B87]/10 text-white"
          : "text-white/65 hover:bg-white/[0.035] hover:text-white"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#F52B87]" />
      )}

      <Icon
        size={20}
        className={`shrink-0 ${
          active
            ? "text-[#F52B87]"
            : "text-white/45 group-hover:text-[#F52B87]"
        }`}
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {title}
        </p>

        <p className="mt-0.5 truncate text-[11px] text-white/35">
          {subtitle}
        </p>
      </div>

      <ChevronRight
        size={15}
        className={`shrink-0 ${
          active
            ? "text-[#F52B87]"
            : "text-white/20"
        }`}
      />
    </button>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
        {label}
      </span>

      <p className="mt-1.5 text-sm font-medium text-white/80">
        {value}
      </p>
    </div>
  );
}
