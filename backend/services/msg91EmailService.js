const sendEmailOtp = async ({ email, otp }) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_EMAIL_TEMPLATE_ID;
  const fromEmail = process.env.MSG91_FROM_EMAIL;
  const domain = process.env.MSG91_EMAIL_DOMAIN;
  if (!authKey || !templateId || !fromEmail || !domain) {
    throw new Error("MSG91 email OTP is not configured (MSG91_AUTH_KEY, MSG91_EMAIL_TEMPLATE_ID, MSG91_FROM_EMAIL, MSG91_EMAIL_DOMAIN).");
  }

  const response = await fetch("https://control.msg91.com/api/v5/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", authkey: authKey },
    body: JSON.stringify({
      to: [{ email }],
      from: { email: fromEmail, name: "DYVA" },
      domain,
      template_id: templateId,
      variables: { otp },
    }),
  });
  if (!response.ok) throw new Error(`MSG91 email request failed (${response.status}).`);
  const result = await response.json().catch(() => ({}));
  if (result?.status === "error" || result?.type === "error") throw new Error("MSG91 could not send the verification email.");
};

module.exports = { sendEmailOtp };
