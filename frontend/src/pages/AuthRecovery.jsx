import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/auth/AuthShell';
import api from '../services/api';

const inputClassName = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const resendCode = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setOtpSent(true);
      setOtp('');
      setMessage(response.data.message || 'A new verification code has been sent.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to resend the verification code.');
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
    if (otpVerified) {
      if (newPassword.length < 8) {
        setError('Choose a password with at least 8 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      const response = await api.post('/auth/forgot-password/update-password', { email, newPassword, confirmPassword });
        setMessage(response.data.message || 'Your password has been reset successfully.');
        setOtpVerified(false);
        setOtpSent(false);
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        return;
      }
      const response = otpSent
        ? await api.post('/auth/forgot-password/verify-otp', { email, otp })
        : await api.post('/auth/forgot-password', { email });
      if (response.data.otpRequired) setOtpSent(true);
      if (response.data.otpVerified) setOtpVerified(true);
      setMessage(response.data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell panelSide="right" panelTitle="Remembered your password?" panelCopy="Return to your DYVA account and continue your routine." panelCtaLabel="Sign in" panelCtaTo="/login">
      <div>
        <Link to="/" className="text-sm font-semibold tracking-[0.3em] text-slate-500">DYVA</Link>
        <h1 className="mt-8 text-4xl font-semibold tracking-tight text-slate-950">Forgot password?</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Enter your registered email and we&apos;ll help you reset your password.</p>
        <form className="mt-8 space-y-5" onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-700">Email address
            <input className={inputClassName} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" disabled={otpSent} />
          </label>
          {otpSent && !otpVerified && <>
            <label className="block text-sm font-medium text-slate-700">Verification code
              <input className={inputClassName} inputMode="numeric" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} required maxLength={6} autoComplete="one-time-code" />
            </label>
            <button type="button" onClick={resendCode} disabled={loading} className="w-full -mt-2 text-sm font-semibold text-slate-600 underline underline-offset-4 disabled:opacity-50">Resend code</button>
          </>}
          {otpVerified && <>
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">Your email is verified. Choose a new password for your DYVA account.</p>
            <label className="block text-sm font-medium text-slate-700">New password
              <input className={inputClassName} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={8} autoComplete="new-password" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Confirm new password
              <input className={inputClassName} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} autoComplete="new-password" />
            </label>
            {newPassword && newPassword.length < 8 && <p className="text-sm text-red-700" role="alert">Choose a password with at least 8 characters.</p>}
            {confirmPassword && newPassword !== confirmPassword && <p className="text-sm text-red-700" role="alert">Passwords do not match.</p>}
          </>}
          {message && <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700" role="status">{message}</p>}
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
          <button className="w-full rounded-xl ui-primary px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading || (otpVerified ? newPassword.length < 8 || !confirmPassword : otpSent ? !otp : !email)}>
            {loading ? 'Please wait...' : otpVerified ? 'Reset password' : otpSent ? 'Verify code →' : 'Send code →'}
          </button>
        </form>
        <p className="mt-7 text-center text-sm text-slate-500"><Link to="/login" className="font-semibold text-slate-950 underline underline-offset-4">← Back to login</Link></p>
      </div>
    </AuthShell>
  );
}
