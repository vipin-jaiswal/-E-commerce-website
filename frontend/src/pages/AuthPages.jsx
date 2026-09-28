import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../components/auth/AuthShell';
import api from '../services/api';

const inputClassName =
  'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-[#2A2A2A] dark:bg-[#151515] dark:text-white';

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.response?.data?.error || fallback;
}

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', form);
      if (response.data.token) localStorage.setItem('token', response.data.token);
      toast.success('Welcome back to DYVA');
      const savedAccount = JSON.parse(localStorage.getItem('account') || 'null');
      localStorage.setItem('account', JSON.stringify({
        ...(savedAccount?.email === form.email.trim().toLowerCase() ? savedAccount : {}),
        email: form.email.trim().toLowerCase(),
      }));
      const returnTo = searchParams.get('returnTo');
      navigate(returnTo?.startsWith('/') ? returnTo : '/');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to sign in. Please check your details and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell panelSide="right" panelTitle="New to DYVA?" panelCopy="Create an account to save your favourites and keep every order close at hand." panelCtaLabel="Create account" panelCtaTo={returnTo?.startsWith('/') ? `/register?returnTo=${encodeURIComponent(returnTo)}` : '/register'}>
      <div>
        <Link to="/" className="text-sm font-semibold tracking-[0.3em] text-slate-500">DYVA</Link>
        <h1 className="mt-8 text-4xl font-semibold tracking-tight text-slate-950">Welcome back</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Sign in to continue your beauty ritual.</p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">Email address<input className={inputClassName} type="email" name="email" value={form.email} onChange={updateField} required autoComplete="email" /></label>
          <label className="block text-sm font-medium text-slate-700">Password<input className={inputClassName} type="password" name="password" value={form.password} onChange={updateField} required minLength={8} autoComplete="current-password" /><Link to="/forgot-password" className="mt-2 inline-block text-xs font-semibold text-slate-950 underline underline-offset-4">Forgot Password?</Link></label>
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
          <button className="w-full rounded-xl ui-primary px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <p className="mt-7 text-center text-sm text-slate-500">Don&apos;t have an account? <Link to={returnTo?.startsWith('/') ? `/register?returnTo=${encodeURIComponent(returnTo)}` : '/register'} className="font-semibold text-slate-950 underline underline-offset-4">Register</Link></p>
      </div>
    </AuthShell>
  );
}

export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', { name: form.name, email: form.email, password: form.password });
      localStorage.setItem('account', JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
      }));
      toast.success('Account created. You can now sign in.');
      const returnTo = searchParams.get('returnTo');
      navigate(`/login${returnTo?.startsWith('/') ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to create your account. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell panelTitle="Already a member?" panelCopy="Sign in to pick up where you left off and discover what is next for your routine." panelCtaLabel="Sign in" panelCtaTo="/login">
      <div>
        <Link to="/" className="text-sm font-semibold tracking-[0.3em] text-slate-500">DYVA</Link>
        <h1 className="mt-8 text-4xl font-semibold tracking-tight text-slate-950">Create your account</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">A considered routine starts here.</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">Full name<input className={inputClassName} type="text" name="name" value={form.name} onChange={updateField} required autoComplete="name" /></label>
          <label className="block text-sm font-medium text-slate-700">Email address<input className={inputClassName} type="email" name="email" value={form.email} onChange={updateField} required autoComplete="email" /></label>
          <label className="block text-sm font-medium text-slate-700">Password<input className={inputClassName} type="password" name="password" value={form.password} onChange={updateField} required minLength={8} autoComplete="new-password" /></label>
          <label className="block text-sm font-medium text-slate-700">Confirm password<input className={inputClassName} type="password" name="confirmPassword" value={form.confirmPassword} onChange={updateField} required minLength={8} autoComplete="new-password" /></label>
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
          <button className="w-full rounded-xl ui-primary px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
        </form>
        <p className="mt-7 text-center text-sm text-slate-500">Already registered? <Link to={returnTo?.startsWith('/') ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login'} className="font-semibold text-slate-950 underline underline-offset-4">Sign in</Link></p>
      </div>
    </AuthShell>
  );
}
