import { json, clean, SITES } from './_lib.js';

const MAX_PER_HOUR = 3;

async function hashIP(ip) {
  const data = new TextEncoder().encode('rr:' + ip);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  let b;
  try { b = await request.json(); } catch { return json({ ok: false, error: 'Bad request.' }, 400); }

  // Hidden field: humans never see it, bots fill it. Pretend success.
  if (clean(b.website, 80)) return json({ ok: true });

  const site = SITES.includes(clean(b.site, 40)) ? clean(b.site, 40) : 'realroofers';
  const name = clean(b.name, 80);
  const town = clean(b.town, 80);
  const job  = clean(b.job, 160);
  const when = clean(b.when_done, 40);
  const body = clean(b.body, 1500);

  if (name.length < 2)  return json({ ok: false, error: 'Please put your name.' }, 400);
  if (body.length < 15) return json({ ok: false, error: 'Please write a little more.' }, 400);

  const ip = request.headers.get('cf-connecting-ip') || '0.0.0.0';
  const ipHash = await hashIP(ip);

  try {
    const since = new Date(Date.now() - 3600 * 1000).toISOString();
    const row = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM reviews WHERE ip_hash = ? AND created_at > ?`
    ).bind(ipHash, since).first();
    if (row && row.n >= MAX_PER_HOUR) {
      return json({ ok: false, error: 'That is enough for now. Try again later.' }, 429);
    }

    await env.DB.prepare(
      `INSERT INTO reviews (created_at, site, name, town, job, when_done, body, reply, published, position, ip_hash)
       VALUES (?,?,?,?,?,?,?,'',1,0,?)`
    ).bind(new Date().toISOString(), site, name, town, job, when, body, ipHash).run();
  } catch (err) {
    return json({ ok: false, error: 'Could not save that. Please text me instead.' }, 500);
  }

  return json({ ok: true });
}
