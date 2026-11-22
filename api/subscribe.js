
const { db } = require("./firebase-admin");
const crypto = require("crypto");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const origin = req.headers.origin;
  if (origin && origin !== "https://kingmobileshophusainganj2.vercel.app") {
    return res.status(403).json({ error: "Invalid origin" });
  }

  try {
    const { token } = req.body || {};

    if (!token || typeof token !== "string" || token.length > 4096) {
      return res.status(400).json({ error: "Invalid token" });
    }

    const id = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await db.collection("pushSubscribers").doc(id).set({
      token,
      createdAt: new Date().toISOString()
    }, { merge: true });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Subscribe error:", error);
    return res.status(500).json({ error: "Subscription failed" });
  }
};
