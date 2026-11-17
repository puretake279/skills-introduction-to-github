# Steam AI生成コンテンツの申告（下書き・英語）

- 作成：2026-11-17 営業部（AIの下書き。**Steamworksへの入力はオーナーが行う**）
- 入れる場所：Steamworks の「Content Survey（コンテンツに関する質問票）」の AI 開示欄。Steamの申告は2つに分かれる。
  - **Pre-Generated**：開発中にAIで作り、ゲームやストアに入れたもの → 下の文を書く
  - **Live-Generated**：遊んでいる最中にAIがその場で作るもの → このゲームにはないので「なし」
- 申告した内容の要約は、ストアページに表示される。
- 根拠：`team/03_営業/権利チェック.md`（2026-11-16 オーナー回答）と部長からの指示。
- 2026-11-17 オーナー回答を反映済み（絵は全部オーナーが選んで確認した／既存作品に似た絵がないか確認した／翻訳の母語チェックは発売前には行わない）。事実が変わったら書き直す。

---

## Pre-Generated（開発中にAIで作ったもの）— 入力する文

> **Art:** All character sprites (the five playable characters and their outfits), zombie sprites and boss sprites were generated with Sprite Fusion, an AI image generation service, under a paid plan that permits commercial use. These images were then edited and adjusted with the help of Claude (Anthropic's AI assistant). The developer selected, arranged and reviewed every image used in the game.
>
> **Procedural content (not generative AI):** Backgrounds, weapon and gear pixel art, sound effects and music are drawn or synthesized at runtime by the game's own code. No AI audio or image models are used for these.
>
> **Code:** The game's source code was written with the assistance of Claude (Anthropic's AI assistant).
>
> **Text and localization:** The English and Simplified Chinese translations of the in-game text, and parts of the store page text, were produced with AI assistance (Claude). The translations have not been reviewed by native speakers; corrections from players are welcome and will be applied in updates.
>
> All story, characters, names and game design are original to this project, and all AI-generated art was checked by the developer before inclusion.
>
> The developer checked that the generated art does not imitate any existing artist, franchise or copyrighted character.

## Live-Generated（遊んでいる最中にAIが作るもの）

> None. The game does not generate any content with AI while it is running.

---

## オーナーの回答（2026-11-17）
1. 全部の絵をオーナーが選んで確かめた → はい（Art の文を残した）
2. 翻訳の母語チェックを発売前に行うか → **行わない**（Text の文を「母語の人の確認はまだ。プレイヤーからの指摘をアップデートで直す」に変えた）
3. 「AIの内容は全部確認済み」の段落 → 翻訳は確認できていないので、「AIで作った絵は確認済み」に絞った
4. 既存の作品に似た絵がないか → オーナーが確認した（最後の段落を「開発者が確認した」という書き方で残した）

## 残りのメモ
5. ストアのカプセル画像（一覧の画像）をプロに依頼した場合は、その絵はAIではないので、申告文の Art に「Store capsule art was created by a human artist.」と足せる（ロードマップ フェーズ1）。

## 参考（日本語の意味）
- 絵：キャラ5人と衣装、ゾンビ、ボスの絵は、AI画像生成サービス Sprite Fusion（商用利用できる有料プラン）で作り、Claude（AI）で手直しした。
- プログラムで作ったもの（生成AIではない）：背景、武器・防具のドット絵、効果音、BGMは、ゲーム自身のプログラムがその場で描画・合成している。
- コード：ゲームのプログラムはClaudeの支援で書いた。
- 文章と翻訳：英語・中国語の訳と、ストアページの文の一部はAI（Claude）の支援で作った。母語の人の確認はまだで、プレイヤーからの指摘はアップデートで直す。
- 最後の2段落：物語・キャラ・名前・ゲームの設計はこの作品のオリジナルで、AIで作った絵は開発者が確認した。既存の作家・作品・キャラをまねていないことも開発者が確認した。
- 遊んでいる最中にAIで作るもの：なし。
