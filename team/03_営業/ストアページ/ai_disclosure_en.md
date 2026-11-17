# Steam AI生成コンテンツの申告（下書き・英語）

- 作成：2026-11-17 営業部（AIの下書き。**Steamworksへの入力はオーナーが行う**）
- 入れる場所：Steamworks の「Content Survey（コンテンツに関する質問票）」の AI 開示欄。Steamの申告は2つに分かれる。
  - **Pre-Generated**：開発中にAIで作り、ゲームやストアに入れたもの → 下の文を書く
  - **Live-Generated**：遊んでいる最中にAIがその場で作るもの → このゲームにはないので「なし」
- 申告した内容の要約は、ストアページに表示される。
- 根拠：`team/03_営業/権利チェック.md`（2026-11-16 オーナー回答）と部長からの指示。
- **[ ] の箇所はオーナーに確かめてから外す。** 事実と違うことを申告しない。

---

## Pre-Generated（開発中にAIで作ったもの）— 入力する文

> **Art:** All character sprites (the five playable characters and their outfits), zombie sprites and boss sprites were generated with Sprite Fusion, an AI image generation service, under a paid plan that permits commercial use. These images were then edited and adjusted with the help of Claude (Anthropic's AI assistant). [The developer selected, arranged and reviewed every image used in the game.]
>
> **Procedural content (not generative AI):** Backgrounds, weapon and gear pixel art, sound effects and music are drawn or synthesized at runtime by the game's own code. No AI audio or image models are used for these.
>
> **Code:** The game's source code was written with the assistance of Claude (Anthropic's AI assistant).
>
> **Text and localization:** The English and Simplified Chinese translations of the in-game text, and parts of the store page text, were produced with AI assistance (Claude). [Translations are being reviewed by native speakers before release.]
>
> All story, characters, names and game design are original to this project, and all AI-assisted content was checked by the developer before inclusion. [確認後に残すか決める]
>
> Generated content does not imitate any existing artist, franchise or copyrighted character.

## Live-Generated（遊んでいる最中にAIが作るもの）

> None. The game does not generate any content with AI while it is running.

---

## オーナーに確認すること
1. **「開発者が全部の絵を選び、確かめた」と書いてよいか**（Art の最後の [ ] の文）。事実でなければ消す。
2. **翻訳の母語チェックを発売前に行うか**（Text の [ ] の文）。行わないなら「reviewed by native speakers」の文を消す。翻訳部の方針は「販売前に母語の人が確認」。
3. **最後から2つ目の段落**（全部確認済み）を残すか。
4. **最後の段落「既存の作品やキャラをまねていない」**：Sprite Fusion の規約では「似ていないことは保証しない、確認は利用者の責任」（`権利チェック.md`）。似ている絵がないか、オーナーが一度見て確かめてから残す。確かめられないなら消す。
5. ストアのカプセル画像（一覧の画像）をプロに依頼した場合は、その絵はAIではないので、申告文の Art に「Store capsule art was created by a human artist.」と足せる（ロードマップ フェーズ1）。

## 参考（日本語の意味）
- 絵：キャラ5人と衣装、ゾンビ、ボスの絵は、AI画像生成サービス Sprite Fusion（商用利用できる有料プラン）で作り、Claude（AI）で手直しした。
- プログラムで作ったもの（生成AIではない）：背景、武器・防具のドット絵、効果音、BGMは、ゲーム自身のプログラムがその場で描画・合成している。
- コード：ゲームのプログラムはClaudeの支援で書いた。
- 文章と翻訳：英語・中国語の訳と、ストアページの文の一部はAI（Claude）の支援で作った。
- 遊んでいる最中にAIで作るもの：なし。
