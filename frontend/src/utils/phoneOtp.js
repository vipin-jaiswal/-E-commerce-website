import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth, hasFirebaseConfig } from '../firebase';

export const normalizeIndianPhone = (value = '') => value.replace(/\D/g, '').slice(0, 10);

export const normalizePhoneInput = (value = '') => value.replace(/[^\d+]/g, '').slice(0, 13);

export const formatPhoneNumber = (phone) => {
  const cleaned = normalizePhoneInput(phone);
  if (cleaned.startsWith('+')) return cleaned;
  return `+91${cleaned.replace(/\D/g, '').slice(0, 10)}`;
};

export const formatIndianPhone = formatPhoneNumber;

export const getPhoneOtpErrorMessage = (error) => {
  if (error?.code === 'auth/operation-not-allowed') {
    return 'Enable Phone sign-in and allow this SMS region in Firebase Authentication settings';
  }

  if (error?.code === 'auth/too-many-requests') {
    return 'Too many OTP requests. Please wait a while and try again';
  }

  if (error?.code === 'auth/invalid-phone-number') {
    return 'Enter a valid 10 digit phone number';
  }

  if (error?.message) return error.message;

  return 'Could not send OTP';
};

export const sendPhoneOtp = async (phone, containerId) => {
  const formattedPhone = formatPhoneNumber(phone);
  const digits = formattedPhone.replace(/\D/g, '');

  if (digits.length < 10) {
    throw new Error('Enter a valid phone number');
  }

  if (!hasFirebaseConfig) {
    throw new Error('Add your real Firebase API key in frontend/.env and restart the dev server');
  }

  if (window.recaptchaVerifier?.clear) {
    window.recaptchaVerifier.clear();
    window.recaptchaVerifier = null;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error('reCAPTCHA container was not found');
  }

  container.innerHTML = '';
  const verifierContainer = document.createElement('div');
  verifierContainer.id = `${containerId}-${Date.now()}`;
  container.appendChild(verifierContainer);

  window.recaptchaVerifier = new RecaptchaVerifier(auth, verifierContainer.id, {
    size: 'invisible',
  });

  try {
    return await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
  } catch (error) {
    if (window.recaptchaVerifier?.clear) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    container.innerHTML = '';
    throw error;
  }
};
