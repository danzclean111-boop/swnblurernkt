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

const DATA_PROJECT_ID = "danzzclean";
const DATABASE_URL = "https://danzzclean-default-rtdb.asia-southeast1.firebasedatabase.app";
const DATA_APP_NAME = "adminNotifData";

const AUTH_PROJECT_ID = "danzclean-auth";
const AUTH_APP_NAME = "adminNotifAuth";

// App ini HANYA dipakai untuk menulis ke database notifikasi (project danzzclean),
// pakai service account server sendiri. Tidak perlu token user yang cocok dengan
// project ini, karena verifikasi login dilakukan lewat getAuthApp() di bawah.
function getDataApp() {
  const found = admin.apps.find((a) => a && a.name === DATA_APP_NAME);
  if (found) return found;
  return admin.initializeApp({
    credential: admin.credential.cert(parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_MAIN, DATA_PROJECT_ID, "FIREBASE_SERVICE_ACCOUNT_MAIN")),
    databaseURL: DATABASE_URL
  }, DATA_APP_NAME);
}

// App ini HANYA dipakai untuk memverifikasi ID token owner, yang dibuat dari project
// login utama (danzclean-auth) - sesi yang sama dipakai di seluruh dashboard, jadi
// owner tidak perlu login popup kedua kalinya khusus untuk fitur notifikasi ini.
function getAuthApp() {
  const found = admin.apps.find((a) => a && a.name === AUTH_APP_NAME);
  if (found) return found;
  return admin.initializeApp({
    credential: admin.credential.cert(parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT, AUTH_PROJECT_ID, "FIREBASE_SERVICE_ACCOUNT"))
  }, AUTH_APP_NAME);
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

  let authApp, dataApp;
  try {
    authApp = getAuthApp();
    dataApp = getDataApp();
  } catch (e) {
    console.error("[adminNotif] init:", e.message);
    return res.status(500).json({ error: "Server belum dikonfigurasi: " + e.message });
  }

  const match = String(req.headers.authorization || "").match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).json({ error: "Belum login admin" });
  }

  let decoded;
  try {
    decoded = await admin.auth(authApp).verifyIdToken(match[1]);
  } catch (e) {
    return res.status(401).json({ error: "Sesi login tidak valid, login ulang" });
  }

  const email = String(decoded.email || "").toLowerCase();
  if (decoded.email_verified !== true || list.indexOf(email) === -1) {
    return res.status(403).json({ error: "Akun ini bukan akun owner" });
  }

  const body = readBody(req);
  const db = admin.database(dataApp);

  try {
    if (body.action === "add") {
      const title = typeof body.title === "string" ? body.title.trim().slice(0, 100) : "";
      const message = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";
      const author = typeof body.author === "string" ? body.author.trim().slice(0, 60) : "";
      if (!message) {
        return res.status(400).json({ error: "Pesan kosong" });
      }
      const ref = await db.ref("notifications").push({
        title: title || "Informasi",
        message: message,
        author: author || "Owner",
        createdAt: admin.database.ServerValue.TIMESTAMP
      });
      return res.status(200).json({ ok: true, key: ref.key });
    }
    if (body.action === "remove") {
      const key = body.key;
      if (typeof key !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(key)) {
        return res.status(400).json({ error: "Key tidak valid" });
      }
      await db.ref("notifications/" + key).remove();
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: "Aksi tidak dikenal" });
  } catch (e) {
    console.error("[adminNotif] write:", e.message);
    return res.status(500).json({ error: "Gagal menyimpan ke database" });
  }
};
