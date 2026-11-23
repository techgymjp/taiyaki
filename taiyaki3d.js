// リアルな3Dたい焼きを three.js で作り、スプライト画像としてキャッシュする
import * as THREE from './vendor/three.module.min.js';

// ---------- 輪郭（右向き、頭が +x） ----------
function bodyHalf(x) {
  const t = (x - 0.15) / 0.88;
  return t * t >= 1 ? 0 : 0.56 * Math.sqrt(1 - t * t);
}
function topH(x) {
  if (x < -0.7) return tailH(x);
  let h = bodyHalf(x);
  if (x > -0.48 && x < 0.38) h += 0.17 * Math.pow(Math.sin(Math.PI * (x + 0.48) / 0.86), 1.3); // 背びれ
  return Math.max(h, x < -0.6 ? tailH(x) : 0);
}
function botH(x) {
  if (x < -0.7) return tailH(x);
  let h = bodyHalf(x);
  if (x > -0.32 && x < 0.08) h += 0.1 * Math.sin(Math.PI * (x + 0.32) / 0.4); // 腹びれ
  return Math.max(h, x < -0.6 ? tailH(x) : 0);
}
function tailH(x) {
  const u = Math.min(1, Math.max(0, (-0.7 - x) / 0.47));
  return 0.14 + 0.4 * Math.pow(u, 1.4);
}

function buildOutline() {
  const pts = [];
  const N = 90;
  for (let i = 0; i <= N; i++) {
    const x = 1.03 - (2.2 * i) / N;
    pts.push([x, topH(x)]);
  }
  pts.push([-0.98, 0.0]); // 尾の切れ込み
  for (let i = 0; i <= N; i++) {
    const x = -1.17 + (2.2 * i) / N;
    pts.push([x, -botH(x)]);
  }
  return pts;
}

// 符号付き距離（内側が正）
function makeSdf(poly) {
  return (px, py) => {
    let inside = false, md = Infinity;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
      const dx = xj - xi, dy = yj - yi;
      let t = ((px - xi) * dx + (py - yi) * dy) / (dx * dx + dy * dy);
      t = Math.max(0, Math.min(1, t));
      const ex = xi + t * dx - px, ey = yi + t * dy - py;
      md = Math.min(md, ex * ex + ey * ey);
    }
    md = Math.sqrt(md);
    return inside ? md : -md;
  };
}

// 簡易ノイズ
function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y) {
  return vnoise(x, y) * 0.55 + vnoise(x * 2.3, y * 2.3) * 0.3 + vnoise(x * 5.1, y * 5.1) * 0.15;
}
const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// ---------- 高さ（ふくらみ＋型の模様） ----------
function surface(x, y, d) {
  // ふっくらした生地
  const tailF = x < -0.62 ? 0.28 + 0.72 * smooth(-0.95, -0.62, x) : 1;
  const finF = (y > bodyHalf(x) || -y > bodyHalf(x)) && x > -0.6 ? 0.35 : 1;
  const dome = 0.3 * Math.pow(smooth(-0.02, 0.42, d), 0.8) * tailF * finF;

  // 模様（うろこ・えら・目・ひれのすじ）
  let relief = 0;
  // うろこ
  if (x > -0.62 && x < 0.42 && Math.abs(y) < bodyHalf(x) - 0.02) {
    const cs = 0.15;
    const col = Math.floor(x / cs);
    const off = (col & 1) ? cs / 2 : 0;
    const cy = Math.round((y - off) / cs) * cs + off;
    const cx = (col + 0.5) * cs;
    const r = Math.hypot((x - cx) / cs, (y - cy) / cs);
    // 頭側が盛り上がり、しっぽ側に段がつく
    relief += 0.028 * smooth(0.75, 0.2, r) * (0.6 + 0.4 * ((x - cx) / cs + 0.5));
    relief += 0.012 * Math.exp(-Math.pow((r - 0.62) / 0.08, 2));
    relief *= smooth(0.42, 0.25, x);
  }
  // えら
  {
    const gd = Math.hypot(x - 0.52, y * 1.1);
    const ang = Math.atan2(y, x - 0.52);
    if (Math.abs(ang) < 1.15) relief += 0.04 * Math.exp(-Math.pow((gd - 0.33) / 0.03, 2));
  }
  // 目
  {
    const ed = Math.hypot(x - 0.78, y - 0.14);
    relief += 0.05 * smooth(0.075, 0.0, ed);
    relief += 0.03 * Math.exp(-Math.pow((ed - 0.1) / 0.018, 2));
  }
  // 口
  {
    const md = Math.hypot(x - 0.97, y + 0.06);
    relief -= 0.03 * Math.exp(-Math.pow((md - 0.07) / 0.02, 2)) * (x < 0.99 ? 1 : 0);
  }
  // しっぽのすじ
  if (x < -0.68) {
    const a = Math.atan2(y, x + 0.62);
    relief += 0.018 * Math.pow(Math.abs(Math.cos(a * 11)), 6) * smooth(-0.68, -0.8, x);
  }
  // 背びれ・腹びれのすじ
  if (x > -0.6 && Math.abs(y) > bodyHalf(x) - 0.01) {
    relief += 0.015 * Math.pow(Math.abs(Math.cos(x * 38)), 6);
  }
  relief *= smooth(0.0, 0.07, d);

  // 型からはみ出した羽根（パリパリのふち）
  const flange = 0.014 * smooth(-0.09, -0.02, d) + 0.006 * fbm(x * 9, y * 9);
  return { z: Math.max(dome, flange) + relief, dome, relief };
}

// ---------- 焼き色 ----------
const RAMP = [
  [0.0, [0.97, 0.92, 0.76]],
  [0.35, [0.95, 0.78, 0.45]],
  [0.65, [0.82, 0.52, 0.2]],
  [0.9, [0.6, 0.32, 0.1]],
  [1.2, [0.36, 0.17, 0.05]],
];
function ramp(b) {
  if (b <= RAMP[0][0]) return RAMP[0][1];
  for (let i = 1; i < RAMP.length; i++) {
    if (b <= RAMP[i][0]) {
      const [a0, c0] = RAMP[i - 1], [a1, c1] = RAMP[i];
      const t = (b - a0) / (a1 - a0);
      return [c0[0] + (c1[0] - c0[0]) * t, c0[1] + (c1[1] - c0[1]) * t, c0[2] + (c1[2] - c0[2]) * t];
    }
  }
  return RAMP[RAMP.length - 1][1];
}
const toLinear = v => Math.pow(v, 2.2);

// ---------- ジオメトリ生成 ----------
function buildGeometry() {
  const sdf = makeSdf(buildOutline());
  const NX = 170, NY = 110;
  const x0 = -1.3, x1 = 1.15, y0 = -0.82, y1 = 0.82;
  const nv = (NX + 1) * (NY + 1);
  const pos = [], info = [], keep = new Uint8Array(nv);

  for (let j = 0; j <= NY; j++) {
    for (let i = 0; i <= NX; i++) {
      const x = x0 + ((x1 - x0) * i) / NX;
      const y = y0 + ((y1 - y0) * j) / NY;
      const d = sdf(x, y);
      const k = j * (NX + 1) + i;
      // ふちのギザギザ（羽根）
      const limit = 0.035 + 0.07 * fbm(x * 6 + 3, y * 6 + 7);
      keep[k] = d > -limit ? 1 : 0;
      const s = surface(x, y, d);
      // 外周に向かって厚みを 0 に
      const edgeFade = smooth(-limit, -limit + 0.025, d);
      pos.push(x, y, s.z * (d < 0 ? edgeFade : 1));
      info.push({ d, dome: s.dome, relief: s.relief, n: fbm(x * 14, y * 14), n2: fbm(x * 3 + 11, y * 3) });
    }
  }

  // 表と裏
  const positions = new Float32Array(nv * 2 * 3);
  for (let k = 0; k < nv; k++) {
    positions[k * 3] = pos[k * 3];
    positions[k * 3 + 1] = pos[k * 3 + 1];
    positions[k * 3 + 2] = pos[k * 3 + 2];
    positions[(nv + k) * 3] = pos[k * 3];
    positions[(nv + k) * 3 + 1] = pos[k * 3 + 1];
    positions[(nv + k) * 3 + 2] = -pos[k * 3 + 2];
  }
  const idx = [];
  for (let j = 0; j < NY; j++) {
    for (let i = 0; i < NX; i++) {
      const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
      if (keep[a] && keep[b] && keep[c] && keep[d]) {
        idx.push(a, b, d, a, d, c);
        idx.push(nv + a, nv + d, nv + b, nv + a, nv + c, nv + d);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(nv * 2 * 3), 3));
  return { geo, info, nv };
}

function applyCook(model, cook) {
  const col = model.geo.getAttribute('color');
  const arr = col.array;
  const { info, nv } = model;
  for (let k = 0; k < nv; k++) {
    const f = info[k];
    // 型に当たる盛り上がり・ふちほど焦げやすい
    let b = cook * (0.42 + f.dome * 1.0 + f.relief * 8 + (f.d < 0.02 ? 0.3 : 0) + (f.n - 0.5) * 0.3 + (f.n2 - 0.5) * 0.25);
    if (cook < 0.15) b = cook * 0.5; // 生地のまま
    let c = ramp(b);
    // 生っぽい部分はしっとり白っぽく
    const wet = Math.max(0, 1 - cook * 2.5);
    c = [c[0] + (0.99 - c[0]) * wet * 0.3, c[1] + (0.95 - c[1]) * wet * 0.3, c[2] + (0.82 - c[2]) * wet * 0.3];
    const r = toLinear(c[0]), g = toLinear(c[1]), bl = toLinear(c[2]);
    arr[k * 3] = r; arr[k * 3 + 1] = g; arr[k * 3 + 2] = bl;
    arr[(nv + k) * 3] = r; arr[(nv + k) * 3 + 1] = g; arr[(nv + k) * 3 + 2] = bl;
  }
  col.needsUpdate = true;
}

// ---------- レンダラ ----------
export function createTaiyakiSprites() {
  const PX = 320, PY = 240; // スプライトの解像度
  const canvas = document.createElement('canvas');
  canvas.width = PX; canvas.height = PY;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(1);
  renderer.setSize(PX, PY, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const VW = 1.5, VH = VW * PY / PX;
  const cam = new THREE.OrthographicCamera(-VW, VW, VH, -VH, 0.1, 10);
  cam.position.set(0, 0, 5);

  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x5a3a20, 1.1));
  const key = new THREE.DirectionalLight(0xffe2b8, 2.4);
  key.position.set(-1.5, 2.5, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffc080, 1.0);
  rim.position.set(2, -1, 1.5);
  scene.add(rim);

  const model = buildGeometry();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.0 });
  const mesh = new THREE.Mesh(model.geo, mat);
  const pivot = new THREE.Group();
  pivot.add(mesh);
  scene.add(pivot);

  const cache = new Map();
  let lastCook = -1;
  const COOK_STEPS = 20, YAW_STEPS = 24;

  function render(ci, yi) {
    const cook = ci / COOK_STEPS;
    if (ci !== lastCook) { applyCook(model, cook); lastCook = ci; }
    mat.roughness = 0.3 + 0.4 * cook;
    const yaw = ((yi / YAW_STEPS) - 0.5) * 1.6;
    pivot.rotation.set(-0.42, yaw, 0);
    renderer.render(scene, cam);
    const out = document.createElement('canvas');
    out.width = PX; out.height = PY;
    out.getContext('2d').drawImage(canvas, 0, 0);
    return out;
  }

  function get(cook, yaw) {
    const ci = Math.round(Math.min(1, Math.max(0, cook)) * COOK_STEPS);
    const yi = Math.round(Math.min(YAW_STEPS, Math.max(0, (yaw / 1.6 + 0.5) * YAW_STEPS)));
    const k = ci * 100 + yi;
    let c = cache.get(k);
    if (!c) { c = render(ci, yi); cache.set(k, c); }
    return c;
  }

  // 事前に作っておく
  function warm() {
    const mid = YAW_STEPS / 2;
    for (let ci = 0; ci <= COOK_STEPS; ci++) get(ci / COOK_STEPS, 0);
    for (let yi = 0; yi <= YAW_STEPS; yi++) get(1, ((yi / YAW_STEPS) - 0.5) * 1.6);
    return mid;
  }

  // 1ユニットあたりのピクセル（ゲーム座標）
  return { get, warm, unitW: VW * 2, unitH: VH * 2 };
}
