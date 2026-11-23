# とべ！たいやきちゃん

おじさんが焼いているたい焼きを、焼き上がっておじさんに取られる前にタップして逃がしてあげるゲームです。
1匹でも取られたらゲームオーバー。

- `index.html` … ゲーム本体（Canvas 2D ＋ Web Audio のオリジナルBGM）
- `taiyaki3d.js` … three.js でリアルな3Dたい焼きを生成・描画
- `vendor/three.module.min.js` … three.js r160（MIT, `vendor/three-LICENSE`）

GitHub Pages（main ブランチ / ルート）でそのまま公開できます。
ローカルで遊ぶときは ES モジュールのため簡易サーバーを使ってください:

```
python3 -m http.server
```
