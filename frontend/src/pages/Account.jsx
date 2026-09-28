import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { isFormValid, sanitizeAddressData, validateAddressForm } from "../utils/addressValidation";

const ADDRESS_KEY = "dyvaSavedAddresses";
const emptyAddress = { name: "", phone: "", address1: "", address2: "", landmark: "", city: "", state: "", pincode: "", type: "Home" };
const displayName = (customer) => [customer?.firstName, customer?.lastName].filter(Boolean).join(" ") || customer?.email || "";

export default function Account() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [addresses, setAddresses] = useState(() => JSON.parse(localStorage.getItem(ADDRESS_KEY) || "[]"));
  const [editingAddress, setEditingAddress] = useState(null);
  const [address, setAddress] = useState(emptyAddress);
  const [addressErrors, setAddressErrors] = useState({});

  useEffect(() => {
    api.get("/auth/me")
      .then((response) => {
        const nextCustomer = response.data?.data?.customer;
        setCustomer(nextCustomer);
        setProfile({ name: displayName(nextCustomer), phone: nextCustomer?.phone || "" });
        if (!addresses.length && nextCustomer?.addresses?.nodes?.length) {
          setAddresses(nextCustomer.addresses.nodes.map((savedAddress) => ({
            ...savedAddress,
            name: [savedAddress.firstName, savedAddress.lastName].filter(Boolean).join(" "),
            state: savedAddress.province,
            pincode: savedAddress.zip,
            type: "Home",
            default: savedAddress.id === nextCustomer.defaultAddress?.id,
          })));
        }
      })
      .catch(() => navigate("/login?returnTo=/account", { replace: true }))
      .finally(() => setLoading(false));
  }, [navigate]);

  const saveAddresses = (nextAddresses) => {
    setAddresses(nextAddresses);
    localStorage.setItem(ADDRESS_KEY, JSON.stringify(nextAddresses));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      const response = await api.patch("/auth/profile", profile);
      setCustomer(response.data?.data?.customer);
      setEditingProfile(false);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update profile");
    }
  };

  const submitAddress = (event) => {
    event.preventDefault();
    const errors = validateAddressForm(address);
    setAddressErrors(errors);
    if (!isFormValid(address)) return;
    const next = { ...sanitizeAddressData(address), id: editingAddress || crypto.randomUUID(), default: addresses.length === 0 || address.default };
    const nextAddresses = editingAddress ? addresses.map((item) => item.id === editingAddress ? next : item) : [...addresses, next];
    saveAddresses(nextAddresses.map((item) => item.id === next.id ? { ...item, default: next.default } : next.default ? { ...item, default: false } : item));
    setAddress(emptyAddress);
    setEditingAddress(null);
    setAddressErrors({});
  };

  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("account"); navigate("/login"); };
  if (loading) return <div className="min-h-screen px-6 py-16 text-center">Loading account...</div>;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-950">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">My account</p><h1 className="mt-3 text-3xl font-bold dark:text-white">Profile and preferences</h1></div><button type="button" onClick={logout} className="rounded-xl border border-gray-300 px-5 py-3 font-semibold">Logout</button></div>
        <section className="rounded-3xl bg-white p-8 shadow-lg dark:bg-slate-900"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold dark:text-white">Profile</h2><button type="button" onClick={() => setEditingProfile((value) => !value)} className="rounded-xl border px-4 py-2 text-sm font-semibold">{editingProfile ? "Cancel" : "Edit Profile"}</button></div>
          {editingProfile ? <form onSubmit={saveProfile} className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Full Name<input className="mt-1 w-full rounded-xl border px-4 py-3" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} required /></label><label className="text-sm font-medium">Mobile Number<input className="mt-1 w-full rounded-xl border px-4 py-3" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} inputMode="numeric" /></label><button className="rounded-xl bg-black px-5 py-3 font-semibold text-white sm:col-span-2">Save Changes</button></form> : <div className="mt-6 grid gap-5 sm:grid-cols-2"><Info label="Full Name" value={displayName(customer) || "Not added"} /><Info label="Email" value={customer?.email || "Not added"} /><Info label="Mobile Number" value={customer?.phone || "Not added"} /><Info label="Account Status" value="Active" /></div>}
        </section>
        <section className="rounded-3xl bg-white p-8 shadow-lg dark:bg-slate-900"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold dark:text-white">Delivery Address</h2><button type="button" onClick={() => { setAddress(emptyAddress); setEditingAddress(false); }} className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">+ Add Address</button></div>
          {!addresses.length && <p className="mt-6 text-gray-500">No delivery address added yet.</p>}
          <div className="mt-6 grid gap-4 md:grid-cols-2">{addresses.map((item) => <AddressCard key={item.id} address={item} onEdit={() => { setAddress(item); setEditingAddress(item.id); }} onDelete={() => saveAddresses(addresses.filter((saved) => saved.id !== item.id))} />)}</div>
          {editingAddress !== null && <form onSubmit={submitAddress} className="mt-8 grid gap-4 border-t pt-8 sm:grid-cols-2">{[["name", "Full Name"], ["phone", "Mobile Number"], ["address1", "House / Flat / Building"], ["address2", "Street / Area"], ["landmark", "Landmark"], ["city", "City"], ["state", "State"], ["pincode", "Pincode"]].map(([key, label]) => <label key={key} className="text-sm font-medium">{label}<input className="mt-1 w-full rounded-xl border px-4 py-3" value={address[key] || ""} onChange={(event) => setAddress({ ...address, [key]: event.target.value })} required={key !== "landmark"} />{addressErrors[key] && <span className="text-xs text-red-600">{addressErrors[key]}</span>}</label>)}<label className="text-sm font-medium">Address Type<select className="mt-1 w-full rounded-xl border px-4 py-3" value={address.type} onChange={(event) => setAddress({ ...address, type: event.target.value })}><option>Home</option><option>Work</option></select></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(address.default)} onChange={(event) => setAddress({ ...address, default: event.target.checked })} /> Use this as my default delivery address</label><div className="flex gap-3 sm:col-span-2"><button className="rounded-xl bg-black px-5 py-3 font-semibold text-white">Save Address</button><button type="button" onClick={() => { setAddress(emptyAddress); setEditingAddress(null); }} className="rounded-xl border px-5 py-3 font-semibold">Cancel</button></div></form>}
        </section>
        <section className="rounded-3xl bg-white p-8 shadow-lg dark:bg-slate-900"><h2 className="text-xl font-bold dark:text-white">My Orders</h2>{!customer?.orders?.nodes?.length ? <div className="mt-5"><p className="text-gray-500">You haven&apos;t placed any orders yet.</p><Link to="/products" className="mt-4 inline-block rounded-xl bg-black px-5 py-3 font-semibold text-white">Start Shopping</Link></div> : <div className="mt-5 space-y-4">{customer.orders.nodes.map((order) => <div key={order.id} className="rounded-2xl border p-4"><div className="flex justify-between gap-3"><strong>Order #{order.orderNumber}</strong><span>{order.currentTotalPrice?.currencyCode} {order.currentTotalPrice?.amount}</span></div><p className="mt-2 text-sm text-gray-500">{new Date(order.processedAt).toLocaleDateString()} · {order.fulfillmentStatus || order.financialStatus || "Order Placed"}</p>{order.lineItems?.nodes?.map((line) => <p key={`${order.id}-${line.title}`} className="mt-2 text-sm">{line.title} × {line.quantity}</p>)}</div>)}</div>}</section>
      </div>
    </div>
  );
}

function Info({ label, value }) { return <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p><p className="mt-1 dark:text-white">{value}</p></div>; }
function AddressCard({ address, onEdit, onDelete }) { return <div className="rounded-2xl border p-5"><div className="flex justify-between gap-3"><strong>{address.type} {address.default && <span className="ml-2 text-xs text-green-600">Default</span>}</strong><div className="flex gap-3 text-sm"><button type="button" onClick={onEdit} className="underline">Edit</button><button type="button" onClick={onDelete} className="text-red-600 underline">Delete</button></div></div><p className="mt-3 text-sm leading-6 text-gray-600">{address.name} · {address.phone}<br />{address.address1}, {address.address2}{address.landmark ? `, ${address.landmark}` : ""}<br />{address.city}, {address.state} {address.pincode}</p></div>; }
