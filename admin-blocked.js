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

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try {
    return JSON.parse(req.body || "{}");
  } catch (e) {
    return {};
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }

  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.indexOf(origin) === -1) {
    return res.status(403).json({ error: "Origin tidak diizinkan" });
  }

  const ADMIN_EMAILS = adminEmails();
  if (!ADMIN_EMAILS.length) {
    return res.status(500).json({ error: "ADMIN_EMAILS belum diatur di Vercel" });
  }

  try {
    initAdmin();
  } catch (e) {
    console.error("[admin-blocked] init:", e.message);
    return res.status(500).json({ error: "Server belum dikonfigurasi: " + e.message });
  }

  const header = String(req.headers.authorization || "");
  const match = header.match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).json({ error: "Belum login admin" });
  }

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(match[1]);
  } catch (e) {
    return res.status(401).json({ error: "Sesi login tidak valid, login ulang" });
  }

  const email = String(decoded.email || "").toLowerCase();
  if (decoded.email_verified !== true || ADMIN_EMAILS.indexOf(email) === -1) {
    return res.status(403).json({ error: "Akun ini bukan akun owner" });
  }

  const body = readBody(req);
  const action = body.action;
  const uid = body.uid;

  if (action !== "block" && action !== "unblock") {
    return res.status(400).json({ error: "Aksi tidak dikenal" });
  }
  if (typeof uid !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
    return res.status(400).json({ error: "UID tidak valid" });
  }

  const ref = admin.database().ref("blocked_users/" + uid);

  try {
    if (action === "block") {
      const reason = typeof body.reason === "string" ? body.reason.slice(0, 300) : "";
      const username = typeof body.username === "string" ? body.username.slice(0, 60) : "";
      await ref.set({ blocked: true, reason: reason, username: username, blockedAt: Date.now() });
    } else {
      await ref.remove();
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[admin-blocked] write:", e.message);
    return res.status(500).json({ error: "Gagal menyimpan ke database" });
  }
};
