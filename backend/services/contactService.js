const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const sendContactEmail = async ({ name, email, phone, orderNumber, subject, message }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.CONTACT_EMAIL;
  const sender = process.env.FROM_EMAIL;

  if (!apiKey || !recipient || !sender) {
    throw new Error("Contact email configuration is incomplete");
  }

  const submitted = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date());
  const safePhone = phone || "Not provided";
  const safeOrderNumber = orderNumber || "Not provided";
  const html = `
    <h2>DYVA - New Contact Request</h2>
    <h3>Customer Details</h3>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(safePhone)}</p>
    <p><strong>Order number:</strong> ${escapeHtml(safeOrderNumber)}</p>
    <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    <h3>Message</h3>
    <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
    <hr>
    <p><strong>Submitted:</strong> ${submitted}</p>
  `;
  const text = [
    "DYVA - New Contact Request",
    "",
    "Customer Details",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${safePhone}`,
    `Order number: ${safeOrderNumber}`,
    `Subject: ${subject}`,
    "",
    "Message:",
    message,
    "",
    `Submitted: ${submitted}`,
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: sender,
      to: [recipient],
      reply_to: email,
      subject: "New Contact Request - DYVA",
      html,
      text,
    }),
  });

  if (!response.ok) {
    const providerError = await response.text();
    throw new Error(`Resend request failed (${response.status}): ${providerError}`);
  }
};

module.exports = { sendContactEmail };