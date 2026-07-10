import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import Button from '../components/common/Button';
import AuthShell from '../components/auth/AuthShell';
import EmailAuth from '../components/EmailAuth';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Login() {
  const [adminForm, setAdminForm] = useState({ email: '', password: '' });
  const [adminMode, setAdminMode] = useState(false);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const submitAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(adminForm);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      panelSide="left"
      panelTitle="Welcome Back!"
      panelCopy="Sign in to continue your skincare journey and access your personalized experience."
      panelCtaLabel="Create Account"
      panelCtaTo="/register"
    >
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <div className="text-center">
          <Link to="/" className="font-display text-3xl font-bold tracking-tight text-pink-600 hover:text-pink-400">
            DYVA
          </Link>
          <h1 className="mt-6 font-display text-3xl font-semibold text-charcoal dark:text-slate-100">Sign In</h1>
          <p className="mt-2 text-sm text-muted dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-accent hover:text-accent-dark hover:underline text-pink-400 hover:text-pink-300">
              Register
            </Link>
          </p>
        </div>

        {!adminMode ? (
          <EmailAuth
            mode="login"
            onSuccess={() => navigate(from, { replace: true })}
          />
        ) : (
          <form onSubmit={submitAdmin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.28em] text-charcoal dark:text-slate-200">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input
                  name="email"
                  type="email"
                  required
                  value={adminForm.email}
                  onChange={(e) => setAdminForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@dyva.com"
                  className="w-full rounded-2xl border border-border bg-white px-11 py-3 text-sm outline-none transition-all duration-300 placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/10 dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.28em] text-charcoal dark:text-slate-200">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input
                  name="password"
                  type={show ? 'text' : 'password'}
                  required
                  value={adminForm.password}
                  onChange={(e) => setAdminForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="********"
                  className="w-full rounded-2xl border border-border bg-white px-11 py-3 pr-12 text-sm outline-none transition-all duration-300 placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/10 dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-charcoal dark:hover:text-slate-100"
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              size="lg"
              className="mt-8 w-full justify-center rounded-full border border-white/1000 hover:border-gray-100 bg-white/5 px-6 py-2.5 text-[15px] text-black hover:text-pink-600 hover:bg-pink-200 font-bold uppercase tracking-[0.22em] text-pink-600 shadow-[0_8px_24px_rgba(26,26,46,0.18)] transition-all duration-300 hover:-translate-y-0.5"
            >
              Admin Sign In
            </Button>
          </form>
        )}

        <button
          type="button"
          onClick={() => setAdminMode((value) => !value)}
          className="mx-auto block text-sm font-medium text-pink-500 hover:text-pink-600 hover:underline"
        >
          {adminMode ? 'Use email OTP instead' : 'Admin sign in'}
        </button>

      </motion.div>
    </AuthShell>
  );
}
