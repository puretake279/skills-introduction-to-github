// xvfb-run node desktop/test-app.js — starts the staged desktop app with the Linux Electron and checks it end to end:
// the game loads, the save goes to a file, the save survives a restart, the bundled font is used, no page errors.
const { _electron: electron } = require('playwright');
const path = require('path'); const fs = require('fs'); const os = require('os');
const APP = path.join(__dirname, '.build', 'app');
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'asd-test-'));
const shots = process.argv[2] || process.cwd();
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };

async function run(n) {
  const app = await electron.launch({ executablePath: require('electron'), args: [APP, '--no-sandbox', `--user-data-dir=${userData}`] });
  const errs = []; const win = await app.firstWindow();
  win.on('pageerror', (e) => errs.push(e.message)); win.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await win.waitForSelector('[data-a="begin"]', { timeout: 30000 });
  return { app, win, errs };
}

(async () => {
  // first start: new save, play a little, check the file
  let { app, win, errs } = await run(1);
  ok(await win.evaluate(() => !!window.desktop && typeof window.desktop.writeSave === 'function'), 'the game sees the desktop bridge');
  ok(await win.evaluate(() => typeof require === 'undefined' && typeof process === 'undefined'), 'the page has no direct access to the computer (only the save bridge)');
  await win.waitForTimeout(800);
  ok(await win.evaluate(() => document.fonts.check('16px "DotGothic16"')), 'the bundled DotGothic16 font is loaded');
  const size = await win.evaluate(() => [innerWidth, innerHeight]); ok(size[0] === 1280 && size[1] === 720, 'window content is 1280x720 (' + size.join('x') + ')');
  await win.screenshot({ path: path.join(shots, 'desktop_title.png') });
  await win.click('[data-a="begin"]', { force: true }); await win.waitForSelector('[data-to="stages"]');
  await win.evaluate(() => { S.chars.yui.lv = 12; S.ap = 77; saveGame(); });
  const file = path.join(userData, 'save.json');
  ok(fs.existsSync(file), 'save.json was written to the app data folder');
  ok(JSON.parse(fs.readFileSync(file, 'utf8')).chars.yui.lv === 12, 'save.json holds the progress');
  await win.evaluate(() => { S.ap = 78; saveGame(); });
  ok(fs.existsSync(path.join(userData, 'save.bak.json')), 'the previous save is kept as save.bak.json');
  ok(errs.length === 0, 'no errors in the page' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await app.close();

  // second start: progress comes back from the file (not from browser storage)
  ({ app, win, errs } = await run(2));
  const back = await win.evaluate(() => [S.chars.yui.lv, S.ap]);
  ok(back[0] === 12 && back[1] === 78, 'progress is restored after restarting (' + back.join(', ') + ')');
  await win.click('[data-a="begin"]', { force: true }); await win.waitForSelector('[data-to="opt"]');
  await win.click('[data-to="opt"]', { force: true }); await win.waitForTimeout(500);
  ok((await win.evaluate(() => document.body.innerText)).includes('自動保存：このパソコン'), 'the settings screen says the save is on this computer');
  // window size from the settings screen
  await win.click('[data-a="win"][data-k="1600"]', { force: true }); await win.waitForTimeout(800);
  const big = await win.evaluate(() => [innerWidth, innerHeight, S.opt.win]); ok(big[0] === 1600 && big[1] === 900 && big[2] === '1600', 'window size 1600×900 from 設定 (' + big.join(', ') + ')');
  await win.click('[data-a="win"][data-k="1280"]', { force: true }); await win.waitForTimeout(800);
  const small = await win.evaluate(() => [innerWidth, innerHeight]); ok(small[0] === 1280 && small[1] === 720, 'back to 1280×720 (' + small.join('x') + ')');
  await win.screenshot({ path: path.join(shots, 'desktop_settings.png') });
  // a stage starts and runs
  await win.evaluate(() => { const s = JSON.parse(JSON.stringify(S)); STAGES.filter(st => st.ch <= 5).forEach(st => { s.stages[st.id] = { n: { clear: true, stars: [true, true, false], best: 100 } }; }); Object.keys(STORY).forEach(k => s.seen[k] = 1); S = sanitizeSave(mergeSave(newSave(), s)); saveGame(); });
  await win.evaluate(() => UI.show('home')); await win.waitForTimeout(300);
  await win.click('[data-to="stages"]', { force: true }); await win.waitForTimeout(300);
  await win.click('[data-a="chap"][data-id="6"]', { force: true }); await win.waitForTimeout(300);
  await win.click('[data-a="sortie"]', { force: true }); await win.waitForTimeout(4000);
  ok(await win.evaluate(() => typeof B !== 'undefined' && !!B && B.players.length > 0), 'a stage starts in the desktop app');
  await win.screenshot({ path: path.join(shots, 'desktop_battle.png') });
  ok(errs.length === 0, 'no errors after restart' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await app.close();
  fs.rmSync(userData, { recursive: true, force: true });
})().catch((e) => { console.log('FAIL', e.message); process.exitCode = 1; });
