
const { db, messaging } = require("./firebase-admin");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (
    !process.env.ADMIN_SECRET ||
    req.headers["x-admin-secret"] !== process.env.ADMIN_SECRET
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { title, body, link } = req.body || {};

    if (
      typeof title !== "string" || !title.trim() || title.length > 100 ||
      typeof body !== "string" || !body.trim() || body.length > 500
    ) {
      return res.status(400).json({ error: "Invalid title or message" });
    }

    let target = "https://kingmobileshophusainganj2.vercel.app/";

    if (link) {
      const parsed = new URL(link, target);
      if (parsed.origin !== new URL(target).origin) {
        return res.status(400).json({ error: "Only your website links are allowed" });
      }
      target = parsed.href;
    }

    const snapshot = await db.collection("pushSubscribers").get();
    const docs = snapshot.docs;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < docs.length; i += 500) {
      const batch = docs.slice(i, i + 500);
      const tokens = batch.map(doc => doc.data().token);

      const result = await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: title.trim(),
          body: body.trim()
        },
        webpush: {
          fcmOptions: { link: target },
          notification: { icon: "/favicon.ico" }
        }
      });

      sent += result.successCount;
      failed += result.failureCount;

      const removals = [];
      result.responses.forEach((response, index) => {
        if (
          !response.success &&
          ["messaging/registration-token-not-registered",
           "messaging/invalid-registration-token"].includes(
             response.error?.code
           )
        ) {
          removals.push(batch[index].ref.delete());
        }
      });

      await Promise.all(removals);
    }

    return res.status(200).json({
      success: true,
      total: docs.length,
      sent,
      failed
    });
  } catch (error) {
    console.error("Send notification error:", error);
    return res.status(500).json({ error: "Could not send notification" });
  }
};
