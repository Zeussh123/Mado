// Roue de la chance après la commande.
// Le tirage se fait ici (le téléphone ne peut pas choisir son lot). Trois modes (admin › Roue) :
// - "phone"  : 1 tour par commande, et 1 tour par téléphone toutes les « resetHours » heures ;
// - "order"  : 1 tour par commande, sans limite par téléphone ;
// - "amount" : 1 tour par tranche de « step » € dépensés dans la commande (ex. 25 € → 2 tours si step = 10).
// Il faut une vraie commande de la table, passée il y a moins de « resetHours » heures.
// Les lots gagnés sont écrits sur la commande (colonne prize) : la cuisine les voit et imprime un ticket cadeau.
let ready = false;
async function schema(db) {
  if (ready) return;
  await db.exec("CREATE TABLE IF NOT EXISTS game_plays (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, n INTEGER NOT NULL, cid TEXT NOT NULL, created_at TEXT NOT NULL, table_no TEXT, prize_id TEXT, prize TEXT, UNIQUE(order_id, n))");
  await db.exec("CREATE INDEX IF NOT EXISTS game_plays_cid ON game_plays(cid, created_at)");
  try { await db.exec("ALTER TABLE orders ADD COLUMN prize TEXT"); } catch {}
  // anciennes parties (première version : une seule partie par commande)
  try { await db.exec("INSERT OR IGNORE INTO game_plays (order_id, n, cid, created_at, table_no, prize_id, prize) SELECT order_id, 1, cid, created_at, table_no, prize_id, prize FROM game_spins"); } catch {}
  ready = true;
}

export function gameConfig(menu) {
  const g = menu.game || {};
  const prizes = (g.prizes || []).filter((p) => p && p.name && (p.name.fr || "").trim() && +p.chance > 0);
  const mode = ["phone", "order", "amount"].includes(g.mode) ? g.mode : "phone";
  return { enabled: !!g.enabled && prizes.length > 0, mode, step: Math.max(1, +g.step || 10), maxSpins: Math.min(20, Math.max(1, parseInt(g.maxSpins) || 5)), resetHours: Math.min(48, Math.max(1, +g.resetHours || 3)), prizes };
}

function draw(prizes) {
  const r = (crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32) * 100;
  let acc = 0;
  for (const p of prizes) { acc += +p.chance; if (r < acc) return p; }
  return null;
}

// combien de tours cette commande donne-t-elle ?
const allowed = (cfg, o) => cfg.mode === "amount" ? Math.min(cfg.maxSpins, Math.floor((+o.total + 1e-9) / cfg.step)) : 1;

async function context(request, env, menu, checkTableKey) {
  const cfg = gameConfig(menu);
  if (!cfg.enabled) return { err: ["off", 403] };
  let b = {}; try { b = await request.json(); } catch {}
  const table = String(b.table || ""), order = parseInt(b.order), cid = String(b.cid || "").slice(0, 32);
  if (!/^\d{1,3}$/.test(table) || !order || cid.length < 8) return { err: ["invalide", 400] };
  if (!(await checkTableKey(env, table, String(b.k || "")))) return { err: ["Non autorisé", 403] };
  await schema(env.DB);
  const o = await env.DB.prepare("SELECT id, status, total, created_at FROM orders WHERE id = ? AND table_no = ?").bind(order, table).first();
  if (!o || o.status === "cancelled" || Date.now() - Date.parse(o.created_at) > cfg.resetHours * 3600e3) return { err: ["order", 404] };
  const { results } = await env.DB.prepare("SELECT n, prize_id, prize FROM game_plays WHERE order_id = ? ORDER BY n").bind(order).all();
  return { cfg, table, order, cid, o, plays: results, total: allowed(cfg, o) };
}
const view = (c) => ({ mode: c.cfg.mode, total: c.total, left: Math.max(0, c.total - c.plays.length), results: c.plays.map((p) => ({ prizeId: p.prize_id || null, prize: p.prize || null })) });

export async function gameStatus(request, env, menu, { json, checkTableKey }) {
  if (!env.DB) return json({ error: "indisponible" }, 503);
  const c = await context(request, env, menu, checkTableKey);
  if (c.err) return json({ error: c.err[0] }, c.err[1]);
  return json(view(c));
}

export async function spin(request, env, menu, { json, checkTableKey }) {
  if (!env.DB) return json({ error: "indisponible" }, 503);
  const c = await context(request, env, menu, checkTableKey);
  if (c.err) return json({ error: c.err[0] }, c.err[1]);
  if (c.plays.length >= c.total) return json({ ...view(c), error: c.total ? "none" : "amount" }, 409);
  if (c.cfg.mode === "phone") {
    const win = c.cfg.resetHours * 3600e3, since = new Date(Date.now() - win).toISOString();
    const last = await env.DB.prepare("SELECT created_at FROM game_plays WHERE cid = ? AND created_at >= ? ORDER BY created_at DESC LIMIT 1").bind(c.cid, since).first();
    if (last) return json({ error: "played", next: new Date(Date.parse(last.created_at) + win).toISOString() }, 429);
  }
  const p = draw(c.cfg.prizes), n = c.plays.length + 1;
  try {
    await env.DB.prepare("INSERT INTO game_plays (order_id, n, cid, created_at, table_no, prize_id, prize) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(c.order, n, c.cid, new Date().toISOString(), c.table, p ? p.id : null, p ? p.name.fr : null).run();
  } catch {
    return json({ error: "busy" }, 409);   // deux téléphones de la table en même temps : on réessaie
  }
  if (p) {
    const { results } = await env.DB.prepare("SELECT prize FROM game_plays WHERE order_id = ? AND prize IS NOT NULL ORDER BY n").bind(c.order).all();
    await env.DB.prepare("UPDATE orders SET prize = ?, updated_at = ? WHERE id = ?").bind(results.map((r) => r.prize).join(" + "), new Date().toISOString(), c.order).run();
  }
  c.plays.push({ n, prize_id: p ? p.id : null, prize: p ? p.name.fr : null });
  return json({ ...view(c), prizeId: p ? p.id : null, prize: p ? p.name.fr : null });
}

export async function gameStats(env, url) {
  await schema(env.DB);
  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get("days")) || 30));
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const tot = await env.DB.prepare("SELECT COUNT(*) AS n FROM game_plays WHERE created_at >= ?").bind(since).first();
  const { results } = await env.DB.prepare("SELECT prize, COUNT(*) AS n FROM game_plays WHERE created_at >= ? AND prize IS NOT NULL GROUP BY prize ORDER BY n DESC").bind(since).all();
  return { days, spins: tot.n, wins: results };
}
