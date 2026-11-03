// Site Mado : Worker Cloudflare
// - sert les fichiers statiques de /public (menu public + /admin)
// - stocke le menu (JSON) et les photos dans le namespace KV "MADO"
// - protège les modifications par le mot de passe ADMIN_PASSWORD (secret Cloudflare)

import { handleOrders } from "./orders.js";

const MENU_KEY = "menu";
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
      if (path.startsWith("/api/orders")) return handleOrders(request, env, path, { withAuth, json, menuText });
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
    body = JSON.stringify(saved);
  }
  return body;
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
