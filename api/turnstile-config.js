module.exports = function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.setHeader("Cache-Control", "no-store");
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }
  const env = process.env;
  let siteKey = env.TURNSTILE_SITE_KEY || "";
  if (!siteKey && env.TURNSTILE_SERVER_SECRET && env.TURNSTILE_SECRET_KEY) {
    siteKey = env.TURNSTILE_SECRET_KEY;
  }
  if (!siteKey) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).json({ error: "Site key Turnstile belum diatur" });
  }
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return res.status(200).json({ siteKey: siteKey });
};
