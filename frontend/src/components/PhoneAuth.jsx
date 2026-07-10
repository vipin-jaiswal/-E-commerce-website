import { useState } from "react";
import toast from "react-hot-toast";
import { authService } from "../services/authService";
import { getPhoneOtpErrorMessage, normalizeIndianPhone, sendPhoneOtp } from "../utils/phoneOtp";

export default function PhoneAuth() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  const sendOTP = async () => {
    try {
      const result = await sendPhoneOtp(phone, "recaptcha-container");
      setConfirmation(result);
      toast.success("OTP Sent Successfully");
    } catch (error) {
      toast.error(getPhoneOtpErrorMessage(error));
    }
  };

  const verifyOTP = async () => {
    if (!confirmation) {
      toast.error("Please send OTP first");
      return;
    }

    try {
      const result = await confirmation.confirm(otp);
      const user = result.user;

      const response = await authService.register({
        name: user.displayName || user.phoneNumber || 'Phone User',
        phone: user.phoneNumber,
        firebaseUid: user.uid,
      });

      if (response?.token) {
        localStorage.setItem('token', response.token);
      }

      toast.success("You are successfully logged in!");
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Invalid OTP");
      console.error(error);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Phone Number"
        value={phone}
        onChange={(e) => setPhone(normalizeIndianPhone(e.target.value))}
      />

      <button onClick={sendOTP}>Send OTP</button>

      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
      />

      <button onClick={verifyOTP}>Verify OTP</button>

      <div id="recaptcha-container"></div>
    </div>
  );
}
