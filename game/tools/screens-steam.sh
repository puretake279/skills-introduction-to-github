#!/bin/bash
# Steamストア用スクリーンショットの「候補」をまとめて撮る（1920×1080）。
#   bash game/tools/screens-steam.sh 言語(ja|en|zh) 候補の保存先 [撮る番号 例: "1 3 8"]
# 戦闘の場面は毎回変わるので、何枚か続けて撮る（01_boss_00.png, 01_boss_01.png …）。
# 候補を目で見て一番いい1枚を選び、team/02_PR広報/スクリーンショット/<言語>/ にコピーする。
# ゲーム本体は変えない。手順の中身は game/tools/screens.js の先頭の説明を参照。
set -u
L=${1:-ja}; OUT=${2:-/tmp/steam-shots/$L}; ONLY=${3:-"1 2 3 4 5 6 7 8"}
cd "$(dirname "$0")/../.."
G=game/houkago-deadline.html; T=game/tools/screens.js
ST="begin;;css:[data-to=stages]"
# fight:ms と shot を交互に並べる（戦いながら撮る）
fs() { local n=$1 ms=$2 nm=$3 o=""; for i in $(seq -w 0 $((n-1))); do o="$o;;fight:$ms;;shot${nm}_$i"; done; echo "$o"; }
# 狙撃：近いゾンビに照準を合わせて撃ち、照準を合わせ直して撮る
ss() { local n=$1 nm=$2 o=""; for i in $(seq -w 0 $((n-1))); do o="$o;;aimz;;wait250;;click;;wait500;;aimz;;wait500;;shot${nm}_$i"; done; echo "$o"; }
mkdir -p "$OUT"
run() { case " $ONLY " in *" $1 "*) shift; node $T $G "$OUT" "$L" "$@" > "$OUT/log_$RANDOM.txt" 2>&1 & ;; esac; }
# 1 第3章ボス「終電の車掌」（ボスはおよそ45〜70秒後に出る。40秒戦ってから0.7秒ごとに30枚）
run 1 "$ST;;chap:3;;stage:3-4;;sortie;;wait1500;;fight:40000$(fs 30 700 01_boss)" played
# 2 第2章アーケード・2人1組（相棒はAIで援護）。2・4・7は初期装備のセーブ（敵が早く倒れすぎず、群れが画面に残る）
run 2 "$ST;;chap:2;;stage:2-2;;sortie;;wait1500;;fight:2000$(fs 14 1500 02_pair)"
# 3 狙撃ステージ 2-S（屋上からの援護射撃）
run 3 "$ST;;chap:2;;stage:2-S;;sortie;;wait1500;;wait7000$(ss 16 03_snipe)" played
# 4 防衛ステージ 1-3（体育倉庫バリケード）
run 4 "$ST;;chap:1;;stage:1-3;;sortie;;wait1500;;fight:12000$(fs 14 2500 04_defend)"
# 5 武器（チーム・装備 → 武器タブ、ユイ）
run 5 "begin;;css:[data-to=team];;ttab:weapon;;wait800;;shot05_weapons" played
# 6 防具（チーム・装備 → ハルを選んで「装備おまかせ」→ 防具タブ）
run 6 "begin;;css:[data-to=team];;csel:haru;;auto:one;;ttab:armor;;wait800;;shot06_gear" played
# 7 第4章 病院（4-2）
run 7 "$ST;;chap:4;;stage:4-2;;sortie;;wait1500;;fight:5000$(fs 14 1500 07_hospital)"
# 8 プロローグ「状況開始！」（はじめて遊ぶ状態で 出撃 → 会話を8回送る）
run 8 "begin;;wait800;;go;;sortie;;wait1500$(for i in 1 2 3 4 5 6 7 8; do printf ';;snext;;wait600'; done);;wait800;;shot08_story" fresh
wait
grep -h -v '^SHOT\|^$' "$OUT"/log_*.txt && echo "（上に出たのはエラーや見つからなかったボタン）"
rm -f "$OUT"/log_*.txt
ls "$OUT" | wc -l
