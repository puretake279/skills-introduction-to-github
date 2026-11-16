// node game/tools/i18n-qa.js game/houkago-deadline.html <en|zh> [shot-dir]
// Visits every screen in the chosen language and lists
//   - text still left in Japanese (I18N.missing: what the dictionary could not translate)
//   - buttons, tabs and cards whose text no longer fits
// Screenshots of each screen go to shot-dir (named qa_<lang>_<screen>.png).
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const [, , html, lang = 'en', shots = ''] = process.argv;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript((l) => { try { localStorage.setItem('houkago_lang', l); } catch (e) { } }, lang);
  await p.goto('file://' + path.resolve(html)); await p.waitForSelector('[data-a="begin"]');
  await p.evaluate(() => { const s = JSON.parse(JSON.stringify(S)); STAGES.forEach((st) => { s.stages[st.id] = { n: { clear: true, stars: [true, true, false], best: 100 } }; }); CHAR_IDS.forEach((c) => s.chars[c].lv = 30); Object.keys(WEAPONS).forEach((k) => s.weapons[k] = 1); Object.keys(ARMOR).forEach((k) => s.armor[k] = 1); ACHS.slice(0, 8).forEach((a) => s.ach[a.id] = 1); Object.keys(ENEMIES).forEach((k) => s.stats.kills[k] = 3); Object.keys(BOSSES).forEach((k) => s.stats.kills[k] = 1); S = sanitizeSave(mergeSave(newSave(), s)); saveGame(); });
  const overflow = []; const seen = new Set();
  const shot = async (name) => {
    await p.waitForTimeout(250);
    const o = await p.evaluate(() => [...document.querySelectorAll('#ui .b, #ui .tab, #ui .scard .snm, #ui .df, #ui .chip, #ui .tcard, #ui .ccard, #ui .hmenu .b, #ui .sname')].filter((e) => e.offsetParent && (e.scrollWidth > e.clientWidth + 2)).map((e) => e.innerText.replace(/\s+/g, ' ').slice(0, 50)));
    o.forEach((t) => { if (!seen.has(t)) { seen.add(t); overflow.push(name + ': ' + t); } });
    if (shots) await p.screenshot({ path: path.join(shots, `qa_${lang}_${name}.png`) });
  };
  const show = async (scr) => { await p.evaluate((s) => UI.show(s), scr); };
  const clickAll = async (sel, name, max = 30) => { const n = await p.evaluate((s) => document.querySelectorAll(s).length, sel); for (let i = 0; i < Math.min(n, max); i++) { await p.evaluate(([s, i]) => { const e = document.querySelectorAll(s)[i]; if (e && !e.disabled) e.click(); }, [sel, i]); await p.waitForTimeout(80); if (i < 3 || i === n - 1) await shot(name + i); } };

  await shot('title'); await p.evaluate(() => UI.ACT.begin()); await shot('home');
  await show('stages'); await clickAll('#ui .tabs .tab', 'stages'); await clickAll('#ui [data-a="diff"]', 'diff', 4); await clickAll('#ui [data-a="stage"]', 'stage', 12);
  await show('team'); await clickAll('#ui [data-a="csel"]', 'team', 5);
  for (const t of ['status', 'weapon', 'armor', 'perk']) { await p.evaluate((t) => { const e = document.querySelector(`#ui [data-a="ttab"][data-id="${t}"]`); if (e) e.click(); }, t); await shot('team_' + t); }
  await p.evaluate(() => { const e = document.querySelector('#ui [data-a="aslot"]'); if (e) e.click(); }); await shot('team_armorslot');
  await show('shop'); await clickAll('#ui .tabs .tab', 'shop', 12);
  await show('rec'); await clickAll('#ui .tabs .tab', 'rec', 3);
  await show('opt'); await shot('opt');
  // every story scene (text only, through the translator)
  await p.evaluate(() => { for (const k in STORY) for (const [, t] of STORY[k]) I18N.tr(t); for (const c in CHARS) { I18N.tr(CHARS[c].name); I18N.tr(CHARS[c].short); } });
  await p.evaluate(() => UI.story('ch6', () => UI.show('home'))); await shot('story'); await p.evaluate(() => UI.ACT.snext()); await p.waitForTimeout(400); await shot('story2'); await p.evaluate(() => UI.ACT.sskip()); await p.waitForTimeout(300);
  // battle, tutorial hints, pause, result
  await p.evaluate(() => { S.seen = {}; UI.launch(STAGES[0], false); }); await p.waitForTimeout(1500); await shot('battle');
  await p.evaluate(() => { B.stat.time = 20; }); await p.waitForTimeout(600); await shot('battle_hint');
  await p.evaluate(() => B.cfg.onPause()); await shot('pause'); await p.evaluate(() => UI.resumeBattle());
  await p.evaluate(() => B.cfg.onEnd({ win: true, xp: 300, time: 100, downs: 0, kills: 40, by: { walker: 40 }, boss: 0, maxCombo: 9, wbox: 3, abox: 1, gbox: 2 })); await p.waitForTimeout(1200); await shot('result');
  await p.evaluate(() => { UI.launch(STAGES.find((s) => s.id === '6-4'), false); }); await p.waitForTimeout(2500); await shot('snipe');
  await p.evaluate(() => SN.cfg.onPause()); await shot('snipe_pause');
  // all data names / descriptions through the translator, as the collection screens would
  await p.evaluate(() => { const t = I18N.tr; Object.values(WEAPONS).forEach((w) => { t(w.name); t(w.desc || ''); (w.tags || []).forEach((x) => typeof x === 'string' && t(x)); weaponFeats(w).forEach(t); });
    Object.values(ARMOR).forEach((a) => { t(a.name); t(a.how || ''); }); Object.values(ENEMIES).concat(Object.values(BOSSES)).forEach((e) => { t(e.name); t(e.desc); if (e.title) t(e.title); });
    ACHS.forEach((a) => { t(a.name); t(a.desc); t(rwText(a.rw)); }); CHAPTERS.forEach((c) => { t(c.name); t(c.sub); }); STAGES.forEach((s) => t(s.name)); TIPS.forEach(t); PERKS.forEach((k) => { t(k.name); t(k.desc); });
    Object.values(CHARS).forEach((c) => { t(c.role); t(c.prof); t(c.passive); t(c.skill.name); t(c.skill.desc); t(c.uniq.name); t(c.uniq.desc); }); });
  const missing = await p.evaluate(() => [...I18N.missing]);
  const out = { lang, missing, overflow, errors: errs };
  if (shots) fs.writeFileSync(path.join(shots, `qa_${lang}.json`), JSON.stringify(out, null, 1));
  console.log(`${lang}: ${missing.length} untranslated, ${overflow.length} overflowing, ${errs.length} errors`);
  missing.slice(0, 40).forEach((m) => console.log('  JP  ' + m.replace(/\n/g, '⏎').slice(0, 100)));
  overflow.slice(0, 30).forEach((m) => console.log('  BOX ' + m));
  errs.slice(0, 5).forEach((m) => console.log('  ERR ' + m));
  await b.close();
})();
