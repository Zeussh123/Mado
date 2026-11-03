// Icônes dessinées pour les options (viande, crudités, sauces, accompagnements).
// Chaque icône est un SVG 64×64. Le gérant peut les remplacer par une photo depuis l'admin.
(function () {
  const svg = (body) => `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;

  // Pot de sauce : ramequin blanc + sauce colorée, avec reflet
  const cup = (color, extra = "") => svg(`
    <ellipse cx="32" cy="50" rx="22" ry="5" fill="#000" opacity=".18"/>
    <path d="M10 28 L15 47 Q32 54 49 47 L54 28 Z" fill="#f4f1ec"/>
    <path d="M10 28 L15 47 Q32 54 49 47 L54 28 Z" fill="none" stroke="#d9d3c9" stroke-width="1.5"/>
    <ellipse cx="32" cy="28" rx="22" ry="8" fill="#e8e3da"/>
    <ellipse cx="32" cy="28.5" rx="18.5" ry="6" fill="${color}"/>
    <path d="M22 26.5 Q30 23.5 40 25.5" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" opacity=".45"/>
    ${extra}`);

  const I = {
    // ---------- Viandes ----------
    boeuf: svg(`
      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#000" opacity=".18"/>
      <path d="M14 22 Q32 12 50 22 L48 30 Q32 22 16 30 Z" fill="#8a4a2b"/>
      <path d="M15 31 Q32 22 49 31 L47 39 Q32 31 17 39 Z" fill="#a0582f"/>
      <path d="M17 40 Q32 32 47 40 L45 48 Q32 41 19 48 Z" fill="#7a3f22"/>
      <path d="M20 25 Q28 21 36 23 M22 34 Q30 30 40 32 M24 43 Q32 39 40 42" stroke="#c98a5a" stroke-width="1.5" fill="none" stroke-linecap="round"/>`),
    poulet: svg(`
      <ellipse cx="32" cy="55" rx="18" ry="4" fill="#000" opacity=".18"/>
      <path d="M38 10 C52 10 58 24 50 33 C44 40 34 38 30 34 C26 30 26 18 38 10 Z" fill="#e0a052"/>
      <path d="M40 14 C48 15 52 22 49 28" stroke="#f3c47e" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M31 35 L17 49" stroke="#f4ead8" stroke-width="6" stroke-linecap="round"/>
      <circle cx="14" cy="47" r="4" fill="#f4ead8"/><circle cx="19" cy="52" r="4" fill="#f4ead8"/>`),
    mixte: svg(`
      <ellipse cx="32" cy="55" rx="22" ry="4" fill="#000" opacity=".18"/>
      <path d="M6 30 Q18 22 30 28 L29 35 Q18 30 7 37 Z" fill="#8a4a2b"/>
      <path d="M7 38 Q18 31 29 36 L28 43 Q18 38 8 45 Z" fill="#a0582f"/>
      <path d="M8 46 Q18 40 28 44 L27 50 Q18 46 9 52 Z" fill="#7a3f22"/>
      <path d="M44 12 C56 12 61 24 54 32 C49 37 41 36 38 33 C35 29 35 19 44 12 Z" fill="#e0a052"/>
      <path d="M38 34 L30 46" stroke="#f4ead8" stroke-width="5" stroke-linecap="round"/>
      <circle cx="28" cy="45" r="3.5" fill="#f4ead8"/><circle cx="32" cy="49" r="3.5" fill="#f4ead8"/>`),

    escalope: svg(`
      <ellipse cx="32" cy="54" rx="22" ry="4" fill="#000" opacity=".18"/>
      <path d="M10 34 C8 22 22 14 34 16 C48 16 58 26 54 38 C50 48 30 52 18 46 C12 43 10 39 10 34 Z" fill="#d98b3a"/>
      <path d="M14 34 C13 25 24 19 34 20 C45 20 52 28 49 37 C46 44 30 47 20 42 C16 40 14 37 14 34 Z" fill="#e9a54f"/>
      <g fill="#c4762b"><circle cx="24" cy="28" r="1.6"/><circle cx="33" cy="25" r="1.4"/><circle cx="42" cy="30" r="1.6"/><circle cx="28" cy="38" r="1.4"/><circle cx="39" cy="39" r="1.5"/></g>`),
    tenders: svg(`
      <ellipse cx="32" cy="55" rx="22" ry="4" fill="#000" opacity=".18"/>
      <path d="M8 40 C6 32 20 26 30 30 C34 32 34 40 30 42 C22 46 10 46 8 40 Z" fill="#e0a052" transform="rotate(-18 20 37)"/>
      <path d="M28 32 C26 22 42 16 52 20 C58 23 56 31 52 33 C44 37 30 38 28 32 Z" fill="#d98b3a" transform="rotate(-8 42 27)"/>
      <path d="M22 46 C22 40 36 38 46 42 C52 45 50 51 46 52 C38 54 24 52 22 46 Z" fill="#eab060"/>
      <g fill="#c4762b"><circle cx="16" cy="38" r="1.3"/><circle cx="40" cy="25" r="1.3"/><circle cx="47" cy="27" r="1.2"/><circle cx="32" cy="46" r="1.3"/><circle cx="40" cy="47" r="1.2"/></g>`),
    nuggets: svg(`
      <ellipse cx="32" cy="55" rx="22" ry="4" fill="#000" opacity=".18"/>
      <path d="M8 40 C6 30 16 26 24 30 C30 33 30 44 24 47 C17 50 10 47 8 40 Z" fill="#e0a052"/>
      <path d="M28 26 C28 16 40 12 47 18 C53 23 50 34 42 35 C34 36 28 33 28 26 Z" fill="#d98b3a"/>
      <path d="M32 44 C32 36 44 34 50 39 C56 44 52 53 44 53 C37 53 32 50 32 44 Z" fill="#eab060"/>
      <g fill="#c4762b"><circle cx="15" cy="36" r="1.3"/><circle cx="20" cy="42" r="1.2"/><circle cx="38" cy="22" r="1.3"/><circle cx="44" cy="27" r="1.2"/><circle cx="41" cy="44" r="1.3"/><circle cx="46" cy="48" r="1.2"/></g>`),

    // ---------- Crudités ----------
    tout: svg(`
      <ellipse cx="32" cy="54" rx="22" ry="4" fill="#000" opacity=".18"/>
      <path d="M8 30 Q32 62 56 30 Z" fill="#f4f1ec"/>
      <path d="M12 30 Q20 18 30 26 Q36 16 44 24 Q52 20 54 30 Z" fill="#5cb85c"/>
      <circle cx="22" cy="28" r="5" fill="#e63946"/><circle cx="40" cy="27" r="4" fill="#f4a261"/>
      <circle cx="31" cy="30" r="3.5" fill="#7b2d8b"/><circle cx="47" cy="30" r="3" fill="#f2c94c"/>
      <path d="M8 30 Q32 62 56 30" fill="none" stroke="#d9d3c9" stroke-width="1.5"/>`),
    salade: svg(`
      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#000" opacity=".18"/>
      <path d="M32 52 C14 52 8 38 14 28 C10 18 22 10 30 16 C36 8 50 12 50 22 C58 28 54 46 32 52 Z" fill="#4caf50"/>
      <path d="M32 50 C22 48 18 38 22 30 C20 24 28 20 32 24 C36 20 44 22 42 30 C46 38 42 48 32 50 Z" fill="#8bd16b"/>
      <path d="M32 50 L32 26 M32 40 L24 33 M32 36 L40 30" stroke="#d6f0c2" stroke-width="2" stroke-linecap="round" fill="none"/>`),
    tomate: svg(`
      <ellipse cx="32" cy="55" rx="18" ry="4" fill="#000" opacity=".18"/>
      <circle cx="32" cy="34" r="19" fill="#e63946"/>
      <path d="M20 26 Q24 20 30 21" stroke="#ff8a8a" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M32 17 L28 11 M32 17 L24 18 L30 20 L32 25 L34 20 L40 18 L36 17 Z" fill="#3c9a3c" stroke="#3c9a3c" stroke-width="2" stroke-linejoin="round"/>`),
    oignons: svg(`
      <ellipse cx="32" cy="55" rx="18" ry="4" fill="#000" opacity=".18"/>
      <path d="M32 8 C34 16 50 24 50 38 C50 48 42 53 32 53 C22 53 14 48 14 38 C14 24 30 16 32 8 Z" fill="#9b4f96"/>
      <path d="M32 14 C34 22 44 28 44 39 C44 46 38 50 32 50 C26 50 20 46 20 39 C20 28 30 22 32 14 Z" fill="#c27bbd"/>
      <path d="M32 22 C33 28 38 32 38 40 C38 44 35 47 32 47 C29 47 26 44 26 40 C26 32 31 28 32 22 Z" fill="#ead1e8"/>`),
    "chou-rouge": svg(`
      <ellipse cx="32" cy="55" rx="20" ry="4" fill="#000" opacity=".18"/>
      <circle cx="32" cy="33" r="20" fill="#6a2c70"/>
      <path d="M32 13 C22 20 22 46 32 53 M32 13 C42 20 42 46 32 53 M13 30 Q32 24 51 30 M14 40 Q32 34 50 40" stroke="#c49bd0" stroke-width="2" fill="none"/>`),
    carottes: svg(`
      <ellipse cx="32" cy="55" rx="16" ry="3.5" fill="#000" opacity=".18"/>
      <path d="M22 22 L42 22 L33 56 Q32 58 31 56 Z" fill="#f4892b"/>
      <path d="M25 30 L30 30 M28 38 L33 38 M30 46 L34 46" stroke="#c8641b" stroke-width="2" stroke-linecap="round"/>
      <path d="M32 22 C30 14 24 10 22 8 M32 22 C32 14 34 8 36 6 M32 22 C36 16 42 14 44 12" stroke="#4caf50" stroke-width="3.5" fill="none" stroke-linecap="round"/>`),
    concombre: svg(`
      <ellipse cx="32" cy="55" rx="18" ry="4" fill="#000" opacity=".18"/>
      <circle cx="32" cy="33" r="19" fill="#2e7d32"/>
      <circle cx="32" cy="33" r="16" fill="#c5e8a7"/>
      <circle cx="32" cy="33" r="8" fill="#e6f5d6"/>
      <g fill="#f8fbe9"><ellipse cx="32" cy="27" rx="1.6" ry="2.6"/><ellipse cx="32" cy="39" rx="1.6" ry="2.6"/><ellipse cx="26.5" cy="33" rx="2.6" ry="1.6"/><ellipse cx="37.5" cy="33" rx="2.6" ry="1.6"/></g>`),
    mais: svg(`
      <ellipse cx="32" cy="56" rx="16" ry="3.5" fill="#000" opacity=".18"/>
      <ellipse cx="32" cy="30" rx="11" ry="22" fill="#f2c94c"/>
      <g fill="#e0a800">${Array.from({length: 6}, (_, r) => [26, 32, 38].map(x => `<circle cx="${x}" cy="${14 + r * 6}" r="2.2"/>`).join("")).join("")}</g>
      <path d="M21 36 C14 44 16 54 30 56 C24 50 22 44 24 38 Z" fill="#5cb85c"/>
      <path d="M43 36 C50 44 48 54 34 56 C40 50 42 44 40 38 Z" fill="#4caf50"/>`),
    olives: svg(`
      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#000" opacity=".18"/>
      <ellipse cx="23" cy="34" rx="11" ry="14" fill="#2b2b2b" transform="rotate(-20 23 34)"/>
      <ellipse cx="41" cy="36" rx="11" ry="14" fill="#6b8e23" transform="rotate(18 41 36)"/>
      <ellipse cx="41" cy="36" rx="4" ry="5" fill="#d64545" transform="rotate(18 41 36)"/>
      <path d="M17 27 Q20 23 24 23" stroke="#666" stroke-width="2" fill="none" stroke-linecap="round"/>`),
    "piment-vert": svg(`
      <ellipse cx="32" cy="55" rx="18" ry="3.5" fill="#000" opacity=".18"/>
      <path d="M40 16 C44 30 40 46 18 54 C16 55 15 53 17 52 C30 44 32 30 30 18 Z" fill="#3fa34d"/>
      <path d="M33 22 C35 30 33 40 24 47" stroke="#8fd88f" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M35 17 Q36 10 44 8" stroke="#2e7d32" stroke-width="4" fill="none" stroke-linecap="round"/>`),
    feta: svg(`
      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#000" opacity=".18"/>
      <path d="M12 28 L30 20 L52 26 L34 34 Z" fill="#ffffff"/>
      <path d="M12 28 L34 34 L34 52 L12 46 Z" fill="#ede7da"/>
      <path d="M34 34 L52 26 L52 44 L34 52 Z" fill="#d9d1c1"/>
      <g fill="#cfc6b3"><circle cx="20" cy="38" r="1.5"/><circle cx="27" cy="44" r="1.2"/><circle cx="43" cy="38" r="1.5"/><circle cx="30" cy="27" r="1.2"/></g>`),

    // ---------- Accompagnements ----------
    frites: svg(`
      <ellipse cx="32" cy="56" rx="16" ry="3.5" fill="#000" opacity=".18"/>
      <g fill="#f6c443" stroke="#e0a21a" stroke-width="1">
        <rect x="18" y="12" width="5" height="26" rx="1.5" transform="rotate(-10 20 25)"/><rect x="25" y="8" width="5" height="30" rx="1.5"/>
        <rect x="32" y="10" width="5" height="28" rx="1.5" transform="rotate(6 34 24)"/><rect x="39" y="13" width="5" height="25" rx="1.5" transform="rotate(14 41 25)"/></g>
      <path d="M16 30 L48 30 L44 55 L20 55 Z" fill="#e63946"/>
      <path d="M22 36 Q32 42 42 36" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>`),
    boulgour: svg(`
      <ellipse cx="32" cy="54" rx="22" ry="4" fill="#000" opacity=".18"/>
      <path d="M10 30 Q22 18 32 22 Q42 18 54 30 Z" fill="#d9a441"/>
      <g fill="#b9812a">${[[18,27],[24,24],[30,26],[36,24],[42,26],[47,28],[26,29],[38,29],[33,22]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`).join("")}</g>
      <path d="M8 30 Q32 60 56 30 Z" fill="#2f7fb5"/>
      <path d="M14 36 Q32 50 50 36" stroke="#7fbde6" stroke-width="2" fill="none"/>`),

    // ---------- Sauces ----------
    ketchup: cup("#d62828"),
    mayonnaise: cup("#f6e7b0"),
    algerienne: cup("#e9a23b", `<g fill="#b5121b"><circle cx="26" cy="29" r="1.2"/><circle cx="36" cy="27" r="1.2"/><circle cx="40" cy="30" r="1"/></g>`),
    rouge: cup("#c1121f"),
    bbq: cup("#6b2e1a"),
    bresilienne: cup("#f2b134", `<g fill="#f7dc6f"><circle cx="27" cy="29" r="1.4"/><circle cx="37" cy="28" r="1.4"/></g>`),
    blanche: cup("#f7f5ee", `<g fill="#6aa84f"><circle cx="26" cy="28" r="1"/><circle cx="34" cy="30" r="1"/><circle cx="39" cy="27" r="1"/></g>`),
    samourai: cup("#ee7b30", `<g fill="#b5121b"><circle cx="28" cy="30" r="1.1"/><circle cx="38" cy="28" r="1.1"/></g>`),
    curry: cup("#e8b100"),
    "biggy-burger": cup("#f0a868", `<g fill="#6aa84f"><circle cx="28" cy="29" r="1"/><circle cx="36" cy="28" r="1"/></g>`),
    andalouse: cup("#f08a4b", `<g fill="#3fa34d"><circle cx="27" cy="28" r="1.1"/><circle cx="37" cy="30" r="1.1"/></g>`),
    tartare: cup("#eef0d6", `<g fill="#4caf50"><circle cx="25" cy="29" r="1.2"/><circle cx="31" cy="27" r="1.2"/><circle cx="37" cy="30" r="1.2"/><circle cx="40" cy="27" r="1"/></g>`),
    piment: cup("#b5121b", `<path d="M42 14 C44 22 40 26 34 30" stroke="#e63946" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M42 14 Q44 10 48 10" stroke="#2e7d32" stroke-width="2.5" fill="none" stroke-linecap="round"/>`),
    harissa: cup("#8f1d14", `<g fill="#d9480f"><circle cx="27" cy="29" r="1.2"/><circle cx="36" cy="28" r="1.2"/></g>`),
    sauce: cup("#f39200"),
    aucune: svg(`<circle cx="32" cy="32" r="18" fill="none" stroke="#a9a39a" stroke-width="4"/><path d="M19 45 L45 19" stroke="#a9a39a" stroke-width="4" stroke-linecap="round"/>`),
  };
  window.MADO_ICONS = I;
})();
