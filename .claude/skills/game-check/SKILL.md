---
name: game-check
description: 放課後デッドライン（game/houkago-deadline.html）を変更したあとに、エラーがないか・見た目が崩れていないか・遊べるかを確かめる手順。ゲームのコードを変えたら必ず使う。
---

# ゲームの動作確認

確認用スクリプトは `game/tools/` にある（ブラウザのChromiumとPlaywrightが必要。クラウド環境には最初から入っている）。
画像を作ったら、Readで開いて自分の目で見る。

## 1. 全装備の組み合わせでエラーがないか（毎回）
```
node game/tools/smoke.js game/houkago-deadline.html
```
`"fail":[]` で、後ろの `[]` が空なら合格。

## 2. 見た目（見た目に関わる変更をしたとき）
- 服・装備：`node game/tools/outfits.js game/houkago-deadline.html 出力.png "胴:脚:頭,胴:脚:頭" フレーム番号 倍率`
  - 例：`"b_tac:l_boots:h_tac,b_bikini:l_bikini"`、フレームは 0〜3 が歩き、5〜6 が射撃、7 が待機
- 頭装備のアップ：`node game/tools/heads.js game/houkago-deadline.html 出力.png h_cap,h_riot 5 7`
- 武器：`node game/tools/guns.js game/houkago-deadline.html 出力.png ar8,sr9`

5人全員の行を見て、はみ出し・色抜け・顔にかぶる部品がないか確かめる。

## 3. 実際に操作してみる（画面・進行・セーブに関わる変更をしたとき）
```
node game/tools/play.js game/houkago-deadline.html "手順;;手順;;..."
```
- 起動時に「第1部クリア済み・全員Lv30」のセーブを入れてから始まる。
- 手順の書き方：`begin`（タイトルのボタン）、`css:[data-to=stages]`（セレクタで押す）、`chap:6`、`sortie`、`sskip`、`wait1000`（ミリ秒待つ）、`shot名前`（スクリーンショット）、`js:式`（ページ内で実行して結果を表示）、`acts`（押せるボタン一覧）
- ステージのクリアを試す：`js:B.cfg.onEnd({win:true,xp:500,time:120,downs:0,kills:80,by:{walker:80},boss:0,maxCombo:20,wbox:1,abox:1,gbox:0}),1`

## 4. 起動の速さ（重さに関わる変更をしたとき）
```
node game/tools/boot-time.js game/houkago-deadline.html 4 3000
```
CPUを4分の1、フォント読み込みに3秒かかる回線を想定して、タイトルが出るまでの時間（wallToTitle）を見る。1.5秒を大きく超えたら原因を調べる。

## 5. ゲームパッド（操作・メニュー・入力に関わる変更をしたとき）
```
node game/tools/gamepad-test.js game/houkago-deadline.html <保存先>
```
仮想のゲームパッドをつないで、メニュー・戦闘・ポーズ・狙撃を操作する。全行が `OK` なら合格。

## 6. パソコン版（セーブ・起動・`desktop/` に関わる変更をしたとき）
```
cd desktop && node build.mjs --stage-only && xvfb-run -a node test-app.js <保存先>
```
全行が `OK` なら合格。

## 報告するとき
確認したこと（どのスクリプトで何を見たか）と、確認していないこと（実機、実際に遊んだ手応え）を分けて書く。
