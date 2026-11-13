// Fichiers de gravure laser des QR des tables (plaque 100 x 100 mm, noir et blanc pur, 10 points par mm).
// MADO_GRAVURE.png(url, label, inverse) -> Promise<Blob PNG 1000 x 1000 px>
//  - normal  : noir = là où le laser passe = carrés du QR, logo, texte (alu brut + spray de marquage : marque foncée)
//  - inverse : le laser passe sur le fond du QR (et le logo, le texte) : plaque peinte ou anodisée noire, le laser la rend claire
(function () {
  const PX = 10, SIZE = 100 * PX; // 10 px par mm
  let logoMask = null;
  const SCAN_TXT = "SCANNEZ POUR COMMANDER";
  function loadLogo() {
    if (logoMask) return logoMask;
    logoMask = new Promise((ok) => {
      const im = new Image();
      im.onload = () => ok(im); im.onerror = () => ok(null);
      im.src = "img/logo.png";
    });
    return logoMask;
  }
  function qrMatrix(text) {
    const div = document.createElement("div");
    const q = new QRCode(div, {text, width: 64, height: 64, correctLevel: QRCode.CorrectLevel.H});
    const m = q._oQRCode, n = m.getModuleCount(), out = [];
    for (let r = 0; r < n; r++) { const row = []; for (let c = 0; c < n; c++) row.push(m.isDark(r, c)); out.push(row); }
    return out;
  }
  async function png(url, label, inverse) {
    const cv = document.createElement("canvas"); cv.width = cv.height = SIZE;
    const g = cv.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, SIZE, SIZE);
    g.fillStyle = "#000";

    // Logo en haut : silhouette pleine (tout ce qui n'est pas transparent devient noir)
    const im = await loadLogo();
    if (im) {
      const h = 14 * PX, w = Math.round(h * im.width / im.height);
      const t = document.createElement("canvas"); t.width = w; t.height = h;
      const tg = t.getContext("2d"); tg.drawImage(im, 0, 0, w, h);
      const d = tg.getImageData(0, 0, w, h), p = d.data;
      for (let i = 0; i < p.length; i += 4) { const on = p[i + 3] > 128; p[i] = p[i + 1] = p[i + 2] = 0; p[i + 3] = on ? 255 : 0; }
      tg.putImageData(d, 0, 0);
      g.drawImage(t, Math.round((SIZE - w) / 2), 3 * PX);
    }

    // Consigne sous le logo
    g.textAlign = "center"; g.textBaseline = "top";
    g.font = `bold ${5 * PX}px Arial, Helvetica, sans-serif`;
    g.fillText(SCAN_TXT, SIZE / 2, 18.5 * PX, 86 * PX);

    // QR : zone de 58 mm (marge blanche de 4 carrés comprise), carrés en pixels entiers
    const mx = qrMatrix(url), n = mx.length, quiet = 4;
    const cell = Math.floor(58 * PX / (n + 2 * quiet));
    const full = cell * (n + 2 * quiet), x0 = Math.round((SIZE - full) / 2), y0 = 25 * PX;
    if (inverse) g.fillRect(x0, y0, full, full);
    g.fillStyle = inverse ? "#fff" : "#000";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++)
      if (mx[r][c]) g.fillRect(x0 + (c + quiet) * cell, y0 + (r + quiet) * cell, cell, cell);
    g.fillStyle = "#000";

    // Nom de la table en dessous
    const ty = y0 + full + 1 * PX;
    let fs = 9 * PX; const txt = String(label).toUpperCase();
    do { g.font = `bold ${fs}px Arial, Helvetica, sans-serif`; fs -= 4; } while (g.measureText(txt).width > 86 * PX && fs > 30);
    g.fillText(txt, SIZE / 2, ty, 86 * PX);

    // Noir et blanc pur (aucun gris, sinon le laser hésite sur les bords)
    const d = g.getImageData(0, 0, SIZE, SIZE), p = d.data;
    for (let i = 0; i < p.length; i += 4) { const v = p[i] < 128 ? 0 : 255; p[i] = p[i + 1] = p[i + 2] = v; p[i + 3] = 255; }
    g.putImageData(d, 0, 0);
    return new Promise((ok) => cv.toBlob(ok, "image/png"));
  }
  window.MADO_GRAVURE = {png};
})();
