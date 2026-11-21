// Browser me kholiye: https://<aapki-site>/api/health  -> bataata hai keys mili ya nahi (value nahi dikhata)
const { getKeys } = require("./_keys");
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  const k = getKeys();
  const out = {
    keysOk: !!(k.KEY_ID && k.KEY_SECRET),
    keyIdFound: k.idName || false,
    keySecretFound: k.secretName || false,
    keyMode: k.KEY_ID ? (/^rzp_live_/.test(k.KEY_ID) ? "LIVE" : /^rzp_test_/.test(k.KEY_ID) ? "TEST" : "UNKNOWN-FORMAT") : null,
    vercelEnv: process.env.VERCEL_ENV || "",
    deployment: process.env.VERCEL_URL || "",
    time: new Date().toISOString(),
  };
  // Razorpay se asli check: keys sahi/chalu hain ya nahi
  if (out.keysOk && req.query && req.query.deep) {
    try {
      const r = await fetch("https://api.razorpay.com/v1/orders?count=1", {
        headers: { Authorization: "Basic " + Buffer.from(k.KEY_ID + ":" + k.KEY_SECRET).toString("base64") },
      });
      out.razorpayAuth = r.ok ? "OK" : "FAIL HTTP " + r.status;
    } catch (e) { out.razorpayAuth = "network error"; }
  }
  res.status(out.keysOk ? 200 : 503).json(out);
};
