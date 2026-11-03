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
  await db.exec("CREATE TABLE IF NOT EXISTS table_baskets (table_no TEXT PRIMARY KEY, data TEXT NOT NULL, version INTEGER NOT NULL, updated_at TEXT NOT NULL)");
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
  let item = null, cat = null, catOrder = 0;
  menu.categories.forEach((c, ci) => { for (const it of c.items) if (it.id === line.id && !it.hidden && !c.hidden) { item = it; cat = c; catOrder = ci; } });
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
    const counted = chosen.filter((c) => !c.all && !c.apart).length;
    if (+g.free && +g.extraPrice) unit += Math.max(0, counted - g.free) * g.extraPrice;
    const all = chosen.find((c) => c.all);
    const names = [all ? all.name.fr : "", ...chosen.filter((c) => !c.all && !(all && !(+c.price) && !c.apart)).map((c) => c.name.fr)].filter(Boolean);
    if (names.length) details.push({ gid: g.id, group: g.name.fr, choices: names });
  }
  const qty = Math.max(1, Math.min(20, parseInt(line.qty) || 1));
  unit = Math.round(unit * 100) / 100;
  return { id: item.id, name: item.name.fr, qty, unit, details, cat: cat.name.fr, catOrder };
}

async function createOrder(env, menu, table, rawLines, rawNote) {
  const lines = (Array.isArray(rawLines) ? rawLines : []).slice(0, MAX_LINES);
  const now = parisNow(), promos = (menu.promos || []).filter((p) => promoActive(p, now));
  const priced = lines.map((l) => priceLine(menu, l, promos)).filter(Boolean);
  if (!priced.length) return null;
  const total = Math.round(priced.reduce((n, l) => n + l.unit * l.qty, 0) * 100) / 100;
  const note = String(rawNote || "").slice(0, 300);
  const iso = new Date().toISOString(), token = randomToken();
  const row = await env.DB.prepare("SELECT COALESCE(MAX(num),0)+1 AS n FROM orders WHERE day=?").bind(now.date).first();
  const res = await env.DB.prepare(
    "INSERT INTO orders (day,num,table_no,status,total,lines,note,token,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)"
  ).bind(now.date, row.n, table, "new", total, JSON.stringify(priced), note, token, iso, iso).run();
  return { id: res.meta.last_row_id, num: row.n, token, total };
}

// ---------- panier commun ----------
const BASKET_TTL = 4 * 3600 * 1000;   // un panier oublié depuis 4 h repart à zéro
const MAX_MEMBERS = 20, MAX_BASKET_LINES = 80;
const emptyBasket = () => ({ members: [], lines: [], last: null });
async function readBasket(env, table) {
  const r = await env.DB.prepare("SELECT data, version, updated_at FROM table_baskets WHERE table_no=?").bind(table).first();
  if (!r) return { data: emptyBasket(), version: 0, exists: false };
  const data = JSON.parse(r.data);
  if (Date.now() - Date.parse(r.updated_at) > BASKET_TTL) return { data: { ...emptyBasket(), last: null }, version: r.version, exists: true };
  return { data, version: r.version, exists: true };
}
// modification avec contrôle de version : si deux téléphones écrivent en même temps, on recommence
async function updateBasket(env, table, fn) {
  for (let i = 0; i < 5; i++) {
    const cur = await readBasket(env, table);
    const out = await fn(cur.data);
    if (out && out.error) return out;
    const iso = new Date().toISOString(), v = cur.version + 1;
    const res = cur.exists
      ? await env.DB.prepare("UPDATE table_baskets SET data=?, version=?, updated_at=? WHERE table_no=? AND version=?").bind(JSON.stringify(cur.data), v, iso, table, cur.version).run()
      : await env.DB.prepare("INSERT OR IGNORE INTO table_baskets (table_no, data, version, updated_at) VALUES (?,?,?,?)").bind(table, JSON.stringify(cur.data), v, iso).run();
    if (res.meta.changes) return { data: cur.data, version: v, result: out };
  }
  return { error: "Réessayez", status: 409 };
}
const publicBasket = (data, version) => ({ version, members: data.members, lines: data.lines, last: data.last });
const cleanStr = (x, n) => String(x || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, n);

async function handleBasket(request, env, table, action, { json, menuText }) {
  const menu = JSON.parse(await menuText(request, env));
  if (!(menu.ordering && menu.ordering.enabled)) return json({ error: "closed" }, 403);
  const maxT = parseInt(menu.ordering.tables) || 0;
  if (+table < 1 || (maxT && +table > maxT)) return json({ error: "Table inconnue" }, 400);
  const nocache = { "cache-control": "no-store" };
  if (!action) {
    if (request.method !== "GET") return json({ error: "introuvable" }, 404);
    const b = await readBasket(env, table);
    return json(publicBasket(b.data, b.version), 200, nocache);
  }
  if (request.method !== "POST") return json({ error: "introuvable" }, 404);
  const raw = await request.text();
  if (raw.length > 20000) return json({ error: "Trop grand" }, 413);
  let body; try { body = JSON.parse(raw); } catch { return json({ error: "illisible" }, 400); }
  const me = cleanStr(body.member, 32);
  if (!/^[a-z0-9]{6,32}$/.test(me)) return json({ error: "membre inconnu" }, 400);
  const now = Date.now();
  const touch = (d) => {
    let m = d.members.find((x) => x.id === me);
    if (!m) {
      if (d.members.length >= MAX_MEMBERS) d.members = d.members.filter((x) => d.lines.some((l) => l.m === x.id));
      const used = new Set(d.members.map((x) => x.c));
      let c = 0; while (used.has(c) && c < 7) c++;
      m = { id: me, name: "", c, ready: false, t: now }; d.members.push(m);
    }
    m.t = now; return m;
  };
  const out = await updateBasket(env, table, async (d) => {
    const m = touch(d);
    if (action === "join") { m.name = cleanStr(body.name, 20); return {}; }
    if (action === "add") {
      if (d.lines.length >= MAX_BASKET_LINES) return { error: "Panier plein", status: 400 };
      const l = body.line || {};
      if (!menu.categories.some((c) => c.items.some((it) => it.id === l.id))) return { error: "Produit inconnu", status: 400 };
      d.lines.push({ k: cleanStr(l.k, 40) || String(now), m: me, id: String(l.id), qty: Math.max(1, Math.min(20, parseInt(l.qty) || 1)), sel: l.sel && typeof l.sel === "object" ? l.sel : {}, price: +l.price || 0, t: now });
      m.ready = false; return {};
    }
    if (action === "remove" || action === "qty") {
      const i = d.lines.findIndex((x) => x.k === body.k && x.m === me);   // chacun ne touche qu'à ses plats
      if (i < 0) return {};
      const q = action === "remove" ? 0 : Math.min(20, parseInt(body.qty) || 0);
      if (q <= 0) d.lines.splice(i, 1); else d.lines[i].qty = q;
      return {};
    }
    if (action === "ready") { m.ready = !!body.ready; return {}; }
    if (action === "send") {
      if (!d.lines.length) return { error: "Commande vide", status: 400 };
      const o = await createOrder(env, menu, table, d.lines, body.note);
      if (!o) return { error: "Commande vide", status: 400 };
      d.last = { id: o.id, num: o.num, token: o.token, total: o.total, by: m.name, at: now, n: d.lines.reduce((n, l) => n + l.qty, 0) };
      d.lines = []; d.members.forEach((x) => (x.ready = false));
      return { order: o };
    }
    return { error: "introuvable", status: 404 };
  });
  if (out.error) return json({ error: out.error }, out.status || 400);
  return json({ ok: true, ...(out.result || {}), basket: publicBasket(out.data, out.version) }, 200, nocache);
}

function randomToken() {
  const b = new Uint8Array(12); crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// ---------- routes ----------
export async function handleOrders(request, env, path, { withAuth, json, menuText, staffAuth }) {
  if (!env.DB) return json({ error: "Les commandes ne sont pas encore activées sur ce site." }, 503);
  await ensureSchema(env.DB);
  const m = request.method;

  // Le client envoie sa commande
  if (path === "/api/orders" && m === "POST") {
    const raw = await request.text();
    if (raw.length > 30000) return json({ error: "Commande trop grande" }, 413);
    let body; try { body = JSON.parse(raw); } catch { return json({ error: "Commande illisible" }, 400); }
    const menu = JSON.parse(await menuText(request, env));
    // un serveur (code serveur ou mot de passe admin) peut commander même si les commandes clients sont fermées, et « à emporter »
    const staff = request.headers.get("authorization") ? await staffAuth(request, env) : null;
    if (request.headers.get("authorization") && !staff) return json({ error: "Code incorrect" }, 401);
    if (!staff && !(menu.ordering && menu.ordering.enabled)) return json({ error: "closed" }, 403);
    const table = String(body.table || "").trim().slice(0, 10);
    const maxT = parseInt((menu.ordering || {}).tables) || 0;
    const takeaway = staff && table === "EMP";
    if (!takeaway && (!/^\d{1,3}$/.test(table) || +table < 1 || (maxT && +table > maxT))) return json({ error: "Table inconnue" }, 400);
    const o = await createOrder(env, menu, table, body.lines, body.note);
    if (!o) return json({ error: "Commande vide" }, 400);
    return json({ ok: true, ...o });
  }

  // Panier commun de la table (tous les téléphones d'une même table)
  const mBasket = path.match(/^\/api\/table\/(\d{1,3})(?:\/(join|add|remove|qty|ready|send))?$/);
  if (mBasket) return handleBasket(request, env, mBasket[1], mBasket[2] || "", { json, menuText });

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
      // table libérée : le panier commun repart à zéro pour les clients suivants
      await env.DB.prepare("DELETE FROM table_baskets WHERE table_no=?").bind(mTable[1]).run();
      return json({ ok: true });
    });
  }

  return json({ error: "introuvable" }, 404);
}
