import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../components/auth/AuthShell';
import api from '../services/api';

const inputClassName = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send the reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return <AuthShell panelSide="right" panelTitle="Remembered your password?" panelCopy="Return to your DYVA account and continue your routine." panelCtaLabel="Sign in" panelCtaTo="/login"><div><Link to="/" className="text-sm font-semibold tracking-[0.3em] text-slate-500">DYVA</Link><h1 className="mt-8 text-4xl font-semibold tracking-tight text-slate-950">Forgot password?</h1><p className="mt-3 text-sm leading-6 text-slate-500">Enter your registered email and Shopify will send a secure reset link if an account exists.</p><form className="mt-8 space-y-5" onSubmit={submit}><label className="block text-sm font-medium text-slate-700">Email address<input className={inputClassName} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>{message && <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700" role="status">{message}</p>}{error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}<button className="w-full rounded-xl ui-primary px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading}>{loading ? 'Sending link...' : 'Send reset link'}</button></form><p className="mt-7 text-center text-sm text-slate-500"><Link to="/login" className="font-semibold text-slate-950 underline underline-offset-4">Back to sign in</Link></p></div></AuthShell>;
}

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [resetUrl, setResetUrl] = useState(searchParams.get('resetUrl') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { resetUrl, password });
      toast.success('Password reset successful.');
      navigate('/login', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };
  return <AuthShell panelSide="right" panelTitle="Need another link?" panelCopy="Request a fresh secure reset link from Shopify." panelCtaLabel="Forgot password" panelCtaTo="/forgot-password"><div><Link to="/" className="text-sm font-semibold tracking-[0.3em] text-slate-500">DYVA</Link><h1 className="mt-8 text-4xl font-semibold tracking-tight text-slate-950">Reset password</h1><p className="mt-3 text-sm leading-6 text-slate-500">Use the secure reset link from your email to choose a new password.</p><form className="mt-8 space-y-5" onSubmit={submit}>{!searchParams.get('resetUrl') && <label className="block text-sm font-medium text-slate-700">Reset link<input className={inputClassName} type="url" value={resetUrl} onChange={(event) => setResetUrl(event.target.value)} required placeholder="Paste the Shopify reset link" /></label>}<label className="block text-sm font-medium text-slate-700">New password<input className={inputClassName} type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" /></label><label className="block text-sm font-medium text-slate-700">Confirm new password<input className={inputClassName} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} autoComplete="new-password" /></label>{error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}<button className="w-full rounded-xl ui-primary px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading}>{loading ? 'Resetting password...' : 'Set new password'}</button></form></div></AuthShell>;
}
