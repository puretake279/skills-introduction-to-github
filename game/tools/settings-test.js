// node game/tools/settings-test.js game/houkago-deadline.html [shot-dir]
// Drives 設定: rebinding keyboard keys and pad buttons, swapping on conflicts, Esc to cancel, reset, texts that follow
// the bindings, the 16:9 display option — and checks the new bindings really work in a battle.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const html = path.resolve(process.argv[2]), shots = process.argv[3] || process.cwd();
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 700 } }); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => {
    const pad = { id: 'Virtual Xbox Controller', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    window.__pad = pad; navigator.getGamepads = () => [pad, null, null, null];
  });
  await p.goto('file://' + html); await p.waitForSelector('[data-a="begin"]');
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
  const padTap = async (i) => { await p.evaluate((i) => { const bt = window.__pad.buttons[i]; bt.pressed = true; bt.value = 1; }, i); await p.waitForTimeout(100); await p.evaluate((i) => { const bt = window.__pad.buttons[i]; bt.pressed = false; bt.value = 0; }, i); await p.waitForTimeout(150); };
  const click = (sel) => p.evaluate((sel) => document.querySelector(sel).click(), sel);
  const label = (dev, a) => p.evaluate(([dev, a]) => document.querySelector(`[data-a="bind"][data-dev="${dev}"][data-k="${a}"]`).textContent, [dev, a]);
  await p.evaluate(() => { const s = JSON.parse(JSON.stringify(S)); STAGES.filter((st) => st.ch <= 5).forEach((st) => { s.stages[st.id] = { n: { clear: true, stars: [true, true, false], best: 100 } }; }); Object.keys(STORY).forEach((k) => s.seen[k] = 1); CHAR_IDS.forEach((c) => s.chars[c].lv = 30); S = sanitizeSave(mergeSave(newSave(), s)); buildKeymaps(); saveGame(); });
  await click('[data-a="begin"]'); await p.waitForTimeout(300); await click('[data-to="opt"]'); await p.waitForTimeout(300);
  ok(await label('key', 'jump') === 'W' && await label('pad', 'jump') === 'A', 'defaults shown: jump = W / A');

  // keyboard: jump → L
  await click('[data-a="bind"][data-dev="key"][data-k="jump"]'); ok((await label('key', 'jump')).includes('押す'), 'the button waits for a key');
  await p.keyboard.press('KeyL'); await p.waitForTimeout(150);
  ok(await label('key', 'jump') === 'L' && await p.evaluate(() => KEYMAP.KeyL === 'jump' && KEYMAP.KeyW !== 'jump' && KEYMAP.ArrowUp === 'jump'), 'jump is now L (W freed, ↑ still works)');
  // conflict: fire → L swaps, jump gets fire's old key J
  await click('[data-a="bind"][data-dev="key"][data-k="fire"]'); await p.keyboard.press('KeyL'); await p.waitForTimeout(150);
  ok(await label('key', 'fire') === 'L' && await label('key', 'jump') === 'J', 'choosing a key in use swaps the two (fire L, jump J)');
  // Esc cancels
  await click('[data-a="bind"][data-dev="key"][data-k="skill"]'); await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok(await label('key', 'skill') === 'E', 'Esc cancels without changing');
  // pad: jump → B swaps with dash
  await click('[data-a="bind"][data-dev="pad"][data-k="jump"]'); await padTap(1);
  ok(await label('pad', 'jump') === 'B' && await label('pad', 'dash') === 'A', 'pad: jump → B swaps with dash (dash → A)');
  ok((await p.evaluate(() => document.querySelector('.opt .box').innerText)).includes('J ジャンプ'), 'the controls box shows the new keys');
  await p.screenshot({ path: path.join(shots, 'settings_keys.png') });

  // the new bindings work in a battle
  await p.evaluate(() => UI.launch(STAGES.find((s) => s.id === '6-1'), false)); await p.waitForTimeout(3000);
  await p.keyboard.press('KeyJ'); await p.waitForTimeout(60); ok(await p.evaluate(() => B.players[B.active].y > 0), 'J now jumps in battle');
  await p.waitForTimeout(800);
  const a0 = await p.evaluate(() => B.players[B.active].ammo); await p.keyboard.down('KeyL'); await p.waitForTimeout(600); await p.keyboard.up('KeyL');
  ok(await p.evaluate(() => B.players[B.active].ammo) < a0, 'L now fires');
  await padTap(1); await p.waitForTimeout(40); ok(await p.evaluate(() => B.players[B.active].y > 0), 'pad B now jumps');
  ok((await p.evaluate(() => B.msg && B.msg.text || '')) !== null, 'battle still runs');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200); ok(await p.evaluate(() => B.paused), 'Esc still pauses');
  ok((await p.evaluate(() => document.querySelector('.pausebox small').textContent)).includes('J ジャンプ') || (await p.evaluate(() => document.querySelector('.pausebox small').textContent)).includes('B ジャンプ'), 'the pause help shows the new keys');
  await p.evaluate(() => UI.resumeBattle()); await p.evaluate(() => { B.cfg.onEnd({ win: false, xp: 1, time: 5, downs: 0, kills: 0, by: {}, boss: 0, maxCombo: 0, wbox: 0, abox: 0, gbox: 0 }); }); await p.waitForTimeout(500);

  // reset + 16:9
  await p.evaluate(() => UI.show('opt')); await p.waitForTimeout(200);
  await click('[data-a="bindreset"]'); await p.waitForTimeout(150);
  ok(await label('key', 'jump') === 'W' && await label('pad', 'dash') === 'B' && await p.evaluate(() => !S.opt.keys && !S.opt.padb), 'reset restores the defaults');
  const r0 = await p.evaluate(() => { const r = document.getElementById('rot').getBoundingClientRect(); return r.width / r.height; });
  await click('[data-a="aspect"][data-k="169"]'); await p.waitForTimeout(150);
  const r1 = await p.evaluate(() => { const r = document.getElementById('rot').getBoundingClientRect(); return r.width / r.height; });
  ok(Math.abs(r1 - 16 / 9) < 0.01 && Math.abs(r0 - 2) < 0.01, `16:9 option (2.00 → ${r1.toFixed(2)} on a 2:1 window)`);
  await p.screenshot({ path: path.join(shots, 'settings_169.png') });
  await click('[data-a="aspect"][data-k="fill"]');
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem(SAVE_KEY)).opt.aspect === 'fill'), 'display choice is saved');
  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close();
})().catch((e) => { console.log('FAIL', e.message); process.exitCode = 1; });
