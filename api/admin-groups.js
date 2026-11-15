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

const PROJECT_ID = "danzclean-verify";
const DATABASE_URL = "https://danzclean-verify-default-rtdb.asia-southeast1.firebasedatabase.app";
const APP_NAME = "adminGroups";

function getApp() {
  const found = admin.apps.find((a) => a && a.name === APP_NAME);
  if (found) return found;
  return admin.initializeApp({
    credential: admin.credential.cert(parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_VERIFY, PROJECT_ID, "FIREBASE_SERVICE_ACCOUNT_VERIFY")),
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
    console.error("[adminGroups] init:", e.message);
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

  const NAME_MAX = 80;
  const rawUrl = /chat\.whatsapp\.com\/([A-Za-z0-9]{10,40})/;
  const cleanUrl = (u) => {
    const m = String(u || "").match(rawUrl);
    return m ? "https://chat.whatsapp.com/" + m[1] : null;
  };
  const cleanName = (n) => {
    const s = typeof n === "string" ? n.trim().replace(/\s+/g, " ") : "";
    return s && s.length <= NAME_MAX ? s : null;
  };
  const keyOk = (k) => typeof k === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(k);

  try {
    const add = body.add || null;
    const edit = body.edit || null;
    const removeKey = body.removeKey || null;
    const removeUrl = typeof body.removeUrl === "string" ? body.removeUrl : null;
    const defaults = Array.isArray(body.defaults) ? body.defaults.slice(0, 50) : [];

    let addData = null;
    if (add) {
      const name = cleanName(add.name);
      const url = cleanUrl(add.url);
      if (!name || !url) return res.status(400).json({ error: "Nama atau link grup tidak valid" });
      addData = { name: name, url: url };
    }

    let editData = null;
    if (edit) {
      const name = cleanName(edit.name);
      const url = cleanUrl(edit.url);
      if (!name || !url) return res.status(400).json({ error: "Nama atau link grup tidak valid" });
      if (edit.key != null && !keyOk(edit.key)) return res.status(400).json({ error: "Key tidak valid" });
      editData = { key: edit.key || null, oldUrl: typeof edit.oldUrl === "string" ? edit.oldUrl : null, name: name, url: url };
    }

    if (removeKey != null && !keyOk(removeKey)) {
      return res.status(400).json({ error: "Key tidak valid" });
    }
    if (!addData && !editData && !removeKey && !removeUrl) {
      return res.status(400).json({ error: "Tidak ada perubahan" });
    }

    const ref = db.ref("wa_groups");
    const snap = await ref.once("value");
    const val = snap.val();
    const seeded = !!(val && val.seeded);

    const updates = { seeded: true, updatedAt: admin.database.ServerValue.TIMESTAMP };
    const base = Date.now();

    if (!seeded) {
      defaults.forEach((g, i) => {
        const gName = cleanName(g && g.name);
        const gUrl = cleanUrl(g && g.url);
        if (!gName || !gUrl) return;
        if (removeUrl && g.url === removeUrl) return;
        const edited = editData && editData.oldUrl && g.url === editData.oldUrl;
        updates["items/" + ref.child("items").push().key] = {
          name: edited ? editData.name : gName,
          url: edited ? editData.url : gUrl,
          order: base + i
        };
      });
    }

    if (addData) {
      updates["items/" + ref.child("items").push().key] = { name: addData.name, url: addData.url, order: base + 1000 };
    }
    if (removeKey) {
      updates["items/" + removeKey] = null;
    }
    if (editData && seeded && editData.key) {
      updates["items/" + editData.key + "/name"] = editData.name;
      updates["items/" + editData.key + "/url"] = editData.url;
    }

    await ref.update(updates);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[adminGroups] write:", e.message);
    return res.status(500).json({ error: "Gagal menyimpan ke database" });
  }
};
