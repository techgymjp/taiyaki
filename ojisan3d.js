// たい焼き屋のおじさん（3D）。体と腕を別々に描いて、腕だけ鉄板の手前に重ねる
import * as THREE from './vendor/three.module.min.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

function knitTexture(base, dot) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 64, 64);
  g.fillStyle = dot;
  for (let y = 0; y < 64; y += 4) {
    for (let x = (y / 4) % 2 ? 2 : 0; x < 64; x += 4) {
      g.beginPath(); g.ellipse(x + 1, y + 1.5, 1.1, 1.7, 0, 0, Math.PI * 2); g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function twistTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 32;
  const g = c.getContext('2d');
  g.fillStyle = '#f7f4ee'; g.fillRect(0, 0, 256, 32);
  g.strokeStyle = '#d23a32'; g.lineWidth = 7;
  for (let x = -40; x < 300; x += 18) {
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 22, 32); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(3, 1);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// 2点の間に置く円柱（腕など）
function limb(radius, mat) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.92, 1, 20, 1), mat);
  m.userData.place = (a, b) => {
    const d = b.clone().sub(a);
    const len = d.length();
    m.position.copy(a).addScaledVector(d, 0.5);
    m.scale.set(1, len, 1);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
  };
  return m;
}

// 2関節IK：肩S→手首T、ひじはpole側に曲がる
function solveIK(S, T, L1, L2, pole) {
  const d0 = T.clone().sub(S);
  let d = d0.length();
  const dir = d0.normalize();
  d = Math.min(d, (L1 + L2) * 0.999);
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const pv = pole.clone().sub(S);
  pv.addScaledVector(dir, -pv.dot(dir)).normalize();
  const elbow = S.clone().addScaledVector(dir, a).addScaledVector(pv, h);
  const wrist = S.clone().addScaledVector(dir, d);
  return { elbow, wrist };
}

export function createOjisan(opts) {
  const { W, top, bottom, res } = opts;
  const H = bottom - top;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * res); canvas.height = Math.round(H * res);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(canvas.width, canvas.height, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  // 遠近のあるカメラ。z=0 の面がゲーム座標とぴったり重なるように置く
  const DIST = 900;
  const cam = new THREE.PerspectiveCamera(2 * Math.atan(H / 2 / DIST) * 180 / Math.PI, W / H, 10, 4000);
  cam.position.set(W / 2, -(top + H / 2), DIST);
  cam.lookAt(W / 2, -(top + H / 2), 0);
  cam.updateMatrixWorld();
  // 画面上の点(gx,gy)の、奥行きzにある3D座標
  const screenToWorld = (gx, gy, z) => {
    const nx = gx / W * 2 - 1, ny = -((gy - top) / H * 2 - 1);
    const d = V(nx, ny, 0.5).unproject(cam).sub(cam.position).normalize();
    const t = (z - cam.position.z) / d.z;
    return cam.position.clone().addScaledVector(d, t);
  };
  const hemi = new THREE.HemisphereLight(0xfff6ea, 0x6a4a30, 1.2);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-300, 400, 700);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd6a0, 0.9);
  rim.position.set(400, 100, -200);
  scene.add(rim);
  for (const o of [hemi, key, rim]) { o.layers.enableAll(); }

  // ---- マテリアル ----
  const skin = new THREE.MeshStandardMaterial({ color: 0xe8b38c, roughness: 0.62 });
  const skinDark = new THREE.MeshStandardMaterial({ color: 0xd9997a, roughness: 0.7 });
  const cheek = new THREE.MeshStandardMaterial({ color: 0xec9a86, roughness: 0.7, transparent: true, opacity: 0.55 });
  const cloth = new THREE.MeshStandardMaterial({ color: 0xf3f0e8, roughness: 0.92 });
  const navy = new THREE.MeshStandardMaterial({ color: 0x24407a, roughness: 0.85 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x4a4a4c, roughness: 0.95 });
  const brow = new THREE.MeshStandardMaterial({ color: 0x2c2c2e, roughness: 0.95 });
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const pupil = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.2 });
  const mouthM = new THREE.MeshStandardMaterial({ color: 0x6a2018, roughness: 0.6 });
  const band = new THREE.MeshStandardMaterial({ map: twistTexture(), roughness: 0.9 });
  const glove = new THREE.MeshStandardMaterial({ color: 0xffffff, map: knitTexture('#efede6', '#cfcabd'), roughness: 1 });
  glove.map.repeat.set(3, 3);
  const yellow = new THREE.MeshStandardMaterial({ color: 0xe9c22a, roughness: 0.9 });
  const stain = new THREE.MeshStandardMaterial({ color: 0xc8a060, roughness: 1, transparent: true, opacity: 0.6 });

  const BODY = 1, ARMS = 2;
  const setLayer = (obj, l) => obj.traverse(o => o.layers.set(l));

  // ---- 体 ----
  const body = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), cloth);
  torso.scale.set(98, 120, 62);
  torso.position.set(0, -125, -40);
  body.add(torso);
  for (const sx of [-1, 1]) {
    const sh = new THREE.Mesh(new THREE.SphereGeometry(30, 24, 16), cloth);
    sh.position.set(sx * 62, -72, -30);
    body.add(sh);
    const collar = limb(4.5, navy);
    collar.userData.place(V(sx * 22, -50, 5), V(-sx * 8, -120, 22));
    body.add(collar);
  }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(18, 20, 30, 20), skinDark);
  neck.position.set(0, -45, -10);
  body.add(neck);

  // 頭
  const head = new THREE.Group();
  head.position.set(0, 0, 0);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(55, 48, 36), skin);
  skull.scale.set(1, 1.04, 0.95);
  head.add(skull);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(56.5, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.42), hair);
  hairCap.position.set(0, 4, -2);
  hairCap.rotation.x = -0.25;
  head.add(hairCap);
  const bandM = new THREE.Mesh(new THREE.TorusGeometry(55, 7.5, 12, 48), band);
  bandM.position.set(0, 30, -6);
  bandM.rotation.x = Math.PI / 2 - 0.25;
  head.add(bandM);
  for (const [x, y, z, rz] of [[54, 36, -14, -0.6], [62, 46, -18, -1.2]]) {
    const k = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), band);
    k.scale.set(11, 6, 6);
    k.position.set(x, y, z); k.rotation.z = rz;
    head.add(k);
  }
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), skin);
    ear.scale.set(7, 13, 6);
    ear.position.set(sx * 53, -2, -4);
    head.add(ear);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 16), skinDark);
  nose.scale.set(9, 11, 9);
  nose.position.set(0, -10, 52);
  head.add(nose);
  const eyes = [], pupils = [], brows = [];
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 16), white);
    e.scale.set(9.5, 8.5, 5);
    e.position.set(sx * 21, 4, 47);
    head.add(e); eyes.push(e);
    const p = new THREE.Mesh(new THREE.SphereGeometry(4.8, 16, 12), pupil);
    p.position.set(sx * 21, 4, 51);
    head.add(p); pupils.push(p);
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(3.6, 18, 6, 12), brow);
    b.rotation.z = Math.PI / 2;
    b.position.set(sx * 22, 19, 49);
    head.add(b); brows.push(b);
    const ck = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), cheek);
    ck.scale.set(9, 6, 3);
    ck.position.set(sx * 33, -14, 44);
    head.add(ck);
    const mu = new THREE.Mesh(new THREE.CapsuleGeometry(4.5, 20, 6, 12), brow);
    mu.position.set(sx * 13, -24, 51);
    mu.rotation.z = sx * (Math.PI / 2 - 0.35);
    head.add(mu);
  }
  const mouthN = new THREE.Mesh(new THREE.TorusGeometry(7, 1.8, 8, 16, Math.PI), mouthM);
  mouthN.position.set(0, -32, 49);
  mouthN.rotation.z = Math.PI;
  head.add(mouthN);
  const mouthH = new THREE.Mesh(new THREE.SphereGeometry(11, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mouthM);
  mouthH.position.set(0, -30, 46);
  mouthH.scale.set(1, 1, 0.5);
  head.add(mouthH);
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0, 0);
  headPivot.add(head);
  body.add(headPivot);

  // 腰を軸に前かがみ・横に傾く
  const hips = new THREE.Group();
  hips.position.set(180, -470, -40);
  body.position.set(0, 310, 40);
  hips.add(body);
  scene.add(hips);
  setLayer(body, BODY);
  const shoulderAnchors = [-1, 1].map(sx => {
    const o = new THREE.Object3D();
    o.position.set(sx * 64, -72, -20);
    body.add(o);
    return o;
  });

  // ---- 腕と軍手 ----
  const L1 = 138, L2 = 132, HAND = 34;
  function makeArm(side) {
    const g = new THREE.Group();
    const clip = new THREE.Plane(V(0, 0, 1), -95);
    const cl = m => { const c = m.clone(); c.clippingPlanes = [clip]; return c; };
    const cloth = cl(clothBase), skin = cl(skinBase), glove = cl(gloveBase), yellow = cl(yellowBase), stain = cl(stainBase);
    const upper = limb(19, cloth);
    const fore = limb(11.5, skin);
    const sleeveEnd = new THREE.Mesh(new THREE.SphereGeometry(19, 20, 14), cloth);
    const elbowJ = new THREE.Mesh(new THREE.SphereGeometry(12, 16, 12), skin);
    g.add(upper, fore, sleeveEnd, elbowJ);
    // 軍手（ローカル: +x 指先、+y 手の甲、+z 親指側の反対）
    const hand = new THREE.Group();
    const palm = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), glove);
    palm.scale.set(17, 7.5, 15);
    palm.position.set(4, 0, 0);
    hand.add(palm);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(13, 14, 16, 20), glove);
    cuff.rotation.z = Math.PI / 2;
    cuff.position.set(-16, 0, 0);
    hand.add(cuff);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(14, 1.8, 6, 24), yellow);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(-24, 0, 0);
    hand.add(ring);
    const spot = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), stain);
    spot.scale.set(6, 1.5, 4);
    spot.position.set(6, 7, 3);
    hand.add(spot);
    const fingers = [];
    for (let i = 0; i < 4; i++) {
      const z = (i - 1.5) * 7.2;
      const f1 = new THREE.Group();
      f1.position.set(18, 0, z);
      const seg1 = new THREE.Mesh(new THREE.CapsuleGeometry(3.6, 9, 4, 10), glove);
      seg1.rotation.z = -Math.PI / 2; seg1.position.x = 6;
      f1.add(seg1);
      const f2 = new THREE.Group();
      f2.position.x = 12;
      const seg2 = new THREE.Mesh(new THREE.CapsuleGeometry(3.3, 7, 4, 10), glove);
      seg2.rotation.z = -Math.PI / 2; seg2.position.x = 5;
      f2.add(seg2);
      f1.add(f2);
      hand.add(f1);
      fingers.push({ f1, f2, z });
    }
    const thumb = new THREE.Group();
    thumb.position.set(4, -2, -side * 15);
    const tseg = new THREE.Mesh(new THREE.CapsuleGeometry(4, 11, 4, 10), glove);
    tseg.rotation.z = -Math.PI / 2; tseg.position.x = 8;
    thumb.add(tseg);
    hand.add(thumb);
    g.add(hand);
    scene.add(g);
    setLayer(g, ARMS);
    return { g, upper, fore, sleeveEnd, elbowJ, hand, fingers, thumb, side, clip, thr: 95 };
  }
  const clothBase = cloth, skinBase = skin, gloveBase = glove, yellowBase = yellow, stainBase = stain;
  const arms = [makeArm(-1), makeArm(1)];
  renderer.localClippingEnabled = true;

  const tmpM = new THREE.Matrix4();
  function poseArm(arm, S, tip, grip, reach) {
    // 手首の位置：指先から少し手前（腕の方向と、上からかぶせる向きを混ぜる）
    const toTip = tip.clone().sub(S).normalize();
    const downish = V(0, -0.55, 0.85).normalize();
    const fdir = toTip.clone().lerp(downish, 0.35 + 0.25 * reach).normalize();
    const wristT = tip.clone().addScaledVector(fdir, -(HAND + 18));
    const pole = S.clone().add(V(arm.side * (55 + 40 * reach), -200 + 120 * reach, -40)); // ひじは下（伸ばすほど外へ）
    const { elbow, wrist } = solveIK(S, wristT, L1, L2, pole);
    const mid = elbow.clone().lerp(wrist, 0.18);
    arm.upper.userData.place(S, mid);
    arm.sleeveEnd.position.copy(mid);
    arm.elbowJ.position.copy(elbow);
    arm.fore.userData.place(mid, wrist);
    // 手の向き：+x が指先、手の甲は上（と手前）を向く
    const fx = fdir.clone();
    const hint = V(0, 1, 0.5).normalize();
    const fy = hint.clone().addScaledVector(fx, -hint.dot(fx)).normalize();
    const fz = fx.clone().cross(fy);
    tmpM.makeBasis(fx, fy, fz);
    arm.hand.quaternion.setFromRotationMatrix(tmpM);
    arm.hand.position.copy(wrist).addScaledVector(fx, 16);
    // 指の曲げ（grip 0=開く 1=にぎる）
    for (const f of arm.fingers) {
      f.f1.rotation.set(0, (f.z / 10.8) * 0.18 * (1 - grip), -0.15 - grip * 1.05);
      f.f2.rotation.z = -0.1 - grip * 1.2;
    }
    arm.thumb.rotation.set(arm.side * (0.5 - grip * 0.4), arm.side * (0.6 - grip * 0.5), -0.3 - grip * 0.6);
  }

  const state = { blink: 0, nextBlink: 2 };

  function update(dt, s) {
    // s: { tips:[{x,y,z,grip,reach}], look:{x,y}|null, mood, t }
    const t = s.t;
    // 呼吸
    const breath = Math.sin(t * 2.2) * 1.5;
    body.position.y = 310 + breath * 0.5;
    torso.scale.y = 120 + breath;
    // 体の傾き：手を伸ばすほど前かがみ、伸ばしている側へ少し傾く
    let fwd = 0, side = 0;
    s.tips.forEach((tp, i) => {
      const deep = Math.max(0, Math.min(1, (tp.y - 300) / 230));
      fwd = Math.max(fwd, tp.reach * (0.1 + 0.16 * deep));
      side += tp.reach * (i ? 1 : -1) * (0.04 + 0.05 * Math.abs(tp.x - 180) / 140);
    });
    if (s.mood === 'happy') fwd = -0.04;
    const k = Math.min(1, dt * 5);
    hips.rotation.x += (fwd - hips.rotation.x) * k;
    hips.rotation.z += (-side - hips.rotation.z) * k;
    hips.updateMatrixWorld(true);
    // 頭の向き
    let ry = 0, rx = 0.06;
    if (s.look) {
      ry = Math.max(-0.5, Math.min(0.5, (s.look.x - 180) / 260));
      rx = 0.12 + Math.min(0.3, (s.look.y - 300) / 900);
    }
    if (s.mood === 'happy') { ry *= 0.3; rx = -0.08 + Math.sin(t * 10) * 0.04; }
    headPivot.rotation.y += (ry - headPivot.rotation.y) * Math.min(1, dt * 7);
    headPivot.rotation.x += (rx - headPivot.rotation.x) * Math.min(1, dt * 7);
    // 目線
    const px = s.look ? Math.max(-1, Math.min(1, (s.look.x - 180) / 120)) * 3.5 : 0;
    const py = s.look ? -2.5 : 0;
    pupils.forEach((p, i) => { p.position.x = (i ? 21 : -21) + px; p.position.y = 4 + py; });
    // まばたき
    state.nextBlink -= dt;
    if (state.nextBlink <= 0) { state.blink = 0.14; state.nextBlink = 2 + Math.random() * 3; }
    state.blink = Math.max(0, state.blink - dt);
    const open = s.mood === 'happy' ? 0.15 : state.blink > 0 ? 0.1 : (s.mood === 'focus' ? 0.8 : 1);
    eyes.forEach(e => { e.scale.y = 8.5 * open; });
    pupils.forEach(p => { p.visible = open > 0.3; });
    // 眉
    const tilt = s.mood === 'focus' ? 0.28 : s.mood === 'happy' ? -0.2 : 0.05;
    brows.forEach((b, i) => {
      const sx = i ? 1 : -1;
      b.rotation.z = Math.PI / 2 + sx * tilt;
      b.position.y = 19 + (s.mood === 'happy' ? 4 : 0);
    });
    mouthN.visible = s.mood !== 'happy';
    mouthH.visible = s.mood === 'happy';
    // 腕
    s.tips.forEach((tp, i) => {
      // 手を伸ばしはじめたら腕は機械の上を越えるので、全部手前に描く
      const r = Math.min(1, Math.max(0, tp.reach / 0.3));
      arms[i].thr = 95 - 400 * r * r * (3 - 2 * r);
      const S = shoulderAnchors[i].getWorldPosition(V(0, 0, 0));
      poseArm(arms[i], S, screenToWorld(tp.x, tp.y, tp.z), tp.grip, tp.reach);
    });
  }

  // 機械の奥のふち（これより奥は鉄板の後ろに隠れる）
  function render(layers, front) {
    cam.layers.disableAll();
    for (const l of layers) cam.layers.enable(l);
    // 奥側の描画では z<thr だけ、手前側の描画では z>=thr だけを残す
    for (const a of arms) {
      if (front) a.clip.set(V(0, 0, 1), -a.thr);
      else a.clip.set(V(0, 0, -1), a.thr);
    }
    renderer.render(scene, cam);
    return canvas;
  }

  return {
    update,
    renderBody: () => render([BODY, ARMS], false),
    renderArms: () => render([ARMS], true),
    top, height: H,
  };
}
