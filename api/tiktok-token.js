const crypto = require("crypto");

const ALLOWED_ORIGINS = ["https://danzclean.arisu.biz.id"];
const TTL_SEC = 30 * 60;
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }

  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.indexOf(origin) === -1) {
    return res.status(403).json({ error: "Origin tidak diizinkan" });
  }

  const secret = process.env.TIKTOK_HD_TOKEN_SECRET;
  const cfSecret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !cfSecret) {
    console.error("[tiktok-token] TIKTOK_HD_TOKEN_SECRET / TURNSTILE_SECRET_KEY belum diisi");
    return res.status(500).json({ error: "Server belum dikonfigurasi" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const cf = body && body.turnstileToken;
  if (!cf || typeof cf !== "string") {
    return res.status(400).json({ error: "Verifikasi Cloudflare belum selesai." });
  }

  try {
    const params = new URLSearchParams({ secret: cfSecret, response: cf });
    const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    if (ip) params.set("remoteip", ip);
    const r = await fetch(VERIFY_URL, { method: "POST", body: params });
    const j = await r.json();
    if (!j || !j.success) {
      return res.status(403).json({ error: "Verifikasi Cloudflare gagal, coba lagi." });
    }
  } catch (e) {
    console.error("[tiktok-token] siteverify error", e);
    return res.status(502).json({ error: "Gagal menghubungi Cloudflare, coba lagi." });
  }

  const exp = Math.floor(Date.now() / 1000) + TTL_SEC;
  const sig = crypto.createHmac("sha256", secret).update(String(exp)).digest("hex");
  return res.status(200).json({ token: exp + "." + sig, exp });
};
