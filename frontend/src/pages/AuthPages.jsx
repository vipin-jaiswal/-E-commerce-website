import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
import api, { clearCustomerScopedState } from '../services/api';

const inputClassName =
  'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-[#2A2A2A] dark:bg-[#151515] dark:text-white';

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback;
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
      if (!response.data?.token) throw new Error('Sign-in could not be completed. Please try again.');
      clearPreviousUserData();
      localStorage.setItem('token', response.data.token);
      toast.success('Welcome back to DYVA');
      const savedAccount = JSON.parse(localStorage.getItem('account') || 'null');
      const accountEmail = form.email.trim().toLowerCase();
      localStorage.setItem('account', JSON.stringify({
        ...(savedAccount?.email === accountEmail ? savedAccount : {}),
        email: accountEmail,
      }));
      const returnTo = searchParams.get('returnTo');
      const isSmallScreen = window.matchMedia('(max-width: 639px)').matches;
      navigate(isSmallScreen ? '/' : returnTo?.startsWith('/') ? returnTo : '/');
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
        <Link to="/" aria-label="DYVA home" className="inline-flex rounded-xl bg-slate-950 px-4 py-2 text-2xl font-bold tracking-[0.22em]"><span className="text-[#e92c87]">DY</span><span className="text-black">VA</span></Link>
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
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationAttempted, setRegistrationAttempted] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const registrationErrors = {
    name: form.name.trim() ? '' : 'Enter your name.',
    phone: /^\d+$/.test(form.phone) ? '' : 'Enter your phone number using digits only.',
    email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(form.email.trim()) && !/@gamil\.com$/i.test(form.email.trim())
      ? ''
      : 'Please enter a correct, complete email address, such as name@gmail.com.',
    password: /^[A-Za-z]/.test(form.password) && form.password.length >= 8
      ? ''
      : 'Start your password with a letter and use at least 8 characters.',
    confirmPassword: form.confirmPassword && form.password === form.confirmPassword ? '' : 'Enter the same password in both password fields.',
  };

  const validateRegistration = () => {
    setRegistrationAttempted(true);
    return Object.values(registrationErrors).every((message) => !message);
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === 'phone' ? value.replace(/\D/g, '') : value }));
    setError('');
  };

  const sendRegistrationOtp = async () => {
    if (!validateRegistration()) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register/send-otp', { name: form.name, email: form.email, phone: form.phone, password: form.password, confirmPassword: form.confirmPassword });
      setOtpSent(true);
      toast.success('Verification code sent to your email.');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to send a verification code.'));
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async (event) => {
    event?.preventDefault();
    if (!validateRegistration()) return;
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/register/verify-otp', {
        email: form.email,
        otp,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      if (!response.data?.token) throw new Error('Registration did not return a sign-in token. Please try again.');
      clearPreviousUserData();
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('account', JSON.stringify({ name: form.name.trim(), email: form.email.trim().toLowerCase() }));
      toast.success('Account verified. Welcome to DYVA.');
      navigate(returnTo?.startsWith('/') ? returnTo : '/', { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to create your account. Please try again.'));
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

  return (
    <>
    <div className="sm:hidden">
      <MobileAuthPage mode="register" form={form} updateField={updateField} submit={completeRegistration} sendOtp={sendRegistrationOtp} resendOtp={resendRegistrationOtp} loading={loading} error={error} showPassword={showPassword} togglePassword={() => setShowPassword((value) => !value)} otpSent={otpSent} otp={otp} setOtp={setOtp} registrationAttempted={registrationAttempted} emailTouched={emailTouched} setEmailTouched={setEmailTouched} passwordTouched={passwordTouched} setPasswordTouched={setPasswordTouched} registrationErrors={registrationErrors} loginTo={returnTo?.startsWith('/') ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login'} />
    </div>
    <div className="hidden sm:block">
    <AuthShell panelTitle="Already a member?" panelCopy="Sign in to pick up where you left off and discover what is next for your routine." panelCtaLabel="Sign in" panelCtaTo="/login">
      <div>
        <Link to="/" aria-label="DYVA home" className="inline-flex rounded-xl bg-slate-950 px-4 py-2 text-2xl font-bold tracking-[0.22em]"><span className="text-[#e92c87]">DY</span><span className="text-white">VA</span></Link>
        <h1 className="mt-8 text-4xl font-semibold tracking-tight text-slate-950">Create your account</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">A considered routine starts here.</p>
        <form noValidate className="mt-8 space-y-4" onSubmit={otpSent ? completeRegistration : (event) => { event.preventDefault(); sendRegistrationOtp(); }}>
          <label className="block text-sm font-medium text-slate-700">Name<input className={`${inputClassName} ${registrationAttempted && registrationErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}`} type="text" name="name" value={form.name} onChange={updateField} required autoComplete="name" aria-invalid={registrationAttempted && Boolean(registrationErrors.name)} />{registrationAttempted && registrationErrors.name && <span className="mt-1 block text-xs text-red-600">{registrationErrors.name}</span>}</label>
          <label className="block text-sm font-medium text-slate-700">Phone number<input className={`${inputClassName} ${registrationAttempted && registrationErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}`} type="tel" name="phone" value={form.phone} onChange={updateField} required autoComplete="tel" inputMode="numeric" pattern="[0-9]+" aria-invalid={registrationAttempted && Boolean(registrationErrors.phone)} />{registrationAttempted && registrationErrors.phone && <span className="mt-1 block text-xs text-red-600">{registrationErrors.phone}</span>}</label>
          <label className="block text-sm font-medium text-slate-700">Email address<input className={`${inputClassName} ${(registrationAttempted || emailTouched) && registrationErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}`} type="email" name="email" value={form.email} onChange={updateField} onBlur={() => setEmailTouched(true)} required autoComplete="email" aria-invalid={(registrationAttempted || emailTouched) && Boolean(registrationErrors.email)} />{(registrationAttempted || emailTouched) && registrationErrors.email && <span className="mt-1 block text-xs text-red-600">{registrationErrors.email}</span>}</label>
          <label className="block text-sm font-medium text-slate-700">Password<span className="relative block"><input className={`${inputClassName} pr-12 ${(registrationAttempted || passwordTouched) && registrationErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}`} type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={updateField} onBlur={() => setPasswordTouched(true)} required minLength={8} autoComplete="new-password" aria-invalid={(registrationAttempted || passwordTouched) && Boolean(registrationErrors.password)} /><PasswordToggle visible={showPassword} onClick={() => setShowPassword((value) => !value)} /></span>{(registrationAttempted || passwordTouched) && registrationErrors.password && <span className="mt-1 block text-xs text-red-600">{registrationErrors.password}</span>}</label>
          {!otpSent && <label className="block text-sm font-medium text-slate-700">Confirm password<input className={`${inputClassName} ${registrationAttempted && registrationErrors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}`} type={showPassword ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={updateField} required minLength={8} autoComplete="new-password" aria-invalid={registrationAttempted && Boolean(registrationErrors.confirmPassword)} />{registrationAttempted && registrationErrors.confirmPassword && <span className="mt-1 block text-xs text-red-600">{registrationErrors.confirmPassword}</span>}</label>}
          {otpSent && <label className="block text-sm font-medium text-slate-700">Email verification code<input className={inputClassName} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} required /></label>}
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
          <button className="w-full rounded-xl ui-primary px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading}>{loading ? (otpSent ? 'Verifying...' : 'Sending code...') : otpSent ? 'Verify email and create account' : 'Send verification code'}</button>
          {otpSent && <button type="button" className="w-full text-sm underline" disabled={loading} onClick={resendRegistrationOtp}>Resend verification code</button>}
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

function MobileAuthPage({ mode, form, updateField, submit, sendOtp, resendOtp, loading, error, showPassword, togglePassword, otpSent, otp, setOtp, forgotTo, registerTo, loginTo, registrationAttempted, emailTouched, setEmailTouched, passwordTouched, setPasswordTouched, registrationErrors }) {
  const isLogin = mode === 'login';
  const submitMobileForm = (event) => {
    if (isLogin) return submit(event);
    event.preventDefault();
    if (!otpSent) return sendOtp();
    return submit(event);
  };
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-slate-50 px-4 py-5 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[430px] flex-col rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
        <Link to="/" aria-label="DYVA home" className="mx-auto inline-flex rounded-xl bg-slate-950 px-4 py-2 text-2xl font-bold tracking-[0.22em]"><span className="text-[#e92c87]">DY</span><span className="text-white">VA</span></Link>
        <div className="mt-14">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-slate-950">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className="mt-3 text-[15px] leading-6 text-slate-500">{isLogin ? 'Sign in to your account and continue your routine.' : 'A considered routine starts here.'}</p>
        </div>
        <form noValidate className="mt-9 flex flex-1 flex-col" onSubmit={submitMobileForm}>
          {!isLogin && !otpSent && <MobileField label="Name"><input className={`${mobileInputClass} ${registrationAttempted && registrationErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}`} type="text" name="name" value={form.name} onChange={updateField} required autoComplete="name" placeholder="Your name" aria-invalid={registrationAttempted && Boolean(registrationErrors.name)} />{registrationAttempted && registrationErrors.name && <span className="mt-1 block text-xs text-red-600">{registrationErrors.name}</span>}</MobileField>}
          {!isLogin && !otpSent && <MobileField label="Phone number"><input className={`${mobileInputClass} ${registrationAttempted && registrationErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}`} type="tel" name="phone" value={form.phone} onChange={updateField} required autoComplete="tel" inputMode="numeric" pattern="[0-9]+" placeholder="Phone number" aria-invalid={registrationAttempted && Boolean(registrationErrors.phone)} />{registrationAttempted && registrationErrors.phone && <span className="mt-1 block text-xs text-red-600">{registrationErrors.phone}</span>}</MobileField>}
          {!isLogin && !otpSent && <MobileField label="Email address"><input className={`${mobileInputClass} ${(registrationAttempted || emailTouched) && registrationErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}`} type="email" name="email" value={form.email} onChange={updateField} onBlur={() => setEmailTouched(true)} required autoComplete="email" placeholder="Email address" aria-invalid={(registrationAttempted || emailTouched) && Boolean(registrationErrors.email)} />{(registrationAttempted || emailTouched) && registrationErrors.email && <span className="mt-1 block text-xs text-red-600">{registrationErrors.email}</span>}</MobileField>}
          {isLogin && <MobileField label="Email address"><input className={mobileInputClass} type="email" name="email" value={form.email} onChange={updateField} required autoComplete="username" placeholder="Email address" /></MobileField>}
          {!otpSent && <MobileField label="Password"><span className="relative block"><input className={`${mobileInputClass} pr-12 ${!isLogin && (registrationAttempted || passwordTouched) && registrationErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}`} type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={updateField} onBlur={!isLogin ? () => setPasswordTouched(true) : undefined} required minLength={8} autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="Password" aria-invalid={!isLogin && (registrationAttempted || passwordTouched) && Boolean(registrationErrors.password)} /><PasswordToggle visible={showPassword} onClick={togglePassword} /></span>{!isLogin && (registrationAttempted || passwordTouched) && registrationErrors.password && <span className="mt-1 block text-xs text-red-600">{registrationErrors.password}</span>}</MobileField>}
          {!isLogin && !otpSent && <MobileField label="Confirm password"><input className={`${mobileInputClass} ${registrationAttempted && registrationErrors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}`} type={showPassword ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={updateField} required minLength={8} autoComplete="new-password" placeholder="Confirm password" aria-invalid={registrationAttempted && Boolean(registrationErrors.confirmPassword)} />{registrationAttempted && registrationErrors.confirmPassword && <span className="mt-1 block text-xs text-red-600">{registrationErrors.confirmPassword}</span>}</MobileField>}
          {!isLogin && otpSent && <MobileField label="Verification code"><input className={mobileInputClass} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} required placeholder="Enter verification code" /></MobileField>}
          {isLogin && <Link to={forgotTo} className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-[#d9237a]">Forgot password?</Link>}
          {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
          <button className="mt-7 min-h-[54px] w-full rounded-2xl bg-[#e92c87] px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(233,44,135,0.18)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading}>{loading ? 'Please wait...' : isLogin ? 'Sign in' : !otpSent ? 'Send verification code' : 'Verify email and create account'}</button>
          {!isLogin && otpSent && <button type="button" className="mt-4 min-h-10 w-full text-sm font-semibold text-[#d9237a] underline underline-offset-4" disabled={loading} onClick={resendOtp}>Resend verification code</button>}
          <div className="mt-auto pt-10"><p className="text-center text-sm text-slate-500">{isLogin ? 'New to DYVA?' : 'Already registered?'}{' '}<Link to={isLogin ? registerTo : loginTo} className="font-semibold text-[#d9237a]">{isLogin ? 'Create an account' : 'Sign in'}</Link></p></div>
        </form>
      </div>
    </main>
  );
}

const mobileInputClass = 'mt-2 min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#e92c87] focus:ring-2 focus:ring-[#e92c87]/10';
function MobileField({ label, children }) { return <label className="mb-4 block text-sm font-medium text-slate-700">{label}{children}</label>; }
