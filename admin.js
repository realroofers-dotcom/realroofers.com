import { json, clean, authorised, SITES } from './_lib.js';

export async function onRequestPost({ request, env }) {
  if (!authorised(request, env)) return json({ ok: false, error: 'Wrong password.' }, 401);

  let b;
  try { b = await request.json(); } catch { return json({ ok: false, error: 'Bad request.' }, 400); }

  const action = clean(b.action, 20);
  const db = env.DB;

  try {
    if (action === 'list') {
      const { results } = await db.prepare(
        `SELECT id, site, name, town, job, when_done, body, reply, published, position
           FROM reviews ORDER BY id DESC LIMIT 200`
      ).all();
      return json({ ok: true, reviews: results || [] });
    }

    if (action === 'save') {
      const id        = Number(b.id) || 0;
      const site      = SITES.includes(clean(b.site, 40)) ? clean(b.site, 40) : 'realroofers';
      const name      = clean(b.name, 120);
      const town      = clean(b.town, 120);
      const job       = clean(b.job, 200);
      const whenDone  = clean(b.when_done, 60);
      const body      = clean(b.body, 4000);
      const reply     = clean(b.reply, 4000);
      const published = b.published ? 1 : 0;
      const position  = Number(b.position) || 0;

      if (!name) return json({ ok: false, error: 'Needs a name.' }, 400);
      if (body.length < 3) return json({ ok: false, error: 'Needs the review text.' }, 400);

      if (id) {
        await db.prepare(
          `UPDATE reviews SET site=?, name=?, town=?, job=?, when_done=?, body=?, reply=?,
                              published=?, position=? WHERE id=?`
        ).bind(site, name, town, job, whenDone, body, reply, published, position, id).run();
        return json({ ok: true, id });
      }

      const res = await db.prepare(
        `INSERT INTO reviews (created_at, site, name, town, job, when_done, body, reply, published, position)
         VALUES (?,?,?,?,?,?,?,?,?,?)`
      ).bind(new Date().toISOString(), site, name, town, job, whenDone, body, reply, published, position).run();
      return json({ ok: true, id: res.meta ? res.meta.last_row_id : 0 });
    }

    if (action === 'delete') {
      const id = Number(b.id) || 0;
      if (!id) return json({ ok: false, error: 'No id.' }, 400);
      await db.prepare(`DELETE FROM reviews WHERE id = ?`).bind(id).run();
      return json({ ok: true });
    }

    return json({ ok: false, error: 'Unknown action.' }, 400);
  } catch (err) {
    return json({ ok: false, error: 'Database error. Check the D1 binding is named DB.' }, 500);
  }
}
