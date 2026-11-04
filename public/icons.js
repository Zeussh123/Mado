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

  // Bol vu de côté avec garniture
  const bowl = (top) => svg(`
    <ellipse cx="32" cy="54" rx="22" ry="4" fill="#000" opacity=".18"/>
    <path d="M14 26 Q20 16 30 22 Q38 14 46 22 Q54 20 54 30 L10 30 Q10 24 14 26 Z" fill="#5cb85c"/>
    ${top}
    <path d="M8 30 Q32 62 56 30 Z" fill="#f4f1ec"/>
    <path d="M12 36 Q32 50 52 36" stroke="#f39200" stroke-width="2.5" fill="none"/>`);
  const slices = (c1, c2) => `<path d="M16 28 Q24 20 32 26 L30 30 Q24 26 18 31 Z" fill="${c1}"/><path d="M30 26 Q40 18 48 26 L46 30 Q40 25 32 30 Z" fill="${c2}"/>`;

  // Canette générique de couleur (pas de logo de marque)
  const can = (body, band) => svg(`
    <ellipse cx="32" cy="57" rx="13" ry="3" fill="#000" opacity=".18"/>
    <path d="M20 12 Q20 8 24 8 L40 8 Q44 8 44 12 L44 52 Q44 56 40 56 L24 56 Q20 56 20 52 Z" fill="${body}"/>
    <rect x="20" y="10" width="24" height="5" fill="#c9c9c9"/><rect x="20" y="49" width="24" height="5" fill="#c9c9c9"/>
    <path d="M20 26 Q32 34 44 26 L44 34 Q32 42 20 34 Z" fill="${band}"/>
    <rect x="23" y="16" width="3" height="32" fill="#fff" opacity=".25"/>`);

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

    "bowl-boeuf": bowl(slices("#8a4a2b", "#a0582f") + `<circle cx="24" cy="24" r="2.5" fill="#e63946"/>`),
    "bowl-poulet": bowl(slices("#e0a052", "#eab060") + `<circle cx="24" cy="24" r="2.5" fill="#e63946"/>`),
    "bowl-mixte": bowl(slices("#8a4a2b", "#e0a052") + `<circle cx="24" cy="24" r="2.5" fill="#e63946"/>`),
    "bowl-chicken": bowl(`<path d="M16 29 C14 22 24 19 30 23 C33 26 31 30 28 30 Z" fill="#d98b3a"/><path d="M32 28 C31 21 42 18 48 23 C51 27 48 30 44 30 Z" fill="#e9a54f"/><g fill="#c4762b"><circle cx="22" cy="25" r="1.2"/><circle cx="40" cy="24" r="1.2"/></g>`),
    "bowl-kofte": bowl(`<ellipse cx="22" cy="26" rx="7" ry="5" fill="#7a3f22"/><ellipse cx="34" cy="24" rx="7" ry="5" fill="#8a4a2b"/><ellipse cx="45" cy="27" rx="6" ry="4.5" fill="#6b351c"/><g fill="#a86a44"><circle cx="20" cy="24" r="1"/><circle cx="33" cy="22" r="1"/><circle cx="44" cy="25" r="1"/></g>`),
    "supp-viande": svg(`
      <ellipse cx="32" cy="54" rx="20" ry="4" fill="#000" opacity=".18"/>
      <path d="M8 26 Q22 16 36 24 L34 32 Q22 26 10 34 Z" fill="#8a4a2b"/>
      <path d="M9 35 Q22 27 35 33 L33 41 Q22 36 11 43 Z" fill="#a0582f"/>
      <path d="M10 44 Q22 37 34 42 L32 49 Q22 45 12 51 Z" fill="#7a3f22"/>
      <circle cx="46" cy="22" r="13" fill="#f39200"/>
      <path d="M46 15 V29 M39 22 H53" stroke="#1a1100" stroke-width="4" stroke-linecap="round"/>`),
    "supp-feta": svg(`
      <ellipse cx="30" cy="54" rx="20" ry="4" fill="#000" opacity=".18"/>
      <path d="M8 36 L20 30 L32 35 L20 41 Z" fill="#fffdf6"/><path d="M8 36 L20 41 L20 51 L8 46 Z" fill="#ece6d6"/><path d="M20 41 L32 35 L32 45 L20 51 Z" fill="#ddd5c0"/>
      <path d="M24 26 L35 21 L46 26 L35 31 Z" fill="#fffdf6"/><path d="M24 26 L35 31 L35 40 L24 35 Z" fill="#ece6d6"/><path d="M35 31 L46 26 L46 35 L35 40 Z" fill="#ddd5c0"/>
      <g fill="#cfc6ad"><circle cx="13" cy="42" r=".9"/><circle cx="16" cy="46" r=".8"/><circle cx="27" cy="42" r=".9"/><circle cx="29" cy="31" r=".8"/><circle cx="40" cy="31" r=".9"/></g>
      <circle cx="48" cy="44" r="11" fill="#f39200"/>
      <path d="M48 38 V50 M42 44 H54" stroke="#1a1100" stroke-width="3.6" stroke-linecap="round"/>`),

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

    "can-cola": can("#c8102e", "#fff"),
    "can-zero": can("#1a1a1a", "#c8102e"),
    "can-orange": can("#f68b1f", "#1f5fbf"),
    "can-tropical": can("#ffb000", "#e4572e"),
    "can-tea": can("#f2c230", "#1e7b3a"),
    "can-lemon": can("#2e9e44", "#f7e35a"),
    canette: svg(`
      <ellipse cx="32" cy="57" rx="13" ry="3" fill="#000" opacity=".18"/>
      <path d="M20 12 Q20 8 24 8 L40 8 Q44 8 44 12 L44 52 Q44 56 40 56 L24 56 Q20 56 20 52 Z" fill="#d62828"/>
      <rect x="20" y="10" width="24" height="5" fill="#c9c9c9"/><rect x="20" y="49" width="24" height="5" fill="#c9c9c9"/>
      <path d="M24 22 Q32 28 40 22 L40 40 Q32 34 24 40 Z" fill="#fff" opacity=".85"/>
      <rect x="23" y="16" width="3" height="32" fill="#fff" opacity=".25"/>`),

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
    "piment-poudre": svg(`
      <ellipse cx="32" cy="52" rx="24" ry="4.5" fill="#000" opacity=".18"/>
      <path d="M8 30 L13 46 Q30 53 47 46 L52 30 Z" fill="#f4f1ec"/>
      <path d="M8 30 L13 46 Q30 53 47 46 L52 30 Z" fill="none" stroke="#d9d3c9" stroke-width="1.5"/>
      <ellipse cx="30" cy="30" rx="22" ry="7.5" fill="#e8e3da"/>
      <path d="M11 30 Q14 20 30 18 Q46 20 49 30 Q30 37 11 30 Z" fill="#c4321b"/>
      <rect x="26.8" y="24.0" width="2.1" height="0.9" rx=".3" fill="#e3501f" transform="rotate(137 27.8 24.4)"/><rect x="27.2" y="22.4" width="1.9" height="0.8" rx=".3" fill="#9e1a12" transform="rotate(111 28.2 22.8)"/><rect x="32.3" y="22.2" width="1.8" height="1.5" rx=".3" fill="#c7261b" transform="rotate(31 33.2 22.9)"/><rect x="22.0" y="22.0" width="1.3" height="1.3" rx=".3" fill="#c7261b" transform="rotate(12 22.6 22.6)"/><rect x="42.3" y="27.4" width="1.6" height="0.9" rx=".3" fill="#d93a1c" transform="rotate(30 43.1 27.8)"/><rect x="24.5" y="30.0" width="1.5" height="1.3" rx=".3" fill="#c7261b" transform="rotate(163 25.2 30.6)"/><rect x="22.1" y="27.4" width="1.3" height="0.8" rx=".3" fill="#9e1a12" transform="rotate(52 22.7 27.8)"/><rect x="25.4" y="21.1" width="1.6" height="1.3" rx=".3" fill="#f07a2a" transform="rotate(116 26.2 21.8)"/><rect x="24.9" y="30.0" width="2.2" height="1.0" rx=".3" fill="#f07a2a" transform="rotate(147 26.0 30.5)"/><rect x="15.2" y="25.3" width="2.2" height="1.0" rx=".3" fill="#e3501f" transform="rotate(18 16.3 25.8)"/><rect x="24.1" y="22.1" width="1.7" height="1.5" rx=".3" fill="#e3501f" transform="rotate(107 24.9 22.9)"/><rect x="32.2" y="21.3" width="2.0" height="1.4" rx=".3" fill="#f07a2a" transform="rotate(80 33.1 22.0)"/><rect x="25.3" y="21.2" width="2.0" height="1.2" rx=".3" fill="#f07a2a" transform="rotate(23 26.3 21.8)"/><rect x="17.8" y="25.7" width="1.3" height="1.4" rx=".3" fill="#d93a1c" transform="rotate(165 18.4 26.4)"/><rect x="42.5" y="25.6" width="1.6" height="1.1" rx=".3" fill="#f07a2a" transform="rotate(171 43.3 26.1)"/><rect x="38.6" y="24.8" width="1.4" height="0.9" rx=".3" fill="#c7261b" transform="rotate(15 39.3 25.2)"/><rect x="29.7" y="20.7" width="1.5" height="1.1" rx=".3" fill="#e3501f" transform="rotate(127 30.5 21.2)"/><rect x="33.6" y="26.6" width="1.6" height="0.9" rx=".3" fill="#d93a1c" transform="rotate(110 34.4 27.1)"/><rect x="27.6" y="26.8" width="1.7" height="1.5" rx=".3" fill="#c7261b" transform="rotate(59 28.4 27.6)"/><rect x="33.1" y="23.4" width="2.1" height="0.8" rx=".3" fill="#c7261b" transform="rotate(150 34.2 23.8)"/><rect x="29.1" y="20.9" width="1.8" height="1.1" rx=".3" fill="#f07a2a" transform="rotate(144 30.0 21.4)"/><rect x="40.5" y="23.9" width="1.9" height="1.3" rx=".3" fill="#e3501f" transform="rotate(173 41.5 24.6)"/><rect x="15.4" y="27.1" width="2.5" height="1.3" rx=".3" fill="#9e1a12" transform="rotate(143 16.7 27.8)"/><rect x="22.2" y="25.6" width="1.9" height="1.1" rx=".3" fill="#e3501f" transform="rotate(48 23.1 26.2)"/><rect x="38.5" y="23.7" width="1.4" height="1.3" rx=".3" fill="#e3501f" transform="rotate(26 39.1 24.4)"/><rect x="19.3" y="23.0" width="2.5" height="1.3" rx=".3" fill="#c7261b" transform="rotate(18 20.6 23.7)"/><rect x="25.6" y="21.3" width="1.6" height="1.1" rx=".3" fill="#9e1a12" transform="rotate(93 26.4 21.8)"/><rect x="38.4" y="29.1" width="2.6" height="1.2" rx=".3" fill="#f07a2a" transform="rotate(123 39.7 29.7)"/><rect x="32.4" y="22.7" width="1.7" height="1.0" rx=".3" fill="#c7261b" transform="rotate(177 33.3 23.2)"/><rect x="23.0" y="22.6" width="2.5" height="1.1" rx=".3" fill="#d93a1c" transform="rotate(176 24.2 23.1)"/><rect x="40.1" y="23.2" width="1.6" height="1.3" rx=".3" fill="#f07a2a" transform="rotate(23 40.9 23.8)"/><rect x="15.1" y="25.6" width="1.7" height="1.0" rx=".3" fill="#d93a1c" transform="rotate(138 15.9 26.1)"/><rect x="25.9" y="24.5" width="2.3" height="1.6" rx=".3" fill="#c7261b" transform="rotate(49 27.1 25.3)"/><rect x="34.5" y="21.5" width="1.5" height="1.2" rx=".3" fill="#e3501f" transform="rotate(91 35.2 22.1)"/><rect x="42.1" y="25.4" width="1.9" height="1.0" rx=".3" fill="#f07a2a" transform="rotate(154 43.0 25.9)"/><rect x="15.1" y="27.6" width="2.6" height="1.6" rx=".3" fill="#e3501f" transform="rotate(93 16.4 28.4)"/><rect x="30.4" y="25.1" width="1.5" height="1.0" rx=".3" fill="#d93a1c" transform="rotate(159 31.1 25.6)"/><rect x="34.1" y="21.3" width="2.1" height="1.4" rx=".3" fill="#e3501f" transform="rotate(21 35.2 22.0)"/><rect x="39.8" y="23.2" width="2.3" height="1.2" rx=".3" fill="#9e1a12" transform="rotate(45 40.9 23.8)"/><rect x="30.7" y="20.7" width="2.3" height="1.6" rx=".3" fill="#9e1a12" transform="rotate(101 31.9 21.5)"/><rect x="17.1" y="29.3" width="2.2" height="0.9" rx=".3" fill="#e3501f" transform="rotate(32 18.2 29.7)"/><rect x="37.1" y="30.2" width="2.3" height="0.9" rx=".3" fill="#9e1a12" transform="rotate(152 38.2 30.6)"/><rect x="24.6" y="21.4" width="2.0" height="0.9" rx=".3" fill="#e3501f" transform="rotate(3 25.6 21.9)"/><rect x="14.9" y="25.2" width="1.8" height="1.5" rx=".3" fill="#e3501f" transform="rotate(54 15.8 25.9)"/><rect x="29.1" y="25.7" width="1.5" height="1.3" rx=".3" fill="#d93a1c" transform="rotate(66 29.9 26.4)"/><rect x="24.9" y="23.0" width="2.5" height="1.1" rx=".3" fill="#d93a1c" transform="rotate(117 26.1 23.5)"/><rect x="32.8" y="21.1" width="2.4" height="1.5" rx=".3" fill="#d93a1c" transform="rotate(33 34.0 21.8)"/><rect x="34.6" y="27.1" width="2.4" height="1.4" rx=".3" fill="#e3501f" transform="rotate(155 35.8 27.8)"/><rect x="30.1" y="20.6" width="1.4" height="1.3" rx=".3" fill="#d93a1c" transform="rotate(30 30.8 21.3)"/><rect x="40.1" y="26.7" width="1.9" height="1.2" rx=".3" fill="#d93a1c" transform="rotate(27 41.0 27.3)"/><rect x="34.6" y="23.5" width="1.3" height="0.9" rx=".3" fill="#d93a1c" transform="rotate(115 35.2 23.9)"/><rect x="43.2" y="26.9" width="1.3" height="1.1" rx=".3" fill="#d93a1c" transform="rotate(129 43.8 27.5)"/><rect x="17.1" y="24.9" width="1.8" height="1.2" rx=".3" fill="#d93a1c" transform="rotate(122 18.0 25.5)"/><rect x="40.1" y="23.6" width="2.4" height="1.6" rx=".3" fill="#d93a1c" transform="rotate(66 41.3 24.3)"/><rect x="33.6" y="21.5" width="1.8" height="1.1" rx=".3" fill="#9e1a12" transform="rotate(100 34.5 22.1)"/><rect x="24.3" y="29.0" width="1.8" height="1.0" rx=".3" fill="#e3501f" transform="rotate(77 25.2 29.5)"/><rect x="32.8" y="21.3" width="2.2" height="1.3" rx=".3" fill="#f07a2a" transform="rotate(36 33.9 21.9)"/><rect x="40.1" y="22.7" width="1.5" height="1.6" rx=".3" fill="#9e1a12" transform="rotate(101 40.9 23.5)"/><rect x="35.4" y="28.5" width="1.5" height="1.4" rx=".3" fill="#9e1a12" transform="rotate(131 36.1 29.2)"/><rect x="26.2" y="24.2" width="1.6" height="1.4" rx=".3" fill="#f07a2a" transform="rotate(4 27.0 24.9)"/><rect x="20.7" y="23.1" width="1.2" height="1.1" rx=".3" fill="#f07a2a" transform="rotate(159 21.4 23.6)"/><rect x="25.8" y="21.4" width="2.6" height="1.4" rx=".3" fill="#e3501f" transform="rotate(26 27.1 22.1)"/><rect x="28.6" y="22.1" width="2.3" height="1.0" rx=".3" fill="#9e1a12" transform="rotate(33 29.8 22.6)"/><rect x="35.7" y="21.8" width="2.5" height="1.1" rx=".3" fill="#d93a1c" transform="rotate(137 36.9 22.4)"/><rect x="18.4" y="23.6" width="1.3" height="0.8" rx=".3" fill="#c7261b" transform="rotate(176 19.1 24.0)"/><rect x="26.0" y="22.1" width="2.5" height="1.3" rx=".3" fill="#e3501f" transform="rotate(66 27.2 22.7)"/><rect x="24.5" y="21.7" width="1.6" height="0.9" rx=".3" fill="#f07a2a" transform="rotate(2 25.3 22.1)"/><rect x="37.6" y="23.8" width="2.5" height="1.3" rx=".3" fill="#d93a1c" transform="rotate(11 38.9 24.4)"/><rect x="25.1" y="21.4" width="2.6" height="1.0" rx=".3" fill="#c7261b" transform="rotate(46 26.4 21.9)"/><rect x="39.4" y="23.4" width="1.9" height="1.0" rx=".3" fill="#d93a1c" transform="rotate(114 40.3 23.9)"/>
      <path d="M50 40 C55 34 60 33 61 28 C62 26 60 25 59 27 C57 31 53 33 48 37 Z" fill="#a8150f"/>
      <path d="M59 27 Q60 23 63 22" stroke="#4e6b2a" stroke-width="2.2" fill="none" stroke-linecap="round"/>`),
    harissa: cup("#8f1d14", `<g fill="#d9480f"><circle cx="27" cy="29" r="1.2"/><circle cx="36" cy="28" r="1.2"/></g>`),
    sauce: cup("#f39200"),
    aucune: svg(`<circle cx="32" cy="32" r="18" fill="none" stroke="#a9a39a" stroke-width="4"/><path d="M19 45 L45 19" stroke="#a9a39a" stroke-width="4" stroke-linecap="round"/>`),
  };
  window.MADO_ICONS = I;
})();
