// Steamストア用スクリーンショット（1920×1080）を撮る。ゲーム本体は変えない。
// node game/tools/screens.js game.html 出力フォルダ 言語(ja|en|zh) "手順;;手順;;..." [fresh|played]
//   手順は play.js と同じ（begin, css:SEL, chap:3, stage:3-4, sortie, sskip, waitMS, shot名前, js:式, acts）に加えて
//   hold:KeyD,KeyJ   … キーを押しっぱなしにする（release:KeyD で離す）
//   tap:KeyE         … キーを1回押して離す
//   burst:名前:枚数:間隔ms … 一定間隔で続けて撮る（名前_00.png, 名前_01.png …）。良い1枚を選ぶ用
//   aimz[:n]         … 狙撃ステージ：n番目に近いゾンビへマウスを動かす（照準を合わせるだけ。click で撃つ）
//   fight:ms         … 戦闘：その時間だけキー入力で戦う（近い敵の方を向いて撃つ・敵がいなければ右へ・スキルは使えるときに押す）
//                      このあと burst / shot を続けると、撃ちながら撮れる（射撃キーは押したまま）
//   mouse:x,y / click … マウスを動かす / クリックする
//   fresh を付けると、セーブを作らず「はじめて遊ぶ状態」で始める（プロローグ用）。
//   付けないときは play.js と同じ「第1部クリア済み・全員Lv30」のセーブで始める（持ち物は初期装備だけ）。
//   played を付けると、それに加えて「第1部をノーマルで遊び終えた人が持っていそうな装備」を持たせる：
//     第1部（1〜5章）で出る ★3以下・絆武器以外 の武器の約6割、第2部の夏・海の防具と水着を除く防具の約半分（どれを持つかは毎回同じ）。
//     実績はゲーム自身の判定（checkAchs）で付ける。各キャラは持っている同じ系統の武器のうち一番レベルの高いものを装備（防具は制服のまま）。第2部の武器・水着は持たせない。
// ビューポート 1920×1080・倍率1。ゲームは高さ300の画面を4倍（1200）で描いて1080に縮めて表示するので、
//   拡大によるぼやけはない（1080pのモニターで全画面にしたときと同じ見え方）。
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const [html, outDir, lang, stepStr, mode] = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, locale: 'ja-JP' });
  await p.addInitScript(l => { try { localStorage.setItem('houkago_lang', l); } catch (e) { } }, lang || 'ja');
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + path.resolve(html)); await p.waitForTimeout(2000);
  if (mode !== 'fresh') await p.evaluate(() => {
    const s = JSON.parse(JSON.stringify(S));
    STAGES.filter(st => st.ch <= 5).forEach(st => { s.stages[st.id] = { n: { clear: true, stars: [true, true, false], best: 100 } }; });
    Object.keys(STORY).forEach(k => { if (!/6|ending2/.test(k)) s.seen[k] = 1; });
    CHAR_IDS.forEach(c => s.chars[c].lv = 30);
    S = sanitizeSave(mergeSave(newSave(), s)); saveGame();
  });
  if (mode === 'played') await p.evaluate(() => {
    const SUMMER = ['h_goggle', 'h_visor', 'h_diver', 'h_straw', 'b_rash', 'b_life', 'b_happi', 'b_wet', 'b_tide', 'b_swim', 'l_swim', 'l_surf', 'l_geta', 'a_board', 'a_uchiwa', 'a_float', 'b_bikini', 'l_bikini'];   // 第2部（夏・海）の防具と水着は持たせない
    const h = t => { let x = 7; for (const c of t) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x % 100; };
    WEAPON_IDS.filter(id => { const w = WEAPONS[id]; return w.ch <= 5 && !w.bond && !w.need && w.star <= 3 && w.wlv <= 23; }).forEach(id => { if (h(id) < 60) S.weapons[id] = 1; });
    Object.values(ARMOR).filter(a => a.lv > 0 && !a.need && !a.only && !a.bare && !a.skin && a.lv <= 23 && !SUMMER.includes((a.base || a.id).split('.')[0])).forEach(a => { if (h(a.id) < 50) S.armor[a.id] = 1; });
    CHAR_IDS.forEach(c => { const cls = WEAPONS[CHARS[c].w0].cls; const best = WEAPON_IDS.filter(id => S.weapons[id] && WEAPONS[id].cls === cls).sort((a, b) => WEAPONS[b].wlv - WEAPONS[a].wlv)[0]; if (best) S.chars[c].weapon = best; });
    checkAchs(); S = sanitizeSave(S); saveGame();   // 実績はゲームの判定どおりに付ける（第1部全クリアの報酬など）
  });
  await p.evaluate(() => document.fonts && document.fonts.ready);
  const key = (type, code) => p.evaluate(([t, c]) => window.dispatchEvent(new KeyboardEvent(t, { code: c, bubbles: true })), [type, code]);
  const acts = async () => p.evaluate(() => [...document.querySelectorAll('[data-a]')].filter(e => e.offsetParent).map(e => e.dataset.a + (e.dataset.id ? ':' + e.dataset.id : '')).join(' '));
  for (const st of stepStr.split(';;')) {
    if (st.startsWith('wait')) { await p.waitForTimeout(+st.slice(4)); continue; }
    if (st.startsWith('shot')) { const f = path.join(outDir, st.slice(4) + '.png'); await p.screenshot({ path: f }); console.log('SHOT', f); continue; }
    if (st.startsWith('burst:')) { const [, nm, n, ms] = st.split(':'); for (let i = 0; i < +n; i++) { const f = path.join(outDir, `${nm}_${String(i).padStart(2, '0')}.png`); await p.screenshot({ path: f }); console.log('SHOT', f, await p.evaluate(() => typeof B !== 'undefined' && B && B.enemies ? `t=${(B.t || 0).toFixed ? (B.t || 0).toFixed(1) : B.t} enemies=${B.enemies.length} boss=${B.boss ? (B.boss.dead ? "dead" : Math.round(B.boss.hp)) : "-"} sn=${typeof SN !== "undefined" && SN ? SN.zs.filter(z => !z.dead).length : "-"}` : '')); await p.waitForTimeout(+ms); } continue; }
    if (st.startsWith('js:')) { try { console.log('JS>', JSON.stringify(await p.evaluate(st.slice(3)))); } catch (e) { console.log('JSERR', e.message); } continue; }
    if (st.startsWith('hold:')) { for (const c of st.slice(5).split(',')) await key('keydown', c); continue; }
    if (st.startsWith('release:')) { for (const c of st.slice(8).split(',')) await key('keyup', c); continue; }
    if (st.startsWith('tap:')) { for (const c of st.slice(4).split(',')) { await key('keydown', c); await p.waitForTimeout(80); await key('keyup', c); } continue; }
    if (st.startsWith('mouse:')) { const [x, y] = st.slice(6).split(',').map(Number); await p.mouse.move(x, y, { steps: 8 }); continue; }
    if (st === 'click') { await p.mouse.down(); await p.waitForTimeout(60); await p.mouse.up(); continue; }
    if (st.startsWith('aimz')) {   // 狙撃：一番近い（生きている）ゾンビにマウスを動かす。aimz:2 なら2番目に近いゾンビ
      const nth = +(st.split(':')[1] || 1) - 1;
      const pt = await p.evaluate(n => { if (typeof SN === 'undefined' || !SN) return null; const z = SN.zs.filter(z => !z.dead).sort((a, b) => Math.abs(a.x) - Math.abs(b.x))[n]; if (!z) return null;
        const r = document.getElementById('cv').getBoundingClientRect(), ay = Math.min(284, Math.max(70, z.y - 22 * (z.s || 1)));
        return [r.left + (z.x / 1090 + 0.5) * r.width, r.top + (20 + (ay - 70) / 214 * (VH - 40)) / VH * r.height]; }, nth);
      if (pt) await p.mouse.move(pt[0], pt[1], { steps: 10 }); else console.log('aimz: no target'); continue; }
    if (st.startsWith('fight:')) {   // 戦闘：キー入力だけで戦う。近い敵の方を向いて撃ち、敵がいなければ右へ進む。スキルは使えるときに押す
      const end = Date.now() + +st.slice(6); let held = null; await key('keydown', 'KeyJ');
      const hold = async c => { if (held === c) return; if (held) await key('keyup', held); held = c; if (c) await key('keydown', c); };
      while (Date.now() < end) {
        const o = await p.evaluate(() => { if (typeof B === 'undefined' || !B || !B.players || !B.players.length) return null; const pl = B.players[B.active]; if (!pl) return null;
          const es = B.enemies.filter(e => !e.dead && e.hp > 0).map(e => ({ d: e.x - pl.x })).sort((a, b) => Math.abs(a.d) - Math.abs(b.d));
          return { e: es[0] || null, dir: pl.dir, boss: !!(B.boss && !B.boss.dead) }; });
        if (!o) { await hold(null); await p.waitForTimeout(200); continue; }
        if (!o.e || Math.abs(o.e.d) > 700) await hold('KeyD');
        else { const want = o.e.d > 0 ? 1 : -1, c = want > 0 ? 'KeyD' : 'KeyA';
          if (Math.abs(o.e.d) > 260) await hold(c); else if (o.dir !== want) { await hold(c); await p.waitForTimeout(60); await hold(null); } else await hold(null); }
        await key('keydown', 'KeyE'); await key('keyup', 'KeyE');
        await p.waitForTimeout(120);
      }
      await hold(null); continue; }
    if (st === 'acts') { console.log('ACTS:', await acts()); continue; }
    if (st.startsWith('css:')) { const el = await p.$(st.slice(4)); if (!el) console.log('MISSING', st); else { await el.click({ force: true }).catch(e => console.log('clickerr', e.message)); await p.waitForTimeout(500); } continue; }
    const [a, id] = st.split(':'); const sel = id ? `[data-a="${a}"][data-id="${id}"]` : `[data-a="${a}"]`;
    const el = await p.$(sel);
    if (!el) { console.log('MISSING', st, '| have:', await acts()); continue; }
    await el.click({ force: true }).catch(e => console.log('clickerr', e.message)); await p.waitForTimeout(500);
  }
  console.log(errs.join('\n')); await b.close();
})();
