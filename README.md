# とべ！たいやきちゃん

おじさんが焼いているたい焼きを、焼きあがっておじさんの手が届く前にタップして、気球で昇天させてあげるゲームです。
1匹でも取られたらゲームオーバー。日本語・英語に対応しています。

- Web 版（GitHub Pages）：https://techgymjp.github.io/taiyaki/
- Android アプリ：下の「Android アプリ」

## あそびかた

1. おじさんが型に生地を流し、あんこをのせて、型を閉じて焼きます
2. 焼けると型が開きます。おじさんの手が届く前に、焼きあがったたい焼きをタップ
3. たい焼きは気球に吊るされて、ゆっくり昇天していきます

## ファイル

| ファイル | 内容 |
| --- | --- |
| `index.html` | ゲーム本体（Canvas 2D・Web Audio のオリジナル BGM・画面の切り替え・シェア） |
| `taiyaki3d.js` | three.js で 3D のたい焼きと鋳物の焼き型を描く |
| `ojisan3d.js` | 3D のおじさん（2 関節 IK の腕・軍手・表情） |
| `ads.js` / `ads-config.js` | AdMob 広告（アプリのときだけ動く。Web 版では何もしない） |
| `build-info.js` | タイトル画面に出すバージョン（ビルド時に書き換える） |
| `vendor/` | three.js（MIT License） |
| `scripts/build-web.js` | Web 版・アプリ用のファイルを `www/` にまとめる |
| `android/` | Android アプリ（Capacitor 8） |
| `assets/` | アイコン・起動画面の元画像 |

## Android アプリ

Capacitor 8 で Android アプリにしています（パッケージ名 `jp.techgym.taiyaki`）。
`main` に push すると GitHub Actions（`.github/workflows/android.yml`）が動作確認用の APK を作り、Release に載せます。

- リリース画面：https://github.com/techgymjp/taiyaki/releases/tag/android-latest
- APK（直接ダウンロード）：https://github.com/techgymjp/taiyaki/releases/latest/download/taiyaki.apk

<img src="docs/apk-qr.png" width="200" alt="リリース画面の QR コード">

動作確認用の APK はデバッグ署名・テスト広告です。GitHub Secrets にアップロード鍵を登録すると、Google Play 用の署名付き AAB（本番広告）も Artifact に作られます。

```bash
npm ci
npm run android:sync   # www/ を作って Android プロジェクトへコピー
npm run android:open   # Android Studio で開く
```

### 広告

| 種類 | 出す場面 |
| --- | --- |
| バナー | タイトル・あそびかた・ポーズ・結果画面（下中央）。プレイ中は出さない |
| 全画面広告 | 「プレイ」（タイトル・あそびかたから）、「タイトルへ」（あそびかた・ポーズ・結果から）、ポーズからの「再開」、結果画面の「もう一度」のたび |
| リワード広告 | おじさんに取られたとき、見ると取られたたい焼きを型に取り返せる（1 ゲーム 3 回まで。点数はもらえず、自分でもう一度逃がす） |

本番の広告ユニット ID は `ads.js`、AdMob のアプリ ID は `android/app/src/main/res/values/strings.xml` にあります。

## ライセンス

著作権はテックジム株式会社に帰属します（All rights reserved）。許可なく複製・改変・再配布すること、Web サイトやアプリとして公開・販売することを禁止します。
テックジムの受講生が学習目的で複製・改変することは許可しますが、アプリストアでの公開・広告の掲載・販売などの商用利用は禁止です。
詳しくは [LICENSE](LICENSE) を見てください。同梱の three.js は MIT License です。
