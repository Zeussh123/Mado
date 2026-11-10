/* Personnage de l'écran TV : employé du snack, tenue impeccable, tablier vert avec le logo Mado.
   MADO_MASCOT.svg(photo) renvoie le dessin (SVG) ; photo = image du plat posée sur l'assiette (facultatif).
   Les parties animées ont une classe (m-walk, m-body, m-armL + m-foreL (coucou coude plié), m-armR, m-head, m-eyes, m-steam) : les animations sont dans ecran.html. */
window.MADO_MASCOT = (() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function svg(photo){
    const dish = photo
      ? `<image href="${esc(photo)}" x="248" y="182" width="104" height="104" preserveAspectRatio="xMidYMid slice" clip-path="url(#mPlate)"/>`
      : `<text x="300" y="258" font-size="64" text-anchor="middle">🥙</text>`;
    return `<svg class="m-svg" viewBox="0 0 380 640" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
  <radialGradient id="mSkin" cx="45%" cy="38%" r="70%"><stop offset="0" stop-color="#f5cfab"/><stop offset=".7" stop-color="#e2a77c"/><stop offset="1" stop-color="#c98a5e"/></radialGradient>
  <linearGradient id="mShirt" x1="0" x2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".65" stop-color="#f6f8fa"/><stop offset="1" stop-color="#d9e1e8"/></linearGradient>
  <linearGradient id="mApron" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f8a45"/><stop offset=".55" stop-color="#22703a"/><stop offset="1" stop-color="#16522a"/></linearGradient>
  <linearGradient id="mCap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34964b"/><stop offset="1" stop-color="#1c5f30"/></linearGradient>
  <linearGradient id="mGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dc8e"/><stop offset=".55" stop-color="#d9b45a"/><stop offset="1" stop-color="#a87f2a"/></linearGradient>
  <linearGradient id="mPants" x1="0" x2="1"><stop offset="0" stop-color="#3a4452"/><stop offset="1" stop-color="#232a33"/></linearGradient>
  <clipPath id="mPlate"><circle cx="300" cy="234" r="50"/></clipPath>
</defs>
<ellipse class="m-shadow" cx="185" cy="622" rx="120" ry="13" fill="rgba(0,0,0,.38)"/>
<g class="m-walk"><g class="m-body">
  <!-- jambes et chaussures -->
  <rect x="142" y="430" width="40" height="172" rx="14" fill="url(#mPants)"/>
  <rect x="188" y="430" width="40" height="172" rx="14" fill="url(#mPants)"/>
  <path d="M128 612 Q130 592 160 594 L184 596 Q188 616 176 618 L136 619 Q127 618 128 612Z" fill="#15181c"/>
  <path d="M242 612 Q240 592 210 594 L186 596 Q182 616 194 618 L234 619 Q243 618 242 612Z" fill="#15181c"/>
  <path d="M140 600 L170 600 M200 600 L230 600" stroke="#3b4048" stroke-width="2" stroke-linecap="round"/>

  <!-- bras droit (côté gauche de l'écran) : il fait coucou -->
  <g class="m-armL">
    <path d="M128 210 Q108 214 104 236 L100 268 L136 272 L142 222Z" fill="url(#mShirt)" stroke="#cfd8e0" stroke-width="1.5"/>
    <path d="M104 262 L136 266 M102 268 L136 272" stroke="#2f8a45" stroke-width="3"/>
    <rect x="104" y="266" width="28" height="56" rx="14" fill="url(#mSkin)"/>
    <g class="m-foreL">
    <rect x="104" y="298" width="28" height="66" rx="14" fill="url(#mSkin)"/>
    <g transform="translate(118 372)">
      <ellipse rx="18" ry="20" fill="url(#mSkin)"/>
      <path d="M-14 -12 Q-24 -2 -20 8" stroke="#e2a77c" stroke-width="9" stroke-linecap="round" fill="none"/>
      <path d="M-8 14 L-8 26 M0 16 L0 30 M8 14 L8 26" stroke="#d99a6c" stroke-width="7" stroke-linecap="round"/>
    </g>
    </g>
  </g>

  <!-- buste : chemise blanche bien repassée -->
  <path d="M126 206 Q185 190 244 206 L256 300 L248 452 L122 452 L114 300Z" fill="url(#mShirt)"/>
  <path d="M168 196 L185 226 L202 196" fill="none" stroke="#cfd8e0" stroke-width="3" stroke-linejoin="round"/>
  <rect x="166" y="168" width="38" height="36" rx="12" fill="#d89a6e"/>
  <path d="M164 196 L185 228 L171 230Z M206 196 L185 228 L199 230Z" fill="#fff" stroke="#d5dde4" stroke-width="1.5"/>

  <!-- tablier vert, liseré doré, logo Mado -->
  <path d="M140 236 L164 198 M230 236 L206 198" stroke="#1f6b35" stroke-width="7" stroke-linecap="round"/>
  <path d="M136 234 Q185 226 234 234 L238 326 Q256 330 254 344 L250 548 Q185 562 120 548 L116 344 Q114 330 132 326Z" fill="url(#mApron)"/>
  <path d="M136 234 Q185 226 234 234 L238 326 Q256 330 254 344 L250 548 Q185 562 120 548 L116 344 Q114 330 132 326Z" fill="none" stroke="url(#mGold)" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M120 338 Q185 350 250 338" fill="none" stroke="#174f27" stroke-width="7"/>
  <path d="M120 338 Q185 350 250 338" fill="none" stroke="url(#mGold)" stroke-width="1.5" opacity=".8"/>
  <rect x="139" y="250" width="92" height="46" rx="9" fill="rgba(0,0,0,.18)"/>
  <image href="img/logo.png" x="141" y="254" width="88" height="36.2" preserveAspectRatio="xMidYMid meet"/>
  <rect x="152" y="440" width="66" height="44" rx="7" fill="none" stroke="#3ea457" stroke-width="2.5" stroke-dasharray="5 4"/>
  <!-- nœud du tablier -->
  <path d="M116 344 Q98 334 92 350 Q100 360 116 352Z M116 352 Q100 368 104 384 Q114 376 118 358Z" fill="#1f6b35"/>
  <!-- plis du tablier -->
  <path d="M150 360 Q148 450 146 540 M220 360 Q222 450 224 540" stroke="rgba(0,0,0,.12)" stroke-width="3" fill="none"/>

  <!-- bras gauche (côté droit de l'écran) : il présente l'assiette -->
  <g class="m-armR">
    <path d="M242 208 Q264 212 266 236 L268 270 L232 272 L228 222Z" fill="url(#mShirt)" stroke="#cfd8e0" stroke-width="1.5"/>
    <path d="M234 266 L268 264 M232 272 L268 270" stroke="#2f8a45" stroke-width="3"/>
    <path d="M250 272 L296 300" stroke="url(#mSkin)" stroke-width="28" stroke-linecap="round"/>
    <path d="M250 272 L296 300" stroke="#e0a57a" stroke-width="28" stroke-linecap="round" opacity=".55"/>
    <g class="m-plate">
      <circle cx="300" cy="234" r="62" fill="#fff" stroke="#e3e8ec" stroke-width="3"/>
      <circle cx="300" cy="234" r="53" fill="#f3f5f7"/>
      ${dish}
      <circle cx="300" cy="234" r="50" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="2"/>
      <g class="m-steam" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="5" stroke-linecap="round">
        <path d="M280 168 Q270 150 282 134 Q294 118 284 100"/>
        <path d="M302 162 Q292 144 304 128 Q316 112 306 94"/>
        <path d="M324 168 Q314 150 326 134 Q338 118 328 100"/>
      </g>
    </g>
    <ellipse cx="300" cy="300" rx="19" ry="16" fill="url(#mSkin)"/>
    <path d="M286 292 Q284 280 292 276" stroke="#e2a77c" stroke-width="9" stroke-linecap="round" fill="none"/>
  </g>

  <!-- tête -->
  <g class="m-head">
    <circle cx="124" cy="124" r="15" fill="url(#mSkin)"/><circle cx="246" cy="124" r="15" fill="url(#mSkin)"/>
    <path d="M124 118 Q118 124 124 132 M246 118 Q252 124 246 132" stroke="#c98a5e" stroke-width="3" fill="none"/>
    <ellipse cx="185" cy="118" rx="60" ry="66" fill="url(#mSkin)"/>
    <!-- cheveux courts bien coupés -->
    <path d="M127 116 Q124 84 142 72 L228 72 Q246 84 243 116 Q238 100 232 96 L138 96 Q132 100 127 116Z" fill="#2a1d17"/>
    <path d="M128 112 L128 132 Q131 136 134 130 L136 108Z M242 112 L242 132 Q239 136 236 130 L234 108Z" fill="#2a1d17"/>
    <!-- casquette verte Mado -->
    <path d="M122 92 Q122 38 185 32 Q248 38 248 92 Q185 80 122 92Z" fill="url(#mCap)"/>
    <path d="M150 42 Q185 32 220 42" stroke="rgba(255,255,255,.18)" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M118 92 Q185 76 252 92 Q262 104 246 108 Q185 94 124 108 Q108 104 118 92Z" fill="#164f27"/>
    <path d="M122 92 Q185 80 248 92" stroke="url(#mGold)" stroke-width="3" fill="none"/>
    <circle cx="185" cy="62" r="13" fill="url(#mGold)"/>
    <text x="185" y="68" font-family="Philosopher,Georgia,serif" font-weight="700" font-size="17" text-anchor="middle" fill="#164f27">M</text>
    <!-- sourcils, yeux, nez, sourire -->
    <path d="M148 106 Q160 98 172 104 M198 104 Q210 98 222 106" stroke="#2a1d17" stroke-width="5.5" stroke-linecap="round" fill="none"/>
    <g class="m-eyes">
      <ellipse cx="161" cy="122" rx="10" ry="11" fill="#fff"/><ellipse cx="209" cy="122" rx="10" ry="11" fill="#fff"/>
      <circle cx="163" cy="124" r="6.5" fill="#3b2416"/><circle cx="211" cy="124" r="6.5" fill="#3b2416"/>
      <circle cx="165" cy="121" r="2.2" fill="#fff"/><circle cx="213" cy="121" r="2.2" fill="#fff"/>
    </g>
    <path d="M185 126 Q193 142 183 147" stroke="#b9774c" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    <ellipse cx="146" cy="146" rx="12" ry="7" fill="#f08b7a" opacity=".35"/><ellipse cx="224" cy="146" rx="12" ry="7" fill="#f08b7a" opacity=".35"/>
    <path class="m-mouth" d="M157 154 Q185 186 213 154 Q185 166 157 154Z" fill="#7d2b25"/>
    <path d="M162 156 Q185 166 208 156 L206 161 Q185 170 164 161Z" fill="#fff"/>
    <path d="M172 172 Q185 178 198 172" stroke="#e27c70" stroke-width="4" stroke-linecap="round" fill="none" opacity=".8"/>
  </g>
</g></g>
</svg>`;
  }
  return {svg};
})();
