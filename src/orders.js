// Commandes à table : enregistrées dans la base D1 "DB", lues par la page Cuisine.
// Les prix sont recalculés ici à partir du menu, le client ne peut pas les modifier.

const MAX_LINES = 40;
const STATUSES = ["new", "ready", "done", "paid", "cancelled"];

let schemaReady = false;
async function ensureSchema(db) {
  if (schemaReady) return;
  await db.exec(
    "CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, day TEXT NOT NULL, num INTEGER NOT NULL, table_no TEXT NOT NULL, status TEXT NOT NULL, total REAL NOT NULL, lines TEXT NOT NULL, note TEXT, token TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"
  );
  await db.exec("CREATE INDEX IF NOT EXISTS orders_day ON orders(day)");
  schemaReady = true;
}

// ---------- heure de Paris ----------
function parisNow() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date()).map((x) => [x.type, x.value])
  );
  return { day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(p.weekday) + 1, min: +p.hour * 60 + +p.minute, date: `${p.year}-${p.month}-${p.day}` };
}
const toMin = (hm) => { if (!hm) return null; const [h, m] = hm.split(":").map(Number); return h * 60 + (m || 0); };
function promoActive(p, now) {
  if (!p.active) return false;
  if (p.startDate && now.date < p.startDate) return false;
  if (p.endDate && now.date > p.endDate) return false;
  const f = toMin(p.from), to = toMin(p.to); let day = now.day;
  if (f !== null && to !== null && to <= f) { if (now.min >= f) {} else if (now.min < to) day = day === 1 ? 7 : day - 1; else return false; }
  else { if (f !== null && now.min < f) return false; if (to !== null && now.min >= to) return false; }
  return !p.days || !p.days.length || p.days.includes(day);
}

// ---------- calcul d'une ligne ----------
function priceLine(menu, line, promos) {
  let item = null;
  for (const c of menu.categories) for (const it of c.items) if (it.id === line.id && !it.hidden && !c.hidden) item = it;
  if (!item) return null;
  let unit = +item.price || 0;
  for (const p of promos) for (const x of p.items || []) if (x.id === item.id && x.price !== null && x.price !== "" && +x.price < unit) unit = +x.price;
  const groups = (item.options || []).map((id) => (menu.optionGroups || []).find((g) => g.id === id)).filter(Boolean);
  const details = [];
  const sel = line.sel && typeof line.sel === "object" ? line.sel : {};
  for (const g of groups) {
    const ids = Array.isArray(sel[g.id]) ? sel[g.id].map(String) : [];
    const chosen = g.choices.filter((c) => ids.includes(c.id) && !c.hidden);
    if (!g.multi && chosen.length > 1) chosen.length = 1;
    for (const c of chosen) unit += +c.price || 0;
    const counted = chosen.filter((c) => !c.all).length;
    if (+g.free && +g.extraPrice) unit += Math.max(0, counted - g.free) * g.extraPrice;
    const all = chosen.find((c) => c.all);
    const names = [all ? all.name.fr : "", ...chosen.filter((c) => !c.all && !(all && !(+c.price))).map((c) => c.name.fr)].filter(Boolean);
    if (names.length) details.push({ gid: g.id, group: g.name.fr, choices: names });
  }
  const qty = Math.max(1, Math.min(20, parseInt(line.qty) || 1));
  unit = Math.round(unit * 100) / 100;
  return { id: item.id, name: item.name.fr, qty, unit, details };
}

function randomToken() {
  const b = new Uint8Array(12); crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// ---------- routes ----------
export async function handleOrders(request, env, path, { withAuth, json, menuText }) {
  if (!env.DB) return json({ error: "Les commandes ne sont pas encore activées sur ce site." }, 503);
  await ensureSchema(env.DB);
  const m = request.method;

  // Le client envoie sa commande
  if (path === "/api/orders" && m === "POST") {
    const raw = await request.text();
    if (raw.length > 30000) return json({ error: "Commande trop grande" }, 413);
    let body; try { body = JSON.parse(raw); } catch { return json({ error: "Commande illisible" }, 400); }
    const menu = JSON.parse(await menuText(request, env));
    if (!(menu.ordering && menu.ordering.enabled)) return json({ error: "closed" }, 403);
    const table = String(body.table || "").trim().slice(0, 10);
    const maxT = parseInt(menu.ordering.tables) || 0;
    if (!/^\d{1,3}$/.test(table) || +table < 1 || (maxT && +table > maxT)) return json({ error: "Table inconnue" }, 400);
    const lines = (Array.isArray(body.lines) ? body.lines : []).slice(0, MAX_LINES);
    const now = parisNow(), promos = (menu.promos || []).filter((p) => promoActive(p, now));
    const priced = lines.map((l) => priceLine(menu, l, promos)).filter(Boolean);
    if (!priced.length) return json({ error: "Commande vide" }, 400);
    const total = Math.round(priced.reduce((n, l) => n + l.unit * l.qty, 0) * 100) / 100;
    const note = String(body.note || "").slice(0, 300);
    const iso = new Date().toISOString(), token = randomToken();
    const row = await env.DB.prepare("SELECT COALESCE(MAX(num),0)+1 AS n FROM orders WHERE day=?").bind(now.date).first();
    const res = await env.DB.prepare(
      "INSERT INTO orders (day,num,table_no,status,total,lines,note,token,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)"
    ).bind(now.date, row.n, table, "new", total, JSON.stringify(priced), note, token, iso, iso).run();
    return json({ ok: true, id: res.meta.last_row_id, num: row.n, token, total });
  }

  // Le client suit sa commande
  const mStatus = path.match(/^\/api\/orders\/(\d+)$/);
  if (mStatus && m === "GET") {
    const token = new URL(request.url).searchParams.get("token") || "";
    const o = await env.DB.prepare("SELECT id,num,status,table_no FROM orders WHERE id=? AND token=?").bind(+mStatus[1], token).first();
    if (!o) return json({ error: "introuvable" }, 404);
    return json(o, 200, { "cache-control": "no-store" });
  }

  // Page Cuisine : liste des commandes du jour
  if (path === "/api/orders" && m === "GET") {
    return withAuth(request, env, async () => {
      // ?day=AAAA-MM-JJ pour l'historique ; sinon le jour même + tout ce qui n'est pas encore encaissé
      const q = new URL(request.url).searchParams.get("day");
      const day = q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : parisNow().date;
      const stmt = q
        ? env.DB.prepare("SELECT id,day,num,table_no,status,total,lines,note,created_at,updated_at FROM orders WHERE day=? ORDER BY id DESC LIMIT 500").bind(day)
        : env.DB.prepare("SELECT id,day,num,table_no,status,total,lines,note,created_at,updated_at FROM orders WHERE day=? OR status IN ('new','ready','done') ORDER BY id DESC LIMIT 300").bind(day);
      const { results } = await stmt.all();
      return json({ orders: results.map((o) => ({ ...o, lines: JSON.parse(o.lines) })) }, 200, { "cache-control": "no-store" });
    });
  }

  // Page Cuisine : changer le statut
  const mSet = path.match(/^\/api\/orders\/(\d+)\/status$/);
  if (mSet && m === "POST") {
    return withAuth(request, env, async () => {
      const { status } = await request.json().catch(() => ({}));
      if (!STATUSES.includes(status)) return json({ error: "statut inconnu" }, 400);
      await env.DB.prepare("UPDATE orders SET status=?, updated_at=? WHERE id=?").bind(status, new Date().toISOString(), +mSet[1]).run();
      return json({ ok: true });
    });
  }

  // Plan des tables : encaisser / libérer toutes les commandes servies d'une table
  const mTable = path.match(/^\/api\/orders\/table\/(\d{1,3})\/paid$/);
  if (mTable && m === "POST") {
    return withAuth(request, env, async () => {
      await env.DB.prepare("UPDATE orders SET status='paid', updated_at=? WHERE table_no=? AND status IN ('new','ready','done')").bind(new Date().toISOString(), mTable[1]).run();
      return json({ ok: true });
    });
  }

  return json({ error: "introuvable" }, 404);
}
