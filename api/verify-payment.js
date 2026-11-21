// Vercel Serverless Function: payment ka signature verify karta hai
const crypto = require("crypto");

const { getKeys } = require("./_keys");

const cors = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const readBody = (req) => {
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b || {};
};

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { KEY_ID, KEY_SECRET } = getKeys();
  if (!KEY_ID || !KEY_SECRET) return res.status(500).json({ ok: false, error: "Razorpay keys set nahi hain (server par RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET nahi mili: /api/health kholkar dekhiye)" });

  const b = readBody(req);
  const oid = String(b.razorpay_order_id || "");
  const pid = String(b.razorpay_payment_id || "");
  const sig = String(b.razorpay_signature || "");
  if (!oid || !pid || !sig) return res.status(400).json({ ok: false, error: "Data adhura hai" });

  const expected = crypto.createHmac("sha256", KEY_SECRET).update(oid + "|" + pid).digest("hex");
  const a = Buffer.from(expected), c = Buffer.from(sig);
  const valid = a.length === c.length && crypto.timingSafeEqual(a, c);
  if (!valid) return res.status(400).json({ ok: false, error: "Signature match nahi hua" });

  // (optional) payment ki asli status Razorpay se confirm
  let status = "", amount = 0;
  try {
    const r = await fetch("https://api.razorpay.com/v1/payments/" + encodeURIComponent(pid), {
      headers: { Authorization: "Basic " + Buffer.from(KEY_ID + ":" + KEY_SECRET).toString("base64") },
    });
    const j = await r.json();
    status = j.status || ""; amount = j.amount || 0;
  } catch (e) {}

  return res.status(200).json({ ok: true, status, amount });
};
