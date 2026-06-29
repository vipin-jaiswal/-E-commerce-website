import React, 'react';
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
  ShoppingBag,
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

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('profile');
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState({
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

    // TODO: Call authService.updateProfile(form) here
    setEditing(false);
    toast.success('Profile updated!');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }

    setForm((prevForm) => ({
      ...prevForm,
      [name]: processedValue,
    }));
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
          onChange={handleFormChange}
          maxLength={name === 'phone' ? 10 : undefined}
          placeholder={`Enter ${label}`}
          className="
          border border-gray-300
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
        <p className="text-sm text-gray-700 py-3 px-4 bg-gray-50 rounded-xl border border-gray-200">
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
    <div className="max-w-site mx-auto px-6 py-10">
      <h1 className="font-display text-3xl font-semibold text-charcoal mb-8">My Account</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-card p-6 flex flex-col items-center text-center mb-4">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-ivory-dark flex items-center justify-center text-2xl font-display font-semibold text-accent overflow-hidden">
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
            <p className="font-semibold text-charcoal">{user?.name || 'Guest'}</p>
            <p className="text-xs text-muted mt-1">{user?.email}</p>
          </div>

          <nav className="bg-white rounded-2xl shadow-card overflow-hidden">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-5 py-4 text-sm font-medium transition-colors border-b border-border last:border-0
                  ${activeTab === id
                    ? 'bg-charcoal text-ivory'
                    : 'text-muted hover:bg-ivory-dark hover:text-charcoal'}`}
              >
                <Icon size={17} /> {label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-4 text-sm font-medium text-red-400 hover:bg-red-50 transition-colors"
            >
              <LogOut size={17} /> Sign Out
            </button>
          </nav>
        </aside>

        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold text-charcoal">Personal Details</h2>
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
                    <button type="button" onClick={() => setEditing(false)} className="text-sm text-muted hover:text-charcoal transition-colors">Cancel</button>
                    <button type="button" onClick={handleSave} className="flex items-center gap-1.5 text-sm text-sage font-semibold">
                      <CheckCircle size={15} /> Save
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" name="name" />
                <Field label="Email" name="email" type="email" />
                <Field label="Phone Number" name="phone" type="tel" />
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="font-display text-xl font-semibold text-charcoal mb-6">My Orders</h2>
              {/* Placeholder for orders list */}
            </div>
          )}

          {/* Other tabs can be implemented similarly */}
        </div>
      </div>
    </div>
  );
}