// Notes des clients après leur commande. 5 étoiles : le client est envoyé sur la fiche Google.
// Moins de 5 : il peut écrire un message privé au restaurant (il est prévenu qu'il n'est pas publié).
let ready = false;
async function schema(db) {
  if (ready) return;
  await db.exec("CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, cid TEXT NOT NULL, created_at TEXT NOT NULL, table_no TEXT, num INTEGER, rating INTEGER NOT NULL, text TEXT, lang TEXT, UNIQUE(order_id, cid))");
  ready = true;
}

export async function postFeedback(request, env, { json, checkTableKey }) {
  if (!env.DB) return json({ error: "indisponible" }, 503);
  let b = {}; try { b = await request.json(); } catch {}
  const table = String(b.table || ""), order = parseInt(b.order), rating = parseInt(b.rating);
  if (!/^\d{1,3}$/.test(table) || !order || !(rating >= 1 && rating <= 5)) return json({ error: "invalide" }, 400);
  if (!(await checkTableKey(env, table, String(b.k || "")))) return json({ error: "Non autorisé" }, 403);
  await schema(env.DB);
  // seulement pour une vraie commande de cette table, du jour
  const o = await env.DB.prepare("SELECT id, num, created_at FROM orders WHERE id = ? AND table_no = ?").bind(order, table).first();
  if (!o || Date.now() - Date.parse(o.created_at) > 864e5) return json({ error: "commande inconnue" }, 404);
  const text = String(b.text || "").slice(0, 1000), cid = String(b.cid || "x").slice(0, 20);
  const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM feedback WHERE order_id = ?").bind(order).first();
  if (n.n >= 12) return json({ ok: true });
  await env.DB.prepare(
    "INSERT INTO feedback (order_id, cid, created_at, table_no, num, rating, text, lang) VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
    "ON CONFLICT(order_id, cid) DO UPDATE SET rating = excluded.rating, text = CASE WHEN excluded.text <> '' THEN excluded.text ELSE feedback.text END"
  ).bind(order, cid, new Date().toISOString(), table, o.num, rating, text, String(b.lang || "fr").slice(0, 2)).run();
  return json({ ok: true });
}

export async function listFeedback(env, url) {
  await schema(env.DB);
  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get("days")) || 30));
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const { results } = await env.DB.prepare("SELECT * FROM feedback WHERE created_at >= ? ORDER BY created_at DESC LIMIT 300").bind(since).all();
  const counts = [0, 0, 0, 0, 0]; for (const r of results) counts[r.rating - 1]++;
  return { days, items: results, counts, avg: results.length ? results.reduce((n, r) => n + r.rating, 0) / results.length : 0 };
}
