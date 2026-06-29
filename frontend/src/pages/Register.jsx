import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate     = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to Lumière.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex">
      <div className="hidden lg:flex flex-1 bg-charcoal items-center justify-center p-16">
        <div className="text-center">
          <span className="font-display text-5xl font-semibold text-ivory tracking-tight">Lumière</span>
          <p className="mt-4 text-ivory/60 text-base max-w-xs leading-relaxed">
            Join thousands who've found their perfect skincare routine.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="font-display text-2xl font-semibold text-charcoal lg:hidden block mb-10">Lumière</Link>
          <h1 className="font-display text-3xl font-semibold text-charcoal mb-2">Create Account</h1>
          <p className="text-sm text-muted mb-8">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline font-medium">Sign in</Link>
          </p>

          <form onSubmit={submit} className="space-y-4">
            {[
              { label: 'Full Name', name: 'name', type: 'text', placeholder: 'Priya Sharma' },
              { label: 'Email',     name: 'email', type: 'email', placeholder: 'priya@email.com' },
            ].map(({ label, name, type, placeholder }) => (
              <div key={name} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-charcoal uppercase tracking-wide">{label}</label>
                <input
                  name={name} type={type} required
                  value={form[name]} onChange={handle}
                  placeholder={placeholder}
                  className="border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
                />
              </div>
            ))}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-charcoal uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  name="password" type={show ? 'text' : 'password'} required minLength={8}
                  value={form.password} onChange={handle}
                  placeholder="Min. 8 characters"
                  className="w-full border border-border rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-accent transition-colors"
                />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full justify-center py-3 text-base">
              Create Account
            </Button>

            <p className="text-xs text-center text-muted">
              By registering you agree to our{' '}
              <Link to="#" className="underline hover:text-accent">Terms</Link> and{' '}
              <Link to="#" className="underline hover:text-accent">Privacy Policy</Link>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
