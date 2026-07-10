import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, KeyRound, Phone, UserRound } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { hasFirebaseConfig } from '../firebase';
import { getPhoneOtpErrorMessage, normalizeIndianPhone, sendPhoneOtp } from '../utils/phoneOtp';

export default function EmailAuth({ mode = 'register', onSuccess }) {
  const [method, setMethod] = useState('email');
  const [form, setForm] = useState({ name: '', email: '', phone: '', otp: '' });
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneConfirmation, setPhoneConfirmation] = useState(null);
  const { setSession } = useAuth();

  const requiresName = mode === 'register';
  const usingPhone = method === 'phone';

  const sendOtp = async () => {
    if (requiresName && !form.name.trim()) {
      toast.error('Enter your full name first');
      return;
    }

    setSendingOtp(true);
    try {
      if (usingPhone) {
        if (!hasFirebaseConfig) {
          toast.error('Enable Firebase first to use phone verification');
          return;
        }

        if (!form.phone.trim()) {
          toast.error('Enter your phone number first');
          return;
        }

        const confirmation = await sendPhoneOtp(form.phone, `${mode}-phone-recaptcha-container`);
        setPhoneConfirmation(confirmation);
        setOtpSent(true);
        toast.success('Verification code sent to your phone');
        return;
      }

      if (!form.email.trim()) {
        toast.error('Enter your email address first');
        return;
      }

      const response = await authService.sendEmailOtp({
        name: form.name.trim(),
        email: form.email.trim(),
      });

      setOtpSent(true);
      toast.success(response?.message || 'Verification code sent to your email');
    } catch (error) {
      toast.error(
        usingPhone
          ? getPhoneOtpErrorMessage(error)
          : error?.response?.data?.message || error.message || 'Failed to send email OTP'
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();

    if (!otpSent) {
      toast.error('Please send the verification code first');
      return;
    }

    setVerifying(true);
    try {
      let response;

      if (usingPhone) {
        const result = await phoneConfirmation.confirm(form.otp);
        const user = result.user;

        response = await authService.register({
          name: user.displayName || form.name.trim() || user.phoneNumber || 'Phone User',
          phone: user.phoneNumber,
          firebaseUid: user.uid,
        });
      } else {
        response = await authService.verifyEmailOtp({
          name: form.name.trim(),
          email: form.email.trim(),
          otp: form.otp,
        });
      }

      if (response?.token) {
        setSession(response.user, response.token);
      } else {
        setSession(response?.user || null);
      }

      toast.success(response?.message || (usingPhone ? 'Phone verified successfully' : 'Email verified successfully'));
      onSuccess?.(response?.user || null);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Invalid verification code');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <form onSubmit={verifyOtp} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setMethod('email')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            !usingPhone ? 'bg-pink-500 text-white shadow-sm' : 'text-muted hover:text-charcoal dark:hover:text-slate-100'
          }`}
        >
          Email OTP
        </button>
        <button
          type="button"
          disabled={!hasFirebaseConfig}
          onClick={() => setMethod('phone')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            usingPhone ? 'bg-pink-500 text-white shadow-sm' : 'text-muted hover:text-charcoal dark:hover:text-slate-100'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Phone OTP
        </button>
      </div>

      {!hasFirebaseConfig && (
        <p className="text-xs leading-5 text-muted dark:text-slate-400">
          Phone OTP will activate after Firebase phone sign-in is configured in your environment.
        </p>
      )}

      {requiresName ? (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.28em] text-charcoal dark:text-slate-200">
            Full Name
          </label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              name="name"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Priya Sharma"
              className="w-full rounded-2xl border border-border bg-white px-11 py-3 text-sm outline-none transition-all duration-300 placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/10 dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500"
            />
          </div>
        </div>
      ) : null}

      {usingPhone ? (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.28em] text-charcoal dark:text-slate-200">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              name="phone"
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: normalizeIndianPhone(e.target.value) }))}
              placeholder="9876543210"
              className="w-full rounded-2xl border border-border bg-white px-11 py-3 pr-28 text-sm outline-none transition-all duration-300 placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/10 dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={sendOtp}
              disabled={sendingOtp || !hasFirebaseConfig}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-pink-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendingOtp ? 'Sending' : 'Send OTP'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.28em] text-charcoal dark:text-slate-200">
            Email Address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="name@example.com"
              className="w-full rounded-2xl border border-border bg-white px-11 py-3 pr-28 text-sm outline-none transition-all duration-300 placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/10 dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={sendOtp}
              disabled={sendingOtp}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-pink-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendingOtp ? 'Sending' : 'Send OTP'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-[0.28em] text-charcoal dark:text-slate-200">
          OTP
        </label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            name="otp"
            type="text"
            inputMode="numeric"
            required
            value={form.otp}
            onChange={(e) => setForm((prev) => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
            placeholder="Enter OTP"
            className="w-full rounded-2xl border border-border bg-white px-11 py-3 text-sm outline-none transition-all duration-300 placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/10 dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={verifying}
        className="mt-4 w-full rounded-full border border-white/1000 bg-white/5 px-6 py-3 text-[15px] font-bold uppercase tracking-[0.22em] text-pink-600 shadow-[0_8px_24px_rgba(26,26,46,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-pink-200 hover:text-pink-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {verifying ? 'Verifying' : requiresName ? 'Verify & Create Account' : 'Verify & Sign In'}
      </button>

      {usingPhone && <div id={`${mode}-phone-recaptcha-container`} />}
    </form>
  );
}
