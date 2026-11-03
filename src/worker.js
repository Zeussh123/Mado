// Site Mado : Worker Cloudflare
// - sert les fichiers statiques de /public (menu public + /admin)
// - stocke le menu (JSON) et les photos dans le namespace KV "MADO"
// - protège les modifications par le mot de passe ADMIN_PASSWORD (secret Cloudflare)

import { handleOrders } from "./orders.js";

const MENU_KEY = "menu";
const STAFF_KEY = "staff-code";
const TKEYS = "table-keys";
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/api/menu" && request.method === "GET") return getMenu(request, env);
      if (path === "/api/menu" && request.method === "PUT") return withAuth(request, env, () => putMenu(request, env));
      if (path === "/api/login" && request.method === "POST") return withAuth(request, env, () => json({ ok: true }));
      if (path === "/api/photo" && request.method === "POST") return withAuth(request, env, () => postPhoto(request, env));
      if (path.startsWith("/api/photo/") && request.method === "DELETE")
        return withAuth(request, env, () => deletePhoto(path.slice(11), env));
      if (path.startsWith("/photos/") && request.method === "GET") return getPhoto(path.slice(8), env);
      if (path === "/api/staff/login" && request.method === "POST") return staffLogin(request, env);
      if (path === "/api/staff/code" && request.method === "GET") return withAuth(request, env, async () => json({ code: (await env.MADO.get(STAFF_KEY)) || "" }));
      if (path === "/api/staff/code" && request.method === "PUT") return withAuth(request, env, () => putStaffCode(request, env));
      if (path === "/api/table-keys" && request.method === "GET") return withAuth(request, env, () => getTableKeys(request, env));
      const mReset = path.match(/^\/api\/table-keys\/(\d{1,3})\/reset$/);
      if (mReset && request.method === "POST") return withAuth(request, env, () => resetTableKey(env, mReset[1]));
      const mSess = path.match(/^\/api\/table\/(\d{1,3})\/session$/);
      if (mSess && request.method === "POST") return tableSession(request, env, mSess[1]);
      if (path.startsWith("/api/orders") || path.startsWith("/api/table/")) return handleOrders(request, env, path, { withAuth, json, menuText, staffAuth, checkTableKey });
      if (path === "/serveur") return env.ASSETS.fetch(new Request(new URL("/", url), request));
      if (path === "/ecran") return env.ASSETS.fetch(new Request(new URL("/ecran.html", url), request));
      if (path === "/cuisine") return env.ASSETS.fetch(new Request(new URL("/cuisine.html", url), request));
      if (path === "/admin") return env.ASSETS.fetch(new Request(new URL("/admin.html", url), request));
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 500);
    }
    return env.ASSETS.fetch(request);
  },
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extra },
  });
}

export async function withAuth(request, env, fn) {
  const expected = env.ADMIN_PASSWORD;
  if (!expected) return json({ error: "ADMIN_PASSWORD non configuré" }, 500);
  const given = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!(await safeEqual(given, expected))) {
    await new Promise((r) => setTimeout(r, 400));
    return json({ error: "Mot de passe incorrect" }, 401);
  }
  return fn();
}

// Code secret de chaque table (dans le QR code) : empêche de commander en tapant juste ?t=1
const randHex = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");
async function loadKeys(env) { try { return JSON.parse((await env.MADO.get(TKEYS)) || "{}"); } catch { return {}; } }
async function rawKeyOk(env, table, k) {
  const keys = await loadKeys(env);
  return !!(keys[table] && k && (await safeEqual(String(k), keys[table])));
}
// Scanner le QR donne un « pass » de table valable 2 h (signé par le serveur).
// Seul ce pass permet de commander : un lien gardé dans le téléphone ne marche plus après 2 h.
const SESSION_MS = 2 * 3600 * 1000;
async function sessionKey(env) {
  let sec = await env.MADO.get("session-secret");
  if (!sec) { sec = randHex(32); await env.MADO.put("session-secret", sec); }
  return crypto.subtle.importKey("raw", new TextEncoder().encode(sec), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}
async function sign(env, table, exp, keyVer) {
  const sig = await crypto.subtle.sign("HMAC", await sessionKey(env), new TextEncoder().encode(`${table}|${exp}|${keyVer}`));
  return [...new Uint8Array(sig)].slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function tableSession(request, env, table) {
  let body = {}; try { body = await request.json(); } catch {}
  if (!(await rawKeyOk(env, table, body.k))) return json({ error: "badkey" }, 403);
  const exp = Date.now() + SESSION_MS;
  // le code de la table entre dans la signature : changer le code dans l'admin coupe aussi les pass en cours
  return json({ token: `${exp}.${await sign(env, table, exp, String(body.k))}`, exp });
}
export async function checkTableKey(env, table, token) {
  const m = /^(\d{13})\.([a-f0-9]{32})$/.exec(String(token || ""));
  if (!m || +m[1] < Date.now()) return false;
  const keys = await loadKeys(env); if (!keys[table]) return false;
  return safeEqual(m[2], await sign(env, table, m[1], keys[table]));
}
async function getTableKeys(request, env) {
  const menu = JSON.parse(await menuText(request, env));
  const n = Math.min(200, parseInt((menu.ordering || {}).tables) || 0);
  const keys = await loadKeys(env); let changed = false;
  for (let i = 1; i <= n; i++) if (!keys[i]) { keys[i] = randHex(5); changed = true; }
  if (changed) await env.MADO.put(TKEYS, JSON.stringify(keys));
  return json({ keys });
}
async function resetTableKey(env, n) {
  const keys = await loadKeys(env); keys[n] = randHex(5);
  await env.MADO.put(TKEYS, JSON.stringify(keys));
  return json({ ok: true, key: keys[n] });
}

// Code serveur (enregistré dans KV, jamais dans le menu public). Le mot de passe admin marche aussi.
export async function staffAuth(request, env) {
  const given = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!given) return null;
  if (env.ADMIN_PASSWORD && (await safeEqual(given, env.ADMIN_PASSWORD))) return "admin";
  const code = await env.MADO.get(STAFF_KEY);
  if (code && (await safeEqual(given, code))) return "staff";
  return null;
}
async function staffLogin(request, env) {
  if (await staffAuth(request, env)) return json({ ok: true });
  await new Promise((r) => setTimeout(r, 800));
  return json({ error: "Code incorrect" }, 401);
}
async function putStaffCode(request, env) {
  const { code } = await request.json().catch(() => ({}));
  const c = String(code || "").trim();
  if (!c) { await env.MADO.delete(STAFF_KEY); return json({ ok: true, code: "" }); }
  if (!/^\d{4,8}$/.test(c)) return json({ error: "Le code doit faire 4 à 8 chiffres" }, 400);
  await env.MADO.put(STAFF_KEY, c);
  return json({ ok: true, code: c });
}

async function safeEqual(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function getMenu(request, env) {
  const body = await menuText(request, env);
  return new Response(body, {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

// Menu courant (enregistré dans KV, complété avec les nouveautés par défaut)
export async function menuText(request, env) {
  let body = await env.MADO.get(MENU_KEY);
  const loadDefault = async () => (await env.ASSETS.fetch(new Request(new URL("/menu.json", request.url)))).text();
  if (!body) {
    // Premier lancement : on part du menu livré avec le site
    body = await loadDefault();
  } else {
    // Menu enregistré avec une ancienne version du site : on complète avec les nouveautés par défaut
    const saved = JSON.parse(body), def = JSON.parse(await loadDefault());
    saved.optionGroups = saved.optionGroups || [];
    const have = new Set(saved.optionGroups.map((g) => g.id)), removed = new Set(saved.removedGroups || []);
    const added = (def.optionGroups || []).filter((g) => !have.has(g.id) && !removed.has(g.id));
    saved.optionGroups.push(...added);
    const addedIds = new Set(added.map((g) => g.id));
    saved.ui = { ...def.ui, ...saved.ui };
    if (saved.ordering === undefined) saved.ordering = def.ordering;
    const di = {}, dc = {};
    for (const c of def.categories) { dc[c.id] = c; for (const it of c.items) di[it.id] = it; }
    for (const c of saved.categories) {
      if (c.suggest === undefined) c.suggest = (dc[c.id] && dc[c.id].suggest) || [];
      for (const it of c.items) {
        const d = di[it.id];
        if (it.options === undefined) it.options = (d && d.options) || [];
        else if (d && addedIds.size) for (const id of d.options || []) if (addedIds.has(id) && !it.options.includes(id)) it.options.push(id);
        if (it.upgrade === undefined) it.upgrade = (d && d.upgrade) || "";
      }
    }
    applyMigrations(saved);
    body = JSON.stringify(saved);
  }
  return body;
}

// Photos retouchées ajoutées pour le gérant (fichiers dans public/img/produits)
const PRODUCT_PHOTOS = {
  "pizzas-pizza-margherita": "/img/produits/pizza-margherita.jpg",
  "pizzas-pizza-kebab": "/img/produits/pizza-kebab.jpg",
};

// Mises à jour ponctuelles d'un menu déjà enregistré (appliquées une seule fois)
function applyMigrations(m){
  m.applied = m.applied || [];
  if (!m.applied.includes("piment-2026-11")) {
    const gr = (id) => (m.optionGroups || []).find((g) => g.id === id);
    const cr = gr("crudites"), sa = gr("sauces");
    if (cr) for (const c of cr.choices) if (c.id === "piment-vert") c.apart = true;
    if (sa && !sa.choices.some((c) => c.id === "piment-poudre"))
      sa.choices.push({ id: "piment-poudre", name: { fr: "Piment en poudre", en: "Spicy (chili powder)", tr: "Pul biber", de: "Chilipulver (scharf)" }, icon: "piment-poudre", photo: "", price: 0, hidden: false, apart: true });
    m.applied.push("piment-2026-11");
  }
  // photos préparées pour le gérant : posées seulement si le produit n'a pas déjà de photo
  if (m.applied.includes("photo-margherita-2026-11")) m.applied.push("photo:pizzas-pizza-margherita");
  for (const [id, url] of Object.entries(PRODUCT_PHOTOS)) {
    if (m.applied.includes("photo:" + id)) continue;
    for (const c of m.categories || []) for (const it of c.items || []) if (it.id === id && !it.photo) it.photo = url;
    m.applied.push("photo:" + id);
  }
  m.applied = [...new Set(m.applied)];
  return m;
}

async function putMenu(request, env) {
  const text = await request.text();
  let data;
  try { data = JSON.parse(text); } catch { return json({ error: "JSON invalide" }, 400); }
  if (!data || !Array.isArray(data.categories)) return json({ error: "Menu invalide" }, 400);
  data.updatedAt = new Date().toISOString();
  const out = JSON.stringify(data);
  // garde la version précédente en sauvegarde
  const prev = await env.MADO.get(MENU_KEY);
  if (prev) await env.MADO.put("menu-backup", prev);
  await env.MADO.put(MENU_KEY, out);
  return json({ ok: true, updatedAt: data.updatedAt });
}

async function postPhoto(request, env) {
  const type = request.headers.get("content-type") || "";
  if (!/^image\/(jpeg|png|webp)$/.test(type)) return json({ error: "Format d'image non supporté" }, 400);
  const buf = await request.arrayBuffer();
  if (buf.byteLength > MAX_PHOTO_BYTES) return json({ error: "Photo trop lourde (max 3 Mo)" }, 413);
  const id = crypto.randomUUID().replace(/-/g, "") + "." + type.split("/")[1].replace("jpeg", "jpg");
  await env.MADO.put("photo:" + id, buf, { metadata: { type } });
  return json({ ok: true, url: "/photos/" + id });
}

async function deletePhoto(id, env) {
  if (!/^[a-z0-9]+\.(jpg|png|webp)$/.test(id)) return json({ error: "id invalide" }, 400);
  await env.MADO.delete("photo:" + id);
  return json({ ok: true });
}

async function getPhoto(id, env) {
  if (!/^[a-z0-9]+\.(jpg|png|webp)$/.test(id)) return new Response("Not found", { status: 404 });
  const { value, metadata } = await env.MADO.getWithMetadata("photo:" + id, { type: "arrayBuffer", cacheTtl: 3600 });
  if (!value) return new Response("Not found", { status: 404 });
  return new Response(value, {
    headers: {
      "content-type": (metadata && metadata.type) || "image/jpeg",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
