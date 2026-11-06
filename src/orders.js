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
  // « grp » = numéro d'addition : les commandes d'un même client à une table partagent le même grp
  try { await db.exec("ALTER TABLE orders ADD COLUMN grp INTEGER"); } catch {}
  // split = les clients de la table ont demandé à payer chacun sa part
  try { await db.exec("ALTER TABLE orders ADD COLUMN split INTEGER"); } catch {}
  // lot gagné à la roue de la chance (voir game.js)
  try { await db.exec("ALTER TABLE orders ADD COLUMN prize TEXT"); } catch {}
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
  const mx = item.optMax || {};
  const groups = (item.options || []).map((id) => (menu.optionGroups || []).find((g) => g.id === id)).filter(Boolean)
    .map((g) => (+mx[g.id] ? { ...g, max: +mx[g.id], choices: g.choices.filter((c) => !c.all) } : g));
  const details = [];
  const sel = line.sel && typeof line.sel === "object" ? line.sel : {};
  for (const g of groups) {
    if (g.showIf && groups.some((x) => x.id === g.showIf.group) && !(Array.isArray(sel[g.showIf.group]) && sel[g.showIf.group].includes(g.showIf.choice))) continue;
    const ids = Array.isArray(sel[g.id]) ? sel[g.id].map(String) : [];
    const chosen = g.choices.filter((c) => ids.includes(c.id) && !c.hidden);
    if (!g.multi && chosen.length > 1) chosen.length = 1;
    if (g.multi && +g.max) { let k = 0; for (let i = 0; i < chosen.length; i++) { const c = chosen[i]; if (c.all || c.apart || +c.price) continue; if (++k > g.max) chosen.splice(i--, 1); } }
    for (const c of chosen) unit += +c.price || 0;
    const counted = chosen.filter((c) => !c.all && !c.apart).length;
    if (+g.free && +g.extraPrice) unit += Math.max(0, counted - g.free) * g.extraPrice;
    const all = chosen.find((c) => c.all);
    const missing = all ? g.choices.filter((c) => (menu.outChoices || []).includes(c.id) && !c.all && !c.apart && !(+c.price) && !c.hidden).map((c) => c.name.fr) : [];
    const names = [all ? all.name.fr + (missing.length ? " sauf " + missing.join(", ") : "") : "", ...chosen.filter((c) => !c.all && !(all && !(+c.price) && !c.apart)).map((c) => c.name.fr)].filter(Boolean);
    if (names.length) details.push({ gid: g.id, group: g.name.fr, choices: names });
    // aucune crudité choisie (confirmé par le client) : on l'écrit pour la cuisine
    else if (g.id === "crudites") details.push({ gid: g.id, group: g.name.fr, choices: ["Sans crudités"], none: true });
  }
  const qty = Math.max(1, Math.min(20, parseInt(line.qty) || 1));
  unit = Math.round(unit * 100) / 100;
  const out = { id: item.id, name: item.name.fr, qty, unit, details, cat: cat.name.fr, catOrder };
  if (line.who) out.who = String(line.who).slice(0, 24);   // qui a commandé (panier commun), pour les reçus séparés
  return out;
}

// La caisse est à part : on oublie parfois « Servie » ou « Encaissée » sur le PC (demande momo).
// - en préparation / prête depuis plus de 40 min → servie
// - servie depuis plus d'1 h sans être encaissée → encaissée (la table redevient libre)
// Durées et règle « nouveau client » réglables dans l'admin (menu.ordering) ; 0 = jamais.
export function orderCfg(menu) {
  const o = (menu && menu.ordering) || {};
  const num = (v, d) => (v === undefined || v === null || v === "" ? d : Math.max(0, Math.min(1440, parseInt(v) || 0)));
  return { servedMin: num(o.autoServedMin, 40), paidMin: num(o.autoPaidMin, 60),
    newClient: ["served", "sent", "minutes"].includes(o.newClient) ? o.newClient : "served", newClientMin: Math.max(1, num(o.newClientMin, 30)) };
}
let autoAt = 0;
async function autoAdvance(env, getMenu) {
  if (Date.now() - autoAt < 20000) return;   // au plus toutes les 20 s
  autoAt = Date.now();
  let cfg; try { cfg = orderCfg(await getMenu()); } catch { return; }
  const AUTO_SERVED_MIN = cfg.servedMin, AUTO_PAID_MIN = cfg.paidMin;
  const now = new Date().toISOString(), ago = (min) => new Date(Date.now() - min * 60e3).toISOString();
  if (AUTO_SERVED_MIN) await env.DB.prepare("UPDATE orders SET status='done', updated_at=? WHERE status IN ('new','ready') AND created_at < ?").bind(now, ago(AUTO_SERVED_MIN)).run();
  if (!AUTO_PAID_MIN) return;
  // le délai d'1 h part du passage en « Servie » (à la main, ou automatique après 40 min)
  const paid = await env.DB.prepare("UPDATE orders SET status='paid', updated_at=? WHERE status='done' AND updated_at < ?").bind(now, ago(AUTO_PAID_MIN)).run();
  if (paid.meta && paid.meta.changes) {
    // tables qui n'ont plus rien en cours : panier et convives vidés
    const { results } = await env.DB.prepare("SELECT table_no FROM table_baskets WHERE table_no NOT IN (SELECT table_no FROM orders WHERE status IN ('new','ready','done'))").all();
    for (const r of results) await resetBasket(env, r.table_no);
  }
}

// Thé offert (libre service) avec une pizza, un pide ou un menu, à table seulement (réglable : menu.tea)
function teaOffered(menu, table, priced) {
  const t = menu.tea || {};
  if (t.enabled === false || table === "EMP") return false;
  const cats = new Set(Array.isArray(t.cats) && t.cats.length ? t.cats : ["pizzas", "pides", "menus"]);
  return priced.some((l) => (menu.categories || []).some((c) => cats.has(c.id) && (c.items || []).some((it) => it.id === l.id)));
}
async function createOrder(env, menu, table, rawLines, rawNote, split, newGroup) {
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
  const id = res.meta.last_row_id;
  if (split) await env.DB.prepare("UPDATE orders SET split=1 WHERE id=?").bind(id).run();
  // même addition que la commande précédente de la table seulement si elle n'est pas encore servie (mêmes clients) ;
  // sinon c'est une nouvelle addition (nouveau client), regroupable à la main sur le PC
  const prev = table === "EMP" || newGroup ? null : await env.DB.prepare("SELECT COALESCE(grp,id) AS g FROM orders WHERE table_no=? AND id<? AND status IN ('new','ready') ORDER BY id DESC LIMIT 1").bind(table, id).first();
  await env.DB.prepare("UPDATE orders SET grp=? WHERE id=?").bind(prev ? prev.g : id, id).run();
  return { id, num: row.n, token, total, tea: teaOffered(menu, table, priced) };
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
// table libérée : panier et convives vidés (version +1 pour que les téléphones déjà ouverts suivent)
async function resetBasket(env, table) {
  await env.DB.prepare("UPDATE table_baskets SET data=?, version=version+1, updated_at=? WHERE table_no=?").bind(JSON.stringify(emptyBasket()), new Date().toISOString(), String(table)).run();
}
const publicBasket = (data, version) => ({ version, members: data.members, lines: data.lines, last: data.last && { ...data.last, ids: undefined } });
// Ce téléphone est-il un nouveau client ? (il n'était pas à la table lors du dernier envoi, et la règle de l'admin le dit)
function isNewClient(d, viewer, cfg, cooking) {
  if (!d.last) return false;
  if (viewer && (d.last.ids || []).includes(viewer)) return false;
  if (cfg.newClient === "sent") return true;
  if (cfg.newClient === "minutes") return Date.now() - (d.last.first || d.last.at || 0) > cfg.newClientMin * 60e3;
  return !cooking;   // "served" : tout est servi
}
// un nouveau client ne voit ni la commande ni les prénoms du groupe d'avant
const viewFor = (d, isNew) => isNew ? { ...d, last: null, members: d.members.filter((x) => !(d.last.ids || []).includes(x.id)) } : d;
async function tableCooking(env, table) {
  const st = await env.DB.prepare("SELECT SUM(status IN ('new','ready')) AS cooking, SUM(status IN ('new','ready','done')) AS open FROM orders WHERE table_no=?").bind(String(table)).first();
  return { cooking: +st.cooking || 0, open: +st.open || 0 };
}
const cleanStr = (x, n) => String(x || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, n);

async function handleBasket(request, env, table, action, { json, menuText, checkTableKey }) {
  const menu = JSON.parse(await menuText(request, env));
  if (!(menu.ordering && menu.ordering.enabled)) return json({ error: "closed" }, 403);
  const maxT = parseInt(menu.ordering.tables) || 0;
  if (+table < 1 || (maxT && +table > maxT)) return json({ error: "Table inconnue" }, 400);
  const nocache = { "cache-control": "no-store" };
  if (!(await checkTableKey(env, table, new URL(request.url).searchParams.get("k")))) return json({ error: "badkey" }, 403);
  if (!action) {
    if (request.method !== "GET") return json({ error: "introuvable" }, 404);
    let b = await readBasket(env, table), isNew = false;
    if (b.data.last && b.data.last.id) {
      const st = await tableCooking(env, table);
      if (!st.open) { await resetBasket(env, table); b = await readBasket(env, table); }   // tout annulé ou encaissé
      else isNew = isNewClient(b.data, cleanStr(new URL(request.url).searchParams.get("m"), 32), orderCfg(menu), st.cooking);
    }
    return json(publicBasket(viewFor(b.data, isNew), b.version), 200, nocache);
  }
  if (request.method !== "POST") return json({ error: "introuvable" }, 404);
  const raw = await request.text();
  if (raw.length > 20000) return json({ error: "Trop grand" }, 413);
  let body; try { body = JSON.parse(raw); } catch { return json({ error: "illisible" }, 400); }
  const me = cleanStr(body.member, 32);
  if (!/^[a-z0-9]{6,32}$/.test(me)) return json({ error: "membre inconnu" }, 400);
  const now = Date.now(), cfg = orderCfg(menu);
  const st = await tableCooking(env, table);
  let meNew = false;
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
    meNew = isNewClient(d, me, cfg, st.cooking);
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
      m.ready = false;   // panier modifié après « J'ai fini » : il repasse en attente
      return {};
    }
    if (action === "ready") { m.ready = !!body.ready; return {}; }
    if (action === "send") {
      if (!orderingOpen(menu)) return { error: "hours", status: 403 };
      if (!d.lines.length) return { error: "Commande vide", status: 400 };
      const so = soldOutIn(menu, d.lines);
      if (so.length) return { error: "soldout", items: so, status: 409 };
      // prénom de chacun sur ses plats (« Invité 1, 2… » pour ceux qui n'en ont pas mis)
      let gi = 0; const names = {};
      for (const x of d.members) if (d.lines.some((l) => l.m === x.id)) names[x.id] = x.name || `Invité ${++gi}`;
      const o = await createOrder(env, menu, table, d.lines.map((l) => ({ ...l, who: names[l.m] })), body.note, !!body.split, meNew);
      if (!o) return { error: "Commande vide", status: 400 };
      // qui était à la table pour cet envoi (ils continuent de voir la commande) ; « first » = première commande du groupe
      const prevIds = meNew || !d.last ? [] : d.last.ids || [];
      const ids = [...new Set([...prevIds, ...d.members.filter((x) => !(meNew && d.last && (d.last.ids || []).includes(x.id))).map((x) => x.id)])];
      const first = !meNew && d.last ? d.last.first || d.last.at : now;
      d.last = { id: o.id, num: o.num, token: o.token, total: o.total, tea: o.tea, by: m.name, at: now, first, ids, n: d.lines.reduce((n, l) => n + l.qty, 0) };
      if (meNew) d.members = d.members.filter((x) => ids.includes(x.id));   // le groupe d'avant quitte la liste
      d.lines = []; d.members.forEach((x) => (x.ready = false));
      return { order: o };
    }
    return { error: "introuvable", status: 404 };
  });
  if (out.error) return json({ error: out.error, ...(out.items ? { items: out.items } : {}) }, out.status || 400);
  const sent = action === "send";
  return json({ ok: true, ...(out.result || {}), basket: publicBasket(viewFor(out.data, !sent && isNewClient(out.data, me, cfg, st.cooking)), out.version) }, 200, nocache);
}

// plats en rupture de stock dans une commande (noms en français)
function soldOutIn(menu, lines) {
  const so = new Set(menu.outItems || menu.soldOut || []), oc = new Set(menu.outChoices || []), out = [];
  const push = (x) => { if (!out.includes(x)) out.push(x); };
  for (const l of lines || []) for (const c of menu.categories) for (const it of c.items) if (it.id === l.id) {
    if (so.has(l.id)) { push(it.name.fr); continue; }
    const sel = l.sel && typeof l.sel === "object" ? l.sel : {};
    for (const gid of it.options || []) {
      const g = (menu.optionGroups || []).find((x) => x.id === gid); if (!g) continue;
      const ids = Array.isArray(sel[gid]) ? sel[gid] : [], all = g.choices.some((x) => x.all && ids.includes(x.id));
      // « Tout » : les crudités épuisées sont simplement absentes, pas de blocage
      for (const cid of ids) if (oc.has(cid)) { const ch = g.choices.find((x) => x.id === cid); if (ch && !(all && !(+ch.price) && !ch.apart)) push(ch.name.fr); }
    }
  }
  return out;
}
function randomToken() {
  const b = new Uint8Array(12); crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// ---------- routes ----------
// Horaires de commande (onglet Infos de l'admin) : {1:[{from,to}],…,7:[…]}, lundi = 1. Vide = toujours ouvert.
export function orderingOpen(menu, now = parisNow()) {
  const sch = (menu.ordering || {}).schedule;
  if (!(menu.ordering || {}).useSchedule || !sch) return true;
  const prev = now.day === 1 ? 7 : now.day - 1;
  for (const r of sch[now.day] || []) {
    const f = toMin(r.from), t = toMin(r.to); if (f === null || t === null) continue;
    if (t > f ? now.min >= f && now.min < t : now.min >= f) return true;
  }
  for (const r of sch[prev] || []) {   // créneau qui passe minuit
    const f = toMin(r.from), t = toMin(r.to); if (f === null || t === null) continue;
    if (t <= f && now.min < t) return true;
  }
  return false;
}

export async function handleOrders(request, env, path, { withAuth, json, menuText, staffAuth, checkTableKey }) {
  if (!env.DB) return json({ error: "Les commandes ne sont pas encore activées sur ce site." }, 503);
  await ensureSchema(env.DB);
  await autoAdvance(env, async () => JSON.parse(await menuText(request, env)));
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
    if (!staff && !(await checkTableKey(env, table, body.k))) return json({ error: "badkey" }, 403);
    if (!staff && !orderingOpen(menu)) return json({ error: "hours" }, 403);
    const so = staff ? [] : soldOutIn(menu, body.lines);
    if (so.length) return json({ error: "soldout", items: so }, 409);
    const o = await createOrder(env, menu, table, body.lines, body.note);
    if (!o) return json({ error: "Commande vide" }, 400);
    return json({ ok: true, ...o });
  }

  // Panier commun de la table (tous les téléphones d'une même table)
  const mBasket = path.match(/^\/api\/table\/(\d{1,3})(?:\/(join|add|remove|qty|ready|send))?$/);
  if (mBasket) return handleBasket(request, env, mBasket[1], mBasket[2] || "", { json, menuText, checkTableKey });

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
        ? env.DB.prepare("SELECT id,day,num,table_no,status,total,lines,note,created_at,updated_at,COALESCE(grp,id) AS grp,split,prize FROM orders WHERE day=? ORDER BY id DESC LIMIT 500").bind(day)
        : env.DB.prepare("SELECT id,day,num,table_no,status,total,lines,note,created_at,updated_at,COALESCE(grp,id) AS grp,split,prize FROM orders WHERE day=? OR status IN ('new','ready','done') ORDER BY id DESC LIMIT 300").bind(day);
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
      // commande annulée ou encaissée : s'il ne reste rien en cours sur la table, on vide le panier et la liste des convives
      if (status === "cancelled" || status === "paid") {
        const o = await env.DB.prepare("SELECT table_no FROM orders WHERE id=?").bind(+mSet[1]).first();
        if (o && o.table_no && o.table_no !== "EMP") {
          const left = await env.DB.prepare("SELECT COUNT(*) AS n FROM orders WHERE table_no=? AND status IN ('new','ready','done')").bind(o.table_no).first();
          if (!left.n) await resetBasket(env, o.table_no);
        }
      }
      return json({ ok: true });
    });
  }

  // Plan des tables : encaisser une addition
  const mGrp = path.match(/^\/api\/orders\/group\/(\d+)\/paid$/);
  if (mGrp && m === "POST") {
    return withAuth(request, env, async () => {
      const o = await env.DB.prepare("SELECT table_no FROM orders WHERE COALESCE(grp,id)=? LIMIT 1").bind(+mGrp[1]).first();
      await env.DB.prepare("UPDATE orders SET status='paid', updated_at=? WHERE COALESCE(grp,id)=? AND status IN ('new','ready','done')").bind(new Date().toISOString(), +mGrp[1]).run();
      // plus rien en cours sur la table : le panier commun repart à zéro
      if (o) { const left = await env.DB.prepare("SELECT COUNT(*) AS n FROM orders WHERE table_no=? AND status IN ('new','ready')").bind(o.table_no).first();
        if (!left.n) await resetBasket(env, o.table_no); }
      return json({ ok: true });
    });
  }
  // Regrouper une commande avec une autre addition / la séparer
  const mMerge = path.match(/^\/api\/orders\/(\d+)\/(merge|split)$/);
  if (mMerge && m === "POST") {
    return withAuth(request, env, async () => {
      const id = +mMerge[1];
      if (mMerge[2] === "split") { await env.DB.prepare("UPDATE orders SET grp=id WHERE id=?").bind(id).run(); return json({ ok: true }); }
      const { into } = await request.json().catch(() => ({}));
      const a = await env.DB.prepare("SELECT table_no, COALESCE(grp,id) AS g FROM orders WHERE id=?").bind(id).first();
      const b = await env.DB.prepare("SELECT table_no FROM orders WHERE COALESCE(grp,id)=? LIMIT 1").bind(+into).first();
      if (!a || !b || a.table_no !== b.table_no) return json({ error: "Même table seulement" }, 400);
      await env.DB.prepare("UPDATE orders SET grp=? WHERE COALESCE(grp,id)=?").bind(+into, a.g).run();
      return json({ ok: true });
    });
  }

  // Plan des tables : encaisser / libérer toutes les commandes servies d'une table
  const mTable = path.match(/^\/api\/orders\/table\/(\d{1,3})\/paid$/);
  if (mTable && m === "POST") {
    return withAuth(request, env, async () => {
      await env.DB.prepare("UPDATE orders SET status='paid', updated_at=? WHERE table_no=? AND status IN ('new','ready','done')").bind(new Date().toISOString(), mTable[1]).run();
      // table libérée : le panier commun repart à zéro pour les clients suivants
      await resetBasket(env, mTable[1]);
      return json({ ok: true });
    });
  }

  return json({ error: "introuvable" }, 404);
}

// ---------- Statistiques (admin) ----------
// ?from=AAAA-MM-JJ&to=AAAA-MM-JJ (92 jours max). Commandes annulées exclues.
// Panier moyen = chiffre d'affaires / nombre d'additions (une table ou un client qui commande en plusieurs fois compte une fois).
export async function stats(env, url) {
  await ensureSchema(env.DB);
  const today = parisNow().date, re = /^\d{4}-\d{2}-\d{2}$/;
  let to = url.searchParams.get("to"); if (!re.test(to || "")) to = today;
  let from = url.searchParams.get("from"); if (!re.test(from || "")) from = new Date(Date.parse(to) - 29 * 864e5).toISOString().slice(0, 10);
  if (Date.parse(to) - Date.parse(from) > 92 * 864e5) from = new Date(Date.parse(to) - 92 * 864e5).toISOString().slice(0, 10);
  const { results } = await env.DB.prepare("SELECT day,table_no,total,lines,created_at,COALESCE(grp,id) AS grp FROM orders WHERE day>=? AND day<=? AND status!='cancelled' LIMIT 20000").bind(from, to).all();
  const hourFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hourCycle: "h23", weekday: "short" });
  const days = {}, items = {}, hours = Array.from({ length: 24 }, () => 0), wd = Array.from({ length: 7 }, () => 0), grps = new Set();
  let revenue = 0, takeaway = 0;
  for (const o of results) {
    const d = (days[o.day] ||= { day: o.day, orders: 0, revenue: 0, grps: new Set() });
    d.orders++; d.revenue += o.total; d.grps.add(o.grp); grps.add(o.grp); revenue += o.total;
    if (o.table_no === "EMP") takeaway++;
    const p = Object.fromEntries(hourFmt.formatToParts(new Date(o.created_at)).map((x) => [x.type, x.value]));
    hours[+p.hour]++; wd[["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(p.weekday)]++;
    let lines = []; try { lines = JSON.parse(o.lines); } catch {}
    for (const l of lines) { const it = (items[l.id] ||= { id: l.id, name: l.name, qty: 0, revenue: 0 }); it.qty += l.qty; it.revenue += l.qty * l.unit; }
  }
  const r2 = (n) => Math.round(n * 100) / 100;
  return {
    from, to, orders: results.length, revenue: r2(revenue), baskets: grps.size, avg: grps.size ? r2(revenue / grps.size) : 0, takeaway,
    days: Object.values(days).sort((a, b) => a.day.localeCompare(b.day)).map((d) => ({ day: d.day, orders: d.orders, revenue: r2(d.revenue), avg: r2(d.revenue / d.grps.size) })),
    items: Object.values(items).sort((a, b) => b.qty - a.qty || b.revenue - a.revenue).map((x) => ({ ...x, revenue: r2(x.revenue) })),
    hours, weekdays: wd,
  };
}
