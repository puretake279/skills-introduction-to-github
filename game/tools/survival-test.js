// node game/tools/survival-test.js game/houkago-deadline.html [shot-dir]
// Survival upgrade cards: a cleared wave opens the pick screen, Esc can't skip it, keys / clicks / a pad pick a card,
// the card's effect lands on the team, the next wave starts, the kill explosion and the drone work.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const html = path.resolve(process.argv[2]), shots = process.argv[3] || process.cwd();
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 }, locale: 'ja-JP' }); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => { const pad = { id: 'Virtual Pad', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }; window.__pad = pad; navigator.getGamepads = () => [pad, null, null, null]; });
  await p.goto('file://' + html); await p.waitForSelector('[data-a="begin"]');
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
  const clearWave = () => p.evaluate(() => { B.queue.length = 0; for (const e of B.enemies) if (!e.dead) damageEnemy(e, 1e7, { dir: 1 }); });
  const waitPick = async () => { for (let i = 0; i < 60; i++) { if (await p.evaluate(() => UI.cur === 'pick')) return true; await p.waitForTimeout(100); } return false; };
  await p.evaluate(() => { CHAR_IDS.forEach((c) => S.chars[c].lv = 30); S.stages['1-1'] = { n: { clear: true, stars: [true, false, false] } }; UI.ACT.begin(); UI.launch(null, true); });
  await p.waitForTimeout(3500);
  ok(await p.evaluate(() => !!B && B.survival && B.wave >= 1), 'survival starts (wave ' + await p.evaluate(() => B.wave) + ')');
  await clearWave(); ok(await waitPick(), 'clearing the wave opens the pick screen');
  ok(await p.evaluate(() => B.paused && B.picking && document.querySelectorAll('#ui .pcard').length === 3), 'three cards, battle paused');
  await p.screenshot({ path: path.join(shots, 'surv_pick.png') });
  await p.keyboard.press('Escape'); await p.waitForTimeout(200); ok(await p.evaluate(() => UI.cur === 'pick' && B.picking), 'Esc does not skip the pick');
  // pick card 2 with the keyboard
  const id2 = await p.evaluate(() => document.querySelectorAll('#ui .pcard')[1].dataset.id);
  const before = await p.evaluate(() => ({ dmg: B.players[0].cs.dmgMul, rps: B.players[0].ws.rps, hp: B.players[0].maxHp }));
  await p.keyboard.press('Digit2'); await p.waitForTimeout(300);
  ok(await p.evaluate((id) => B.ups[id] === 1 && !B.paused && !B.picking && UI.cur === 'none', id2), `key 2 picks the second card (${id2}) and the battle resumes`);
  const w0 = await p.evaluate(() => B.wave); await p.waitForTimeout(3500); ok(await p.evaluate(() => B.wave) === w0 + 1, 'the next wave starts after the pick');
  // force known cards and check their effect
  await p.evaluate(() => { survApply('dmg'); survApply('rate'); survApply('hp'); survApply('boom'); survApply('drone'); });
  const after = await p.evaluate(() => ({ dmg: B.players[0].cs.dmgMul, rps: B.players[0].ws.rps, hp: B.players[0].maxHp, dr: B.drones.filter((d) => d.pet).length, partner: B.players[1].cs.dmgMul }));
  ok(Math.abs(after.dmg / before.dmg - 1.15) < 0.01 || id2 === 'dmg', `火力増強 +15% (${before.dmg.toFixed(2)} → ${after.dmg.toFixed(2)})`);
  ok(after.rps > before.rps * 1.1, '連射強化 raises fire rate'); ok(after.hp > before.hp, '体力強化 raises max HP');
  ok(after.dr >= 1, '援護ドローン adds a drone (' + after.dr + ')'); ok(after.partner > 1, 'cards apply to the partner too');
  const n0 = await p.evaluate(() => B.delayed.length); await p.evaluate(() => { const e = B.enemies.find((x) => !x.dead); if (e) damageEnemy(e, 1e7, { dir: 1, owner: B.players[0] }); });
  ok(await p.evaluate((n) => B.delayed.length > n, n0), '誘爆: a kill schedules an explosion');
  // gamepad pick on the next card screen
  await clearWave(); ok(await waitPick(), 'the next cleared wave opens the pick again');
  await p.evaluate(() => { const bt = window.__pad.buttons[0]; bt.pressed = true; bt.value = 1; }); await p.waitForTimeout(150); await p.evaluate(() => { const bt = window.__pad.buttons[0]; bt.pressed = false; bt.value = 0; }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !B.picking && UI.cur === 'none'), 'pad A picks the highlighted card');
  // pause lists the upgrades
  await p.evaluate(() => B.cfg.onPause()); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.querySelectorAll('#ui .pups span').length >= 5), 'pause lists the run upgrades');
  await p.screenshot({ path: path.join(shots, 'surv_pause.png') }); await p.evaluate(() => UI.resumeBattle()); await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(shots, 'surv_battle.png') });
  // cards cap at Lv5
  await p.evaluate(() => { for (let i = 0; i < 6; i++) if ((B.ups.crit || 0) < 5) survApply('crit'); }); ok(await p.evaluate(() => B.ups.crit === 5 && !survPickChoices().some((u) => u.id === 'crit')), 'a card stops appearing at Lv5');
  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close();
})().catch((e) => { console.log('FAIL', e.message); process.exitCode = 1; });
