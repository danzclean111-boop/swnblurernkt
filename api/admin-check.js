const admin = require("firebase-admin");

const AUTH_PROJECT_ID = "danzclean-auth";
const DATABASE_URL = "https://danzclean-auth-default-rtdb.asia-southeast1.firebasedatabase.app";
const ALLOWED_ORIGINS = ["https://danzclean.arisu.biz.id"];

function adminEmails() {
  return String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function parseServiceAccount(raw) {
  let text = String(raw || "").trim();
  if (!text) throw new Error("FIREBASE_SERVICE_ACCOUNT belum diisi");
  if (text[0] !== "{") {
    text = Buffer.from(text, "base64").toString("utf8");
  }
  const cred = JSON.parse(text);
  if (cred.private_key) cred.private_key = cred.private_key.replace(/\\n/g, "\n");
  if (cred.project_id !== AUTH_PROJECT_ID) {
    throw new Error("Service account bukan milik project " + AUTH_PROJECT_ID);
  }
  return cred;
}

function initAdmin() {
  if (admin.apps.length) return;
  admin.initializeApp({
    credential: admin.credential.cert(parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT)),
    databaseURL: DATABASE_URL
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ admin: false });
  }

  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.indexOf(origin) === -1) {
    return res.status(403).json({ admin: false });
  }

  const list = adminEmails();
  if (!list.length) {
    return res.status(500).json({ error: "ADMIN_EMAILS belum diatur di Vercel" });
  }

  try {
    initAdmin();
  } catch (e) {
    console.error("[admin-check] init:", e.message);
    return res.status(500).json({ error: "Server belum dikonfigurasi: " + e.message });
  }

  const match = String(req.headers.authorization || "").match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).json({ admin: false });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(match[1]);
    const email = String(decoded.email || "").toLowerCase();
    const ok = decoded.email_verified === true && list.indexOf(email) !== -1;
    return res.status(200).json({ admin: ok });
  } catch (e) {
    return res.status(401).json({ admin: false });
  }
};
