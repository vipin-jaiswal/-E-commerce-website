import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm]   = useState({ email: '', password: '' });
  const [show, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname || '/';

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex">
      {/* Left — decorative */}
      <div className="hidden lg:flex flex-1 bg-charcoal items-center justify-center p-16">
        <div className="text-center">
          <span className="font-display text-5xl font-semibold text-ivory tracking-tight">Lumière</span>
          <p className="mt-4 text-ivory/60 text-base max-w-xs leading-relaxed">
            Premium skincare rooted in science. Welcome back.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="font-display text-2xl font-semibold text-charcoal lg:hidden block mb-10">
            Lumière
          </Link>

          <h1 className="font-display text-3xl font-semibold text-charcoal mb-2">Sign In</h1>
          <p className="text-sm text-muted mb-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:underline font-medium">Register</Link>
          </p>

          <form onSubmit={submit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-charcoal uppercase tracking-wide">Email</label>
              <input
                name="email" type="email" required
                value={form.email} onChange={handle}
                placeholder="you@email.com"
                className="border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-charcoal uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  name="password" type={show ? 'text' : 'password'} required
                  value={form.password} onChange={handle}
                  placeholder="••••••••"
                  className="w-full border border-border rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-accent transition-colors"
                />
                <button
                  type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="#" className="text-xs text-accent hover:underline">Forgot password?</Link>
            </div>

            <Button type="submit" loading={loading} className="w-full justify-center py-3 text-base">
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
