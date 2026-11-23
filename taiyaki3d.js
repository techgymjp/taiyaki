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

// ---------- 鉄板（業務用たい焼き機の鋳物の焼き型）を1枚の画像として描く ----------
// opts: { x, y, w, h, ppu, rects:[{x,y,w,h}], slots:[{x,y}], scale }  座標はゲーム座標(px)
export function renderPlate(opts) {
  const { x: ox, y: oy, w, h, ppu, slots, rects } = opts;
  const scale = opts.scale || 2;
  const TILT = 0.42;
  const cosT = Math.cos(TILT);
  const cx = ox + w / 2, cy = oy + h / 2;
  const PW = Math.round(w * scale), PH = Math.round(h * scale);
  const canvas = document.createElement('canvas');
  canvas.width = PW; canvas.height = PH;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  } catch (e) { return null; }
  renderer.setPixelRatio(1);
  renderer.setSize(PW, PH, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const sdf = makeSdf(buildOutline());
  const toU = (px, py) => ({ x: (px - cx) / ppu, y: -(py - cy) / ppu / cosT });
  const Wu = w / ppu, Du = h / ppu / cosT;
  const holes = slots.map(s => toU(s.x, s.y));
  const plates = rects.map(r => {
    const a = toU(r.x, r.y), b = toU(r.x + r.w, r.y + r.h);
    return { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, hw: Math.abs(b.x - a.x) / 2, hh: Math.abs(b.y - a.y) / 2 };
  });
  const bolts = [];
  for (const p of plates) {
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) bolts.push({ x: p.cx + sx * (p.hw - 0.16), y: p.cy + sy * (p.hh - 0.16) });
  }
  const CAV = 1.06; // 型はたい焼きより少し大きい
  const R = 0.22;   // 角の丸み

  const NX = Math.round(w * 1.4), NY = Math.round(h * 1.4 / cosT);
  const nv = (NX + 1) * (NY + 1);
  const positions = new Float32Array(nv * 3);
  const colors = new Float32Array(nv * 3);
  const keep = new Uint8Array(nv);

  for (let j = 0; j <= NY; j++) {
    for (let i = 0; i <= NX; i++) {
      const X = -Wu / 2 + (Wu * i) / NX;
      const Y = -Du / 2 + (Du * j) / NY;
      const k = j * (NX + 1) + i;
      // 一番近い焼き型の角丸長方形（内側が正）
      let er = -Infinity;
      for (const p of plates) {
        const qx = Math.abs(X - p.cx) - (p.hw - R), qy = Math.abs(Y - p.cy) - (p.hh - R);
        er = Math.max(er, R - (Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0)));
      }
      keep[k] = er > -0.002 ? 1 : 0;

      // 鋳物の地肌（細かいザラザラ）
      let z = 0.005 * (fbm(X * 30, Y * 30) - 0.5) + 0.002 * (hash(i, j) - 0.5);
      // ふちの盛り上がりと面取り
      z += 0.07 * smooth(0.0, 0.05, er) * smooth(0.24, 0.12, er);
      z -= 0.04 * smooth(0.05, 0.0, er);
      // ボルト
      let boltD = Infinity;
      for (const b of bolts) boltD = Math.min(boltD, Math.hypot(X - b.x, Y - b.y));
      if (boltD < 0.075) z += 0.05 * Math.sqrt(1 - Math.pow(boltD / 0.075, 2));

      // 型の凹み（うろこ・えら・目の彫り込み）
      let near = holes[0], nd = Infinity;
      for (const hh of holes) {
        const dd = Math.abs(X - hh.x) + Math.abs(Y - hh.y) * 1.5;
        if (dd < nd) { nd = dd; near = hh; }
      }
      const lx = (X - near.x) / CAV, ly = (Y - near.y) / CAV;
      let d = -1, depth = 0;
      if (Math.abs(lx) < 1.35 && Math.abs(ly) < 0.95) d = sdf(lx, ly);
      if (d > 0) {
        const sf = surface(lx, ly, d);
        depth = sf.dome * 0.9 + sf.relief * 1.7 + 0.012;
        z -= depth * smooth(0.0, 0.035, d);
      } else if (d > -0.07) {
        z += 0.014 * smooth(-0.07, -0.02, d) * smooth(0.0, -0.012, d); // 型のふちの土手
      }

      // 色：使い込まれた鋳鉄（茶色がかったグレー）
      const n1 = fbm(X * 1.5 + 5, Y * 1.5), n2 = fbm(X * 10, Y * 10), n3 = fbm(X * 4 + 20, Y * 4 - 3);
      let c = [0.215 + 0.05 * n1 + 0.04 * n2, 0.205 + 0.045 * n1 + 0.038 * n2, 0.2 + 0.04 * n1 + 0.036 * n2];
      // 油なじみ：型の中と周りは茶色く、しっとり
      const oil = smooth(-0.3, 0.02, d) * (0.55 + 0.45 * n3);
      c = [c[0] * (1 - 0.4 * oil) + 0.24 * oil * 0.4, c[1] * (1 - 0.4 * oil) + 0.16 * oil * 0.4, c[2] * (1 - 0.4 * oil) + 0.1 * oil * 0.4];
      // 彫りの奥は暗く
      if (d > 0) {
        const deep = Math.min(1, depth * 3.2);
        c = c.map(v => v * (1 - 0.35 * deep));
      }
      // こびりついた生地の焦げ（ふちの周り）
      if (d > -0.15 && d < 0.03) {
        const spot = smooth(0.66, 0.8, fbm(X * 13 + 7, Y * 13 + 1));
        c = c.map((v, ci) => v * (1 - spot * 0.4) + [0.36, 0.22, 0.1][ci] * spot * 0.4);
      }
      // 平らな面は使い込まれてまだら
      const mott = smooth(0.5, 0.75, fbm(X * 2.6 - 9, Y * 2.6 + 4));
      c = c.map((v, ci) => v * (1 - 0.12 * mott) + [0.15, 0.12, 0.1][ci] * 0.12 * mott);
      // ふちの角は擦れて明るい
      const wear = smooth(0.06, 0.02, Math.abs(er - 0.1)) * 0.08;
      c = c.map(v => v + wear);
      if (boltD < 0.075) c = [0.5, 0.49, 0.47];

      positions[k * 3] = X; positions[k * 3 + 1] = Y; positions[k * 3 + 2] = z;
      colors[k * 3] = toLinear(c[0]); colors[k * 3 + 1] = toLinear(c[1]); colors[k * 3 + 2] = toLinear(c[2]);
    }
  }
  const idx = [];
  for (let j = 0; j < NY; j++) {
    for (let i = 0; i < NX; i++) {
      const a = j * (NX + 1) + i, b = a + 1, c2 = a + NX + 1, d2 = c2 + 1;
      if (keep[a] && keep[b] && keep[c2] && keep[d2]) idx.push(a, b, d2, a, d2, c2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  const scene = new THREE.Scene();
  const hw = Wu / 2, hh2 = (h / ppu) / 2;
  const cam = new THREE.OrthographicCamera(-hw, hw, hh2, -hh2, 0.1, 20);
  cam.position.set(0, 0, 8);
  scene.add(new THREE.HemisphereLight(0xfff2e4, 0x3a2a1c, 0.8));
  const key = new THREE.DirectionalLight(0xfff0dd, 2.4);
  key.position.set(-2, 3, 2.2);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffd2a0, 0.6);
  fill.position.set(3, -2, 1.5);
  scene.add(fill);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.35 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -TILT;
  scene.add(mesh);
  // ぼんやりした映り込み
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x4a3a2c);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8), new THREE.MeshBasicMaterial({ color: 0xfff2d8 }));
  lamp.position.set(-3, 5, 4); lamp.scale.setScalar(2.5);
  envScene.add(lamp);
  const env = pmrem.fromScene(envScene, 0.04);
  scene.environment = env.texture;

  renderer.render(scene, cam);
  const out = document.createElement('canvas');
  out.width = PW; out.height = PH;
  out.getContext('2d').drawImage(canvas, 0, 0);
  geo.dispose(); mat.dispose(); env.dispose(); pmrem.dispose();
  renderer.dispose();
  renderer.forceContextLoss && renderer.forceContextLoss();
  return out;
}
