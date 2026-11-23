const crypto = require("crypto");

const ALLOWED_ORIGINS = ["https://danzclean.arisu.biz.id"];
const TTL_SEC = 10 * 60; // token berlaku 10 menit

module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }

  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.indexOf(origin) === -1) {
    return res.status(403).json({ error: "Origin tidak diizinkan" });
  }

  const secret = process.env.TIKTOK_HD_TOKEN_SECRET;
  if (!secret) {
    console.error("[tiktok-token] TIKTOK_HD_TOKEN_SECRET belum diisi");
    return res.status(500).json({ error: "Server belum dikonfigurasi" });
  }

  const exp = Math.floor(Date.now() / 1000) + TTL_SEC;
  const sig = crypto.createHmac("sha256", secret).update(String(exp)).digest("hex");
  return res.status(200).json({ token: exp + "." + sig, exp });
};
