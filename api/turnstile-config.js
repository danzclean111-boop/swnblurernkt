module.exports = function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.setHeader("Cache-Control", "no-store");
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }
  const siteKey = process.env.TURNSTILE_SITE_KEY;
  if (!siteKey) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).json({ error: "TURNSTILE_SITE_KEY belum diisi" });
  }
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return res.status(200).json({ siteKey: siteKey });
};
