const admin = require("firebase-admin");

const ALLOWED_ORIGINS = ["https://danzclean.arisu.biz.id"];

function adminEmails() {
  return String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function parseServiceAccount(raw, projectId, envName) {
  let text = String(raw || "").trim();
  if (!text) throw new Error(envName + " belum diisi");
  if (text[0] !== "{") {
    text = Buffer.from(text, "base64").toString("utf8");
  }
  const cred = JSON.parse(text);
  if (cred.private_key) cred.private_key = cred.private_key.replace(/\\n/g, "\n");
  if (cred.project_id !== projectId) {
    throw new Error("Service account bukan milik project " + projectId);
  }
  return cred;
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try {
    return JSON.parse(req.body || "{}");
  } catch (e) {
    return {};
  }
}

const PROJECT_ID = "danzclean-auth";
const DATABASE_URL = "https://danzclean-auth-default-rtdb.asia-southeast1.firebasedatabase.app";
const APP_NAME = "adminMaintenance";

function getApp() {
  const found = admin.apps.find((a) => a && a.name === APP_NAME);
  if (found) return found;
  return admin.initializeApp({
    credential: admin.credential.cert(parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT, PROJECT_ID, "FIREBASE_SERVICE_ACCOUNT")),
    databaseURL: DATABASE_URL
  }, APP_NAME);
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

  const list = adminEmails();
  if (!list.length) {
    return res.status(500).json({ error: "ADMIN_EMAILS belum diatur di Vercel" });
  }

  let app;
  try {
    app = getApp();
  } catch (e) {
    console.error("[adminMaintenance] init:", e.message);
    return res.status(500).json({ error: "Server belum dikonfigurasi: " + e.message });
  }

  const match = String(req.headers.authorization || "").match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).json({ error: "Belum login admin" });
  }

  let decoded;
  try {
    decoded = await admin.auth(app).verifyIdToken(match[1]);
  } catch (e) {
    return res.status(401).json({ error: "Sesi login tidak valid, login ulang" });
  }

  const email = String(decoded.email || "").toLowerCase();
  if (decoded.email_verified !== true || list.indexOf(email) === -1) {
    return res.status(403).json({ error: "Akun ini bukan akun owner" });
  }

  const body = readBody(req);
  const db = admin.database(app);

  try {
    if (body.action !== "set") {
      return res.status(400).json({ error: "Aksi tidak dikenal" });
    }
    const enabled = body.enabled === true;
    const message = typeof body.message === "string" ? body.message.slice(0, 1000) : "";
    const image = typeof body.image === "string" ? body.image : "";
    if (image.length > 3000000) {
      return res.status(400).json({ error: "Gambar terlalu besar" });
    }
    await db.ref("maintenance").set({ enabled: enabled, message: message, image: image });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[adminMaintenance] write:", e.message);
    return res.status(500).json({ error: "Gagal menyimpan ke database" });
  }
};
