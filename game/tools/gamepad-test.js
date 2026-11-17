// node game/tools/gamepad-test.js game/houkago-deadline.html [shot-dir]
// Plugs a virtual gamepad into the page (navigator.getGamepads) and drives menus, a battle, pause and the scope stage with it.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const html = path.resolve(process.argv[2]), shots = process.argv[3] || process.cwd();
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 }, locale: 'ja-JP' }); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => {
    const pad = { id: 'Virtual Xbox Controller', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })), vibrationActuator: { playEffect: () => { window.__rumbles = (window.__rumbles || 0) + 1; return Promise.resolve('complete'); } } };
    window.__pad = pad; navigator.getGamepads = () => [pad, null, null, null];
  });
  await p.goto('file://' + html); await p.waitForSelector('[data-a="begin"]');
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
  const N = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
  const set = (k, v) => p.evaluate(([i, v]) => { const bt = window.__pad.buttons[i]; bt.pressed = v; bt.value = v ? 1 : 0; }, [N[k], v]);
  const tap = async (k, hold = 90) => { await set(k, true); await p.waitForTimeout(hold); await set(k, false); await p.waitForTimeout(160); };
  const axis = (i, v) => p.evaluate(([i, v]) => { window.__pad.axes[i] = v; }, [i, v]);
  const cur = () => p.evaluate(() => UI.cur), focus = () => p.evaluate(() => { const f = document.querySelector('.gpf'); return f ? (f.dataset.a || '') + ':' + (f.dataset.to || f.dataset.id || '') : null; });
  // a save that has finished Part 1, so every chapter is open
  await p.evaluate(() => { const s = JSON.parse(JSON.stringify(S)); STAGES.filter((st) => st.ch <= 5).forEach((st) => { s.stages[st.id] = { n: { clear: true, stars: [true, true, false], best: 100 } }; }); Object.keys(STORY).forEach((k) => s.seen[k] = 1); CHAR_IDS.forEach((c) => s.chars[c].lv = 30); S = sanitizeSave(mergeSave(newSave(), s)); saveGame(); });

  // ---- menus
  await tap('A'); ok(await cur() === 'home', 'A on the title screen starts the game');
  ok(await focus() === 'go:stages', 'the sortie button is highlighted first (' + await focus() + ')');
  await tap('DOWN'); ok(await focus() === 'go:team', 'd-pad down moves to the next button (' + await focus() + ')');
  await tap('UP'); await tap('A'); ok(await cur() === 'stages', 'A opens the stage screen');
  await tap('RB'); const ch = await p.evaluate(() => document.querySelector('.tabs .tab.on').dataset.id); ok(ch !== '1', 'RB switches the chapter tab (now ' + ch + ')');
  await p.screenshot({ path: path.join(shots, 'gp_stages.png') });
  await tap('B'); ok(await cur() === 'home', 'B goes back to home');
  await p.evaluate(() => { document.querySelector('[data-to="stages"]').click(); }); await p.waitForTimeout(300);
  await p.evaluate(() => { document.querySelector('[data-a="chap"][data-id="6"]').click(); }); await p.waitForTimeout(300);
  await p.evaluate(() => { document.querySelector('[data-a="sortie"]').click(); }); await p.waitForTimeout(3500);

  // ---- battle
  ok(await p.evaluate(() => !!B && !B.paused), 'a battle is running');
  const x0 = await p.evaluate(() => B.players[B.active].x);
  await set('RIGHT', true); await p.waitForTimeout(900); await set('RIGHT', false); await p.waitForTimeout(100);
  const x1 = await p.evaluate(() => B.players[B.active].x); ok(x1 > x0 + 20, `d-pad right walks right (${Math.round(x0)} → ${Math.round(x1)})`);
  await axis(0, -1); await p.waitForTimeout(500); await axis(0, 0); await p.waitForTimeout(100);
  const x2 = await p.evaluate(() => B.players[B.active].x); ok(x2 < x1 - 10, `left stick walks left (${Math.round(x1)} → ${Math.round(x2)})`);
  const a0 = await p.evaluate(() => B.players[B.active].ammo); await set('RT', true); await p.waitForTimeout(700); await set('RT', false); await p.waitForTimeout(100);
  const a1 = await p.evaluate(() => B.players[B.active].ammo); ok(a1 < a0, `RT fires (ammo ${a0} → ${a1})`);
  await tap('A', 60); const y = await p.evaluate(() => B.players[B.active].y); ok(y > 0, 'A jumps (height ' + Math.round(y) + ')');
  await p.waitForTimeout(700);
  const act0 = await p.evaluate(() => B.active); await tap('LB'); await p.waitForTimeout(200); ok(await p.evaluate(() => B.active) !== act0, 'LB swaps the character');
  await tap('X'); ok(await p.evaluate(() => B.players[B.active].reloadT > 0 || B.players[B.active].ammo === B.players[B.active].ws.mag), 'X reloads');
  await tap('START'); ok(await p.evaluate(() => B.paused) && await cur() === 'pause', 'Start pauses');
  await p.screenshot({ path: path.join(shots, 'gp_pause.png') });
  ok((await focus() || '').startsWith('resume'), 'the pause menu highlights 再開する (' + await focus() + ')');
  await tap('B'); ok(await p.evaluate(() => !B.paused), 'B on the pause menu resumes');
  await p.evaluate(() => { shake(10); }); ok(await p.evaluate(() => (window.__rumbles || 0) > 0), 'big hits make the pad rumble');
  // keyboard still works alongside the pad
  await p.keyboard.down('KeyD'); await p.waitForTimeout(400); const xk = await p.evaluate(() => B.players[B.active].x); await p.keyboard.up('KeyD');
  ok(xk > x2, 'the keyboard still moves the character while a pad is connected');

  // ---- scope stage
  await p.evaluate(() => { B.cfg.onEnd({ win: true, xp: 10, time: 60, downs: 0, kills: 1, by: {}, boss: 0, maxCombo: 1, wbox: 0, abox: 0, gbox: 0 }); }); await p.waitForTimeout(800);
  await p.evaluate(() => { UI.launch(STAGES.find((s) => s.id === '6-4'), false); }); await p.waitForTimeout(2500);
  ok(await p.evaluate(() => !!SN), 'the scope stage is running');
  const s0 = await p.evaluate(() => [SN.ax, SN.ay]); await axis(0, 1); await axis(1, 0.6); await p.waitForTimeout(600); await axis(0, 0); await axis(1, 0); await p.waitForTimeout(100);
  const s1 = await p.evaluate(() => [SN.ax, SN.ay]); ok(s1[0] > s0[0] + 20 && s1[1] > s0[1] + 5, `the left stick moves the scope (${s0.map(Math.round)} → ${s1.map(Math.round)})`);
  const z0 = await p.evaluate(() => SN.zoom); await tap('LT'); ok(await p.evaluate(() => SN.zoom) !== z0, 'LT changes the zoom');
  await p.waitForTimeout(1500);
  const m0 = await p.evaluate(() => SN.ammo); await tap('RT', 120); await p.waitForTimeout(200); ok(await p.evaluate(() => SN.ammo) < m0, 'RT fires the rifle');
  await p.screenshot({ path: path.join(shots, 'gp_scope.png') });
  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close();
})().catch((e) => { console.log('FAIL', e.message); process.exitCode = 1; });
