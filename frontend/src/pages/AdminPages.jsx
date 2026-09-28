import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../services/api";

export function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/admin/login", form);
      setForm((current) => ({ ...current, password: "" }));
      navigate("/admin", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Admin login failed.");
    } finally { setLoading(false); }
  };
  return <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4"><form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">DYVA Admin</p><h1 className="mt-3 text-3xl font-bold">Admin Login</h1><div className="mt-8 space-y-4"><label className="block text-sm font-medium">Admin Email<input className="mt-1 w-full rounded-xl border px-4 py-3" type="email" autoComplete="username" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label><label className="block text-sm font-medium">Password<input className="mt-1 w-full rounded-xl border px-4 py-3" type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label>{error && <p className="text-sm text-red-600">{error}</p>}<button className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:opacity-60" disabled={loading}>{loading ? "Signing in..." : "Login"}</button></div></form></div>;
}

export function AdminProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => {
    api.get("/admin/me")
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false))
      .finally(() => setChecking(false));
  }, []);
  if (checking) return <div className="min-h-screen p-10 text-center">Checking admin session...</div>;
  return authenticated ? children : <Navigate to="/admin/login" replace />;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [overview, setOverview] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([api.get("/admin/me"), api.get("/admin/overview")])
      .then(([meResponse, overviewResponse]) => {
        setAdmin(meResponse.data?.admin);
        setOverview(overviewResponse.data?.data);
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load Shopify admin data."))
      .finally(() => setChecking(false));
  }, []);
  const logout = async () => {
    try { await api.post("/admin/logout"); } finally { navigate("/admin/login", { replace: true }); }
  };
  if (checking) return <div className="min-h-screen p-10 text-center">Checking admin session...</div>;
  if (error) return <div className="min-h-screen p-10 text-center"><p className="text-red-600">{error}</p><button onClick={logout} className="mt-4 rounded-xl border px-5 py-3 font-semibold">Return to login</button></div>;
  const cards = [["Total Products", overview?.totalProducts ?? "Not available"], ["Total Orders", overview?.totalOrders ?? "Not available"], ["Pending Orders", overview?.pendingOrders ?? "Not available"], ["Customers", overview?.customers ?? "Not available"]];
  return <div className="min-h-screen bg-gray-100 px-4 py-10"><div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">DYVA Admin</p><h1 className="mt-2 text-3xl font-bold">DYVA ADMIN DASHBOARD</h1><p className="mt-2 text-sm text-gray-600">{admin?.email} · {admin?.role}</p></div><button onClick={logout} className="rounded-xl border px-5 py-3 font-semibold">Logout</button></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm text-gray-500">{label}</p><p className="mt-3 text-3xl font-bold">{value}</p></div>)}</div><nav className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{["Products", "Orders", "Customers", "Reviews", "Settings"].map((item) => <div key={item} className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="font-bold">{item}</h2><p className="mt-2 text-sm text-gray-500">Managed from Shopify Admin data.</p></div>)}</nav></div></div>;
}
