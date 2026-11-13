// Fichiers de gravure laser des QR des tables (noir et blanc pur, 10 points par mm).
// MADO_GRAVURE.png(url, label, inverse, format) -> Promise<Blob PNG>
//  format "carre" = plaque 100 x 100 mm (1000 x 1000 px), "carte" = carte bancaire 85,6 x 54 mm (856 x 540 px)
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
  function logoSil(im, h) {
    const w = Math.round(h * im.width / im.height);
    const t = document.createElement("canvas"); t.width = w; t.height = h;
    const tg = t.getContext("2d"); tg.drawImage(im, 0, 0, w, h);
    const d = tg.getImageData(0, 0, w, h), p = d.data;
    for (let i = 0; i < p.length; i += 4) { const on = p[i + 3] > 128; p[i] = p[i + 1] = p[i + 2] = 0; p[i + 3] = on ? 255 : 0; }
    tg.putImageData(d, 0, 0);
    return t;
  }
  // texte centré en x, haut à y, réduit pour tenir dans maxW (tout en px)
  function fitText(g, txt, x, y, size, maxW) {
    let fs = size;
    do { g.font = `bold ${fs}px Arial, Helvetica, sans-serif`; fs -= 2; } while (g.measureText(txt).width > maxW && fs > 16);
    g.fillText(txt, x, y);
    return fs + 2;
  }
  // QR avec sa marge de 4 carrés, dans un carré de « box » px ; renvoie la taille réelle
  function drawQr(g, url, x, y, box, inverse) {
    const mx = qrMatrix(url), n = mx.length, quiet = 4;
    const cell = Math.floor(box / (n + 2 * quiet)), full = cell * (n + 2 * quiet);
    x += Math.round((box - full) / 2); y += Math.round((box - full) / 2);
    if (inverse) g.fillRect(x, y, full, full);
    g.fillStyle = inverse ? "#fff" : "#000";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++)
      if (mx[r][c]) g.fillRect(x + (c + quiet) * cell, y + (r + quiet) * cell, cell, cell);
    g.fillStyle = "#000";
    return full;
  }
  // format : "carre" (100 x 100 mm) ou "carte" (carte bancaire 85,6 x 54 mm, paysage)
  async function png(url, label, inverse, format) {
    const card = format === "carte";
    const W = card ? 856 : SIZE, H = card ? 540 : SIZE;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#000"; g.textAlign = "center"; g.textBaseline = "top";
    const im = await loadLogo(), txt = String(label).toUpperCase();

    if (card) {
      // QR à gauche (48 mm), à droite : logo, consigne, nom de la table
      const box = 48 * PX, qx = 3 * PX, qy = Math.round((H - box) / 2);
      drawQr(g, url, qx, qy, box, inverse);
      const cx = Math.round((qx + box + W - 3 * PX) / 2), colW = W - 3 * PX - (qx + box) - 2 * PX;
      if (im) { const t = logoSil(im, Math.round(Math.min(12 * PX, colW * im.height / im.width))); g.drawImage(t, Math.round(cx - t.width / 2), 6 * PX); }
      fitText(g, "SCANNEZ POUR", cx, 21 * PX, 4 * PX, colW);
      fitText(g, "COMMANDER", cx, 25.5 * PX, 4 * PX, colW);
      const parts = txt.match(/^(.*\D)\s+(\d+)$/);
      if (parts && parts[1].length > 5) { // « TERRASSE 1 » sur deux lignes
        fitText(g, parts[1], cx, 33 * PX, 6 * PX, colW);
        fitText(g, parts[2], cx, 40 * PX, 9 * PX, colW);
      } else fitText(g, txt, cx, 35 * PX, 9 * PX, colW);
    } else {
      // Logo en haut : silhouette pleine (tout ce qui n'est pas transparent devient noir)
      if (im) { const t = logoSil(im, 14 * PX); g.drawImage(t, Math.round((W - t.width) / 2), 3 * PX); }
      g.font = `bold ${5 * PX}px Arial, Helvetica, sans-serif`;
      g.fillText(SCAN_TXT, W / 2, 18.5 * PX, 86 * PX);
      // QR : zone de 58 mm (marge blanche de 4 carrés comprise)
      const full = drawQr(g, url, 21 * PX, 25 * PX, 58 * PX, inverse);
      fitText(g, txt, W / 2, 25 * PX + full + 1 * PX, 9 * PX, 86 * PX);
    }

    // Noir et blanc pur (aucun gris, sinon le laser hésite sur les bords)
    const d = g.getImageData(0, 0, W, H), p = d.data;
    for (let i = 0; i < p.length; i += 4) { const v = p[i] < 128 ? 0 : 255; p[i] = p[i + 1] = p[i + 2] = v; p[i + 3] = 255; }
    g.putImageData(d, 0, 0);
    return new Promise((ok) => cv.toBlob(ok, "image/png"));
  }
  window.MADO_GRAVURE = {png};
})();
