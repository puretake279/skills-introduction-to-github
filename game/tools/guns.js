// node guns.js game.html out.png id,id,...  — draws each weapon's sprite (variant .0 and its element variant .4) large
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const [, , html, out, ids] = process.argv; const b = await chromium.launch(); const p = await b.newPage({ locale: 'ja-JP' });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + path.resolve(html)); await p.waitForTimeout(2500);
  const r = await p.evaluate((ids) => {
    const L = ids.split(','), S = 4, c = document.createElement('canvas'); c.width = 2 * 90 * S + 260; c.height = L.length * 32 * S;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#3a4256'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#fff'; x.font = '16px sans-serif';
    const info = [];
    L.forEach((id, j) => { [id + '.0', id + '.4'].forEach((wid, i) => { const w = WEAPONS[wid] || WEAPONS[id]; if (!w) return; const g = GFX.buildGun(w.id); x.drawImage(g.cv, 0, 0, 84, 30, 250 + i * 90 * S, j * 32 * S, 84 * S, 30 * S); if (i === 0) { x.fillText(w.name, 6, j * 32 * S + 50); x.fillText('Lv' + w.wlv + ' 威力' + w.dmg, 6, j * 32 * S + 72); info.push(w.id + ' ' + w.name + ' wlv' + w.wlv); } }); });
    return { u: c.toDataURL(), info };
  }, ids);
  fs.writeFileSync(out, Buffer.from(r.u.split(',')[1], 'base64')); console.log(r.info.join('\n')); await b.close();
})();
