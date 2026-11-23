# Google Play ストア掲載情報（下書き）

Play Console の「ストアの掲載情報」に貼り付けて使います。既定の言語を日本語にし、「翻訳を管理」から英語（en-US）を追加してください。

## 画像（このフォルダ）

| 用途 | ファイル | サイズ |
| --- | --- | --- |
| アプリのアイコン | `icon-512.png` | 512 × 512 |
| フィーチャー グラフィック | `feature-graphic.png` | 1024 × 500 |
| スマートフォンのスクリーンショット（日本語） | `ja-1-title.png` 〜 `ja-4-caught.png` | 1080 × 1920 |
| スマートフォンのスクリーンショット（英語） | `en-1-title.png` 〜 `en-4-caught.png` | 1080 × 1920 |

スクリーンショットは 1 タイトル画面 → 2 焼きあがりと、のびてくるおじさんの手 → 3 気球で昇天（顔にぶつかって「うわっ！」）→ 4 取られた瞬間、の順です。

---

## ASO（検索で見つけてもらうための方針）

Google Play はアプリ名・簡単な説明・詳しい説明の文章から検索語を拾う（App Store のようなキーワード欄はない）。

| 狙う言葉（日本語） | 狙う言葉（英語） |
| --- | --- |
| たい焼き / たいやき、反射神経、タップゲーム、暇つぶし、簡単操作、カジュアル、屋台、和菓子、3D、オフライン | taiyaki, reflex game, tap game, casual, time killer, one tap, Japanese food / street food, 3D, offline |

- **アプリ名**（30 字）：ゲーム名のあとに一番大事な言葉（反射神経・タップゲーム）を足す。アプリ名に「無料」「No.1」「ランキング」などの宣伝文句・絵文字は入れない（Google Play のポリシー違反）
- **簡単な説明**（80 字）：一覧で最初に見える。狙う言葉を前半に、遊び方がひと目で分かる文にする
- **詳しい説明**：最初の 2〜3 行（「もっと見る」の前に見える部分）に主な言葉を入れる。全体で 1 つの言葉をくり返しすぎない（同じ言葉の羅列はキーワードスパム扱い）
- ホーム画面に出る名前（`strings.xml` の `app_name`）は短い「たいやきちゃん / Taiyaki-chan」のまま。ストアのアプリ名とは別に決められる
- 公開後は Play Console の「ストアの掲載情報の検索キーワード」や「獲得レポート」で、実際にどの言葉で見つけられたかを見て直す

---

## 日本語

**アプリ名**（30 文字以内・21 文字）

```
とべ！たいやきちゃん 反射神経タップゲーム
```

**簡単な説明**（80 文字以内・50 文字）

```
たい焼き屋のおじさんに取られる前にタップ！焼きたてのたい焼きを気球で逃がす、反射神経の暇つぶしゲーム
```

**詳しい説明**

```
焼きたてのたい焼きを、おじさんに取られる前にタップ！
反射神経と瞬発力で、たい焼きちゃんを気球に乗せて逃がしてあげる、ちょっとシュールなタップゲームです。
ルールはタップだけ。1 回 1 分から遊べるので、ちょっとした暇つぶしにもぴったり。

ここは昔ながらのたい焼き屋さんの屋台。
ねじりはちまきのおじさんが、たい焼き機で黙々とたい焼きを焼いています。
生地を流して、あんこをのせて、型を閉じて……パカッと開いたら焼きあがり。
おじさんの軍手の手がのびてくる前にタップすれば、
たい焼きちゃんは気球に吊るされ、天使の輪をつけてゆっくり昇天していきます。

■ あそびかた（かんたん操作）
・焼きあがったたい焼きを、おじさんの手が届く前にタップするだけ
・まだ焼けていないうちは逃がせない。型が開く瞬間を見逃すな
・1 匹でも取られたらゲームオーバー
・進むほど焼き上がりが早く、おじさんの手も速くなる。ハイスコアを目指そう

■ 本物そっくりのたい焼き屋さん
・業務用のたい焼き機 2 台、4 列 4 段の鋳物の焼き型を 3D で再現
・うろこの彫りまで見える、きつね色のたい焼き
・生地を流す「ジュッ」、焼き固まる「パチパチ・チリチリ」という焼き音
・型をパタンと閉じて、焼けたら開く。たい焼きが左右どちらの型に出るかはお楽しみ

■ 3D のおじさん
・焼けたたい焼きを目で追い、前かがみで手をのばしてくる
・昇天していく気球が顔にぶつかると「うわっ！」
・取られると、たい焼きを持ち上げて「へい、いっちょあがり！」

■ こんな人におすすめ
・すきま時間にサクッと遊べるカジュアルゲームを探している
・反射神経や集中力をきたえるゲームが好き
・たい焼きや和菓子、昔ながらの屋台が好き
・ちょっと変わった、シュールなゲームで笑いたい

■ その他
・ズンチャズンチャと鳴る、ちょっと哀愁のあるオリジナル BGM
・取られてしまっても、広告を見ればそのたい焼きを取り返せる（1 ゲーム 3 回まで）
・結果を友だちにシェア
・オフラインでも遊べる（広告・シェアは通信が必要）
・日本語・英語対応

何匹のたい焼きちゃんを天国へ送れるか、挑戦してみてください。
```

---

## English

**App name** (max 30 characters / 29)

```
Taiyaki-chan: Reflex Tap Game
```

**Short description** (max 80 characters / 79)

```
Reflex tap game: save hot taiyaki from the old man and float them up to heaven!
```

**Full description**

```
Tap the fresh taiyaki before the old man grabs it!
Taiyaki-chan is a quirky one-tap reflex game: save the fish-shaped Japanese cakes and send them floating up to heaven on hot-air balloons.
One finger, one-minute rounds — a perfect casual time killer.

Welcome to an old-fashioned Japanese street-food stand.
An old man in a twisted headband is quietly baking taiyaki, the fish-shaped cakes filled with sweet red bean paste.
He pours the batter, adds the filling, closes the mold… and when it pops open, they're done.
Tap a taiyaki before his gloved hand reaches it, and it floats away, hanging from a balloon with a little halo on its head.

■ HOW TO PLAY
• Just tap a finished taiyaki before his hand gets there
• You can't save one that isn't cooked yet — watch for the mold to open
• If he takes even one, it's game over
• The longer you last, the faster they bake and the faster he reaches. Go for a high score!

■ A REAL TAIYAKI STAND IN 3D
• Two commercial taiyaki machines with 4 × 4 cast-iron molds
• Golden-brown taiyaki, right down to the engraved scales
• The sizzle of the batter and the crackle of it baking
• Molds snap shut and open when done — you never know which side the taiyaki will land on

■ A 3D OLD MAN
• He spots a finished taiyaki, follows it with his eyes and leans in to grab it
• Get bumped in the face by a rising balloon? "Whoa!"
• If he gets one, he holds it up: "There ya go, one order up!"

■ GREAT FOR
• Quick, casual games for short breaks
• Testing your reflexes and focus
• Fans of Japanese food, sweets and street-food stalls
• Anyone who likes silly, surreal humor

■ FEATURES
• An original, slightly melancholy oom-pah soundtrack
• Got grabbed? Watch an ad to take that taiyaki back (up to 3 times per game)
• Share your result with friends
• Plays offline (ads and sharing need a connection)
• English and Japanese

How many taiyaki can you send up to heaven?
```

---

## Play Console「アプリのコンテンツ」の回答の目安

- **プライバシー ポリシー**: https://techgym.jp/privacy-policy/
- **広告**: 「はい、広告を含みます」
- **アプリのアクセス権**: 「制限なし（ログイン不要）」
- **広告 ID**: 「使用する」（目的は「広告またはマーケティング」と「アナリティクス」）
- **ターゲット ユーザー**: 13 歳以上（13 歳未満を含めると広告に制限がかかる）
- **データ セーフティ**: アプリ自体は個人情報を集めないが、Google AdMob が「デバイスまたはその他の ID（広告 ID）」と「アプリの操作（広告の表示・クリック）」を広告とアナリティクスの目的で収集・共有する。通信は暗号化されている。※ AdMob の公式ガイドに従って最終確認すること
- **コンテンツのレーティング**: ゲーム → 暴力・性的表現・ギャンブルなどはなし（たい焼きが気球で「昇天」する演出はあるが、流血や死の描写はない）
- **カテゴリ**: ゲーム → カジュアル
