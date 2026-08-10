import { json, clean, SITES } from './_lib.js';

// Public. Returns published reviews for one site.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const site = clean(url.searchParams.get('site'), 40);
  if (!SITES.includes(site)) return json({ ok: true, reviews: [] });

  try {
    const { results } = await env.DB.prepare(
      `SELECT name, town, job, when_done, body, reply
         FROM reviews
        WHERE site = ? AND published = 1
        ORDER BY position DESC, id DESC
        LIMIT 60`
    ).bind(site).all();
    return json({ ok: true, reviews: results || [] });
  } catch (err) {
    return json({ ok: true, reviews: [] });
  }
}
