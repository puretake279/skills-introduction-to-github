// node desktop/make-icon.js — draws Yui's in-game portrait as a 256x256 app icon (desktop/assets/icon.png)
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.resolve(__dirname, '..', 'game', 'houkago-deadline.html')); await p.waitForTimeout(2500);
  const url = await p.evaluate(() => {
    const sh = GFX.composeChar('yui', { head: 'h_none', body: 'b_std', legs: 'l_std', acc: 'a_none' });
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    // rounded square in the game's accent colours, then the 31x28 portrait scaled 8x
    x.fillStyle = '#1c2535'; x.beginPath(); x.roundRect(0, 0, 256, 256, 40); x.fill();
    x.fillStyle = '#ffc83d'; x.fillRect(0, 214, 256, 14); for (let i = -2; i < 16; i++) { x.fillStyle = '#16130a'; x.beginPath(); x.moveTo(i * 24, 228); x.lineTo(i * 24 + 12, 228); x.lineTo(i * 24 + 26, 214); x.lineTo(i * 24 + 14, 214); x.fill(); }
    x.drawImage(sh.body, sh.face.x, sh.face.y, 31, 26, 4, 6, 248, 208);
    return c.toDataURL();
  });
  fs.mkdirSync(path.join(__dirname, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'assets', 'icon.png'), Buffer.from(url.split(',')[1], 'base64')); await b.close();
})();
