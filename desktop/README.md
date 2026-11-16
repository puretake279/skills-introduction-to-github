# パソコン版（Windows）

ゲーム本体 `game/houkago-deadline.html` を、Electron という仕組みでWindowsのアプリにしたものです。
ゲームの中身は1つのHTMLを共有しているので、ゲームを直せばパソコン版にもそのまま反映されます。

## ダウンロードして遊ぶ（オーナー向け）
1. GitHubのリポジトリを開き、上の「Actions」タブ →「Windows版をビルド」を選ぶ
2. 一番上（最新）の実行を開き、下の「Artifacts」にある **AfterschoolDeadline-win-x64** をダウンロード
3. zipを展開し、`AfterschoolDeadline` フォルダの中の **AfterschoolDeadline.exe** をダブルクリック
   - 初回は「WindowsによってPCが保護されました」と出ることがある。「詳細情報」→「実行」で起動できる（まだ署名をしていないため。Steamで配布するときは不要になることが多い）

## 操作
- F11 または Alt+Enter：全画面の切り替え
- ゲームパッド（Xbox配置）：左スティック・十字キー 移動、A ジャンプ、RT・RB 射撃、B 回避、Y スキル、LB 交代、X 装填、Start ポーズ。メニューは十字キーで選んで A 決定、B 戻る
- セーブは自動。保存先は `%APPDATA%\Afterschool Deadline\save.json`（1つ前のセーブは `save.bak.json`）
- 別のパソコンやブラウザ版との行き来は、ゲーム内の「設定」→「引き継ぎコード」で

## 作る（開発部向け）
```
cd desktop
npm install            # 初回だけ
node build.mjs         # → dist/AfterschoolDeadline-<版>-win-x64.zip
```
- Windows用のElectron本体は `.cache/` にダウンロードして使い回す（GitHubのリリースから取得するので、ネットワーク設定で github.com などの許可が必要）
- 版の数字は `package.json` の `version` を上げる

## 確認する
```
node build.mjs --stage-only
xvfb-run -a node test-app.js <スクリーンショットの保存先>
```
Linux用のElectronで同じアプリを起動し、表示・ファイルへのセーブ・再起動後の復元・同梱フォント・ステージ開始を確かめる。
Windowsの実機での確認は、オーナーのパソコンで行う。

## 中身
| ファイル | 役割 |
|---|---|
| `main.js` | ウィンドウを開く、セーブファイルの読み書き、F11で全画面 |
| `preload.js` | ゲームの画面からセーブの読み書きだけを使えるようにする窓口 |
| `build.mjs` | Windows版の組み立て（フォント同梱、exeのアイコンと版の設定、zip作成） |
| `test-app.js` | 動作確認 |
| `make-icon.js` | ゲーム内のユイの顔からアイコンを作る（仮のアイコン） |
| `assets/fonts/` | フォント DotGothic16 とそのライセンス文（SIL Open Font License 1.1） |
