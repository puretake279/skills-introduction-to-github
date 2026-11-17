const { chromium } = require('playwright'); const path = require('path');
(async () => { const [, , html, slow = '4', net = ''] = process.argv; const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: +slow });
  if (net) { await p.route('**/*', async r => { if (/fonts\.(googleapis|gstatic)/.test(r.request().url())) { await new Promise(z => setTimeout(z, +net)); return r.abort(); } r.continue(); }); }
  const t0 = Date.now(); await p.goto('file://' + path.resolve(html), { waitUntil: 'commit' });
  await p.waitForSelector('[data-a="begin"]', { timeout: 60000 }); const wall = Date.now() - t0;
  const m = await p.evaluate(() => { const o = {}; performance.getEntriesByType('mark').forEach(e => o[e.name] = Math.round(e.startTime)); o.dcl = Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd); return o; });
  const t1 = Date.now(); await p.click('[data-a="begin"]', { force: true }); await p.waitForSelector('[data-to="stages"]'); m.beginToHome = Date.now() - t1; m.wallToTitle = wall;
  console.log(JSON.stringify(m)); await b.close(); })();
