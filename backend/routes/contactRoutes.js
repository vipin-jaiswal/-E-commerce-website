const express = require("express");
const { sendContactEmail } = require("../services/contactService");

const router = express.Router();
const submissions = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_SUBMISSIONS = 5;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (value) => String(value || "").trim();

const isRateLimited = (ip) => {
  const now = Date.now();
  const recent = (submissions.get(ip) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_SUBMISSIONS) {
    submissions.set(ip, recent);
    return true;
  }
  recent.push(now);
  submissions.set(ip, recent);
  return false;
};

router.post("/", async (req, res) => {
  const ip = req.ip || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({ success: false, message: "Please wait before sending another message." });
  }

  const name = clean(req.body?.name);
  const email = clean(req.body?.email).toLowerCase();
  const phone = clean(req.body?.phone);
  const orderNumber = clean(req.body?.orderNumber);
  const subject = clean(req.body?.subject);
  const message = clean(req.body?.message);

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: "Please fill all required fields." });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ success: false, message: "Please provide a valid email address." });
  }
  if (name.length > 100 || email.length > 150 || phone.length > 30 || orderNumber.length > 50 || subject.length > 200 || message.length > 5000) {
    return res.status(400).json({ success: false, message: "One or more fields are too long." });
  }

  try {
    await sendContactEmail({ name, email, phone, orderNumber, subject, message });
    return res.status(200).json({ success: true, message: "Your message has been sent successfully." });
  } catch (error) {
    console.error("[contact] Unable to send contact email:", error.message);
    return res.status(500).json({ success: false, message: "Unable to send your message right now." });
  }
});

module.exports = router;