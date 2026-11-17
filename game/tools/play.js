// node play.js game.html "step,step,..."   steps: action[:id] | waitMS | shotNAME | js:CODE (evaluated, result printed)
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 }, locale: 'ja-JP' }); const errs = [];
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const url = 'file://' + path.resolve(process.argv[2]); const steps = process.argv[3].split(';;');
  await p.goto(url); await p.waitForTimeout(2000);
  await p.evaluate(() => {
    const s = JSON.parse(JSON.stringify(S));
    STAGES.filter(st => st.ch <= 5).forEach(st => { s.stages[st.id] = { n: { clear: true, stars: [true, true, false], best: 100 } }; });
    Object.keys(STORY).forEach(k => { if (!/6|ending2/.test(k)) s.seen[k] = 1; });
    CHAR_IDS.forEach(c => s.chars[c].lv = 30);
    S = sanitizeSave(mergeSave(newSave(), s)); saveGame();
  });
  const acts = async () => p.evaluate(() => [...document.querySelectorAll('[data-a]')].filter(e => e.offsetParent).map(e => e.dataset.a + (e.dataset.id ? ':' + e.dataset.id : '')).join(' '));
  for (const st of steps) {
    if (st.startsWith('wait')) { await p.waitForTimeout(+st.slice(4)); continue; }
    if (st.startsWith('shot')) { await p.screenshot({ path: path.resolve(process.cwd(), st.slice(4) + '.png') }); continue; }
    if (st.startsWith('js:')) { try { console.log('JS>', JSON.stringify(await p.evaluate(st.slice(3)))); } catch (e) { console.log('JSERR', e.message); } continue; }
    if (st === 'acts') { console.log('ACTS:', await acts()); continue; }
    if (st.startsWith('css:')) { const el = await p.$(st.slice(4)); if (!el) console.log('MISSING', st); else { await el.click({ force: true }).catch(e => console.log('clickerr', e.message)); await p.waitForTimeout(500); } continue; }
    const [a, id] = st.split(':'); const sel = id ? `[data-a="${a}"][data-id="${id}"]` : `[data-a="${a}"]`;
    const el = await p.$(sel);
    if (!el) { console.log('MISSING', st, '| have:', await acts()); continue; }
    await el.click({ force: true }).catch(e => console.log('clickerr', e.message)); await p.waitForTimeout(500);
  }
  console.log(errs.join('\n')); await b.close();
})();
