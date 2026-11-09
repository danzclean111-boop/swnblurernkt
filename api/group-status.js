const lastKnown = {};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchInvite(code) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    return await fetch('https://chat.whatsapp.com/' + code, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
        'Accept-Language': 'id,en;q=0.8'
      },
      signal: ctrl.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function check(code) {
  const r = await fetchInvite(code);
  if (r.status === 404 || r.status === 410) {
    return { state: 'dead', status: r.status, title: '' };
  }
  if (!r.ok) return { state: 'error', status: r.status, title: '' };

  const html = await r.text();
  const m = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i)
         || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:title["']/i);
  const title = m ? m[1].trim() : '';
  const alive = !!title && !/^whatsapp (group )?invite$/i.test(title);
  return { state: alive ? 'alive' : 'dead', status: r.status, title };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const code = String((req.query && req.query.code) || '');
  if (!/^[A-Za-z0-9]{10,40}$/.test(code)) {
    res.setHeader('Cache-Control', 's-maxage=60');
    return res.status(200).json({ ok: true, active: false });
  }

  const success = (active, info) => {
    lastKnown[code] = { active, t: Date.now() };
    res.setHeader(
      'Cache-Control',
      active ? 's-maxage=15, stale-while-revalidate=300' : 's-maxage=5'
    );
    return res.status(200).json({ ok: true, active, status: info.status, title: info.title });
  };

  const fail = (reason) => {
    res.setHeader('Cache-Control', 'no-store');
    const k = lastKnown[code];
    if (k && Date.now() - k.t < 10 * 60 * 1000) {
      return res.status(200).json({ ok: true, active: k.active, stale: true });
    }
    return res.status(200).json({ ok: false, reason });
  };

  try {
    let a = await check(code);

    if (a.state === 'error') {
      await sleep(600);
      a = await check(code);
    }

    if (a.state === 'dead') {
      await sleep(700);
      const b = await check(code);
      if (b.state !== 'dead') a = b;
    }

    if (a.state === 'alive') return success(true, a);
    if (a.state === 'dead') return success(false, a);
    return fail('whatsapp-http-' + a.status);
  } catch (e) {
    return fail('error: ' + (e && e.message ? e.message : e));
  }
};
