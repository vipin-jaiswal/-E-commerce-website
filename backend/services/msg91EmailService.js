const sanitizeResponse = (value, authKey) => {
  if (typeof value === "string") {
    return authKey ? value.replaceAll(authKey, "[REDACTED]") : value;
  }
  if (Array.isArray(value)) return value.map((item) => sanitizeResponse(item, authKey));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        key.toLowerCase() === "authkey" ? "[REDACTED]" : sanitizeResponse(item, authKey),
      ])
    );
  }
  return value;
};

const sendEmailOtp = async ({ email, otp }) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_EMAIL_TEMPLATE_ID;
  const fromEmail = process.env.MSG91_FROM_EMAIL;
  const domain = process.env.MSG91_EMAIL_DOMAIN;
  const recipient = String(email || "").trim().toLowerCase();
  const code = String(otp || "").trim();
  const requiredConfig = {
    MSG91_AUTH_KEY: authKey,
    MSG91_EMAIL_TEMPLATE_ID: templateId,
    MSG91_FROM_EMAIL: fromEmail,
    MSG91_EMAIL_DOMAIN: domain,
  };
  const missingConfig = Object.entries(requiredConfig)
    .filter(([, value]) => !String(value || "").trim())
    .map(([name]) => name);
  if (missingConfig.length) {
    throw new Error(`MSG91 email OTP is not configured. Missing: ${missingConfig.join(", ")}.`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient) || !/^\d{6}$/.test(code)) {
    throw new Error("MSG91 email OTP requires a valid recipient email and a six-digit code.");
  }

  const response = await fetch("https://control.msg91.com/api/v5/email/send", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", authkey: authKey },
    body: JSON.stringify({
      to: [{ email: recipient }],
      from: { email: fromEmail, name: "DYVA" },
      domain,
      template_id: templateId,
      variables: { company_name: "DYVA", otp: code },
    }),
  });
  const responseText = await response.text();
  let result;
  try {
    result = responseText ? JSON.parse(responseText) : {};
  } catch {
    result = { message: responseText.slice(0, 2000) };
  }
  if (!response.ok || result?.status === "error" || result?.type === "error") {
    console.error("[auth] MSG91 email error:", response.status, sanitizeResponse(result, authKey));
    throw new Error(`MSG91 email request failed (${response.status}).`);
  }
  return result;
};

module.exports = { sendEmailOtp };
