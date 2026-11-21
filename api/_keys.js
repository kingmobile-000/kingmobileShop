// Razorpay keys ko ek hi jagah se padhta hai (spaces/quotes hata kar, alag naam bhi chalega)
const pick = (...names) => {
  for (const n of names) {
    let v = process.env[n];
    if (typeof v === "string") {
      v = v.trim().replace(/^["']|["']$/g, "").trim();
      if (v) return { name: n, value: v };
    }
  }
  return { name: "", value: "" };
};
const getKeys = () => {
  const id = pick("RAZORPAY_KEY_ID", "RAZORPAY_KEYID", "RZP_KEY_ID", "NEXT_PUBLIC_RAZORPAY_KEY_ID");
  const secret = pick("RAZORPAY_KEY_SECRET", "RAZORPAY_SECRET", "RZP_KEY_SECRET");
  return { KEY_ID: id.value, KEY_SECRET: secret.value, idName: id.name, secretName: secret.name };
};
module.exports = { getKeys };
