// Plan de salle : partagé par l'admin (éditeur), la cuisine (plan des tables) et le menu client (nom de la table).
// menu.floor = { zones: [{id, name, w, h}], tables: [{n, label, zone, x, y, w, h, shape, seats}] }
// x, y, w, h sont en cases de grille. n = numéro technique de la table (celui du QR, ?t=n).
(function () {
  const F = {};
  F.tables = (menu) => ((menu && menu.floor && menu.floor.tables) || []);
  F.find = (menu, n) => F.tables(menu).find((t) => String(t.n) === String(n));
  // nom affiché : « Terrasse 1 », sinon « Table 3 »
  F.label = (menu, n, word = "Table") => {
    const t = F.find(menu, n);
    return (t && t.label && t.label.trim()) || `${word} ${n}`;
  };
  F.maxN = (menu) => F.tables(menu).reduce((m, t) => Math.max(m, +t.n || 0), 0);

  // chaises autour d'une table, en % de la boîte de la table
  F.chairs = (t) => {
    const s = Math.max(0, Math.min(16, +t.seats || 0)); if (!s) return [];
    const out = [];
    if (t.shape === "round") {
      for (let i = 0; i < s; i++) { const a = (i / s) * Math.PI * 2 - Math.PI / 2; out.push({x: 50 + Math.cos(a) * 62, y: 50 + Math.sin(a) * 62, r: a * 180 / Math.PI + 90}); }
      return out;
    }
    const horiz = t.w >= t.h; // chaises sur les grands côtés
    const ends = s % 2 ? 1 : 0, side = (s - ends) / 2;
    for (let i = 0; i < side; i++) {
      const p = ((i + .5) / side) * 100;
      if (horiz) { out.push({x: p, y: -16, r: 0}); out.push({x: p, y: 116, r: 180}); }
      else { out.push({x: -16, y: p, r: 270}); out.push({x: 116, y: p, r: 90}); }
    }
    if (ends) out.push(horiz ? {x: 112, y: 50, r: 90} : {x: 50, y: 112, r: 180});
    return out;
  };
  F.chairsHtml = (t) => F.chairs(t).map((c) => `<i class="chair" style="left:${c.x}%;top:${c.y}%;transform:translate(-50%,-50%) rotate(${c.r}deg)"></i>`).join("");

  // styles communs (chaises, grille) injectés une seule fois
  F.css = `
.fl-zone{position:relative;width:100%;border-radius:16px;container-type:inline-size}
.fl-t{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border-radius:10px;padding:2px;box-sizing:border-box}
.fl-t.round{border-radius:50%}
.fl-t .chair{position:absolute;width:min(22px,2.6cqw);height:min(12px,1.4cqw);border-radius:6px 6px 3px 3px;background:#5b5f66;pointer-events:none}
`;
  F.injectCss = () => { if (document.getElementById("fl-css")) return; const st = document.createElement("style"); st.id = "fl-css"; st.textContent = F.css; document.head.appendChild(st); };
  window.MADO_FLOOR = F;
})();
