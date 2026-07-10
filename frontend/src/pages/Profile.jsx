import React, { useEffect, useState } from 'react';
import {
  User,
  Package,
  Heart,
  LogOut,
  CheckCircle,
  MapPin,
  Award,
  ChevronRight,
  Truck,
  Clock,
  XCircle,
  Edit2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { orderService } from '../services/orderService';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState(user?.isAdmin ? 'profile' : 'orders');
  const [editing, setEditing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    if (user?.isAdmin) {
      setActiveView('profile');
    }
  }, [user?.isAdmin]);

  useEffect(() => {
    if (!user || user.isAdmin) {
      setOrders([]);
      return;
    }

    let alive = true;
    setOrdersLoading(true);

    orderService
      .getMine()
      .then((data) => {
        if (alive) setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (alive) setOrders([]);
      })
      .finally(() => {
        if (alive) setOrdersLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleSave = () => {
    if (form.phone && form.phone.length !== 10) {
      toast.error('Phone number must contain exactly 10 digits');
      return;
    }

    setEditing(false);
    toast.success('Profile updated!');
  };

  const STATUS_CONFIG = {
    pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/50' },
    processing: { label: 'Processing', icon: Clock, color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/50' },
    shipped: { label: 'Shipped', icon: Truck, color: 'text-cyan-600 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-900/50' },
    delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/50' },
    cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/50' },
  };

  const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${config.color}`}>
        <Icon size={14} /> {config.label}
      </span>
    );
  };

  const Field = ({ label, name, type = 'text' }) => (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      {editing ? (
        <input
          type={type}
          name={name}
          value={form[name]}
          onChange={(e) => {
            const { name: fieldName, value } = e.target;
            const processedValue = fieldName === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
            setForm((prevForm) => ({ ...prevForm, [fieldName]: processedValue }));
          }}
          maxLength={name === 'phone' ? 10 : undefined}
          placeholder={`Enter ${label}`}
          className="border border-gray-300 dark:border-dark-border dark:bg-dark-card dark:text-dark-text rounded-xl px-4 py-3 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
        />
      ) : (
        <p className="text-sm text-gray-700 dark:text-dark-text py-3">
          {form[name] || <span className="text-gray-400 italic">Not set</span>}
        </p>
      )}
    </div>
  );

  const TABS = user?.isAdmin
    ? [{ id: 'profile', label: 'Account Details', icon: User }]
    : [
        { id: 'orders', label: 'Recent Orders', icon: Package },
        { id: 'profile', label: 'Account Details', icon: User },
      ];

  if (!user) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-gray-100 dark:border-slate-700 p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">My Account</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Please sign in to view your profile, orders, and saved items.</p>
            <Link to="/login" className="inline-flex items-center justify-center rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white hover:bg-pink-600 transition">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex justify-center mb-8 border-b border-gray-200 dark:border-gray-700">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-lg transition-colors duration-300 ${
                activeView === tab.id
                  ? 'border-b-2 border-pink-500 text-pink-500'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        <div>
          {activeView === 'orders' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Your Orders</h2>
                <Link to="/orders" className="text-sm font-semibold text-pink-500 hover:underline">View All</Link>
              </div>

              {ordersLoading ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-8 text-center text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-slate-700">
                  Loading orders...
                </div>
              ) : orders.length > 0 ? (
                orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-5 border border-gray-100 dark:border-slate-700">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white">Order #{order.id}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'Not available'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">
                          Rs. {Number(order.totalPrice ?? 0).toLocaleString('en-IN')}
                        </p>
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-end">
                      <Link
                        to={`/orders/${order.id}`}
                        className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-pink-600 transition"
                      >
                        Track Order
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-8 text-center border border-gray-100 dark:border-slate-700">
                  <Package size={30} className="mx-auto mb-3 text-gray-400" />
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">No orders yet</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Once you place an order, it will show up here.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeView === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6 border border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Personal Information</h2>
                  {!editing ? (
                    <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm font-semibold text-pink-500 hover:underline">
                      <Edit2 size={14} /> Edit
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white">Cancel</button>
                      <button onClick={handleSave} className="flex items-center gap-1.5 text-sm font-semibold text-green-500 hover:underline">
                        <CheckCircle size={14} /> Save
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <Field label="Full Name" name="name" />
                  <Field label="Email Address" name="email" type="email" />
                  <Field label="Phone Number" name="phone" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-gray-100 dark:border-slate-700">
                {!user?.isAdmin && (
                  <Link to="/wishlist" className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition rounded-t-2xl border-b dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <Heart size={18} className="text-gray-500 dark:text-gray-400" />
                      <span className="font-semibold text-gray-700 dark:text-white">Wishlist</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </Link>
                )}
                <Link to="/addresses" className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition border-b dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-gray-500 dark:text-gray-400" />
                    <span className="font-semibold text-gray-700 dark:text-white">Addresses</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </Link>
                <Link to="/rewards" className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition rounded-b-2xl">
                  <div className="flex items-center gap-3">
                    <Award size={18} className="text-gray-500 dark:text-gray-400" />
                    <span className="font-semibold text-gray-700 dark:text-white">Rewards</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </Link>
              </div>

              <button
                onClick={handleLogout}
                className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-gray-100 dark:border-slate-700 flex items-center justify-center gap-3 p-4 text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 transition"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
