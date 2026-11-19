// Vercel Serverless Function: Razorpay order banata hai (secret key sirf yahin rehti hai)
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

  const KEY_ID = process.env.RAZORPAY_KEY_ID;
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
  if (!KEY_ID || !KEY_SECRET) return res.status(500).json({ error: "Razorpay keys set nahi hain" });

  const b = readBody(req);
  const amount = Number(b.amount);                       // rupees
  if (!isFinite(amount) || amount < 1 || amount > 200000)
    return res.status(400).json({ error: "Amount galat hai" });

  const paise = Math.round(amount * 100);
  const clean = (v, n) => String(v == null ? "" : v).slice(0, n);

  try {
    const r = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(KEY_ID + ":" + KEY_SECRET).toString("base64"),
      },
      body: JSON.stringify({
        amount: paise,
        currency: "INR",
        receipt: "KM" + Date.now().toString(36).toUpperCase(),
        notes: {
          item: clean(b.item, 100),
          sku: clean(b.sku, 40),
          qty: clean(b.qty, 5),
          name: clean(b.name, 60),
          mobile: clean(b.mobile, 14),
        },
      }),
    });
    const j = await r.json();
    if (!r.ok || !j.id) return res.status(502).json({ error: (j.error && j.error.description) || "Order nahi bana" });
    return res.status(200).json({ orderId: j.id, amount: j.amount, key: KEY_ID });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
};
