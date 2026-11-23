// Web 版（GitHub Pages / Vercel）と Android アプリに同梱するファイルを www/ にまとめる。アプリ用は APP_BUILD=1
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
for (const item of [
  'index.html', 'taiyaki3d.js', 'ojisan3d.js', 'ads.js', 'vendor',
]) {
  const src = path.join(root, item);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(out, item), { recursive: true });
}
// アプリ(Android / iOS)に同梱するときは、Web 版だけの部分を取り除く。
// 目印: HTML は <!-- web-only --> … <!-- /web-only -->、JS は // web-only:start … // web-only:end
// （アプリの中で隠しているだけの機能は、iOS の審査で「隠した機能」(Guideline 5.6)と見なされるため）
if (process.env.APP_BUILD === '1') {
  const rules = [
    [/[ \t]*<!-- web-only[\s\S]*?<!-- \/web-only -->\n?/g],
    [/[ \t]*\/\/ web-only:start[\s\S]*?\/\/ web-only:end\n?/g],
  ];
  for (const rel of fs.readdirSync(out).filter((f) => /\.(html|js)$/.test(f))) {
    const file = path.join(out, rel);
    let text = fs.readFileSync(file, 'utf8');
    for (const [re] of rules) text = text.replace(re, '');
    fs.writeFileSync(file, text);
    // 取り除き忘れがあれば、アプリ用のビルドを止める
    if (/play\.google\.com|web-only/.test(text)) {
      console.error(`${rel} に Web 版だけの部分が残っています`);
      process.exit(1);
    }
  }
}
// Google Play 用のビルドでは本番の広告を使う
const mode = process.env.ADMOB_MODE === 'production' ? 'production' : 'test';
fs.writeFileSync(path.join(out, 'ads-config.js'), `// ビルド時に生成\nwindow.AD_MODE = '${mode}';\n`);
// タイトル画面に出すバージョン（CI では VERSION_NAME / VERSION_CODE を使う）
const version = process.env.VERSION_CODE
  ? `v${process.env.VERSION_NAME || require('../package.json').version} (build ${process.env.VERSION_CODE})`
  : 'dev';
fs.writeFileSync(path.join(out, 'build-info.js'), `// ビルド時に生成\nwindow.APP_VERSION = '${version}';\n`);
console.log(`built web assets into www/ (${process.env.APP_BUILD === '1' ? 'app' : 'web'}, ads: ${mode}, version: ${version})`);
