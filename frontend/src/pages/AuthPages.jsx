import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
import api, { clearCustomerScopedState } from '../services/api';

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
  const [showPassword, setShowPassword] = useState(false);

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
      clearPreviousUserData();
      if (response.data.token) localStorage.setItem('token', response.data.token);
      toast.success('Welcome back to DYVA');
      const savedAccount = JSON.parse(localStorage.getItem('account') || 'null');
      const accountEmail = form.email.trim().toLowerCase();
      localStorage.setItem('account', JSON.stringify({
        ...(savedAccount?.email === accountEmail ? savedAccount : {}),
        email: accountEmail,
      }));
      const returnTo = searchParams.get('returnTo');
      navigate(returnTo?.startsWith('/') ? returnTo : '/');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="sm:hidden">
      <MobileAuthPage mode="login" form={form} updateField={updateField} submit={handleSubmit} loading={loading} error={error} showPassword={showPassword} togglePassword={() => setShowPassword((visible) => !visible)} forgotTo="/forgot-password" registerTo={returnTo?.startsWith('/') ? `/register?returnTo=${encodeURIComponent(returnTo)}` : '/register'} />
    </div>
    <div className="hidden sm:block">
    <AuthShell panelSide="right" panelTitle="New to DYVA?" panelCopy="Create an account to save your favourites and keep every order close at hand." panelCtaLabel="Create account" panelCtaTo={returnTo?.startsWith('/') ? `/register?returnTo=${encodeURIComponent(returnTo)}` : '/register'}>
      <div>
        <Link to="/" className="text-sm font-semibold tracking-[0.3em] text-slate-500">DYVA</Link>
        <h1 className="mt-8 text-4xl font-semibold tracking-tight text-slate-950">Welcome back</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Sign in to continue your beauty ritual.</p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">Email address<input className={inputClassName} type="email" name="email" value={form.email} onChange={updateField} required autoComplete="email" /></label>
          <label className="block text-sm font-medium text-slate-700">Password<span className="relative block"><input className={`${inputClassName} pr-12`} type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={updateField} required minLength={8} autoComplete="current-password" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span><Link to="/forgot-password" className="mt-2 inline-block text-xs font-semibold text-slate-950 underline underline-offset-4">Forgot Password?</Link></label>
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
          <button className="w-full rounded-xl ui-primary px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <p className="mt-7 text-center text-sm text-slate-500">Don&apos;t have an account? <Link to={returnTo?.startsWith('/') ? `/register?returnTo=${encodeURIComponent(returnTo)}` : '/register'} className="font-semibold text-slate-950 underline underline-offset-4">Register</Link></p>
      </div>
    </AuthShell>
    </div>
    </>
  );
}

export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!otpSent) {
        await api.post('/auth/register/send-otp', { name: form.name, email: form.email, password: form.password });
        setOtpSent(true);
        toast.success('Verification code sent to your email.');
      } else {
        const response = await api.post('/auth/register/verify-otp', { email: form.email, otp, password: form.password });
        clearPreviousUserData();
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('account', JSON.stringify({ name: form.name.trim(), email: form.email.trim().toLowerCase() }));
        toast.success('Account verified. Welcome to DYVA.');
        navigate(returnTo?.startsWith('/') ? returnTo : '/account', { replace: true });
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to create your account. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const sendRegistrationOtp = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register/send-otp', { name: form.name, email: form.email, password: form.password });
      setOtpSent(true);
      setOtpVerified(false);
      toast.success('Verification code sent to your email.');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to send a verification code.'));
    } finally {
      setLoading(false);
    }
  };

  const verifyRegistrationOtp = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register/verify-code', { email: form.email, otp });
      setOtpVerified(true);
      toast.success('Email verified.');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to verify this code.'));
    } finally {
      setLoading(false);
    }
  };

  const resendRegistrationOtp = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register/resend-otp', { email: form.email });
      setOtp('');
      setOtpVerified(false);
      toast.success('A new verification code has been sent.');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to resend code.'));
    } finally {
      setLoading(false);
    }
  };

  const completeMobileRegistration = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/register/complete', { email: form.email, password: form.password });
      clearPreviousUserData();
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('account', JSON.stringify({ name: form.name.trim(), email: form.email.trim().toLowerCase() }));
      toast.success('Account created. Welcome to DYVA.');
      navigate(returnTo?.startsWith('/') ? returnTo : '/account', { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to create your account.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="sm:hidden">
      <MobileAuthPage mode="register" form={form} updateField={updateField} submit={handleSubmit} sendOtp={sendRegistrationOtp} verifyOtp={verifyRegistrationOtp} completeRegistration={completeMobileRegistration} resendOtp={resendRegistrationOtp} otpVerified={otpVerified} loading={loading} error={error} showPassword={showPassword} togglePassword={() => setShowPassword((value) => !value)} otpSent={otpSent} otp={otp} setOtp={setOtp} loginTo={returnTo?.startsWith('/') ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login'} />
    </div>
    <div className="hidden sm:block">
    <AuthShell panelTitle="Already a member?" panelCopy="Sign in to pick up where you left off and discover what is next for your routine." panelCtaLabel="Sign in" panelCtaTo="/login">
      <div>
        <Link to="/" className="text-sm font-semibold tracking-[0.3em] text-slate-500">DYVA</Link>
        <h1 className="mt-8 text-4xl font-semibold tracking-tight text-slate-950">Create your account</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">A considered routine starts here.</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">Full name<input className={inputClassName} type="text" name="name" value={form.name} onChange={updateField} required autoComplete="name" /></label>
          <label className="block text-sm font-medium text-slate-700">Email address<input className={inputClassName} type="email" name="email" value={form.email} onChange={updateField} required autoComplete="email" /></label>
          <label className="block text-sm font-medium text-slate-700">Password<span className="relative block"><input className={`${inputClassName} pr-12`} type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={updateField} required minLength={8} autoComplete="new-password" /><PasswordToggle visible={showPassword} onClick={() => setShowPassword((value) => !value)} /></span></label>
          {otpSent && <label className="block text-sm font-medium text-slate-700">Email verification code<input className={inputClassName} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} required /></label>}
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
          <button className="w-full rounded-xl ui-primary px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading || (otpSent && otp.length !== 6)}>{loading ? (otpSent ? 'Verifying...' : 'Sending code...') : otpSent ? 'Verify email and create account' : 'Send verification code'}</button>
          {otpSent && <button type="button" className="w-full text-sm underline" disabled={loading} onClick={async () => { setLoading(true); setError(''); try { await api.post('/auth/register/resend-otp', { email: form.email }); toast.success('A new verification code has been sent.'); } catch (err) { setError(getErrorMessage(err, 'Unable to resend code.')); } finally { setLoading(false); } }}>Resend verification code</button>}
        </form>
        <p className="mt-7 text-center text-sm text-slate-500">Already registered? <Link to={returnTo?.startsWith('/') ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login'} className="font-semibold text-slate-950 underline underline-offset-4">Sign in</Link></p>
      </div>
    </AuthShell>
    </div>
    </>
  );
}

function PasswordToggle({ visible, onClick }) {
  return <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={onClick} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>;
}

const clearPreviousUserData = clearCustomerScopedState;

function MobileAuthPage({ mode, form, updateField, submit, sendOtp, verifyOtp, completeRegistration, resendOtp, otpVerified, loading, error, showPassword, togglePassword, otpSent, otp, setOtp, forgotTo, registerTo, loginTo }) {
  const isLogin = mode === 'login';
  const isOtpStep = !isLogin && otpSent && !otpVerified;
  const registrationReady = Boolean(form.name?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email?.trim()) && form.password?.length >= 8);
  const submitMobileForm = (event) => {
    if (isLogin) return submit(event);
    event.preventDefault();
    if (!otpSent) return sendOtp();
    if (!otpVerified) return verifyOtp();
    return completeRegistration();
  };
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-slate-50 px-4 py-5 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[430px] flex-col rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
        <Link to="/" aria-label="DYVA home" className="text-center text-xl font-semibold tracking-[0.38em] text-slate-900">DYVA</Link>
        <div className="mt-14">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-slate-950">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className="mt-3 text-[15px] leading-6 text-slate-500">{isLogin ? 'Sign in to your account and continue your routine.' : 'A considered routine starts here.'}</p>
        </div>
        <form className="mt-9 flex flex-1 flex-col" onSubmit={submitMobileForm}>
          {!isLogin && !otpSent && <MobileField label="Full name"><input className={mobileInputClass} type="text" name="name" value={form.name} onChange={updateField} required autoComplete="name" placeholder="Full name" /></MobileField>}
          {!isOtpStep && <MobileField label="Email address"><input className={mobileInputClass} type="email" name="email" value={form.email} onChange={updateField} required autoComplete={isLogin ? 'username' : 'email'} placeholder="Email address" /></MobileField>}
          {!otpSent && <MobileField label="Password"><span className="relative block"><input className={`${mobileInputClass} pr-12`} type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={updateField} required minLength={8} autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="Password" /><PasswordToggle visible={showPassword} onClick={togglePassword} /></span></MobileField>}
          {isOtpStep && <MobileField label="Verification code"><input className={mobileInputClass} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} required placeholder="Enter verification code" /></MobileField>}
          {!isLogin && otpVerified && <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700" role="status">Email verified. Your account is ready to register.</p>}
          {isLogin && <Link to={forgotTo} className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-[#d9237a]">Forgot password?</Link>}
          {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
          <button className="mt-7 min-h-[54px] w-full rounded-2xl bg-[#e92c87] px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(233,44,135,0.18)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading || (isLogin ? false : !registrationReady || (otpSent && !otpVerified && otp.length !== 6))}>{loading ? 'Please wait...' : isLogin ? 'Sign in' : !otpSent ? 'Send verification code' : !otpVerified ? 'Verify email and create account' : 'Register'}</button>
          {!isLogin && otpSent && !otpVerified && <button type="button" className="mt-4 min-h-10 w-full text-sm font-semibold text-[#d9237a] underline underline-offset-4" disabled={loading} onClick={resendOtp}>Resend verification code</button>}
          <div className="mt-auto pt-10"><p className="text-center text-sm text-slate-500">{isLogin ? 'New to DYVA?' : 'Already registered?'}{' '}<Link to={isLogin ? registerTo : loginTo} className="font-semibold text-[#d9237a]">{isLogin ? 'Create an account' : 'Sign in'}</Link></p></div>
        </form>
      </div>
    </main>
  );
}

const mobileInputClass = 'mt-2 min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#e92c87] focus:ring-2 focus:ring-[#e92c87]/10';
function MobileField({ label, children }) { return <label className="mb-4 block text-sm font-medium text-slate-700">{label}{children}</label>; }
