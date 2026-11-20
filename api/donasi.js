const admin = require("firebase-admin");

const PROJECT_ID = "donasi-69866";
const DATABASE_URL = "https://donasi-69866-default-rtdb.asia-southeast1.firebasedatabase.app";
const APP_NAME = "donasi";
const ALLOWED_ORIGINS = ["https://danzclean.arisu.biz.id"];
const MAX_ROWS = 2000;

function parseServiceAccount(raw) {
  let text = String(raw || "").trim();
  if (!text) throw new Error("FIREBASE_SERVICE_ACCOUNT_DONASI belum diisi");
  if (text[0] !== "{") {
    text = Buffer.from(text, "base64").toString("utf8");
  }
  const cred = JSON.parse(text);
  if (cred.private_key) cred.private_key = cred.private_key.replace(/\\n/g, "\n");
  if (cred.project_id !== PROJECT_ID) {
    throw new Error("Service account bukan milik project " + PROJECT_ID);
  }
  return cred;
}

function getApp() {
  const found = admin.apps.find((a) => a && a.name === APP_NAME);
  if (found) return found;
  return admin.initializeApp({
    credential: admin.credential.cert(parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_DONASI)),
    databaseURL: DATABASE_URL
  }, APP_NAME);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Cache-Control", "no-store");
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }

  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.indexOf(origin) === -1) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(403).json({ error: "Origin tidak diizinkan" });
  }

  let app;
  try {
    app = getApp();
  } catch (e) {
    console.error("[donasi] init:", e.message);
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).json({ error: "Server belum dikonfigurasi" });
  }

  try {
    const snap = await admin.database(app).ref("donations").once("value");
    const out = [];
    snap.forEach((c) => {
      const v = c.val();
      if (!v || typeof v.amount !== "number" || typeof v.ts !== "number") return;
      // Hanya field publik. Email tidak pernah disimpan dan tidak pernah dikirim.
      out.push({
        id: c.key,
        name: String(v.name || "Orang Baik").slice(0, 60),
        amount: v.amount,
        message: String(v.message || "").slice(0, 500),
        ts: v.ts
      });
    });
    out.sort((a, b) => b.ts - a.ts);
    res.setHeader("Cache-Control", "public, s-maxage=5, stale-while-revalidate=30");
    return res.status(200).json({ donations: out.slice(0, MAX_ROWS), serverTime: Date.now() });
  } catch (e) {
    console.error("[donasi] read:", e.message);
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).json({ error: "Gagal membaca database" });
  }
};
