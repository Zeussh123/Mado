// Roue de la chance après la commande.
// Le tirage se fait ici (le téléphone ne peut pas choisir son lot) :
// - une seule partie par commande ;
// - une seule partie par téléphone (identifiant gardé dans le navigateur) pendant « resetHours » heures ;
// - seulement pour une vraie commande de la table, passée il y a moins de « resetHours » heures.
// Un lot gagné est écrit sur la commande (colonne prize) : la cuisine le voit et imprime un ticket cadeau.
let ready = false;
async function schema(db) {
  if (ready) return;
  await db.exec("CREATE TABLE IF NOT EXISTS game_spins (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL UNIQUE, cid TEXT NOT NULL, created_at TEXT NOT NULL, table_no TEXT, prize_id TEXT, prize TEXT)");
  await db.exec("CREATE INDEX IF NOT EXISTS game_spins_cid ON game_spins(cid, created_at)");
  try { await db.exec("ALTER TABLE orders ADD COLUMN prize TEXT"); } catch {}
  ready = true;
}

export function gameConfig(menu) {
  const g = menu.game || {};
  const prizes = (g.prizes || []).filter((p) => p && p.name && (p.name.fr || "").trim() && +p.chance > 0);
  return { enabled: !!g.enabled && prizes.length > 0, resetHours: Math.min(48, Math.max(1, +g.resetHours || 3)), prizes };
}

function draw(prizes) {
  const r = (crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32) * 100;
  let acc = 0;
  for (const p of prizes) { acc += +p.chance; if (r < acc) return p; }
  return null;
}

export async function spin(request, env, menu, { json, checkTableKey }) {
  if (!env.DB) return json({ error: "indisponible" }, 503);
  const cfg = gameConfig(menu);
  if (!cfg.enabled) return json({ error: "off" }, 403);
  let b = {}; try { b = await request.json(); } catch {}
  const table = String(b.table || ""), order = parseInt(b.order), cid = String(b.cid || "").slice(0, 32);
  if (!/^\d{1,3}$/.test(table) || !order || cid.length < 8) return json({ error: "invalide" }, 400);
  if (!(await checkTableKey(env, table, String(b.k || "")))) return json({ error: "Non autorisé" }, 403);
  await schema(env.DB);
  const o = await env.DB.prepare("SELECT id, status, created_at FROM orders WHERE id = ? AND table_no = ?").bind(order, table).first();
  const win = cfg.resetHours * 3600e3;
  if (!o || o.status === "cancelled" || Date.now() - Date.parse(o.created_at) > win) return json({ error: "order" }, 404);
  // déjà joué pour cette commande : on renvoie le même résultat
  const done = await env.DB.prepare("SELECT prize_id, prize FROM game_spins WHERE order_id = ?").bind(order).first();
  if (done) return json({ already: true, prizeId: done.prize_id || null, prize: done.prize || null });
  const since = new Date(Date.now() - win).toISOString();
  const last = await env.DB.prepare("SELECT created_at FROM game_spins WHERE cid = ? AND created_at >= ? ORDER BY created_at DESC LIMIT 1").bind(cid, since).first();
  if (last) return json({ error: "played", next: new Date(Date.parse(last.created_at) + win).toISOString() }, 429);
  const p = draw(cfg.prizes);
  const prizeFr = p ? p.name.fr : null;
  try {
    await env.DB.prepare("INSERT INTO game_spins (order_id, cid, created_at, table_no, prize_id, prize) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(order, cid, new Date().toISOString(), table, p ? p.id : null, prizeFr).run();
  } catch {
    // deux téléphones de la même table au même moment : le premier a gagné la course
    const d = await env.DB.prepare("SELECT prize_id, prize FROM game_spins WHERE order_id = ?").bind(order).first();
    return json({ already: true, prizeId: d && d.prize_id || null, prize: d && d.prize || null });
  }
  if (p) await env.DB.prepare("UPDATE orders SET prize = ?, updated_at = ? WHERE id = ?").bind(prizeFr, new Date().toISOString(), order).run();
  return json({ prizeId: p ? p.id : null, prize: prizeFr });
}

export async function gameStats(env, url) {
  await schema(env.DB);
  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get("days")) || 30));
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const tot = await env.DB.prepare("SELECT COUNT(*) AS n FROM game_spins WHERE created_at >= ?").bind(since).first();
  const { results } = await env.DB.prepare("SELECT prize, COUNT(*) AS n FROM game_spins WHERE created_at >= ? AND prize IS NOT NULL GROUP BY prize ORDER BY n DESC").bind(since).all();
  return { days, spins: tot.n, wins: results };
}
