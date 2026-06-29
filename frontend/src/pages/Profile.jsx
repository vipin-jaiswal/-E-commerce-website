import React, { useState } from 'react';
import {
  User,
  Package,
  Heart,
  LogOut,
  Camera,
  Edit2,
  CheckCircle,
  MapPin,
  Award,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'rewards', label: 'Rewards', icon: Award },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleSave = () => {
    if (form.phone && form.phone.length !== 10) {
      toast.error('Phone number must contain exactly 10 digits');
      return;
    }

    // Call authService.updateProfile(form) here
    setEditing(false);
    toast.success('Profile updated!');
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
            const { name, value } = e.target;
            let processedValue = value;
            if (name === 'phone') {
              processedValue = value.replace(/\D/g, '').slice(0, 10);
            }
            setForm((prevForm) => ({ ...prevForm, [name]: processedValue }));
          }}
          maxLength={name === 'phone' ? 10 : undefined}
          placeholder={`Enter ${label}`}
          className="
          border border-gray-300
          dark:border-dark-border dark:bg-dark-card dark:text-dark-text
          rounded-xl
          px-4 py-3
          text-sm
          outline-none
          focus:border-pink-500
          focus:ring-2
          focus:ring-pink-200
          transition-all
        "
        />
      ) : (
        <p className="text-sm text-gray-700 dark:text-dark-text py-3 px-4 bg-gray-50 dark:bg-dark-bg rounded-xl border border-gray-200 dark:border-dark-border">
          {form[name] || (
            <span className="text-gray-400 italic">
              Not set
            </span>
          )}
        </p>
      )}
    </div>
  );

  return (
    <div className="bg-ivory dark:bg-dark-bg min-h-screen">
      <div className="max-w-site mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-display text-3xl font-semibold text-charcoal dark:text-dark-text">My Account</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-card p-6 flex flex-col items-center text-center mb-4">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full bg-ivory-dark dark:bg-dark-bg flex items-center justify-center text-2xl font-display font-semibold text-accent overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <button type="button" className="absolute bottom-0 right-0 w-7 h-7 bg-charcoal rounded-full flex items-center justify-center text-ivory hover:bg-accent transition-colors">
                  <Camera size={13} />
                </button>
              </div>
              <p className="font-semibold text-charcoal dark:text-dark-text">{user?.name || 'Guest'}</p>
              <p className="text-xs text-muted dark:text-dark-muted mt-1">{user?.email}</p>
            </div>

            <nav className="bg-white dark:bg-dark-card rounded-2xl shadow-card overflow-hidden">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-5 py-4 text-sm font-medium transition-colors border-b border-border dark:border-dark-border last:border-0
                    ${activeTab === id
                      ? 'bg-charcoal text-ivory'
                      : 'text-muted dark:text-dark-muted hover:bg-ivory-dark dark:hover:bg-dark-bg hover:text-charcoal dark:hover:text-dark-text'}`}
                >
                  <Icon size={17} /> {label}
                </button>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-5 py-4 text-sm font-medium text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 transition-colors"
              >
                <LogOut size={17} /> Sign Out
              </button>
            </nav>
          </aside>

          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-dark-card rounded-2xl shadow-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-semibold text-charcoal dark:text-dark-text">Personal Details</h2>
                  {!editing ? (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 text-sm text-accent hover:text-accent-dark font-medium transition-colors"
                    >
                      <Edit2 size={15} /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setEditing(false)} className="text-sm text-muted dark:text-dark-muted hover:text-charcoal dark:hover:text-dark-text transition-colors">Cancel</button>
                      <button type="button" onClick={handleSave} className="flex items-center gap-1.5 text-sm text-sage font-semibold">
                        <CheckCircle size={15} /> Save
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" name="name" />
                  <Field label="Email" name="email" type="email" />
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white dark:bg-dark-card rounded-2xl shadow-card p-6">
                <h2 className="font-display text-xl font-semibold text-charcoal dark:text-dark-text mb-6">My Orders</h2>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Package size={40} className="text-border dark:text-dark-border mb-4" />
                  <p className="font-semibold text-charcoal dark:text-dark-text mb-1">No orders yet</p>
                  <p className="text-sm text-muted dark:text-dark-muted mb-6">Your order history will appear here.</p>
                  <Link to="/products" className="btn-primary inline-flex">Start Shopping</Link>
                </div>
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="bg-white dark:bg-dark-card rounded-2xl shadow-card p-6">
                <h2 className="font-display text-xl font-semibold text-charcoal dark:text-dark-text mb-6">My Wishlist</h2>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Heart size={40} className="text-border dark:text-dark-border mb-4" />
                  <p className="font-semibold text-charcoal dark:text-dark-text mb-1">Your wishlist is empty</p>
                  <p className="text-sm text-muted dark:text-dark-muted mb-6">Save products you love to find them later.</p>
                  <Link to="/products" className="btn-primary inline-flex">Browse Products</Link>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-white dark:bg-dark-card rounded-2xl shadow-card p-6">
                <h2 className="text-xl font-semibold mb-6 dark:text-dark-text">Saved Addresses</h2>
                <div className="border dark:border-dark-border rounded-2xl p-5">
                  <h3 className="font-semibold dark:text-dark-text">Home</h3>
                  <p className="text-gray-500 dark:text-dark-muted mt-2">Bhilai, Chhattisgarh - 490001</p>
                </div>
              </div>
            )}

            {activeTab === 'rewards' && (
              <div className="bg-white dark:bg-dark-card rounded-2xl shadow-card p-6">
                <h2 className="text-xl font-semibold mb-6 dark:text-dark-text">Reward Points</h2>
                <div className="text-center py-12">
                  <h1 className="text-5xl font-bold text-pink-500">240</h1>
                  <p className="text-gray-500 dark:text-dark-muted mt-3">Available Reward Points</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
