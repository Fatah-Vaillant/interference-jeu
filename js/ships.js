'use strict';
/* =========================================================
   INTERFÉRENCE — la flotte
   Kit de dessin (silhouettes arrondies, ombrage doux, lumière venant du haut)
   et tous les engins du jeu. Uniquement des machines : aucun visage,
   aucun être vivant.
   Conventions : vue de dessus = nez vers le haut ; « down: true » retourne
   l'engin (ennemis qui foncent vers le joueur). Vue de profil = nez à droite.
   ========================================================= */
(() => {
  const D = Art.DEF, R = Art.R, sym = Art.sym, at = Art.at;
  const SEAM = '#E36A5C', MINT = '#8AD6A8', ICE = '#A9CFE0', GOLD = '#E9C979', WARM = '#F2B36E', AMBER = '#E8A15A', CYAN = '#9CC8E8';

  /* ---------- matières : ombre, sombre, base, clair, reflet ---------- */
  const TN = {
    pe: ['#3E4148', '#9A9EA6', '#D3D6DB', '#ECEEF0', '#FFFFFF'],
    wh: ['#6E737B', '#BCC0C6', '#E2E4E7', '#F3F4F5', '#FFFFFF'],
    al: ['#4C5056', '#83888F', '#B5B9BF', '#D6D9DD', '#F2F3F5'],
    gr: ['#0B0C0E', '#18191C', '#26282D', '#383B42', '#5C606A'],
    gm: ['#101318', '#20252D', '#333A45', '#4B5462', '#77808E'],
    nv: ['#161C23', '#2C3540', '#46515E', '#64707D', '#8F9AA6'],
    br: ['#3A2810', '#6E5226', '#A8844A', '#CBAA70', '#EFD9A6'],
    iv: ['#5A5346', '#988F7C', '#CFC6B0', '#E5DECB', '#FAF6EA'],
    fe: ['#0D1517', '#1F2E31', '#34494C', '#4E686A', '#7C9898'],
    cu: ['#33190E', '#5E301C', '#8E4E30', '#B37050', '#D9A084'],
    ol: ['#201F17', '#3C3A2A', '#5A5840', '#77745A', '#9C987E'],
    fa: ['#4A4438', '#7C7464', '#A8A08C', '#C4BCA8', '#E2DCCB'],
    rd: ['#2E1210', '#58231E', '#83382F', '#A3564A', '#C98679'],
    wd: ['#2A1D12', '#4A3420', '#6E5034', '#8C6C4C', '#B09070'],
    bk: ['#060607', '#111214', '#1C1D21', '#2C2E33', '#4A4D55'],
    go: ['#3E2C0C', '#7A5C22', '#B48E44', '#D8B670', '#F8E6B0'],
    la: ['#050E24', '#0C1D44', '#18346E', '#28508F', '#5078B8'],
    so: ['#081022', '#12203C', '#1D3258', '#2C4878', '#5674A6'],
    fo: ['#4A3408', '#8A661E', '#C49A3E', '#E2C070', '#FFF0BC'],
    nb: ['#0A1020', '#141E34', '#22304E', '#34466C', '#5A6E96'],
    mv: ['#24192A', '#3E2C44', '#5C4664', '#7C6484', '#A792AE'],
    gn: ['#1A2218', '#2E3A2C', '#4A5A46', '#667A60', '#8EA286'],
    st: ['#20242A', '#3C434D', '#5E6773', '#7F8995', '#AEB7C2'],
    tk: ['#2A2620', '#4A4438', '#6A6252', '#857C6A', '#A69C88'],
  };

  /* ---------- géométrie ---------- */
  const bbOf = pts => { let a = 1e9, b = 1e9, e = -1e9, f = -1e9; for (const p of pts) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); e = Math.max(e, p[0]); f = Math.max(f, p[1]); } return [a, b, e, f]; };
  function rpath(pts) {
    const P = new Path2D(), n = pts.length, v = pts.map(p => [p[0], p[1], p[2] || 0]);
    P.moveTo((v[n - 1][0] + v[0][0]) / 2, (v[n - 1][1] + v[0][1]) / 2);
    for (let i = 0; i < n; i++) {
      const a = v[(i + n - 1) % n], b = v[i], e = v[(i + 1) % n]; let r = b[2];
      if (r > 0) {
        const ax = a[0] - b[0], ay = a[1] - b[1], ex = e[0] - b[0], ey = e[1] - b[1], l1 = Math.hypot(ax, ay), l2 = Math.hypot(ex, ey);
        if (l1 < 1e-6 || l2 < 1e-6) r = 0;
        else { const ang = Math.acos(clamp((ax * ex + ay * ey) / (l1 * l2), -1, 1)); r = ang < 1e-3 || ang > Math.PI - 1e-3 ? 0 : Math.min(r, Math.min(l1, l2) * 0.5 * Math.tan(ang / 2)); }
      }
      if (r > 0.05) P.arcTo(b[0], b[1], e[0], e[1], r); else P.lineTo(b[0], b[1]);
    }
    P.closePath(); return P;
  }
  const mir = pts => { const o = pts.map(p => [p[0], p[1], p[2] || 0]); for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; if (Math.abs(p[0]) > 1e-6) o.push([-p[0], p[1], p[2] || 0]); } return o; };
  function cr(pts, steps = 8, closed = false) {
    const n = pts.length, out = [], seg = closed ? n : n - 1, g = i => closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
    for (let i = 0; i < seg; i++) {
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
      }
    }
    if (!closed) out.push([pts[n - 1][0], pts[n - 1][1]]);
    return out;
  }
  function side(list) { const s = cr(list.map(([y, hw]) => [hw, y]), 8).map(p => [Math.max(0, p[0]), p[1]]); if (s[0][0] > 0.01) s.unshift([0, s[0][1]]); const l = s[s.length - 1]; if (l[0] > 0.01) s.push([0, l[1]]); return mir(s); }
  const S = {
    poly: pts => ({ P: rpath(pts), bb: bbOf(pts) }),
    sym: half => S.poly(mir(half)),
    // fuseau : [[y, demi-largeur]] du nez à la queue
    hull: (list, ox = 0, oy = 0) => { const pts = side(list).map(p => [p[0] + ox, p[1] + oy]); return { P: rpath(pts), bb: bbOf(pts) }; },
    // fuseau horizontal (profil) : [[x, demi-hauteur]] de la queue au nez
    hullX: (list, ox = 0, oy = 0) => { const pts = side(list).map(p => [p[1] + ox, p[0] + oy]); return { P: rpath(pts), bb: bbOf(pts) }; },
    smooth: pts => { const q = cr(pts, 10, true); return { P: rpath(q), bb: bbOf(q) }; },
    ell: (cx, cy, rx, ry = rx) => { const P = new Path2D(); P.ellipse(cx, cy, rx, ry, 0, 0, TAU); return { P, bb: [cx - rx, cy - ry, cx + rx, cy + ry] }; },
    rr: (x, y, w, h, r = 0) => S.poly([[x, y, r], [x + w, y, r], [x + w, y + h, r], [x, y + h, r]]),
    ring: (cx, cy, r1, r2) => { const P = new Path2D(); P.arc(cx, cy, r2, 0, TAU); P.moveTo(cx + r1, cy); P.arc(cx, cy, r1, 0, TAU, true); return { P, bb: [cx - r2, cy - r2, cx + r2, cy + r2] }; },
    star: (n, ro, ri, cx = 0, cy = 0, rot = -Math.PI / 2, r = 0) => { const pts = []; for (let i = 0; i < n * 2; i++) { const a = rot + i / (n * 2) * TAU, rr = i % 2 ? ri : ro; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, r]); } return S.poly(pts); },
  };

  /* ---------- peinture ---------- */
  const lg = (c, x0, y0, x1, y1, st) => { const g = c.createLinearGradient(x0, y0, x1, y1); for (const [o, col] of st) g.addColorStop(o, col); return g; };
  const sy = (bb, f) => R.flip ? bb[3] - (bb[3] - bb[1]) * f : bb[1] + (bb[3] - bb[1]) * f; // hauteur « écran »
  const px = v => v / R.sc; // épaisseur en pixels écran
  function paint(c, s, m, o = {}) {
    const P = s.P, bb = s.bb, [x0, y0, x1, y1] = bb, w = Math.max(1e-3, x1 - x0), h = Math.max(1e-3, y1 - y0), rule = o.rule || 'nonzero';
    if (o.cast) { c.save(); c.shadowColor = `rgba(0,0,0,${o.ca == null ? 0.45 : o.ca})`; c.shadowBlur = o.cast * R.sc * R.dpr; c.shadowOffsetY = o.cast * 0.35 * R.sc * R.dpr; c.fillStyle = '#000'; c.fill(P, rule); c.restore(); }
    const t = TN[m]; let f = m;
    if (t) {
      const lit = o.lit || 'x';
      if (lit === 'x') f = lg(c, x0, 0, x1, 0, [[0, t[1]], [0.2, t[2]], [0.44, t[3]], [0.56, t[3]], [0.82, t[2]], [1, t[1]]]);
      else if (lit === 'y') f = lg(c, 0, sy(bb, 0), 0, sy(bb, 1), [[0, t[3]], [0.45, t[2]], [1, t[1]]]);
      else if (lit === 'r') { const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, r = Math.max(w, h) / 2, g = c.createRadialGradient(cx - w * 0.16, sy(bb, 0.3), r * 0.04, cx, cy, r * 1.04); g.addColorStop(0, t[4]); g.addColorStop(0.35, t[3]); g.addColorStop(0.75, t[2]); g.addColorStop(1, t[1]); f = g; }
      else if (lit === 'h') f = lg(c, x0, 0, x1, 0, [[0, t[3]], [1, t[1]]]);
      else f = t[2];
    }
    c.fillStyle = f; c.fill(P, rule);
    c.save(); c.clip(P, rule);
    if (o.sheen !== false) { c.fillStyle = lg(c, 0, sy(bb, 0), 0, sy(bb, 1), [[0, 'rgba(255,255,255,.12)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.2)']]); c.fillRect(x0 - 1, y0 - 1, w + 2, h + 2); }
    const bw = o.bev == null ? 1.5 : o.bev;
    if (bw) { c.strokeStyle = lg(c, 0, sy(bb, 0), 0, sy(bb, 1), [[0, 'rgba(255,255,255,.62)'], [0.45, 'rgba(255,255,255,.1)'], [1, 'rgba(0,0,0,.35)']]); c.lineWidth = bw * 2; c.stroke(P); }
    c.restore();
    const ol = o.ol == null ? 0.42 : o.ol;
    if (ol) { c.strokeStyle = `rgba(6,7,10,${ol})`; c.lineWidth = clamp(px(0.6), 0.35, 2.4); c.stroke(P); }
  }
  // traits gravés (sombre + reflet décalé vers le bas de l'écran)
  function eline(c, d, a = 0.32, w = 0.9) {
    const P = typeof d === 'string' ? Art.path(d) : d;
    c.lineWidth = Math.max(w, px(0.5)); c.strokeStyle = `rgba(0,0,0,${a})`; c.stroke(P);
    c.save(); c.translate(0, px(0.7) * (R.flip ? -1 : 1)); c.strokeStyle = `rgba(255,255,255,${a * 0.42})`; c.stroke(P); c.restore();
  }
  function strk(c, d, col, w = 1.5) { c.strokeStyle = col; c.lineWidth = Math.max(w, px(0.6)); c.stroke(typeof d === 'string' ? Art.path(d) : d); }
  function fill(c, s, col, a = 1) { c.globalAlpha = a; c.fillStyle = col; c.fill(s.P); c.globalAlpha = 1; }
  function clipTo(c, s, fn) { c.save(); c.clip(s.P); fn(); c.restore(); }
  function glass(c, s, tint = 'b') {
    const [x0, y0, x1, y1] = s.bb, w = x1 - x0, h = y1 - y0;
    const T = { b: ['#0C131D', '#3E5A76', '#182435', '#090E16'], c: ['#0A1A22', '#4E8EA6', '#16303C', '#071219'], g: ['#1E1508', '#9C7A3A', '#3A2A10', '#140E05'], d: ['#08090B', '#30343C', '#121418', '#060708'] }[tint];
    c.fillStyle = lg(c, x0, 0, x1, 0, [[0, T[0]], [0.36, T[1]], [0.62, T[2]], [1, T[3]]]); c.fill(s.P);
    clipTo(c, s, () => { c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(x0 + w * 0.34, sy(s.bb, 0.3), Math.max(0.6, w * 0.12), h * 0.2, 0, 0, TAU); c.fill(); });
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = clamp(px(0.6), 0.35, 2); c.stroke(s.P);
  }
  function lamp(c, x, y, r, col = SEAM, a = 1) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x, y, 0, x, y, r * 3.4); g.addColorStop(0, hexA(col, 0.95 * a)); g.addColorStop(0.28, hexA(col, 0.38 * a)); g.addColorStop(1, hexA(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 3.4, 0, TAU); c.fill(); c.restore();
    c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,248,240,.95)'; c.beginPath(); c.arc(x, y, r * 0.5, 0, TAU); c.fill();
  }
  function nozzle(c, x, y, rx, ry, col = WARM) {
    c.fillStyle = '#0B0C0F'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill();
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry) * 1.6);
    g.addColorStop(0, hexA(col, 0.95)); g.addColorStop(0.4, hexA(col, 0.4)); g.addColorStop(1, hexA(col, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, Math.max(rx, ry) * 1.6, 0, TAU); c.fill(); c.restore();
  }
  // hélice vue de dessus (disque vu par la tranche)
  function prop(c, x, y, rx, a = 0.55) {
    c.fillStyle = lg(c, x - rx, 0, x + rx, 0, [[0, 'rgba(225,228,232,0)'], [0.18, `rgba(225,228,232,${a})`], [0.5, `rgba(240,242,245,${a * 0.7})`], [0.82, `rgba(225,228,232,${a})`], [1, 'rgba(225,228,232,0)']]);
    c.beginPath(); c.ellipse(x, y, rx, Math.max(px(1.4), rx * 0.085), 0, 0, TAU); c.fill();
    paint(c, S.ell(x, y, rx * 0.11, rx * 0.11), 'al', { lit: 'r', bev: 0.6, ol: 0.3 });
  }
  // hélice de profil (disque vertical)
  function propS(c, x, y, ry, a = 0.5) {
    c.fillStyle = lg(c, 0, y - ry, 0, y + ry, [[0, 'rgba(225,228,232,0)'], [0.2, `rgba(225,228,232,${a})`], [0.5, `rgba(240,242,245,${a * 0.6})`], [0.8, `rgba(225,228,232,${a})`], [1, 'rgba(225,228,232,0)']]);
    c.beginPath(); c.ellipse(x, y, Math.max(px(1.4), ry * 0.1), ry, 0, 0, TAU); c.fill();
  }
  // rotor vu de dessus (disque flou)
  function rotor(c, x, y, r, a = 0.58, hub = 'al') {
    const g = c.createRadialGradient(x, y, r * 0.1, x, y, r);
    g.addColorStop(0, `rgba(230,232,236,${a * 0.25})`); g.addColorStop(0.7, `rgba(230,232,236,${a * 0.55})`); g.addColorStop(0.93, `rgba(240,242,246,${a})`); g.addColorStop(1, 'rgba(240,242,246,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.strokeStyle = `rgba(255,255,255,${a * 0.5})`; c.lineWidth = Math.max(0.8, px(0.6));
    for (let i = 0; i < 2; i++) { c.beginPath(); c.arc(x, y, r * (0.55 + i * 0.25), -0.4 + i * 2.6, 0.5 + i * 2.6); c.stroke(); }
    paint(c, S.ell(x, y, r * 0.16), hub, { lit: 'r', bev: 0.6, ol: 0.35 });
  }
  // conduit de soufflante (anneau + rotor)
  function fan(c, x, y, r, m = 'wh') {
    const ri = r * 0.82, g = c.createRadialGradient(x, y - ri * 0.3, ri * 0.1, x, y, ri);
    g.addColorStop(0, '#C9CED6'); g.addColorStop(0.7, '#9AA1AB'); g.addColorStop(1, '#6E747E'); c.fillStyle = g; c.beginPath(); c.arc(x, y, ri, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.28)'; for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.4; c.beginPath(); c.moveTo(x, y); c.arc(x, y, ri, a, a + 0.55); c.closePath(); c.fill(); }
    paint(c, S.ell(x, y, r * 0.2), 'al', { lit: 'r', bev: 0.5, ol: 0.3 }); paint(c, S.ring(x, y, ri, r), m, { lit: 'r', rule: 'evenodd', bev: 1 });
  }
  // fuseau moteur vu de dessus
  function nac(c, x, y0, y1, r, m, o = {}) {
    const L = y1 - y0; paint(c, S.hull([[y0, r * 0.62], [y0 + L * 0.12, r * 0.96], [y0 + L * 0.32, r], [y1 - L * 0.22, r * 0.94], [y1, r * 0.72]], x), m, { cast: o.cast == null ? 3 : o.cast });
    if (o.intake !== false) { c.fillStyle = '#08090B'; c.beginPath(); c.ellipse(x, y0 + L * 0.05, r * 0.46, Math.max(0.8, r * 0.2), 0, 0, TAU); c.fill(); }
  }
  function rivets(c, pts, r = 0.9) { for (const [x, y] of pts) { c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(x - r * 0.3, y + (R.flip ? r * 0.3 : -r * 0.3), r * 0.45, 0, TAU); c.fill(); } }
  function grid(c, s, nx, ny, col = 'rgba(160,190,230,.28)') { const [x0, y0, x1, y1] = s.bb; clipTo(c, s, () => { c.strokeStyle = col; c.lineWidth = Math.max(0.5, px(0.5)); c.beginPath(); for (let i = 1; i < nx; i++) { const x = x0 + (x1 - x0) * i / nx; c.moveTo(x, y0); c.lineTo(x, y1); } for (let j = 1; j < ny; j++) { const y = y0 + (y1 - y0) * j / ny; c.moveTo(x0, y); c.lineTo(x1, y); } c.stroke(); }); }
  function panel(c, s, nx, ny) { const [x0, y0, x1, y1] = s.bb, P = new Path2D(); for (let i = 1; i < nx; i++) { const x = x0 + (x1 - x0) * i / nx; P.moveTo(x, y0); P.lineTo(x, y1); } for (let j = 1; j < ny; j++) { const y = y0 + (y1 - y0) * j / ny; P.moveTo(x0, y); P.lineTo(x1, y); } clipTo(c, s, () => eline(c, P, 0.3, 0.7)); }

  /* ---------- assemblage d'un avion vu de dessus ---------- */
  function jet(c, s) {
    const hm = s.hm, wm = s.wm || hm, tm = s.tm || wm;
    if (s.tail) sym(c, () => paint(c, S.poly(s.tail), tm, { lit: 'y', bev: 1.1 }));
    if (s.pre0) s.pre0(c);
    if (s.wing) sym(c, () => { const w = S.poly(s.wing); paint(c, w, wm, { lit: 'y', bev: 1.4, cast: s.wc }); if (s.wl) clipTo(c, w, () => eline(c, s.wl, 0.3, 0.8)); if (s.wtip) clipTo(c, w, () => s.wtip(c)); });
    if (s.nac) for (const n of s.nac) sym(c, () => nac(c, n[0], n[1], n[2], n[3], n[4] || hm, { intake: n[5] !== false }));
    if (s.pre) s.pre(c);
    if (s.hull) { const h = S.hull(s.hull); paint(c, h, hm, { cast: s.cast == null ? 5 : s.cast }); if (s.hl) clipTo(c, h, () => eline(c, s.hl, 0.3, 0.8)); if (s.htip) clipTo(c, h, () => s.htip(c)); }
    if (s.fins) sym(c, () => paint(c, S.poly(s.fins), s.fm || tm, { lit: 'y', bev: 1, cast: 2 }));
    if (s.can) glass(c, S.hull(s.can), s.gc || 'b');
    if (s.post) s.post(c);
  }

  /* =========================================================
     STYLE « FACETTES » (validé, planche v5)
     Couleurs pleines par facette, lumière venant de la gauche,
     contour net sombre, coutures, petits détails mécaniques.
     parts : { p: demi-pièce droite (x ≥ 0, recopiée en miroir), m: matière, s: teinte (gauche s, droite s+1) }
     flame : [[x, y, demi-largeur, longueur, couleur?]] — flammes animées dessinées par le jeu (Art.flame)
     ========================================================= */
  const OUT = '#07080A';
  const FP = {
    hull:  ['#F5F6F8', '#DADEE3', '#B5BCC6', '#8C95A2', '#6A7380'],
    wh:    ['#FFFFFF', '#EEF0F2', '#D6DADF', '#B9BEC6', '#9AA0AA'],
    al:    ['#E4E7EB', '#C3C8CF', '#A0A7B1', '#7E8691', '#5F6772'],
    gm:    ['#6A7280', '#535A66', '#3E444E', '#2C3139', '#1E2228'],
    dark:  ['#1B1E23', '#131519', '#0C0D10', '#08090B', '#050506'],
    glass: ['#8EC2E8', '#4E82B2', '#2E5582', '#1E3A5C', '#132840'],
    amb:   ['#F6BE7E', '#E8A15A', '#C9813C', '#9A5E26', '#6E4018'],
    br:    ['#F0D49A', '#D8B16A', '#B48E44', '#8A6A2C', '#5E4718'],
    go:    ['#FBE6A8', '#EBC56E', '#C99E45', '#9C7630', '#6E521E'],
    fe:    ['#8FAAA8', '#6E8A88', '#526C6B', '#3B5150', '#283938'],
    wd:    ['#C49A6C', '#A07850', '#7E5C3C', '#5E432A', '#402C1A'],
    eg:    ['#8F98A6', '#747D8B', '#5C6472', '#464D59', '#343A44'],
    mint:  ['#B8F0D0', '#8AD6A8', '#5FB486', '#3F8A62', '#2A6646'],
    iv:    ['#FBF5E6', '#EADFC6', '#D2C4A2', '#B3A381', '#8E7F60'],
    cu:    ['#EAA987', '#CC8660', '#A6643F', '#7C482C', '#55301C'],
    lit:   ['#FFE9B8', '#F4CB82', '#D9A456', '#A87634', '#6E4C20'],
    fa:    ['#EFE8D6', '#D8CFB8', '#BBB096', '#988D74', '#716854'],
    ol:    ['#A3A07A', '#84825E', '#666446', '#4C4A34', '#353324'],
    rd:    ['#D68272', '#B65E4E', '#924438', '#6E322A', '#4C221C'],
    nv:    ['#97A2AE', '#77838F', '#5C6773', '#46505B', '#323942'],
    tk:    ['#C2B69C', '#A69A80', '#8A7F68', '#6C6352', '#4C4538'],
    so:    ['#6A88BA', '#4A68A0', '#33528A', '#22386A', '#142446'],
    gn:    ['#A6B896', '#869A76', '#6A7E5C', '#526248', '#3A4632'],
    pe:    ['#F6F6F8', '#DFE0E5', '#C3C5CD', '#A0A2AC', '#7C7E88'],
    mv:    ['#EECCE8', '#CDA0C6', '#AC7CA3', '#8A5C82', '#66445F'],
    nb:    ['#5E72A0', '#42568A', '#2C406C', '#1E2C50', '#121C36'],
    or:    ['#F6B48A', '#E8915A', '#C8703C', '#9A5228', '#6C3818'],
    la:    ['#5A82C2', '#3E64A6', '#2A4C88', '#1C366A', '#10224A'],
    aq:    ['#E0FAFB', '#A8E4E8', '#6FC2C8', '#4A9A9E', '#2E6A6E'],
    eglass:['#9FE6C6', '#5BB894', '#3A8A6C', '#27634E', '#184434'],
  };
  const fpoly = (c, pts, m = 1) => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x * m, y) : c.moveTo(x * m, y)); c.closePath(); };
  const F = (c, pts, col) => { fpoly(c, pts); c.fillStyle = col; c.fill(); };
  const seam = (c, d, a = 0.45, w = 0.55) => { c.strokeStyle = `rgba(7,8,10,${a})`; c.lineWidth = Math.max(w, px(0.45)); c.stroke(Art.path(d)); };
  const hiLine = (c, d, a = 0.5, w = 0.6) => { c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = Math.max(w, px(0.45)); c.stroke(Art.path(d)); };
  const vents = (c, x, y, n, w, gap) => { for (let i = 0; i < n; i++) { c.fillStyle = FP.dark[2]; c.fillRect(x, y + i * gap, w, 1.1); } };
  const dots = (c, pts, r = 0.6) => { c.fillStyle = 'rgba(7,8,10,.5)'; for (const [x, y] of pts) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } };
  // plaque rapportée (arête claire en haut) et prise d'air (bouche sombre, lèvre claire)
  const plate = (c, x, y, w, h, col = FP.gm[2]) => { F(c, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], col); F(c, [[x, y], [x + w, y], [x + w, y + 0.6], [x, y + 0.6]], 'rgba(255,255,255,.28)'); };
  const intake = (c, x, y, w, h) => { F(c, [[x, y], [x + w, y + h * 0.3], [x + w, y + h], [x, y + h]], FP.dark[1]); F(c, [[x, y], [x + w, y + h * 0.3], [x + w, y + h * 0.3 + 0.8], [x, y + 0.8]], 'rgba(255,255,255,.35)'); };
  function missile(c, x, y, l) {
    F(c, [[x - 1.7, y + 4], [x + 1.7, y + 4], [x + 1.7, y + l], [x - 1.7, y + l]], FP.hull[1]);
    F(c, [[x, y], [x + 1.7, y + 4], [x - 1.7, y + 4]], FP.amb[1]);
    F(c, [[x + 1.7, y + l - 6], [x + 4.4, y + l], [x + 1.7, y + l]], FP.gm[2]); F(c, [[x - 1.7, y + l - 6], [x - 4.4, y + l], [x - 1.7, y + l]], FP.gm[1]);
    c.strokeStyle = OUT; c.lineWidth = 0.6; fpoly(c, [[x, y], [x + 1.7, y + 4], [x + 1.7, y + l], [x - 1.7, y + l], [x - 1.7, y + 4]]); c.stroke();
  }
  // occl : le trait fin de chaque pièce est tracé juste après son remplissage, donc caché par les pièces posées dessus (pas de « rayons X »)
  function facets(c, parts, det, occl) {
    const ow = Math.max(1.5, px(1.15)), thin = () => { c.lineWidth = Math.max(0.5, px(0.5)); c.strokeStyle = 'rgba(7,8,10,.55)'; };
    c.lineJoin = 'round'; c.strokeStyle = OUT; c.fillStyle = OUT; c.lineWidth = ow * 2;
    for (const p of parts) for (const m of [1, -1]) { fpoly(c, p.p, m); c.stroke(); c.fill(); }
    if (occl) { thin(); for (const p of parts) for (const m of [-1, 1]) { const P = FP[p.m]; fpoly(c, p.p, m); c.fillStyle = P[Math.min(4, p.s + (m > 0 ? 1 : 0))]; c.fill(); c.stroke(); } }
    else {
      for (const p of parts) for (const m of [-1, 1]) { const P = FP[p.m]; fpoly(c, p.p, m); c.fillStyle = P[Math.min(4, p.s + (m > 0 ? 1 : 0))]; c.fill(); }
      thin(); for (const p of parts) for (const m of [-1, 1]) { fpoly(c, p.p, m); c.stroke(); }
    }
    if (det) det(c);
  }
  function wear(c, o) {
    let y0 = 1e9, y1 = -1e9, x1 = 0; for (const p of o.parts) for (const [x, y] of p.p) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); x1 = Math.max(x1, x); }
    c.save(); c.beginPath(); for (const p of o.parts) for (const m of [1, -1]) { p.p.forEach(([x, y], i) => i ? c.lineTo(x * m, y) : c.moveTo(x * m, y)); c.closePath(); } c.clip();
    const g = c.createLinearGradient(0, y1 - (y1 - y0) * 0.24, 0, y1); g.addColorStop(0, 'rgba(24,18,12,0)'); g.addColorStop(1, 'rgba(24,18,12,.38)'); c.fillStyle = g; c.fillRect(-x1, y0, x1 * 2, y1 - y0);
    let sd = o.wear; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 7; i++) { const x = r() * x1 * 0.7, y = y0 + (0.2 + r() * 0.6) * (y1 - y0), w = 4 + r() * 9, h = 4 + r() * 12; c.fillStyle = 'rgba(7,8,10,.07)'; c.fillRect(x, y, w, h); c.fillRect(-x - w, y + 3, w, h); }
    for (let i = 0; i < 80; i++) { const x = (r() * 2 - 1) * x1, y = y0 + r() * (y1 - y0), a = r(); c.fillStyle = a < 0.72 ? `rgba(7,8,10,${0.08 + r() * 0.14})` : `rgba(255,255,255,${0.1 + r() * 0.14})`; c.fillRect(x, y, 0.6 + r() * 1.8, 0.5 + r() * 0.7); }
    c.restore();
  }
  // slim: [sx, sy] affine une silhouette existante (pièces, détails, flammes) sans la redessiner
  const fac = (o) => {
    if (o.slim) { const [sx, sy] = o.slim, d = o.det; o.parts = o.parts.map(p => Object.assign({}, p, { p: p.p.map(([x, y]) => [x * sx, y * sy]) })); o.w *= sx; o.h *= sy; o.cy *= sy;
      if (o.flame) o.flame = o.flame.map(f => [f[0] * sx, f[1] * sy, f[2] * sx, f[3], ...f.slice(4)]); if (d) o.det = c => { c.save(); c.scale(sx, sy); d(c); c.restore(); }; }
    return Object.assign(o, { facet: true, draw(c) { facets(c, o.parts, o.det, o.occl); if (o.wear) wear(c, o); } });
  };
  const wingLamp = (c, x, y) => { lamp(c, x, y, 1.2, '#F6E2C0', 0.55); lamp(c, -x, y, 1.2, '#F6E2C0', 0.55); };

  /* =========================================================
     VAISSEAUX DU JOUEUR (vue de dessus, nez en haut)
     ========================================================= */
  // IF-50 — silhouette « A · Lame » validée : aile en flèche, dérives inclinées, un seul réacteur
  D.if50 = fac({ wear: 11, w: 160, h: 236, cy: -4, flame: [[0, 104, 5, 30]], parts: [
    { p: [[12, -14], [68, 50], [40, 44], [13, 32]], m: 'hull', s: 0 },
    { p: [[13, 32], [40, 44], [68, 50], [70, 59], [46, 62], [13, 66]], m: 'hull', s: 2 },
    { p: [[11, 72], [36, 90], [37, 99], [12, 95]], m: 'hull', s: 1 },
    { p: [[10, 46], [24, 82], [27, 100], [17, 98], [10, 76]], m: 'gm', s: 1 },
    { p: [[3, -88], [9, -54], [12, -22], [13.5, 40], [12, 80], [6, 86], [5, -58]], m: 'hull', s: 1 },
    { p: [[6, -72], [25, -10], [13, -6], [9, -40]], m: 'hull', s: 1 },
    { p: [[0, -114], [3, -88], [5, -58], [6, 86], [0, 86]], m: 'hull', s: 0 },
    { p: [[0, 84], [7.5, 84], [7.5, 100], [5.5, 105], [0, 105]], m: 'gm', s: 2 },
    { p: [[0, -84], [3.6, -74], [4.6, -56], [3.2, -45], [0, -43]], m: 'glass', s: 0 },
  ], det(c) {
    sym(c, () => {
      F(c, [[48, 30], [68, 50], [66, 52], [46, 33]], FP.amb[1]);
      seam(c, 'M20 6L54 44M16 22L36 46M26 48L28 62M14 34L13 66M20 84L34 92');
      F(c, [[13, -22], [17, -20], [17, -4], [13.4, -4]], FP.dark[2]);
      vents(c, 7, -2, 5, 3.6, 4.2);
      missile(c, 34, 6, 28);
      F(c, [[62, 55], [69, 57], [69.6, 59], [62, 59]], FP.gm[3]);
      seam(c, 'M5 -58L5 84', 0.3);
      F(c, [[3, 100], [7, 100], [7, 101.2], [3, 101.2]], FP.dark[1]);
    });
    F(c, [[-1.3, 18], [1.3, 18], [1.3, 76], [-1.3, 76]], FP.amb[1]);
    hiLine(c, 'M-1.8 -80L-3.2 -58', 0.65, 0.8);
    seam(c, 'M-12 -20L12 -20M-13 40L13 40', 0.35);
    dots(c, [[-9, -12], [9, -12], [-9, 0], [9, 0], [-9, 52], [9, 52], [-9, 64], [9, 64]]);
    wingLamp(c, 69, 58);
  } });

  // Lame — fléchette à plans canard, aile en flèche inversée courte
  D.lame = fac({ wear: 23, w: 150, h: 240, cy: -8, flame: [[0, 106, 5.5, 32]], parts: [
    { p: [[13, 20], [60, -10], [66, -2], [14, 40]], m: 'gm', s: 0 },
    { p: [[14, 40], [66, -2], [65, 6], [30, 46], [13, 60]], m: 'gm', s: 2 },
    { p: [[12, 68], [36, 86], [37, 96], [12, 92]], m: 'gm', s: 1 },
    { p: [[9, 56], [19, 82], [21, 98], [13, 96], [9, 78]], m: 'dark', s: 0 },
    { p: [[9, -50], [27, -42], [28, -35], [10, -38]], m: 'gm', s: 0 },
    { p: [[2.2, -100], [7, -70], [10, -40], [13, -6], [14, 40], [12, 86], [5, 88], [4.5, -70]], m: 'gm', s: 1 },
    { p: [[0, -122], [2.2, -100], [4.5, -70], [5, 86], [0, 86]], m: 'gm', s: 0 },
    { p: [[0, 84], [8, 84], [8, 102], [6, 108], [0, 108]], m: 'dark', s: 0 },
    { p: [[0, -88], [3.4, -78], [4.4, -60], [3, -50], [0, -48]], m: 'glass', s: 0 },
  ], det(c) {
    sym(c, () => {
      F(c, [[48, -2], [60, -10], [62, -6], [50, 2]], FP.amb[1]);
      F(c, [[12, -18], [15, -16], [15, 6], [12.6, 6]], FP.dark[2]);
      seam(c, 'M22 16L50 -2M18 34L52 8M30 46L28 24M13 -40L14 60M20 82L32 90', 0.55);
      missile(c, 38, -4, 26);
      vents(c, 6.5, 14, 6, 3.4, 4.2);
      F(c, [[60, -8], [66, -2], [65.4, 2], [60, -3]], FP.gm[3]);
      F(c, [[20, -46], [27, -42], [27.6, -39], [20, -42]], FP.amb[1]);
    });
    F(c, [[-1.2, 10], [1.2, 10], [1.2, 76], [-1.2, 76]], FP.amb[1]);
    hiLine(c, 'M-1.7 -84L-3 -62', 0.65, 0.8);
    seam(c, 'M-13 -6L13 -6M-14 50L14 50', 0.4);
    wingLamp(c, 66, -2);
  } });

  // Bastion — chasseur lourd : nacelles-canons blindées, aile épaisse, gros réacteur unique
  D.bastion = fac({ wear: 37, w: 180, h: 240, cy: -4, flame: [[0, 112, 11, 32]], slim: [0.84, 1.08], parts: [
    { p: [[18, -6], [78, 40], [52, 40], [19, 36]], m: 'al', s: 0 },
    { p: [[19, 36], [52, 40], [78, 40], [80, 62], [60, 66], [18, 70]], m: 'al', s: 2 },
    { p: [[46, 58], [60, 86], [61, 102], [49, 100], [44, 74]], m: 'gm', s: 1 },
    { p: [[16, 70], [40, 92], [40, 102], [16, 100]], m: 'al', s: 1 },
    { p: [[30, -30], [44, -26], [46, 70], [40, 80], [32, 78], [29, -10]], m: 'gm', s: 0 },
    { p: [[14, -62], [32, -46], [32, -30], [14, -34]], m: 'al', s: 1 },
    { p: [[4, -104], [12, -72], [16, -42], [22, -20], [22, 80], [18, 98], [6, 98], [6, -60]], m: 'al', s: 1 },
    { p: [[0, -118], [4, -104], [6, -60], [6, 98], [0, 98]], m: 'al', s: 0 },
    { p: [[0, 96], [13, 96], [13, 106], [10, 112], [0, 112]], m: 'gm', s: 2 },
    { p: [[0, -96], [4.4, -84], [5.4, -64], [4, -52], [0, -50]], m: 'glass', s: 0 },
  ], det(c) {
    sym(c, () => {
      F(c, [[34.5, -46], [39.5, -46], [39.5, -28], [34.5, -28]], FP.dark[1]);
      F(c, [[35.6, -50], [38.4, -50], [38.4, -46], [35.6, -46]], FP.gm[3]);
      F(c, [[58, 24], [78, 40], [76, 43], [56, 28]], FP.amb[1]);
      F(c, [[30.5, -8], [43.5, -6], [43.5, -2], [30.5, -4]], FP.amb[2]);
      seam(c, 'M24 12L66 44M22 40L22 68M32 8L44 10M32 30L45 32M33 54L45 54M50 42L52 64M14 -34L22 -20');
      vents(c, 10, 8, 7, 7, 4.4);
      F(c, [[3, 100], [12, 100], [12, 101.4], [3, 101.4]], FP.dark[1]); F(c, [[3, 103.5], [11.5, 103.5], [11.5, 104.9], [3, 104.9]], FP.dark[1]);
      dots(c, [[36, 16], [36, 44], [36, 64], [26, -4], [26, 60]], 0.75);
    });
    F(c, [[-1.4, -40], [1.4, -40], [1.4, 40], [-1.4, 40]], FP.amb[1]);
    hiLine(c, 'M-2.2 -90L-3.8 -62', 0.65, 0.8);
    seam(c, 'M-22 -14L22 -14M-22 60L22 60M-16 -44L16 -44', 0.4);
    wingLamp(c, 79, 58);
  } });

  // Concorde (1969) — fuselage effilé, aile delta ogivale, quatre réacteurs en deux nacelles
  D.concorde = fac({ wear: 41, w: 144, h: 288, cy: -12, flame: [[-25, 100, 2.6, 18], [-18.5, 100, 2.6, 18], [18.5, 100, 2.6, 18], [25, 100, 2.6, 18]], parts: [
    { p: [[6, -72], [14, -32], [30, 8], [44, 36], [6, 40]], m: 'wh', s: 0 },
    { p: [[6, 40], [44, 36], [58, 64], [64, 84], [64, 94], [6, 96]], m: 'wh', s: 2 },
    { p: [[14, 52], [30, 52], [30, 98], [14, 98]], m: 'al', s: 1 },
    { p: [[2.5, -140], [7, -100], [8, 110], [5, 122], [3.5, -100]], m: 'wh', s: 1 },
    { p: [[0, -154], [2.5, -140], [3.5, -100], [4, 124], [0, 126]], m: 'wh', s: 0 },
    { p: [[0, -130], [2.6, -124], [3, -116], [0, -114]], m: 'glass', s: 0 },
  ], det(c) {
    sym(c, () => {
      F(c, [[14.6, 52], [29.4, 52], [29.4, 55], [14.6, 55]], FP.dark[1]);
      seam(c, 'M22 52L22 98M14 66L30 66', 0.5);
      seam(c, 'M10 -40L26 0M10 10L48 46M30 52L56 70M8 70L14 70', 0.35);
      F(c, [[54, 74], [63, 84], [63, 94], [54, 94]], FP.al[2]);
      seam(c, 'M40 94L40 80', 0.4);
      F(c, [[14.6, 96], [29.4, 96], [29.4, 98], [14.6, 98]], FP.dark[2]);
    });
    F(c, [[-0.8, 50], [0.8, 50], [0.8, 124], [-0.8, 124]], FP.dark[1]);
    F(c, [[-0.8, -110], [0.8, -110], [0.8, 40], [-0.8, 40]], 'rgba(70,90,120,.4)');
    hiLine(c, 'M-1.4 -136L-2.6 -108', 0.6, 0.6);
    seam(c, 'M-7 -60L7 -60M-8 0L8 0M-8 60L8 60', 0.3);
    wingLamp(c, 63, 90);
  } });

  // Columbiad (Jules Verne, 1865) — obus d'aluminium élancé cerclé de laiton, fusées latérales sur bras, empennage
  D.columbiad = fac({ wear: 53, w: 86, h: 236, cy: -12, flame: [[0, 98, 7, 28], [-26, 78, 2.6, 16], [26, 78, 2.6, 16]], parts: [
    { p: [[17, 38], [40, 80], [40, 92], [17, 84]], m: 'br', s: 1 },
    { p: [[17, 4], [24, 0], [24, 8], [17, 12]], m: 'gm', s: 2 },
    { p: [[17, 50], [24, 46], [24, 54], [17, 58]], m: 'gm', s: 2 },
    { p: [[26, -34], [30, -24], [30, 70], [28, 78], [24, 78], [22, 70], [22, -24]], m: 'br', s: 0 },
    { p: [[0, -122], [6, -108], [12, -84], [16, -60], [18, -42], [18, 84], [14, 92], [0, 92]], m: 'al', s: 1 },
    { p: [[0, -122], [4, -104], [7, -42], [7, 92], [0, 92]], m: 'al', s: 0 },
    { p: [[0, 88], [15, 88], [11, 98], [0, 98]], m: 'gm', s: 2 },
  ], det(c) {
    sym(c, () => {
      F(c, [[1.5, -46], [18, -46], [18, -40], [1.5, -40]], FP.br[2]);
      F(c, [[1.5, 62], [18, 62], [18, 68], [1.5, 68]], FP.br[3]);
      F(c, [[22, 20], [30, 20], [30, 24], [22, 24]], FP.br[3]); F(c, [[22, 56], [30, 56], [30, 59], [22, 59]], FP.br[3]);
      seam(c, 'M26 -24L26 70M12 -40L12 62M7 -84Q12 -70 16 -56M20 46L38 84', 0.4);
      dots(c, [[5, -43], [12, -43], [5, 65], [12, 65], [26, -10], [26, 40]], 0.7);
      F(c, [[24, -34], [26, -36], [28, -34], [26, -30]], FP.br[1]);
      F(c, [[11, 74], [15, 74], [15, 84], [11, 84]], FP.dark[1]);
    });
    for (const x of [-11, -3.5, 4]) { F(c, [[x, -24], [x + 7, -24], [x + 7, -19], [x, -19]], FP.glass[2]); F(c, [[x + 1, -23.4], [x + 3.4, -23.4], [x + 2.8, -19.6], [x + 1, -19.6]], 'rgba(255,255,255,.4)'); }
    F(c, [[-1.4, -36], [1.4, -36], [1.4, 60], [-1.4, 60]], FP.br[2]);
    hiLine(c, 'M-2.5 -112L-6 -84', 0.65, 0.8);
    F(c, [[-1.6, -126], [1.6, -126], [1.6, -121], [-1.6, -121]], FP.br[1]);
    lamp(c, 40, 88, 1.1, '#F6E2C0', 0.6); lamp(c, -40, 88, 1.1, '#F6E2C0', 0.6);
  } });

  // Nautilus (Jules Verne, 1870) — cigare de tôle, éperon, plate-forme de pont, hélice
  D.nautilus = fac({ wear: 67, w: 84, h: 356, cy: -16, flame: [[0, 152, 5, 24, '#9FE6E8']], parts: [
    { p: [[10, 74], [30, 92], [30, 104], [10, 104]], m: 'fe', s: 2 },
    { p: [[14, -90], [30, -84], [30, -78], [14, -76]], m: 'fe', s: 2 },
    { p: [[0, -170], [3, -152], [10, -130], [18, -100], [22, -60], [23, 0], [21, 60], [14, 110], [6, 140], [0, 146]], m: 'fe', s: 1 },
    { p: [[0, -170], [2, -150], [7, -100], [8, 0], [7, 100], [3, 140], [0, 146]], m: 'fe', s: 0 },
    { p: [[0, -190], [2.4, -170], [0, -166]], m: 'al', s: 0 },
    { p: [[0, -50], [8, -50], [8, 40], [0, 40]], m: 'wd', s: 1 },
    { p: [[0, -74], [6, -70], [6, -56], [0, -54]], m: 'fe', s: 3 },
    { p: [[0, 140], [3, 140], [3, 156], [0, 156]], m: 'gm', s: 1 },
  ], det(c) {
    sym(c, () => {
      seam(c, 'M8 -130Q16 -128 19 -100M10 -60L22 -60M10 -10L23 -10M10 40L22 40M8 90L18 90', 0.45);
      dots(c, [[14, -110], [18, -80], [19, -30], [19, 20], [17, 70], [11, 110]], 0.9);
      seam(c, 'M3 -50L3 40', 0.35);
    });
    F(c, [[-1.4, -70], [1.4, -70], [1.4, -58], [-1.4, -58]], FP.glass[1]);
    lamp(c, 0, -150, 2, '#BFF0F2', 0.7);
    hiLine(c, 'M-3 -150L-12 -110', 0.4, 0.8);
    prop(c, 0, 152, 17, 0.6);
  } });

  // Apollo (1969) — tour de sauvetage, module de commande, module de service à radiateurs, blocs de propulseurs, grande tuyère
  D.apollo = fac({ wear: 71, w: 86, h: 316, cy: -24, flame: [[0, 130, 12, 34]], parts: [
    { p: [[29, -34], [37, -34], [37, -18], [29, -18]], m: 'gm', s: 1 },
    { p: [[29, 34], [35, 34], [35, 46], [29, 46]], m: 'gm', s: 2 },
    { p: [[0, -50], [29, -50], [29, 70], [0, 70]], m: 'al', s: 1 },
    { p: [[0, -50], [11, -50], [11, 70], [0, 70]], m: 'al', s: 0 },
    { p: [[0, 70], [25, 70], [22, 78], [0, 78]], m: 'gm', s: 1 },
    { p: [[0, 78], [7, 78], [21, 130], [0, 130]], m: 'gm', s: 0 },
    { p: [[0, -118], [6, -112], [31, -56], [31, -50], [0, -50]], m: 'wh', s: 1 },
    { p: [[0, -118], [3, -113], [10, -50], [0, -50]], m: 'wh', s: 0 },
    { p: [[2, -150], [9, -122], [7, -120], [1.4, -144]], m: 'gm', s: 2 },
    { p: [[0, -178], [2.4, -170], [2.4, -150], [4.6, -146], [4.6, -134], [2.6, -128], [2.6, -114], [0, -114]], m: 'al', s: 1 },
    { p: [[2.4, -168], [6.5, -164], [2.4, -160]], m: 'amb', s: 1 },
  ], det(c) {
    sym(c, () => {
      F(c, [[37, -30], [41, -31], [41, -21], [37, -22]], FP.gm[3]); F(c, [[31, -38], [35, -38], [34, -34], [32, -34]], FP.gm[3]);
      F(c, [[31, -56], [34, -50], [0, -50], [0, -56]], FP.br[2]);
      for (let y = -40; y < 64; y += 13) F(c, [[16, y], [27, y], [27, y + 9], [16, y + 9]], 'rgba(255,255,255,.18)');
      seam(c, 'M11 -24L29 -24M11 10L29 10M11 44L29 44M16 -50L16 70', 0.4);
      seam(c, 'M6 84L19 124M3 -128L1 -150', 0.35);
      F(c, [[3, 122], [20, 122], [21, 130], [3, 130]], FP.dark[1]);
      dots(c, [[22, -46], [22, 66], [6, 66]], 0.7);
    });
    F(c, [[-3.5, -100], [3.5, -100], [3.5, -93], [-3.5, -93]], FP.glass[2]);
    F(c, [[-1.2, -48], [1.2, -48], [1.2, 68], [-1.2, 68]], FP.amb[1]);
    hiLine(c, 'M-2 -112L-12 -70', 0.55, 0.8);
    lamp(c, 0, -176, 1.2, '#FFD9A0', 0.7);
  } });

  // Ω — chasseur de fin : plans canard, aile à pointes dorées, colonne de lumière, réacteur cyan
  D.omega = fac({ wear: 89, w: 186, h: 252, cy: -9, flame: [[0, 108, 5.5, 34, '#9FD4FF']], parts: [
    { p: [[8, -72], [30, -58], [31, -52], [9, -54]], m: 'wh', s: 0 },
    { p: [[12, -24], [74, 46], [46, 44], [13, 30]], m: 'wh', s: 0 },
    { p: [[13, 30], [46, 44], [74, 46], [80, 64], [54, 70], [13, 72]], m: 'wh', s: 2 },
    { p: [[74, 46], [88, 38], [86, 52], [79, 60]], m: 'go', s: 1 },
    { p: [[11, 76], [38, 94], [38, 104], [12, 100]], m: 'wh', s: 1 },
    { p: [[10, 50], [26, 86], [28, 104], [18, 102], [10, 80]], m: 'go', s: 1 },
    { p: [[3, -110], [9, -74], [12, -30], [14, 40], [12, 86], [6, 92], [5, -70]], m: 'wh', s: 1 },
    { p: [[0, -128], [3, -110], [5, -70], [6, 92], [0, 92]], m: 'wh', s: 0 },
    { p: [[0, 90], [8, 90], [8, 104], [6, 110], [0, 110]], m: 'gm', s: 2 },
    { p: [[0, -96], [3.6, -86], [4.6, -66], [3.2, -54], [0, -52]], m: 'glass', s: 0 },
  ], det(c) {
    sym(c, () => {
      F(c, [[44, 18], [74, 46], [72, 49], [42, 21]], FP.go[1]);
      F(c, [[20, -60], [30, -58], [30.6, -55], [20, -57]], FP.go[1]);
      seam(c, 'M22 0L58 44M18 20L40 46M28 50L30 68M14 34L13 70M20 86L34 94', 0.4);
      vents(c, 7, 0, 5, 3.6, 4.2);
      F(c, [[13, -22], [17, -20], [17, -4], [13.4, -4]], FP.dark[2]);
    });
    F(c, [[-1.6, -46], [1.6, -46], [1.6, 84], [-1.6, 84]], '#C9DCEA');
    c.save(); c.globalCompositeOperation = 'lighter'; F(c, [[-3, -46], [3, -46], [3, 84], [-3, 84]], 'rgba(140,200,255,.3)'); c.restore();
    hiLine(c, 'M-1.8 -90L-3.2 -60', 0.65, 0.8);
    seam(c, 'M-12 -24L12 -24M-14 40L14 40', 0.35);
    lamp(c, 84, 46, 1.4, GOLD, 0.7); lamp(c, -84, 46, 1.4, GOLD, 0.7);
  } });

  /* =========================================================
     VÉHICULES DU JOUEUR
     ========================================================= */
  // char 1917, vue de profil (canon antiaérien vertical)
  D.tank = { w: 190, h: 150, cy: -14, orient: 'none', sh: 'halo', draw(c) {
    paint(c, S.poly([[-96, 34, 2], [-70, 14, 2], [-62, 20, 2], [-88, 38, 2]]), 'ol', { lit: 'y', bev: 0.6 });
    const tr = S.rr(-82, 8, 160, 44, 22); paint(c, tr, 'bk', { lit: 'y', cast: 3, bev: 1 });
    clipTo(c, tr, () => { c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2.4; c.setLineDash([3, 5]); c.stroke(Art.path('M-60 10L56 10')); c.stroke(Art.path('M-60 50L56 50')); c.setLineDash([]); });
    for (let i = 0; i < 6; i++) paint(c, S.ell(-50 + i * 20, 34, 8), 'gm', { lit: 'r', bev: 0.8 });
    paint(c, S.ell(-62, 30, 13), 'gm', { lit: 'r' }); paint(c, S.ell(60, 26, 15), 'gm', { lit: 'r' });
    rivets(c, [[-62, 30], [60, 26], [-50, 34], [-30, 34], [-10, 34], [10, 34], [30, 34], [50, 34]], 1.6);
    const hb = S.poly([[-74, 10, 4], [-64, -16, 6], [34, -20, 8], [70, -6, 6], [84, 10, 4], [60, 16, 2], [-70, 16, 2]]); paint(c, hb, 'ol', { lit: 'y', cast: 4 });
    clipTo(c, hb, () => { eline(c, 'M-40 -16L-40 14M0 -18L0 14M40 -16L40 14', 0.3, 0.8); fill(c, S.rr(-74, 0, 160, 3), 'rgba(0,0,0,.25)'); });
    rivets(c, [[-56, -8], [-24, -10], [16, -12], [52, -6]], 1.4);
    paint(c, S.rr(4, -100, 7, 64, 2.5), 'gm', { lit: 'x', cast: 2, bev: 0.6 }); paint(c, S.rr(2, -104, 11, 9, 2), 'gr', { lit: 'x', bev: 0.5 });
    const tu = S.poly([[-22, -18, 4], [-16, -46, 10], [26, -48, 12], [32, -18, 4]]); paint(c, tu, 'ol', { lit: 'y', cast: 3 });
    clipTo(c, tu, () => eline(c, 'M-18 -32L30 -33', 0.35, 0.9)); rivets(c, [[-12, -40], [4, -42], [20, -42]], 1.3);
    paint(c, S.rr(-8, -56, 24, 9, 4), 'ol', { lit: 'y' });
    lamp(c, 74, 2, 2.2, '#FFE9C8', 0.6);
  } };

  // Nautilus de profil (abysses)
  D.nautSide = { w: 330, h: 96, cy: -8, orient: 'none', sh: 'halo', draw(c) {
    paint(c, S.poly([[-148, -4], [-166, -26, 4], [-160, -4], [-166, 22, 4], [-148, 6]]), 'fe', { lit: 'y' });
    const h = S.hullX([[-152, 0], [-140, 8], [-100, 20], [-30, 26], [60, 25], [120, 17], [146, 7], [152, 0]]);
    paint(c, h, 'fe', { lit: 'y', cast: 4 });
    clipTo(c, h, () => { eline(c, 'M-100 -22Q-96 0 -100 22M-50 -26Q-46 0 -50 26M0 -26Q4 0 0 26M50 -26Q54 0 50 26M100 -20Q104 0 100 20', 0.35, 0.9); fill(c, S.rr(-150, 8, 300, 30), 'rgba(0,0,0,.18)'); });
    for (let i = 0; i < 4; i++) { const x = -40 + i * 26; paint(c, S.ell(x, -2, 5.5), 'br', { lit: 'r', bev: 0.6 }); c.fillStyle = '#BFF0F2'; c.beginPath(); c.arc(x, -2, 3.4, 0, TAU); c.fill(); }
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) Art.glow(c, -40 + i * 26, -2, 9, '#9FE3EA', 0.6); c.restore();
    paint(c, S.rr(-70, -32, 140, 8, 4), 'wd', { lit: 'y', bev: 0.6 });
    paint(c, S.poly([[60, -24], [64, -38, 6], [92, -38, 6], [98, -24]]), 'fe', { lit: 'y' }); glass(c, S.rr(70, -35, 20, 6, 3), 'c');
    paint(c, S.ell(-90, -26, 9, 6), 'fe', { lit: 'r' }); lamp(c, 118, -12, 2.4, '#CFF6F8', 0.9);
    paint(c, S.poly([[148, -5], [176, 0], [148, 5]]), 'al', { lit: 'y', bev: 0.5 });
    propS(c, -162, 0, 20, 0.55);
  } };

  // Latécoère 28, vue de dessus
  D.late = { w: 220, h: 156, cy: 2, eng: [], draw(c) {
    jet(c, { hm: 'al', wm: 'iv', tm: 'iv',
      tail: [[0, 52], [34, 54, 7], [37, 64, 6], [0, 68]],
      hull: [[-68, 7], [-64, 13], [-48, 15], [0, 14], [40, 9], [64, 4], [72, 3]],
      htip(c) { fill(c, S.rr(-16, 12, 32, 7), '#9A3F36', 0.85); eline(c, 'M-14 30L14 30M-12 46L12 46', 0.3, 0.8); },
      post(c) {
        const w = S.sym([[0, -36], [100, -32, 16], [108, -22, 10], [108, 4, 10], [100, 10, 10], [0, 12]]); paint(c, w, 'iv', { lit: 'y', cast: 5 });
        clipTo(c, w, () => { eline(c, 'M-104 -2L104 -2M-60 -34L-60 12M60 -34L60 12M-30 -34L-30 12M30 -34L30 12', 0.22, 0.7); fill(c, S.rr(88, -40, 24, 56), '#9A3F36', 0.8); fill(c, S.rr(-112, -40, 24, 56), '#9A3F36', 0.8); });
        glass(c, S.rr(-7, 12, 14, 9, 4), 'b');
        paint(c, S.ell(0, -64, 15, 7), 'gm', { lit: 'r', bev: 0.8 }); prop(c, 0, -72, 46, 0.6);
      } });
  } };

  // contre-torpilleur, vue de dessus
  D.destroyer = { w: 66, h: 284, cy: 0, eng: [], draw(c) {
    const h = S.hull([[-142, 0], [-124, 9], [-92, 21], [-40, 28], [50, 28], [104, 24], [134, 17], [140, 15]]);
    paint(c, h, 'nv', { cast: 4 });
    const dk = S.hull([[-126, 0], [-110, 7], [-84, 17], [-40, 23], [50, 23], [100, 20], [128, 13], [134, 11]]);
    paint(c, dk, 'tk', { lit: 'x', bev: 0.6, ol: 0.2 }); clipTo(c, dk, () => eline(c, 'M-8 -120L-8 134M8 -120L8 134', 0.18, 0.6));
    const tur = (y, f) => { paint(c, S.ell(0, y, 10), 'nv', { lit: 'r', cast: 2 }); for (const x of [-3, 3]) paint(c, S.rr(x - 1.4, f > 0 ? y - 26 : y + 6, 2.8, 20, 1.2), 'gm', { lit: 'x', bev: 0.4 }); };
    tur(-96, 1); tur(-70, 1); tur(98, -1); tur(120, -1);
    const br = S.sym([[0, -54], [14, -50, 6], [16, -22, 4], [0, -18]]); paint(c, br, 'nv', { lit: 'x', cast: 3 }); glass(c, S.rr(-11, -50, 22, 6, 3), 'b');
    for (const y of [4, 36]) { paint(c, S.ell(0, y, 8, 12), 'gm', { lit: 'r', cast: 2 }); c.fillStyle = '#0A0B0C'; c.beginPath(); c.ellipse(0, y, 5, 8, 0, 0, TAU); c.fill(); }
    paint(c, S.rr(-9, 56, 18, 22, 4), 'nv', { lit: 'x' }); eline(c, 'M0 -18L0 0M-12 -10L12 -10', 0.5, 1);
    lamp(c, 0, -30, 1.6, '#FFE9C8', 0.5);
  } };

  // tourelle vue de dessus (canons vers le haut ; retournée chez l'ennemi)
  function turret(c, n, m, o = {}) {
    const len = o.len || 40, sp = o.sp || 7, bw = o.bw || 3.4;
    for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * sp; paint(c, S.rr(x - bw / 2, -len - 6, bw, len + 6, bw * 0.45), 'gm', { lit: 'x', bev: 0.4, cast: 2 }); paint(c, S.rr(x - bw * 0.7, -len - 8, bw * 1.4, 4, 1.2), 'gr', { lit: 'x', bev: 0.3 }); }
    const t = S.sym([[0, -14], [17, -14, 3], [20, -6, 3], [20, 14, 7], [0, 17]]); paint(c, t, m, { lit: 'x', cast: 4 });
    clipTo(c, t, () => { eline(c, 'M-20 -6L20 -6M-20 6L20 6', 0.3, 0.8); fill(c, S.rr(-20, 11, 40, 3), o.lamp || SEAM, 0.8); });
    paint(c, S.rr(-14, -2, 9, 5, 2), m, { lit: 'y', bev: 0.4 });
  }

  /* =========================================================
     ENNEMIS — retournés (nez vers le joueur) sauf mention
     ========================================================= */
  const EN = { orient: 'down', down: true };
  const mk = (name, o, draw) => { D[name] = Object.assign({}, EN, o, { draw }); };

  /* ---------------- 01 · LE BUREAU : drones d'ardoise en Facettes, filets menthe ---------------- */
  // flamme fixe intégrée au sprite (vers l'arrière de l'engin)
  function eflame(c, x, y, w, len, col = MINT) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(0, y, 0, y + len); g.addColorStop(0, hexA(col, 0.95)); g.addColorStop(1, hexA(col, 0));
    c.fillStyle = g; c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w * 0.6, y + len * 0.5, x, y + len); c.quadraticCurveTo(x + w * 0.6, y + len * 0.5, x + w, y); c.fill();
    c.fillStyle = 'rgba(240,255,248,.85)'; c.beginPath(); c.moveTo(x - w * 0.45, y); c.quadraticCurveTo(x, y + len * 0.45, x + w * 0.45, y); c.fill();
    c.restore();
  }
  const efac = (name, o) => { D[name] = Object.assign({}, EN, fac(o)); };
  const MI = FP.mint;

  // filet lumineux menthe (feu d'accent en bande, jamais rond)
  const glowF = (c, pts, col = MI[0], a = 0.9) => { c.save(); c.shadowColor = hexA(MINT, a); c.shadowBlur = px(3); F(c, pts, col); c.restore(); F(c, pts, col); };
  // pointe d'aile sombre (saumon, bord de fuite)
  const tipD = (c, pts) => F(c, pts, FP.gm[3]);

  // Faux : chasseur de ligne, nez aiguille, aile en flèche à pointes rabattues, dérives inclinées
  efac('w1a', { wear: 101, w: 92, h: 116, cy: 4, parts: [
    { p: [[8, -10], [45, 30], [30, 28], [9, 16]], m: 'eg', s: 0 },
    { p: [[9, 16], [30, 28], [45, 30], [42, 37], [24, 35], [8, 31]], m: 'eg', s: 2 },
    { p: [[6, 24], [17, 42], [18, 52], [12, 51], [6, 40]], m: 'gm', s: 1 },
    { p: [[3, -44], [8, -24], [10, 8], [9, 32], [5, 40], [5, -20]], m: 'eg', s: 1 },
    { p: [[0, -54], [3, -44], [5, -20], [5, 40], [0, 42]], m: 'eg', s: 0 },
    { p: [[7, -26], [12, -16], [12, -2], [9, -3]], m: 'gm', s: 2 },
    { p: [[0, 40], [5, 40], [5, 47], [3, 50], [0, 50]], m: 'gm', s: 2 },
    { p: [[0, -38], [2.4, -32], [2.8, -22], [0, -20]], m: 'eglass', s: 0 },
  ], det(c) {
    eflame(c, 0, 50, 3.6, 12);
    sym(c, () => {
      glowF(c, [[26, 8], [45, 30], [43, 31], [24, 11]]);
      tipD(c, [[40, 33], [44, 31.5], [42, 37], [38, 36.5]]);
      seam(c, 'M10 2L33 27M9 18L11 31M18 22L20 34M6 -8L9 -8', 0.5);
      vents(c, 8.4, -14, 3, 2.6, 3.4);
      F(c, [[13, 44], [17, 47], [17.4, 51], [13, 49]], MI[2]);
      dots(c, [[16, 24], [26, 30], [7, 4]], 0.7);
    });
    glowF(c, [[-0.9, -14], [0.9, -14], [0.9, 30], [-0.9, 30]], MI[1]);
    hiLine(c, 'M-1.2 -50L-2.6 -40', 0.55, 0.7);
    seam(c, 'M-9 -4L9 -4M-9 22L9 22', 0.35);
  } });

  // Herse : canonnière à deux nacelles, longs canons en avant, plans canard
  efac('w1b', { wear: 113, w: 64, h: 104, cy: 0, parts: [
    { p: [[5, -2], [26, 8], [28, 16], [6, 14]], m: 'eg', s: 2 },
    { p: [[5, 24], [22, 34], [23, 41], [5, 37]], m: 'eg', s: 1 },
    { p: [[19, -30], [23, -36], [27, -28], [28, 26], [24, 36], [19, 30]], m: 'gm', s: 0 },
    { p: [[23, -36], [27, -28], [28, 26], [24, 36]], m: 'gm', s: 1 },
    { p: [[3, -40], [9, -22], [11, 8], [9, 30], [0, 38]], m: 'eg', s: 1 },
    { p: [[0, -48], [3, -40], [5, 30], [0, 38]], m: 'eg', s: 0 },
    { p: [[4, -30], [14, -22], [14, -19], [4, -21]], m: 'eg', s: 0 },
    { p: [[0, -32], [2.6, -26], [3, -16], [0, -14]], m: 'eglass', s: 0 },
  ], det(c) {
    eflame(c, 0, 38, 3.4, 12); sym(c, () => eflame(c, 23.5, 35, 2.2, 8));
    sym(c, () => {
      F(c, [[21.6, -51], [24.4, -51], [24.4, -35], [21.6, -35]], FP.dark[1]);
      F(c, [[21, -46], [25, -46], [25, -44], [21, -44]], FP.gm[2]);
      glowF(c, [[21.8, -52], [24.2, -52], [24.2, -50.5], [21.8, -50.5]]);
      glowF(c, [[8, -27], [14, -22.6], [14, -21.4], [8, -24.6]], MI[1]);
      seam(c, 'M23 -20L23 24M19 -4L28 -4M19 14L28 14M7 -6L7 14', 0.5);
      vents(c, 24.4, -14, 4, 2.6, 3.2);
      tipD(c, [[22, 36], [26, 36], [24, 38]]);
    });
    glowF(c, [[-0.9, -8], [0.9, -8], [0.9, 28], [-0.9, 28]], MI[1]);
    hiLine(c, 'M-1.2 -45L-2.4 -36', 0.55, 0.7);
  } });

  // Enclume : canonnière lourde, double delta à bord de fuite en dents, nacelles, plaque blindée à fentes
  efac('w1c', { wear: 127, w: 156, h: 128, cy: 2, parts: [
    { p: [[14, -30], [77, 22], [44, 20], [16, 6]], m: 'eg', s: 0 },
    { p: [[16, 6], [44, 20], [77, 22], [74, 30], [58, 29], [52, 37], [16, 40]], m: 'eg', s: 2 },
    { p: [[27, -26], [34, -32], [40, -24], [41, 40], [36, 47], [28, 42]], m: 'gm', s: 0 },
    { p: [[34, -32], [40, -24], [41, 40], [36, 47]], m: 'gm', s: 1 },
    { p: [[5, -54], [14, -36], [20, -4], [17, 40], [0, 48]], m: 'eg', s: 1 },
    { p: [[0, -62], [5, -54], [7, 42], [0, 48]], m: 'eg', s: 0 },
    { p: [[0, -24], [14, -17], [15, 12], [0, 18]], m: 'gm', s: 2 },
    { p: [[0, -50], [3, -43], [3.6, -34], [0, -32]], m: 'eglass', s: 0 },
  ], det(c) {
    eflame(c, 0, 48, 5, 16); sym(c, () => eflame(c, 34, 46, 3.4, 12));
    sym(c, () => {
      F(c, [[30.6, -50], [33.4, -50], [33.4, -30], [30.6, -30]], FP.dark[1]);
      F(c, [[30, -42], [34, -42], [34, -39], [30, -39]], FP.gm[2]);
      glowF(c, [[30.8, -51.5], [33.2, -51.5], [33.2, -50], [30.8, -50]]);
      glowF(c, [[50, -2], [77, 22], [75, 23.5], [48, 1]]);
      tipD(c, [[70, 24], [77, 22], [74, 30], [70, 29.6]]);
      seam(c, 'M18 -2L30 6M46 14L50 36M18 20L28 36M42 0L42 40M28 -4L40 -4M28 22L41 22', 0.5);
      vents(c, 35, -16, 5, 3.6, 3.4);
      dots(c, [[22, 26], [58, 24], [12, -28], [48, 30]], 0.8);
    });
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) { const y = -12 + i * 6.4; F(c, [[-9, y], [9, y], [9, y + 2.4], [-9, y + 2.4]], hexA(MINT, 0.5 + (i % 2) * 0.35)); }
    c.restore();
    seam(c, 'M-14 -17L14 -17M-15 12L15 12', 0.5);
    glowF(c, [[-1, 20], [1, 20], [1, 40], [-1, 40]], MI[1]);
    hiLine(c, 'M-1.6 -58L-3.6 -44', 0.55, 0.8);
  } });

  // Aiguille : plongeur effilé, canards, empennage en flèche, épine lumineuse segmentée
  efac('w1d', { wear: 131, w: 44, h: 132, cy: 4, parts: [
    { p: [[3, 20], [20, 44], [20, 53], [3, 45]], m: 'eg', s: 2 },
    { p: [[3, -34], [14, -22], [14, -18], [3, -21]], m: 'eg', s: 0 },
    { p: [[2, -54], [5, -34], [7, 16], [6, 48], [0, 52]], m: 'eg', s: 1 },
    { p: [[0, -62], [2, -54], [3, 48], [0, 52]], m: 'eg', s: 0 },
    { p: [[0, 50], [4, 50], [4, 56], [0, 56]], m: 'gm', s: 2 },
    { p: [[0, -46], [2, -40], [2.2, -32], [0, -30]], m: 'eglass', s: 0 },
  ], det(c) {
    eflame(c, 0, 56, 3, 14);
    for (let i = 0; i < 5; i++) glowF(c, [[-0.8, -22 + i * 12], [0.8, -22 + i * 12], [0.8, -14 + i * 12], [-0.8, -14 + i * 12]], MI[1]);
    sym(c, () => {
      glowF(c, [[9, -25], [14, -21], [14, -19.4], [8, -23]], MI[1]);
      tipD(c, [[16, 44], [20, 44], [20, 53], [16, 51]]);
      seam(c, 'M3 -4L7 -4M3 26L12 38M4 10L7 10', 0.5);
    });
    hiLine(c, 'M-0.8 -58L-1.6 -48', 0.6, 0.6);
  } });

  // Relais : plate-forme en losange, quatre bras-lames à émetteurs, fentes menthe
  efac('w1e', { wear: 139, w: 112, h: 100, cy: 0, parts: [
    { p: [[8, -10], [42, -38], [49, -33], [18, -3]], m: 'gm', s: 1 },
    { p: [[8, 10], [42, 38], [49, 33], [18, 3]], m: 'gm', s: 1 },
    { p: [[37, -44], [50, -47], [55, -36], [46, -30]], m: 'eg', s: 2 },
    { p: [[37, 44], [50, 47], [55, 36], [46, 30]], m: 'eg', s: 2 },
    { p: [[0, -46], [4, -36], [22, -12], [24, 14], [6, 34], [0, 40]], m: 'eg', s: 1 },
    { p: [[0, -46], [4, -36], [6, 34], [0, 40]], m: 'eg', s: 0 },
    { p: [[0, -24], [13, -9], [13, 9], [0, 22]], m: 'gm', s: 2 },
  ], det(c) {
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const y of [-12, -5.5, 1, 7.5]) F(c, [[-9, y], [9, y], [9, y + 2.4], [-9, y + 2.4]], hexA(MINT, 0.85));
    c.restore();
    sym(c, () => {
      glowF(c, [[42, -45.4], [50, -47], [52, -42], [44, -40.6]]);
      glowF(c, [[42, 45.4], [50, 47], [52, 42], [44, 40.6]]);
      seam(c, 'M22 -12L13 -9M24 14L13 9M16 -22L22 -12M28 -22L34 -16M28 22L34 16M44 -30L48 -38M44 30L48 38', 0.5);
      dots(c, [[18, -8], [18, 8], [30, -24], [30, 24]], 0.8);
      tipD(c, [[2, 34], [6, 34], [3, 38]]);
    });
    hiLine(c, 'M-1.6 -42L-3 -36', 0.55, 0.8);
  } });

  // Éclat : petite fléchette à bord de fuite cranté
  efac('w1m', { w: 40, h: 48, cy: 0, parts: [
    { p: [[0, -24], [5, -8], [18, 13], [12, 13], [7, 9], [3, 14], [0, 14]], m: 'eg', s: 1 },
    { p: [[0, -24], [3, -8], [3, 14], [0, 14]], m: 'eg', s: 0 },
  ], det(c) {
    eflame(c, 0, 14, 2.4, 8);
    glowF(c, [[-0.7, -10], [0.7, -10], [0.7, 10], [-0.7, 10]], MI[1]);
    sym(c, () => { glowF(c, [[11, 4], [18, 13], [16, 13.4], [9.6, 6]]); seam(c, 'M4 -2L8 4', 0.5); });
  } });

  // tourelle de nœud : socle hexagonal à pans, un seul canon lourd à frein de bouche, fentes menthe
  D.w1n = Object.assign({}, EN, fac({ w: 50, h: 70, cy: -10, orient: 'none', parts: [
    { p: [[0, -16], [12, -16], [21, -2], [21, 8], [13, 20], [0, 20]], m: 'eg', s: 1 },
    { p: [[0, -16], [12, -16], [21, -2], [9, -1], [0, -5]], m: 'eg', s: 0 },
    { p: [[13, 20], [21, 8], [21, 12], [15, 21]], m: 'gm', s: 2 },
    { p: [[0, -6], [10, -4], [11, 8], [0, 12]], m: 'gm', s: 2 },
    { p: [[0, -42], [2.6, -42], [2.6, -14], [0, -14]], m: 'gm', s: 1 },
    { p: [[0, -24], [5, -22], [5, -8], [0, -8]], m: 'gm', s: 0 },
  ], det(c) {
    F(c, [[-4.4, -45], [4.4, -45], [4.4, -40], [-4.4, -40]], FP.dark[1]);
    F(c, [[-3.4, -35], [3.4, -35], [3.4, -33], [-3.4, -33]], FP.dark[2]);
    glowF(c, [[-3.6, -45.6], [3.6, -45.6], [3.6, -44.2], [-3.6, -44.2]]);
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const y of [-1, 3.4, 7.8]) F(c, [[-7, y], [7, y], [7, y + 1.8], [-7, y + 1.8]], hexA(MINT, 0.8));
    c.restore();
    sym(c, () => { seam(c, 'M21 -2L10 -4M13 20L11 8M12 -16L9 -1', 0.5); });
    hiLine(c, 'M-11 -15L-19 -3', 0.4, 0.7);
  } }));

  // vaisseau-mère du Bureau : grande aile à bord de fuite cranté, lames de bout d'aile, canons d'aile,
  // nacelles à deux faces, noyau à fentes (pas de disque central) ; occl : aucune pièce cachée en transparence
  D.w1boss = Object.assign({}, EN, fac({ wear: 151, occl: true, w: 330, h: 244, cy: -6, orient: 'none', parts: [
    { p: [[150, -10], [157, -34], [162, -32], [163, 12], [160, 14]], m: 'gm', s: 1 },
    { p: [[30, -80], [150, -10], [90, -6], [36, -40]], m: 'eg', s: 0 },
    { p: [[36, -40], [90, -6], [150, -10], [160, 14], [148, 22], [141, 17], [128, 28], [119, 23], [104, 33], [40, 40]], m: 'eg', s: 2 },
    { p: [[96, 24], [130, 40], [128, 52], [100, 44]], m: 'eg', s: 1 },
    { p: [[98, -26], [101, -42], [109, -42], [111, -22], [104, -18]], m: 'gm', s: 1 },
    { p: [[56, -20], [64, -26], [64, 92], [56, 80]], m: 'gm', s: 0 },
    { p: [[64, -26], [72, -18], [74, 80], [64, 92]], m: 'gm', s: 1 },
    { p: [[10, -112], [30, -90], [44, -40], [48, 40], [34, 88], [0, 104]], m: 'eg', s: 1 },
    { p: [[0, -118], [10, -112], [18, -40], [18, 90], [0, 104]], m: 'eg', s: 0 },
    { p: [[0, 88], [14, 86], [15, 106], [0, 108]], m: 'gm', s: 2 },
    { p: [[0, -44], [28, -32], [28, 34], [0, 46]], m: 'gm', s: 2 },
    { p: [[0, -32], [16, -24], [16, 26], [0, 34]], m: 'dark', s: 0 },
    { p: [[0, -96], [5, -88], [6, -74], [0, -70]], m: 'eglass', s: 0 },
  ], det(c) {
    eflame(c, 0, 107, 11, 32); sym(c, () => eflame(c, 65, 92, 5, 18));
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) { const y = -24 + i * 9; F(c, [[-13, y], [13, y], [13, y + 3.2], [-13, y + 3.2]], hexA(MINT, 0.5 + (i % 2) * 0.4)); }
    c.restore();
    // épine lumineuse segmentée et arête dorsale, sur l'axe
    for (let i = 0; i < 5; i++) glowF(c, [[-1.4, -110 + i * 12], [1.4, -110 + i * 12], [1.4, -102 + i * 12], [-1.4, -102 + i * 12]], MI[1]);
    F(c, [[-6, 50], [6, 50], [5, 80], [-5, 80]], FP.gm[3]); seam(c, 'M-6 58L6 58M-6 66L6 66M-5 74L5 74', 0.6);
    sym(c, () => {
      // aile : bord d'attaque lumineux, panneaux suivant la flèche, plaques rapportées, pointes sombres
      F(c, [[110, -32], [150, -10], [148, -6], [108, -28]], MI[1]);
      seam(c, 'M44 -40L100 14M50 10L110 26M36 -60L44 -40M28 -32L44 -36M28 34L44 40M78 -30L82 32M120 -16L124 26M90 -6L96 30', 0.5);
      plate(c, 82, 0, 12, 7); plate(c, 112, 2, 9, 6, FP.gm[3]); plate(c, 48, 18, 6, 12); plate(c, 120, 12, 7, 4, FP.eg[4]);
      tipD(c, [[141, 17], [148, 22], [160, 14], [154, 10]]); tipD(c, [[119, 23], [128, 28], [134, 23], [126, 20]]);
      dots(c, [[40, 0], [40, 20], [80, 20], [120, -6], [24, -70], [24, 60], [100, 30], [140, 4]], 1.1);
      // lames de bout d'aile
      glowF(c, [[157.4, -34], [161.6, -32.4], [161.6, -29], [157.2, -30.4]], MI[1]);
      seam(c, 'M159 -26L160 10', 0.5);
      // canon d'aile : affût, tube, frein de bouche (sans feu à la bouche)
      F(c, [[102.6, -70], [105.4, -70], [105.4, -42], [102.6, -42]], FP.dark[1]);
      F(c, [[101.6, -64], [106.4, -64], [106.4, -60], [101.6, -60]], FP.gm[2]); F(c, [[101.6, -50], [106.4, -50], [106.4, -48], [101.6, -48]], FP.gm[3]);
      seam(c, 'M101 -34L110 -34', 0.6); vents(c, 102, -30, 3, 6, 2.6);
      // nacelles : prise d'air, canons jumelés, couture de segments, bande lumineuse arrière
      for (const x of [60, 68]) { F(c, [[x - 1.6, -36], [x + 1.6, -36], [x + 1.6, -20], [x - 1.6, -20]], FP.dark[1]); F(c, [[x - 2.2, -32], [x + 2.2, -32], [x + 2.2, -30], [x - 2.2, -30]], FP.gm[3]); }
      intake(c, 57, -18, 15, 8);
      seam(c, 'M56 6L74 6M56 34L74 34M57 60L74 60', 0.55); vents(c, 66, 12, 4, 6, 4);
      glowF(c, [[57, 74], [73, 74], [73, 76.4], [57, 76.4]], MI[1]);
      F(c, [[150, 4], [160, 12], [159, 16], [150, 10]], FP.gm[3]);
      // coque : flancs du noyau à persiennes, plaques blindées, prises d'air ventrales
      vents(c, 30, -20, 6, 10, 5);
      // (ton sur ton : une paire de plaques sombres près de l'axe ferait des yeux)
      plate(c, 22, -70, 8, 18, FP.eg[2]); plate(c, 24, 52, 10, 22, FP.eg[2]);
      seam(c, 'M18 -40L44 -40M18 50L46 50M18 -80L32 -80', 0.5);
      // tuyère centrale à volets
      seam(c, 'M4 88L5 106M9 87L10 106', 0.5);
    });
    seam(c, 'M-44 60L44 60', 0.4);
    hiLine(c, 'M-4 -110L-12 -60', 0.5, 0.9); hiLine(c, 'M-40 -58L-120 -20', 0.3, 0.7);
  } }));

  /* ---------------- 02 · 1865 : machines volantes victoriennes en Facettes (laiton, ivoire, bois) ---------------- */
  const BR = FP.br, CU = FP.cu, LIT = FP.lit;
  // rotor vu de dessus : disque de rotation très léger, pales plates, moyeu octogonal (aucune lumière au centre)
  function frotor(c, x, y, r, n = 4, a0 = 0.35) {
    c.fillStyle = 'rgba(236,226,204,.17)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(236,226,204,.42)'; c.lineWidth = Math.max(0.6, px(0.5)); c.stroke();
    c.strokeStyle = 'rgba(255,246,226,.30)'; c.lineWidth = Math.max(0.8, px(0.6));
    for (let i = 0; i < 2; i++) { c.beginPath(); c.arc(x, y, r * (0.6 + i * 0.22), a0 + 0.9 + i * 3.1, a0 + 1.7 + i * 3.1); c.stroke(); }
    for (let i = 0; i < n; i++) {
      c.save(); c.translate(x, y); c.rotate(a0 + i * TAU / n);
      const bl = [[-r * 0.05, 0], [r * 0.05, 0], [r * 0.08, -r * 0.94], [-r * 0.03, -r * 0.97]];
      c.strokeStyle = OUT; c.lineWidth = Math.max(1, px(0.8)); fpoly(c, bl); c.stroke(); c.fillStyle = FP.wd[1]; c.fill();
      F(c, [[0, 0], [r * 0.05, 0], [r * 0.08, -r * 0.94], [0, -r * 0.955]], FP.wd[2]);
      c.restore();
    }
    const h = r * 0.13, oc = [0, 1, 2, 3, 4, 5, 6, 7].map(i => [x + Math.cos(i * TAU / 8 + 0.39) * h, y + Math.sin(i * TAU / 8 + 0.39) * h]);
    c.strokeStyle = OUT; c.lineWidth = Math.max(1, px(0.8)); fpoly(c, oc); c.stroke(); c.fillStyle = BR[2]; c.fill();
    F(c, [oc[3], oc[4], oc[5], oc[6]], BR[1]);
  }
  // hélice d'étrave / de poupe vue de dessus : deux pales à plat dans un disque fin
  function fprop(c, x, y, r) {
    c.fillStyle = 'rgba(236,226,204,.16)'; c.beginPath(); c.ellipse(x, y, r, Math.max(1.6, r * 0.09), 0, 0, TAU); c.fill();
    for (const s of [-1, 1]) {
      const bl = [[x, y - 1.2], [x + s * r * 0.92, y - 1.8], [x + s * r * 0.95, y + 0.6], [x, y + 1.2]];
      c.strokeStyle = OUT; c.lineWidth = Math.max(1, px(0.8)); fpoly(c, bl); c.stroke(); c.fillStyle = FP.wd[s > 0 ? 2 : 1]; c.fill();
    }
    F(c, [[x - 2.6, y - 3], [x + 2.6, y - 3], [x + 2.6, y + 3], [x - 2.6, y + 3]], BR[1]);
  }
  const band = (c, w, y, h = 3, col = CU[1]) => F(c, [[-w, y], [w, y], [w, y + h], [-w, y + h]], col);
  const slit = (c, x, y, w, h) => { c.save(); c.globalCompositeOperation = 'lighter'; F(c, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], hexA(LIT[1], 0.9)); c.restore(); };

  // obus-fusée de la Columbiad : ogive ivoire effilée, fût de laiton riveté cerclé de cuivre, canards, ailerons rabattus
  efac('w2a', { wear: 211, w: 52, h: 124, cy: 0, parts: [
    { p: [[6, 22], [22, 42], [24, 58], [16, 56], [6, 46]], m: 'cu', s: 1 },
    { p: [[5, -30], [13, -24], [13, -19], [5, -21]], m: 'cu', s: 0 },
    { p: [[0, -40], [10, -28], [10, 42], [7, 48], [0, 48]], m: 'br', s: 0 },
    { p: [[6, -32], [10, -28], [10, 42], [7, 48], [6, 46]], m: 'br', s: 2 },
    { p: [[0, -62], [3, -56], [8, -40], [10, -28], [0, -30]], m: 'iv', s: 0 },
    { p: [[0, 46], [6, 46], [8, 54], [0, 54]], m: 'fe', s: 2 },
  ], det(c) {
    eflame(c, 0, 54, 5, 18, WARM);
    band(c, 10, -26); band(c, 10, 4); band(c, 10, 36);
    slit(c, -1.4, -18, 2.8, 16);
    sym(c, () => {
      seam(c, 'M8 30L20 44M6 -22L6 2M3 10L3 34M10 -8L6 -8M10 20L6 20', 0.45);
      dots(c, [[7, -24.5], [7, 5.5], [7, 37.5], [3, -24.5], [3, 5.5], [3, 37.5]], 0.65);
      F(c, [[17, 50], [23, 54], [24, 58], [16, 56]], CU[3]);
      F(c, [[11, -24], [13, -23], [13, -19.6], [11, -20]], CU[3]);
    });
    seam(c, 'M-10 -28L10 -28', 0.5);
    hiLine(c, 'M-1.5 -58L-6 -36', 0.6, 0.8);
  } });
  // fléchette de cuivre : nez de fer, deux bagues de laiton, ailerons fins
  efac('w2m', { w: 34, h: 82, cy: 0, parts: [
    { p: [[3, 14], [14, 28], [15, 36], [3, 30]], m: 'br', s: 1 },
    { p: [[0, -26], [6, -16], [6, 28], [0, 30]], m: 'cu', s: 0 },
    { p: [[4, -20], [6, -16], [6, 28], [4, 28]], m: 'cu', s: 2 },
    { p: [[0, -40], [3, -32], [6, -16], [0, -18]], m: 'fe', s: 0 },
    { p: [[0, 28], [4, 28], [5, 33], [0, 33]], m: 'fe', s: 2 },
  ], det(c) {
    eflame(c, 0, 33, 3.6, 10, WARM);
    band(c, 6, -12, 2.2, BR[1]); band(c, 6, 14, 2.2, BR[1]);
    slit(c, -1, -6, 2, 14);
    sym(c, () => seam(c, 'M3 18L12 30', 0.45));
    hiLine(c, 'M-1 -36L-4 -20', 0.6, 0.7);
  } });

  // nacelle volante à quatre rotors : coque ivoire, pont de bois, bras de laiton, deux canons d'étrave
  efac('w2b', { wear: 223, w: 132, h: 136, cy: 0, parts: [
    { p: [[6, -30], [40, -29], [40, -24], [6, -22]], m: 'br', s: 1 },
    { p: [[6, 22], [40, 24], [40, 29], [6, 30]], m: 'br', s: 1 },
    { p: [[8, -48], [16, -46], [16, -34], [11, -32]], m: 'br', s: 1 },
    { p: [[0, -62], [8, -52], [14, -30], [14, 30], [10, 52], [0, 60]], m: 'iv', s: 0 },
    { p: [[10, -44], [14, -30], [14, 30], [11, 48], [10, 40]], m: 'iv', s: 2 },
    { p: [[0, -48], [7, -40], [9, -26], [9, 34], [6, 46], [0, 50]], m: 'wd', s: 1 },
    { p: [[0, -18], [8, -16], [8, 12], [0, 14]], m: 'iv', s: 1 },
    { p: [[0, -18], [3, -18], [3, 14], [0, 14]], m: 'iv', s: 0 },
    { p: [[0, 22], [4, 22], [4, 32], [0, 32]], m: 'br', s: 1 },
  ], det(c) {
    sym(c, () => {
      F(c, [[11.4, -62], [14, -62], [14, -46], [11.4, -46]], BR[3]);
      F(c, [[11, -58], [14.4, -58], [14.4, -56], [11, -56]], CU[2]);
      F(c, [[11.6, -63.4], [13.8, -63.4], [13.8, -62], [11.6, -62]], FP.dark[1]);
      seam(c, 'M3 -44L3 -20M3 16L3 46M6 -36L6 -20M6 16L6 40', 0.35);
      for (let y = -40; y <= 40; y += 8) seam(c, `M1 ${y}L8 ${y}`, 0.22);
      slit(c, 6, -12, 1.6, 5); slit(c, 6, -3, 1.6, 5); slit(c, 6, 6, 1.6, 4);
      dots(c, [[12, -26], [12, 26], [12, -40], [12, 40]], 0.8);
    });
    F(c, [[-3, 22], [3, 22], [3, 24], [-3, 24]], FP.dark[1]);
    slit(c, -2, 52, 4, 2.4);
    hiLine(c, 'M-2 -58L-11 -34', 0.6, 0.8);
    fprop(c, 0, -66, 18);
    sym(c, () => { frotor(c, 40, -26, 24, 4, 0.3); frotor(c, 40, 26, 24, 4, 1.1); });
  } });

  // dirigeable de combat : enveloppe ivoire effilée à fuseaux, coiffe de laiton, nacelles motrices latérales, pièce de proue
  efac('w2c', { wear: 233, w: 100, h: 190, cy: 0, parts: [
    { p: [[14, 52], [44, 74], [44, 92], [12, 86]], m: 'br', s: 1 },
    { p: [[20, -8], [42, -6], [42, 0], [20, 2]], m: 'br', s: 1 },
    { p: [[38, -24], [43, -28], [48, -22], [48, 14], [44, 20], [38, 16]], m: 'cu', s: 1 },
    { p: [[0, -94], [14, -86], [26, -64], [32, -24], [32, 24], [27, 62], [16, 86], [0, 92]], m: 'iv', s: 0 },
    { p: [[18, -78], [26, -64], [32, -24], [32, 24], [27, 62], [18, 80], [22, 58], [25, 22], [25, -20], [22, -58]], m: 'iv', s: 2 },
    { p: [[0, -94], [8, -90], [12, -82], [0, -80]], m: 'br', s: 0 },
    { p: [[0, -80], [3.5, -78], [3.5, 80], [0, 82]], m: 'br', s: 0 },
    { p: [[0, -40], [9, -38], [9, -22], [0, -20]], m: 'wd', s: 1 },
  ], det(c) {
    sym(c, () => {
      seam(c, 'M10 -88L14 -56L16 0L14 56L10 88', 0.3); seam(c, 'M20 -70L22 0L20 70', 0.22);
      seam(c, 'M22 58L42 78M26 64L42 88M20 -3L40 -3', 0.4);
      F(c, [[42, -26], [44, -29], [48, -22], [44, -22]], CU[0]);
      dots(c, [[41, -12], [41, 6], [6, -36], [6, -24]], 0.7);
      fprop(c, 43, 23, 10);
      F(c, [[36, 74], [44, 79], [44, 92], [38, 90]], BR[3]);
    });
    for (const [y, w] of [[-56, 25], [0, 32], [48, 28]]) { band(c, w, y - 1.5, 3, BR[2]); dots(c, [[-w * 0.5, y], [w * 0.5, y]], 0.7); }
    F(c, [[-1.6, -58], [1.6, -58], [1.6, -38], [-1.6, -38]], BR[3]);
    F(c, [[-2.2, -60], [2.2, -60], [2.2, -57], [-2.2, -57]], FP.dark[1]);
    for (let y = -12; y <= 72; y += 14) slit(c, -1, y, 2, 6);
    hiLine(c, 'M-8 -86L-22 -62L-27 -24', 0.55, 0.8);
    F(c, [[-1.6, 90], [1.6, 90], [1.6, 98], [-1.6, 98]], FP.fe[2]);
    fprop(c, 0, 98, 20);
  } });

  // obus blindé : ogive d'acier, fût de laiton riveté, ailerons de cuivre, propulseur
  efac('w2d', { wear: 241, w: 38, h: 108, cy: 0, parts: [
    { p: [[10, 22], [19, 38], [19, 50], [12, 48]], m: 'cu', s: 1 },
    { p: [[0, -46], [8, -40], [15, -22], [16, 38], [14, 46], [0, 46]], m: 'br', s: 0 },
    { p: [[10, -34], [15, -22], [16, 38], [14, 46], [11, 46], [11, -28]], m: 'br', s: 2 },
    { p: [[0, -56], [7, -42], [12, -32], [0, -30]], m: 'fe', s: 0 },
    { p: [[0, 36], [15, 36], [14, 48], [0, 48]], m: 'cu', s: 1 },
  ], det(c) {
    eflame(c, 0, 48, 6, 16, WARM);
    band(c, 15, -20); band(c, 16, 6);
    slit(c, -1.2, -14, 2.4, 16);
    sym(c, () => { seam(c, 'M4 -16L10 -2M4 12L10 28M12 -34L6 -30', 0.4); dots(c, [[6, -12], [12, -12], [6, 18], [12, 18], [6, 30], [12, 30]], 0.8); F(c, [[16, 44], [19, 46], [19, 50], [16, 49]], CU[3]); });
    hiLine(c, 'M-2 -52L-9 -34', 0.6, 0.8);
  } });

  // quadrirotor en X : chaudière centrale à fentes (aucun disque), bras diagonaux, canon de proue, soute à bombes
  efac('w2e', { wear: 251, w: 126, h: 126, cy: 0, parts: [
    { p: [[4, -10], [40, -46], [45, -41], [9, -5]], m: 'br', s: 1 },
    { p: [[4, 10], [40, 46], [45, 41], [9, 5]], m: 'br', s: 1 },
    { p: [[0, -36], [10, -30], [16, -12], [16, 14], [10, 30], [0, 34]], m: 'iv', s: 0 },
    { p: [[10, -30], [16, -12], [16, 14], [10, 30], [11, 12], [11, -10]], m: 'iv', s: 2 },
    { p: [[0, -10], [9, -8], [9, 18], [0, 20]], m: 'br', s: 1 },
    { p: [[0, -42], [5, -36], [5, -30], [0, -28]], m: 'cu', s: 1 },
  ], det(c) {
    F(c, [[-1.4, -54], [1.4, -54], [1.4, -40], [-1.4, -40]], BR[3]); F(c, [[-2, -55], [2, -55], [2, -53], [-2, -53]], FP.dark[1]);
    for (const y of [-4, 3, 10]) slit(c, -7, y, 14, 2.2);
    sym(c, () => {
      seam(c, 'M10 -22L14 -14M10 24L14 16M8 -28L3 -32M8 28L3 32', 0.4); dots(c, [[13, -6], [13, 10], [13, -20], [13, 22]], 0.8);
    });
    hiLine(c, 'M-3 -32L-12 -18', 0.55, 0.8);
    sym(c, () => { frotor(c, 42, -42, 22, 3, 0.2); frotor(c, 42, 42, 22, 3, 0.9); });
  } });

  // tourelle de nœud : canon de laiton sur affût de bois à roues (vue de dessus)
  D.w2n = Object.assign({}, EN, fac({ wear: 263, w: 60, h: 78, cy: -6, orient: 'none', parts: [
    { p: [[17, -6], [23, -6], [23, 22], [17, 22]], m: 'wd', s: 2 },
    { p: [[0, 4], [20, 4], [20, 8], [0, 8]], m: 'fe', s: 1 },
    { p: [[7, -12], [14, -12], [14, 26], [7, 26]], m: 'wd', s: 1 },
    { p: [[0, -8], [7, -8], [7, 30], [4, 32], [0, 32]], m: 'wd', s: 0 },
    { p: [[0, -8], [9, -8], [10, 8], [6, 14], [0, 15]], m: 'br', s: 1 },
    { p: [[0, -42], [5, -42], [6, -30], [8, -8], [0, -8]], m: 'br', s: 0 },
    { p: [[3, -42], [5, -42], [6, -30], [8, -8], [5, -8]], m: 'br', s: 2 },
    { p: [[0, -45], [6.4, -45], [6.4, -40], [0, -40]], m: 'cu', s: 1 },
  ], det(c) {
    F(c, [[-3.6, -45], [3.6, -45], [3.6, -43.4], [-3.6, -43.4]], FP.dark[1]);
    band(c, 6, -30, 2, CU[2]); band(c, 7.6, -16, 2.4, CU[2]);
    sym(c, () => {
      for (let y = -2; y <= 18; y += 5) seam(c, `M17 ${y}L23 ${y}`, 0.5);
      seam(c, 'M10.5 -12L10.5 26M2 18L2 30', 0.35);
    });
    hiLine(c, 'M-2.4 -40L-4 -10', 0.5, 0.8);
  } }));

  // clipper volant (d'après Jules Verne) : coque ivoire, pont de bois, six rotors sur bras de laiton à jambes de force
  D.w2boss = Object.assign({}, EN, fac({ wear: 271, occl: true, w: 236, h: 344, cy: 0, orient: 'none', parts: [
    ...[-84, 0, 84].map(y => ({ p: [[20, y - 4.5], [70, y - 3.5], [70, y + 3.5], [20, y + 4.5]], m: 'br', s: 1 })),
    { p: [[0, -164], [12, -150], [28, -110], [34, -60], [34, 40], [30, 110], [18, 148], [0, 162]], m: 'iv', s: 0 },
    { p: [[22, -124], [28, -110], [34, -60], [34, 40], [30, 110], [20, 138], [26, 100], [28, 40], [28, -60]], m: 'iv', s: 2 },
    { p: [[0, -148], [10, -134], [24, -100], [26, -60], [26, 40], [22, 104], [12, 134], [0, 146]], m: 'wd', s: 1 },
    { p: [[14, -122], [30, -122], [33, -118], [33, -106], [30, -102], [14, -102]], m: 'fe', s: 1 },
    { p: [[14, 102], [30, 102], [33, 106], [33, 118], [30, 122], [14, 122]], m: 'fe', s: 1 },
    { p: [[0, -74], [16, -72], [16, -30], [0, -28]], m: 'iv', s: 1 },
    { p: [[0, -74], [6, -73], [6, -29], [0, -28]], m: 'iv', s: 0 },
    { p: [[0, 24], [16, 26], [16, 66], [0, 68]], m: 'iv', s: 1 },
    { p: [[0, 24], [6, 25], [6, 67], [0, 68]], m: 'iv', s: 0 },
    { p: [[0, -20], [13, -18], [13, 14], [0, 16]], m: 'br', s: 1 },
  ], det(c) {
    // pont : lattes et joints décalés
    clipP(c, [[-26, -140], [26, -140], [26, 140], [-26, 140]], () => {
      sym(c, () => { seam(c, 'M5 -140L5 140M15 -120L15 120', 0.18); for (let y = -136; y < 136; y += 22) seam(c, `M5 ${y}L10 ${y}M10 ${y + 11}L15 ${y + 11}M15 ${y + 5}L20 ${y + 5}`, 0.22); });
    });
    sym(c, () => {
      // bras : jambes de force en laiton, boîte de renvoi, bagues de cuivre
      for (const y of [-84, 0, 84]) for (const d of [-1, 1]) {
        const q = [[28, y + d * 14], [56, y + d * 1.8], [56, y + d * 3.6], [28, y + d * 17]];
        F(c, q, BR[2]); c.strokeStyle = 'rgba(7,8,10,.6)'; c.lineWidth = Math.max(0.5, px(0.45)); fpoly(c, q); c.stroke();
      }
      for (const y of [-84, 0, 84]) {
        F(c, [[34, y - 7], [44, y - 7], [44, y + 7], [34, y + 7]], BR[1]); F(c, [[34, y - 7], [44, y - 7], [44, y - 5.6], [34, y - 5.6]], 'rgba(255,246,226,.45)');
        seam(c, `M34 ${y - 7}L44 ${y - 7}L44 ${y + 7}L34 ${y + 7}ZM39 ${y - 7}L39 ${y + 7}`, 0.5);
        for (const x of [50, 60]) F(c, [[x, y - 4.2], [x + 2.4, y - 4.2], [x + 2.4, y + 4.2], [x, y + 4.2]], CU[2]);
      }
      // bordé ivoire : virures
      seam(c, 'M30 -96L31 -60M31 60L30 96M32.6 -60L32.6 40', 0.25);
      seam(c, 'M10 -132L10 -76M10 -26L10 22M10 70L10 130M20 -104L20 -76M20 -26L20 22M20 70L20 100', 0.32);
      for (const y of [-66, -55, -44]) slit(c, 13.6, y, 1.8, 6);
      for (const y of [32, 43, 54]) slit(c, 13.6, y, 1.8, 6);
      seam(c, 'M33 -118L14 -118M33 106L14 106', 0.35);
      dots(c, [[17, -112], [30, -112], [17, 112], [30, 112], [30, -40], [30, 0], [30, 40], [24, -140], [24, 140]], 1);
    });
    for (const y of [-12, -5, 2, 9]) slit(c, -10, y, 20, 2.6);
    sym(c, () => { for (let y = -96; y <= 96; y += 16) if (Math.abs(y) > 12) slit(c, 30.2, y, 1.4, 4); F(c, [[8, -100], [18, -96], [18, -86], [8, -88]], FP.wd[2]); F(c, [[8, 88], [18, 86], [18, 96], [8, 100]], FP.wd[2]); seam(c, 'M8 -94L18 -91M8 94L18 91', 0.4); });
    // écoutille unique sur l'axe (deux petites plaques côte à côte feraient des yeux)
    F(c, [[-8, 73], [8, 73], [8, 81], [-8, 81]], BR[2]); seam(c, 'M-8 73L8 73L8 81L-8 81ZM-8 77L8 77', 0.5);
    F(c, [[-8, -90], [8, -90], [8, -80], [-8, -80]], FP.wd[3]); seam(c, 'M-8 -90L8 -90L8 -80L-8 -80ZM-4 -90L-4 -80M0 -90L0 -80M4 -90L4 -80', 0.45);
    seam(c, 'M-26 -60L26 -60M-26 -16L26 -16M-26 18L26 18M-26 80L26 80', 0.3);
    hiLine(c, 'M-4 -160L-14 -140L-30 -104', 0.55, 1);
    fprop(c, 0, -168, 30); fprop(c, 0, 166, 30);
    sym(c, () => { [-84, 0, 84].forEach((y, i) => frotor(c, 70, y, 44, 4, 0.3 + i * 0.5)); });
  } }));

  /* ---------------- 03 · 1870 : sous-marins de fer en Facettes (profil, nez à droite) ----------------
     Aucune lumière près du nez (évite l'« œil de poisson »), hublots en fentes, mines sans voyant. */
  // Facettes de profil : pièces entières (pas de miroir), teinte s directe, lumière venant du haut
  function facetsS(c, parts, det, occl) {
    const ow = Math.max(1.5, px(1.15)), thin = () => { c.lineWidth = Math.max(0.5, px(0.5)); c.strokeStyle = 'rgba(7,8,10,.55)'; };
    c.lineJoin = 'round'; c.strokeStyle = OUT; c.fillStyle = OUT; c.lineWidth = ow * 2;
    for (const p of parts) { fpoly(c, p.p); c.stroke(); c.fill(); }
    if (occl) { thin(); for (const p of parts) { fpoly(c, p.p); c.fillStyle = FP[p.m][p.s]; c.fill(); c.stroke(); } }
    else {
      for (const p of parts) { fpoly(c, p.p); c.fillStyle = FP[p.m][p.s]; c.fill(); }
      thin(); for (const p of parts) { fpoly(c, p.p); c.stroke(); }
    }
    if (det) det(c);
  }
  // usure de profil : suie côté poupe (gauche), plaques ternies, éclats (graine fixe)
  function wearS(c, o) {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of o.parts) for (const [x, y] of p.p) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const W = x1 - x0, Hh = y1 - y0;
    c.save(); c.beginPath(); for (const p of o.parts) { p.p.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); } c.clip();
    const g = c.createLinearGradient(x0, 0, x0 + W * 0.3, 0); g.addColorStop(0, 'rgba(24,18,12,.36)'); g.addColorStop(1, 'rgba(24,18,12,0)'); c.fillStyle = g; c.fillRect(x0, y0, W, Hh);
    let sd = o.wear; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 8; i++) { const x = x0 + (0.1 + r() * 0.8) * W, y = y0 + (0.25 + r() * 0.6) * Hh, w = 5 + r() * 12, h = 3 + r() * 6; c.fillStyle = 'rgba(7,8,10,.08)'; c.fillRect(x, y, w, h); }
    for (let i = 0; i < 90; i++) { const x = x0 + r() * W, y = y0 + r() * Hh, a = r(); c.fillStyle = a < 0.72 ? `rgba(7,8,10,${0.08 + r() * 0.14})` : `rgba(255,255,255,${0.1 + r() * 0.14})`; c.fillRect(x, y, 0.6 + r() * 1.8, 0.5 + r() * 0.7); }
    c.restore();
  }
  const facS = (o) => Object.assign(o, { facet: true, draw(c) { facetsS(c, o.parts, o.det, o.occl); if (o.wear) wearS(c, o); } });
  const clipP = (c, pts, fn) => { c.save(); fpoly(c, pts); c.clip(); fn(); c.restore(); };
  const AQ = FP.aq;
  const win = (c, x, y, w, h) => { F(c, [[x - 0.8, y - 0.8], [x + w + 0.8, y - 0.8], [x + w + 0.8, y + h + 0.8], [x - 0.8, y + h + 0.8]], FP.fe[4]); c.save(); c.globalCompositeOperation = 'lighter'; F(c, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], hexA(AQ[1], 0.95)); c.restore(); };
  // coque de sous-marin : silhouette en fuseau, bande haute claire, ventre sombre, cône d'étrave
  const subHull = (L, H) => [[-L, 0], [-0.88 * L, -0.55 * H], [-0.5 * L, -0.92 * H], [0, -H], [0.55 * L, -0.9 * H], [0.88 * L, -0.5 * H], [L, 0], [0.88 * L, 0.5 * H], [0.55 * L, 0.9 * H], [0, H], [-0.5 * L, 0.92 * H], [-0.88 * L, 0.55 * H]];
  // haut de coque y(x) le long du fuseau (pour poser une crête)
  const subTop = (L, H, x) => { const T = subHull(L, H).slice(0, 7); for (let i = 0; i < 6; i++) { const [ax, ay] = T[i], [bx, by] = T[i + 1]; if (x >= ax && x <= bx) return ay + (by - ay) * (x - ax) / (bx - ax); } return 0; };
  // crête dorsale en dents de scie (inclinées vers la poupe), de x0 à x1, n dents de hauteur h
  const sawPart = (L, H, [x0, x1, n, h], m = 'fe') => {
    const w = (x1 - x0) / n, pts = [[x0, -0.5 * H], [x1, -0.5 * H]];
    for (let i = 0; i < n; i++) { const xb = x1 - i * w; pts.push([xb, subTop(L, H, xb) + 0.6], [xb - w * 0.8, subTop(L, H, xb - w * 0.8) - h]); }
    pts.push([x0, subTop(L, H, x0) + 0.6]);
    return { p: pts, m, s: 1 };
  };
  function subParts(L, H, m = 'fe', saw) {
    return [
      ...(saw ? [sawPart(L, H, saw)] : []),
      { p: [[-L + 6, -3], [-L - 2, -H * 0.86], [-L - 12, -H * 0.86], [-L - 12, H * 0.86], [-L - 2, H * 0.86], [-L + 6, 3]], m: 'fe', s: 2 },
      { p: [[-L - 2, -H * 0.86], [-L - 12, -H * 0.86], [-L - 12, -H * 0.7], [-L - 3, -H * 0.7]], m: 'fe', s: 1 },
      { p: subHull(L, H), m, s: 2 },
      { p: [[-0.88 * L, -0.55 * H], [-0.5 * L, -0.92 * H], [0, -H], [0.55 * L, -0.9 * H], [0.88 * L, -0.5 * H], [0.7 * L, -0.42 * H], [0, -0.48 * H], [-0.6 * L, -0.42 * H]], m, s: 0 },
      { p: [[-0.88 * L, 0.55 * H], [-0.5 * L, 0.92 * H], [0, H], [0.55 * L, 0.9 * H], [0.88 * L, 0.5 * H], [0.7 * L, 0.4 * H], [0, 0.45 * H], [-0.6 * L, 0.4 * H]], m, s: 3 },
      { p: [[0.88 * L, -0.5 * H], [L, 0], [0.88 * L, 0.5 * H], [0.8 * L, 0]], m, s: 1 },
      { p: [[L - 4, -2.5], [L + 14, 0], [L - 4, 2.5]], m: 'al', s: 1 },
    ];
  }
  // hélice de profil : disque fin + deux pales plates
  function fpropS(c, x, y, r) {
    c.fillStyle = 'rgba(200,230,232,.16)'; c.beginPath(); c.ellipse(x, y, Math.max(1.6, r * 0.1), r, 0, 0, TAU); c.fill();
    for (const s of [-1, 1]) { const bl = [[x - 1.2, y], [x - 2, y + s * r * 0.92], [x + 0.8, y + s * r * 0.95], [x + 1.2, y]]; c.strokeStyle = OUT; c.lineWidth = Math.max(1, px(0.8)); fpoly(c, bl); c.stroke(); c.fillStyle = FP.br[s > 0 ? 2 : 1]; c.fill(); }
    F(c, [[x - 2.4, y - 2.6], [x + 2.4, y - 2.6], [x + 2.4, y + 2.6], [x - 2.4, y + 2.6]], FP.br[1]);
  }
  // détails communs : liseré de cuivre, tôles, rivets, hélice
  function subDet(c, L, H, o = {}) {
    clipP(c, subHull(L, H), () => {
      F(c, [[-L, -H * 0.12], [L, -H * 0.12], [L, -H * 0.12 + Math.max(2, H * 0.1)], [-L, -H * 0.12 + Math.max(2, H * 0.1)]], hexA(FP.cu[o.m === 'cu' ? 3 : 1], 0.9));
      let d = ''; for (let i = 1; i < (o.n || 5); i++) { const x = -L + i * L * 2 / (o.n || 5); d += `M${x} ${-H}Q${x + 3} 0 ${x} ${H}`; } seam(c, d, 0.4);
    });
    hiLine(c, `M${-0.5 * L} ${-0.86 * H}L${0.5 * L} ${-0.85 * H}`, 0.4, 0.8);
    dots(c, Array.from({ length: o.n || 5 }, (_, i) => [-L * 0.7 + i * L * 1.4 / ((o.n || 5) - 1), -H * 0.6]), Math.max(0.8, H * 0.05));
    // barres de plongée (étrave et poupe), vues par la tranche
    for (const [x, l] of [[0.6 * L, 0.2 * L], [-0.74 * L, 0.16 * L]]) {
      const y = H * 0.18, pl = [[x - l * 0.5, y - 1.2], [x + l * 0.5, y - 0.4], [x + l * 0.3, y + 2.2], [x - l * 0.5, y + 1.6]];
      c.strokeStyle = OUT; c.lineWidth = Math.max(1, px(0.9)); fpoly(c, pl); c.stroke(); c.fillStyle = FP.gm[1]; c.fill();
      F(c, [[x - l * 0.5, y - 1.2], [x + l * 0.5, y - 0.4], [x + l * 0.4, y + 0.4], [x - l * 0.5, y]], FP.gm[0]);
    }
    fpropS(c, -L - 9, 0, H * 0.95);
  }

  facS(D.w3a = Object.assign({ wear: 307, w: 140, h: 62, cy: -6, orient: 'side', down: false, sh: 'halo' }, { parts: [
    ...subParts(58, 17, 'fe', [27, 49, 3, 7]),
    { p: [[-4, -14], [0, -27], [22, -27], [26, -14]], m: 'cu', s: 1 },
    { p: [[0, -27], [22, -27], [21, -24], [1, -24]], m: 'cu', s: 0 },
    { p: [[8, -32], [10, -32], [10, -27], [8, -27]], m: 'gm', s: 1 },
  ], det(c) { subDet(c, 58, 17, { n: 4 }); win(c, 6, -21.5, 13, 2.6); dots(c, [[0, -16], [22, -16]], 0.8); } }));

  facS(D.w3b = Object.assign({ wear: 313, w: 160, h: 70, cy: -8, orient: 'side', down: false, sh: 'halo' }, { parts: [
    { p: [[28, -34], [60, -34], [60, -29], [28, -29]], m: 'gm', s: 1 },
    { p: [[16, -17], [20, -31], [34, -31], [37, -17]], m: 'fe', s: 1 },
    ...subParts(66, 19, 'cu', [-54, -24, 4, 6.5]),
    { p: [[-22, -17], [-18, -33], [6, -33], [10, -16]], m: 'fe', s: 1 },
    { p: [[-18, -33], [6, -33], [5, -30], [-17, -30]], m: 'fe', s: 0 },
  ], det(c) { subDet(c, 66, 19, { m: 'cu' }); win(c, -14, -27, 16, 3); F(c, [[58, -35], [61, -35], [61, -28], [58, -28]], FP.dark[1]); dots(c, [[20, -20], [32, -20]], 0.8); } }));

  facS(D.w3c = Object.assign({ wear: 317, w: 190, h: 90, cy: -10, orient: 'side', down: false, sh: 'halo' }, { parts: [
    { p: [[-70, 20], [70, 20], [66, 28], [-66, 28]], m: 'gm', s: 2 },
    ...[-60, 60].flatMap(x => [
      { p: [[x + 2, -31], [x + 22, -31], [x + 22, -27], [x + 2, -27]], m: 'gm', s: 1 },
      { p: [[x - 10, -19], [x - 7, -29], [x + 7, -29], [x + 10, -19]], m: 'fe', s: 1 },
    ]),
    ...subParts(80, 26, 'fe', [34, 52, 3, 7.5]),
    { p: [[-36, -24], [-30, -46], [26, -46], [34, -24]], m: 'cu', s: 1 },
    { p: [[-30, -46], [26, -46], [25, -42], [-29, -42]], m: 'cu', s: 0 },
  ], det(c) {
    subDet(c, 80, 26, { n: 6 });
    win(c, -22, -39, 40, 5);
    for (const x of [-44, -30, -16, 16, 30, 44]) win(c, x - 2.5, -7, 5, 3.4);
    dots(c, [[-62, 24], [-30, 24], [0, 24], [30, 24], [62, 24]], 0.9);
  } }));

  // torpille (vue de dessus, nez en haut) : ogive de laiton, hélice
  efac('w3d', { wear: 331, w: 30, h: 114, cy: 0, parts: [
    { p: [[3, 40], [12, 46], [12, 54], [3, 52]], m: 'gm', s: 1 },
    { p: [[0, -54], [5, -48], [8, -36], [8, 38], [5, 48], [0, 50]], m: 'al', s: 0 },
    { p: [[5, -44], [8, -36], [8, 38], [5, 48], [5, -40]], m: 'al', s: 2 },
    { p: [[0, -57], [5, -48], [8, -38], [0, -38]], m: 'br', s: 0 },
  ], det(c) {
    band(c, 8, -12, 2.4, FP.gm[2]); band(c, 8, 22, 2.4, FP.gm[2]);
    sym(c, () => { dots(c, [[5, -30], [5, 0], [5, 30]], 0.7); seam(c, 'M3 44L11 50', 0.4); });
    hiLine(c, 'M-1.5 -52L-5 -40', 0.6, 0.8);
    fprop(c, 0, 55, 10);
  } });

  // mine marine : sphère à facettes, cerclage de cuivre, cornes de laiton (aucun voyant)
  function mineF(c, r, horns, chain) {
    const ow = Math.max(1, px(0.9));
    if (chain) for (let y = r - 2, i = 0; y < r + chain; y += 6, i++) {
      const l = i % 2 ? [[-1.4, y], [1.4, y], [1.4, y + 7], [-1.4, y + 7]] : [[-2.6, y + 1], [2.6, y + 1], [2.6, y + 6], [-2.6, y + 6]];
      c.strokeStyle = OUT; c.lineWidth = ow; fpoly(c, l); c.stroke(); c.fillStyle = FP.fe[i % 2 ? 3 : 2]; c.fill();
    }
    for (let i = 0; i < horns; i++) {
      const a = i / horns * TAU - Math.PI / 2; c.save(); c.rotate(a + Math.PI / 2);
      const st = [[-r * 0.11, -r * 1.3], [r * 0.11, -r * 1.3], [r * 0.11, -r * 0.8], [-r * 0.11, -r * 0.8]], cap = [[-r * 0.17, -r * 1.42], [r * 0.17, -r * 1.42], [r * 0.17, -r * 1.28], [-r * 0.17, -r * 1.28]];
      for (const [p, s] of [[st, 2], [cap, 1]]) { c.strokeStyle = OUT; c.lineWidth = ow * 1.6; fpoly(c, p); c.stroke(); c.fillStyle = FP.br[s]; c.fill(); }
      c.restore();
    }
    sphereF(c, 0, 0, r, FP.fe);
    const ring = Array.from({ length: 16 }, (_, i) => [Math.cos(i / 16 * TAU) * r, Math.sin(i / 16 * TAU) * r]);
    clipP(c, ring, () => { F(c, [[-r, -r * 0.08], [r, -r * 0.08], [r, r * 0.1], [-r, r * 0.1]], FP.cu[2]); dots(c, [-0.7, -0.35, 0, 0.35, 0.7].map(k => [k * r, 0]), Math.max(0.7, r * 0.04)); });
    hiLine(c, `M${-r * 0.5} ${-r * 0.62}L${-r * 0.1} ${-r * 0.8}`, 0.55, Math.max(0.8, r * 0.05));
  }
  mk('w3e', { w: 92, h: 128, cy: 14, orient: 'none', down: false, sh: 'halo', facet: true }, c => mineF(c, 28, 7, 50));
  mk('w3m', { w: 48, h: 48, cy: 0, orient: 'spin', down: false, sh: 'halo', facet: true }, c => mineF(c, 14, 6, 0));

  // canon de pont suspendu sous le boss
  const rotP = (pts, a, ox, oy) => pts.map(([x, y]) => [ox + x * Math.cos(a) - y * Math.sin(a), oy + x * Math.sin(a) + y * Math.cos(a)]);
  facS(D.w3n = Object.assign({ wear: 337, w: 74, h: 60, cy: 8, orient: 'none', down: false, sh: 'halo' }, { parts: [
    { p: [[-26, -20], [26, -20], [26, -12], [-26, -12]], m: 'fe', s: 1 },
    { p: [[-26, -20], [26, -20], [25, -18], [-25, -18]], m: 'fe', s: 0 },
    { p: [[-12, -13], [12, -13], [12, -6], [-12, -6]], m: 'fe', s: 2 },
    { p: rotP([[-3.5, 0], [3.5, 0], [3.5, 30], [-3.5, 30]], -0.55, 10, 6), m: 'gm', s: 1 },
    { p: rotP([[-4.6, 27], [4.6, 27], [4.6, 34], [-4.6, 34]], -0.55, 10, 6), m: 'gm', s: 2 },
    { p: [[-22, -8], [22, -8], [18, 6], [10, 10], [-10, 10], [-18, 6]], m: 'cu', s: 2 },
    { p: [[-22, -8], [22, -8], [20, -2], [-20, -2]], m: 'cu', s: 0 },
  ], det(c) { dots(c, [[-14, 2], [-4, 3], [6, 2], [-20, -16], [20, -16]], 0.9); seam(c, 'M-18 6L18 6', 0.4); } }));

  // grand sous-marin : salon à baies, kiosque de cuivre, éperon, crêtes en dents de scie (d'après Jules Verne, dessin original)
  // occl : kiosques, quilles et crêtes posés derrière la coque (leur base ne se voit plus en transparence)
  facS(D.w3boss = Object.assign({ wear: 341, occl: true, w: 560, h: 200, cy: -10, orient: 'none', down: false, sh: 'halo' }, { parts: [
    { p: [[-246, -10], [-262, -60], [-284, -60], [-284, 60], [-262, 60], [-246, 10]], m: 'fe', s: 2 },
    { p: [[-262, -60], [-284, -60], [-284, -48], [-264, -48]], m: 'fe', s: 1 },
    ...[-156, -52, 52, 156].map(x => ({ p: [[x - 13, 54], [x + 13, 54], [x + 11, 70], [x - 11, 70]], m: 'gm', s: 2 })),
    sawPart(258, 70, [-218, -116, 5, 13]),
    sawPart(258, 70, [192, 222, 2, 8]),
    { p: [[130, -52], [138, -78], [176, -76], [186, -46]], m: 'fe', s: 1 },
    { p: [[138, -78], [176, -76], [177, -72], [139, -73]], m: 'fe', s: 0 },
    { p: [[-60, -56], [-46, -104], [70, -104], [90, -56]], m: 'cu', s: 1 },
    { p: [[-46, -104], [70, -104], [71, -98], [-44, -98]], m: 'cu', s: 0 },
    ...subParts(258, 70).slice(1, 5),
    { p: [[-52, -66], [86, -64], [88, -60], [-54, -62]], m: 'cu', s: 3 },
    { p: [[250, -9], [302, 0], [250, 9]], m: 'al', s: 1 },
    { p: [[250, -9], [302, 0], [250, 0]], m: 'al', s: 0 },
  ], det(c) {
    clipP(c, subHull(258, 70), () => {
      F(c, [[-260, -8], [260, -8], [260, -2], [-260, -2]], hexA(FP.cu[1], 0.9));
      let d = ''; for (let x = -200; x <= 220; x += 40) d += `M${x} -70Q${x + 8} 0 ${x} 70`; seam(c, d, 0.4, 0.8);
      // tôles décalées : coutures horizontales interrompues, rangées de rivets
      d = ''; for (let x = -240; x <= 240; x += 40) { const k = ((x / 40) & 1) ? 20 : 0; d += `M${x} -18L${x + 40} -18M${x + k} 22L${x + k + 40} 22M${x + 20 - k} 44L${x + 60 - k} 44`; } seam(c, d, 0.25, 0.6);
      dots(c, Array.from({ length: 24 }, (_, i) => [-230 + i * 20, 12]), 0.9);
      dots(c, Array.from({ length: 22 }, (_, i) => [-210 + i * 20, 52]), 0.9);
      // ventre : bande sombre et carénage de quille
      F(c, [[-240, 58], [240, 58], [240, 70], [-240, 70]], 'rgba(7,8,10,.16)');
    });
    for (let i = 0; i < 9; i++) win(c, -156 + i * 34, -32, 12, 8);
    win(c, -34, -94, 96, 10);
    for (const x of [-30, 0, 30, 60]) F(c, [[x - 0.8, -94], [x + 0.8, -94], [x + 0.8, -84], [x - 0.8, -84]], FP.fe[4]);
    seam(c, 'M-52 -80L86 -80', 0.35); for (const x of [-40, -10, 20, 50, 76]) F(c, [[x, -78], [x + 6, -78], [x + 6, -76.6], [x, -76.6]], FP.cu[3]);
    win(c, 146, -70, 22, 5);
    // rambarde du pont (montants droits, main courante)
    c.strokeStyle = 'rgba(30,40,40,.8)'; c.lineWidth = Math.max(0.8, px(0.6)); c.beginPath();
    for (let x = -116; x <= 190; x += 12) { if (x > -66 && x < 92) continue; const y = subTop(258, 70, x); c.moveTo(x, y); c.lineTo(x, y - 7); }
    c.moveTo(-116, subTop(258, 70, -116) - 7); for (let x = -116; x <= -66; x += 10) c.lineTo(x, subTop(258, 70, x) - 7);
    c.moveTo(92, subTop(258, 70, 92) - 7); for (let x = 92; x <= 130; x += 10) c.lineTo(x, subTop(258, 70, x) - 7); c.stroke();
    // barres de plongée à l'étrave et à la poupe, vues par la tranche
    for (const [x, l] of [[176, 54], [-200, 44]]) {
      const y = 14, pl = [[x - l * 0.5, y - 2.4], [x + l * 0.5, y - 0.8], [x + l * 0.3, y + 4.4], [x - l * 0.5, y + 3.2]];
      c.strokeStyle = OUT; c.lineWidth = Math.max(1, px(0.9)); fpoly(c, pl); c.stroke(); c.fillStyle = FP.gm[1]; c.fill();
      F(c, [[x - l * 0.5, y - 2.4], [x + l * 0.5, y - 0.8], [x + l * 0.4, y + 0.8], [x - l * 0.5, y]], FP.gm[0]);
    }
    // quilles : patins striés
    for (const x of [-156, -52, 52, 156]) seam(c, `M${x - 8} 62L${x + 8} 62M${x - 6} 66L${x + 6} 66`, 0.5);
    hiLine(c, 'M-130 -66L130 -66', 0.4, 1.2); hiLine(c, 'M-44 -102L60 -102', 0.35, 0.8);
    dots(c, Array.from({ length: 12 }, (_, i) => [-190 + i * 36, -48 + (i % 2) * 4]), 1.6);
    dots(c, [[-40, -70], [0, -70], [40, -70], [76, -70]], 1.4);
    fpropS(c, -270, 0, 52);
  } }));

  /* ---------------- 04 · SOMME 1917 : avions de toile et dirigeables en Facettes (profil, nez à droite) ----------------
     Aucun feu sur les enveloppes (évite l'œil de cétacé), aucune cocarde ronde : bandes droites. */
  const strut = (c, d, w = 1.4, a = 0.85) => { c.strokeStyle = `rgba(30,26,20,${a})`; c.lineWidth = Math.max(w, px(0.8)); c.stroke(Art.path(d)); };
  const octo = (x, y, r) => Array.from({ length: 8 }, (_, i) => [x + Math.cos(i * TAU / 8 + 0.39) * r, y + Math.sin(i * TAU / 8 + 0.39) * r]);
  function biplaneParts(o) {
    const m = o.m, w = o.w || m, P = [
      { p: [[-64, -4], [-60, -24], [-50, -23], [-46, -6]], m, s: 1 },
      { p: [[-60, -24], [-50, -23], [-50, -20], [-60, -21]], m, s: 0 },
      { p: [[-66, -3], [-46, -3], [-46, 2], [-66, 2]], m, s: 2 },
    ];
    if (!o.mono) P.push({ p: [[-8, 7], [36, 7], [36, 12], [-8, 12]], m: w, s: 2 });
    P.push(
      { p: [[-62, -5], [-40, -8], [10, -11], [40, -10], [50, -8], [50, 9], [36, 10], [0, 8], [-40, 3], [-62, 0]], m, s: 1 },
      { p: [[-62, -5], [-40, -8], [10, -11], [40, -10], [50, -8], [40, -5], [10, -6], [-40, -4]], m, s: 0 },
      { p: [[50, 4], [50, 9], [36, 10], [0, 8], [-40, 3], [-62, 0], [-40, 0], [0, 4], [36, 5]], m, s: 3 },
      { p: [[40, -10], [52, -10], [53, 9], [40, 9]], m: 'al', s: 2 },
      { p: [[40, -10], [52, -10], [52, -5], [40, -5]], m: 'al', s: 1 },
      { p: octo(14, 23, 7), m: 'dark', s: 1 },
    );
    if (o.mono) P.push({ p: [[-12, -4], [34, -4], [34, 1], [-12, 1]], m: w, s: 1 });
    else P.push({ p: [[-14, -27], [38, -27], [38, -21], [-14, -21]], m: w, s: 1 }, { p: [[-14, -27], [38, -27], [38, -25], [-14, -25]], m: w, s: 0 });
    return P;
  }
  function biplaneDet(c, o) {
    strut(c, 'M14 9L8 22M26 9L20 22', 1.6);
    if (o.mono) strut(c, 'M10 -11L0 -24M10 -11L22 -24M0 -24L22 -24', 1, 0.6);
    else strut(c, 'M-4 -21L-2 7M30 -21L32 7M8 -21L12 -10M18 -21L20 -11', 1.6);
    F(c, [[-4, -13], [12, -13], [12, -9.5], [-4, -9.5]], FP.dark[1]);
    if (o.two) { F(c, [[-26, -11], [-14, -11], [-14, -8], [-26, -8]], FP.dark[1]); F(c, [[-26, -17], [-12, -17], [-12, -14.5], [-26, -14.5]], FP.gm[2]); }
    F(c, [[12, -11], [16, -17], [17.5, -17], [17, -11]], hexA(FP.glass[0], 0.85));
    F(c, [[-30, -8.6], [-22, -9.2], [-22, 4.6], [-30, 4]], hexA(FP.rd[o.m === 'rd' ? 4 : 1], 0.85));
    seam(c, 'M-40 -8L-40 3M-10 -10L-10 8M24 -11L24 9', 0.35);
    // roue : flasque de toile couvrant les rayons (aucun point clair au centre)
    F(c, octo(14, 23, 4.9), FP[o.m][2]); F(c, [[10.6, 19.6], [17.4, 19.6], [14, 23]], FP[o.m][1]); seam(c, 'M10.6 19.6L17.4 26.4', 0.4);
    // haubans croisés, mitrailleuse de capot, échappements
    if (!o.mono) strut(c, 'M-4 -21L32 7M30 -21L-2 7', 0.6, 0.45);
    F(c, [[16, -15.4], [36, -15.4], [36, -13.6], [16, -13.6]], FP.dark[1]); F(c, [[16, -16.6], [24, -16.6], [24, -13.6], [16, -13.6]], FP.gm[2]);
    for (const x of [30, 34.5, 39]) F(c, [[x, 6], [x + 2.6, 6], [x + 2, 11], [x - 0.4, 11]], FP.dark[1]);
    clipP(c, [[-62, -5], [-40, -8], [10, -11], [40, -10], [50, -8], [50, 9], [36, 10], [0, 8], [-40, 3], [-62, 0]], () => F(c, [[0, 4], [42, 4], [42, 10], [0, 10]], 'rgba(20,16,12,.28)'));
    seam(c, 'M-56 -3L36 -7', 0.22);
    dots(c, [[44, -2], [44, 4]], 0.8);
    fpropS(c, 56, 0, 25);
  }
  const biplane = (name, box, o) => facS(D[name] = Object.assign({ orient: 'side', down: false, sh: 'halo' }, box, {
    parts: biplaneParts(o).map(p => ({ ...p, p: p.p.map(([x, y]) => [x * (o.k || 1), y * (o.k || 1)]) })),
    det(c) { c.save(); c.scale(o.k || 1, o.k || 1); biplaneDet(c, o); c.restore(); },
  }));
  biplane('w4a', { wear: 401, w: 132, h: 72, cy: -2 }, { m: 'fa', w: 'fa' });
  biplane('w4b', { wear: 409, w: 146, h: 80, cy: -2 }, { m: 'ol', w: 'ol', k: 1.1, two: true });
  biplane('w4d', { wear: 419, w: 128, h: 66, cy: 2 }, { m: 'rd', w: 'fa', mono: true });

  // dirigeable rigide : enveloppe de toile à facettes, gouvernes à bord de fuite droit, nacelles
  const zepHull = (L, H) => [[-L, 0], [-0.94 * L, -0.38 * H], [-0.6 * L, -0.86 * H], [0, -H], [0.5 * L, -0.94 * H], [0.86 * L, -0.6 * H], [L, 0], [0.86 * L, 0.6 * H], [0.5 * L, 0.94 * H], [0, H], [-0.6 * L, 0.86 * H], [-0.94 * L, 0.38 * H]];
  function zepParts(L, H, gond) {
    const P = [];
    for (const s of [-1, 1]) P.push({ p: [[-0.68 * L, s * 0.6 * H], [-0.88 * L, s * 1.22 * H], [-1.0 * L, s * 1.22 * H], [-1.0 * L, s * 0.3 * H]], m: 'fa', s: s < 0 ? 1 : 2 });
    for (const [x, w] of gond) P.push({ p: [[x - w / 2, H + 5], [x + w / 2 - w * 0.1, H + 5], [x + w / 2, H + 5 + w * 0.15], [x + w / 2 - w * 0.1, H + 5 + w * 0.3], [x - w / 2, H + 5 + w * 0.3]], m: 'ol', s: 1 });
    P.push(
      { p: zepHull(L, H), m: 'fa', s: 2 },
      { p: [[-0.94 * L, -0.38 * H], [-0.6 * L, -0.86 * H], [0, -H], [0.5 * L, -0.94 * H], [0.86 * L, -0.6 * H], [0.6 * L, -0.5 * H], [0, -0.55 * H], [-0.7 * L, -0.42 * H]], m: 'fa', s: 0 },
      { p: [[-0.94 * L, 0.38 * H], [-0.6 * L, 0.86 * H], [0, H], [0.5 * L, 0.94 * H], [0.86 * L, 0.6 * H], [0.6 * L, 0.5 * H], [0, 0.52 * H], [-0.7 * L, 0.4 * H]], m: 'fa', s: 3 },
      { p: [[0.86 * L, -0.6 * H], [L, 0], [0.86 * L, 0.6 * H], [0.78 * L, 0]], m: 'fa', s: 1 },
    );
    return P;
  }
  function zepDet(c, L, H, gond) {
    clipP(c, zepHull(L, H), () => {
      let d = ''; for (let i = 1; i < 10; i++) { const x = -L + i * L / 5; d += `M${x} ${-H}Q${x + 3} 0 ${x} ${H}`; } seam(c, d, 0.28);
      F(c, [[-L * 0.2, -H], [-L * 0.1, -H], [-L * 0.1, H], [-L * 0.2, H]], hexA(FP.rd[1], 0.55));
    });
    hiLine(c, `M${-0.5 * L} ${-0.88 * H}L${0.45 * L} ${-0.9 * H}`, 0.45, 1);
    for (const [x, w] of gond) {
      strut(c, `M${x - w * 0.3} ${H * 0.9}L${x - w * 0.2} ${H + 5}M${x + w * 0.3} ${H * 0.9}L${x + w * 0.2} ${H + 5}`, 1.2, 0.8);
      for (let i = 0; i < 3; i++) F(c, [[x - w * 0.36 + i * w * 0.22, H + 5 + w * 0.08], [x - w * 0.22 + i * w * 0.22, H + 5 + w * 0.08], [x - w * 0.22 + i * w * 0.22, H + 5 + w * 0.15], [x - w * 0.36 + i * w * 0.22, H + 5 + w * 0.15]], FP.dark[1]);
      fpropS(c, x - w / 2 - 3, H + 5 + w * 0.15, w * 0.3);
    }
  }
  facS(D.w4c = { wear: 421, w: 226, h: 80, cy: 6, orient: 'side', down: false, sh: 'halo', parts: zepParts(108, 25, [[30, 30], [-50, 22]]), det(c) { zepDet(c, 108, 25, [[30, 30], [-50, 22]]); } });

  // ballon sphérique d'observation : fuseaux de toile, filet, nacelle d'osier
  D.w4e = { w: 120, h: 132, cy: 10, orient: 'none', down: false, sh: 'halo', facet: true, draw(c) {
    const r = 40, cy0 = -14, n = 16, ring = Array.from({ length: n }, (_, i) => [Math.cos(i / n * TAU) * r, cy0 + Math.sin(i / n * TAU) * r]);
    strut(c, 'M-10 22L-6 44M10 22L6 44M-4 22L-2 44M4 22L2 44', 1, 0.8); strut(c, 'M0 56L0 68', 1, 0.7);
    facetsS(c, [
      { p: [[-8, 18], [8, 18], [5, 26], [-5, 26]], m: 'fa', s: 3 },
      { p: ring, m: 'fa', s: 2 },
      { p: [[-8, 44], [8, 44], [7, 56], [-7, 56]], m: 'wd', s: 2 },
      { p: [[-8, 44], [8, 44], [8, 47], [-8, 47]], m: 'wd', s: 1 },
      { p: [[-4, cy0 - r - 4], [4, cy0 - r - 4], [4, cy0 - r + 2], [-4, cy0 - r + 2]], m: 'br', s: 1 },
    ]);
    clipP(c, ring, () => {
      const cols = [0, 1, 1, 2, 2, 3, 4]; for (let i = 0; i < cols.length; i++) { const x0 = -r + i * 2 * r / cols.length, x1 = x0 + 2 * r / cols.length; F(c, [[x0, cy0 - r], [x1, cy0 - r], [x1, cy0 + r], [x0, cy0 + r]], hexA(FP.fa[cols[i]], 0.9)); }
      F(c, [[-r, cy0 + r * 0.5], [r, cy0 + r * 0.5], [r, cy0 + r], [-r, cy0 + r]], 'rgba(40,34,26,.18)');
      let d = ''; for (const k of [-0.75, -0.45, -0.15, 0.15, 0.45, 0.75]) d += `M${k * r * 0.35} ${cy0 - r}Q${k * r * 1.5} ${cy0} ${k * r * 0.35} ${cy0 + r}`; seam(c, d, 0.35);
      seam(c, `M${-r} ${cy0 + r * 0.25}Q0 ${cy0 + r * 0.45} ${r} ${cy0 + r * 0.25}`, 0.3);
      F(c, [[-r, cy0 - 3], [r, cy0 - 3], [r, cy0 + 1], [-r, cy0 + 1]], hexA(FP.rd[1], 0.55));
    });
    hiLine(c, `M${-r * 0.7} ${cy0 - r * 0.5}Q${-r * 0.55} ${cy0 - r * 0.85} ${-r * 0.15} ${cy0 - r * 0.96}`, 0.6, 1.2);
    F(c, [[-10, 42], [10, 42], [10, 44.5], [-10, 44.5]], FP.br[2]);
    seam(c, 'M-7 50L7 50', 0.4);
  } };

  // nacelle d'arme suspendue sous le dirigeable géant
  facS(D.w4n = { wear: 431, w: 80, h: 64, cy: 8, orient: 'none', down: false, sh: 'halo', parts: [
    { p: rotP([[-2.4, 0], [2.4, 0], [2.4, 22], [-2.4, 22]], 0.5, 14, 8), m: 'gm', s: 1 },
    { p: [[-32, -12], [26, -12], [34, 0], [24, 12], [-26, 12]], m: 'ol', s: 1 },
    { p: [[-32, -12], [26, -12], [29, -7], [-31, -7]], m: 'ol', s: 0 },
    { p: [[34, 0], [24, 12], [-26, 12], [-28, 7], [24, 7]], m: 'ol', s: 3 },
  ], det(c) {
    strut(c, 'M-18 -24L-14 -12M18 -24L14 -12M0 -24L0 -12', 1.6);
    for (const x of [-20, -2, 16]) F(c, [[x - 5, -5], [x + 5, -5], [x + 5, 1], [x - 5, 1]], FP.dark[1]);
    seam(c, 'M-10 -12L-10 12M10 -12L10 12', 0.35);
    dots(c, [[-26, 4], [26, 4]], 0.9);
    fpropS(c, -35, 0, 13);
  } });

  // dirigeable géant : nacelle de commandement, nacelles moteur latérales, ancrages des nacelles d'arme,
  // plate-forme de tir dorsale, gouvernes articulées ; occl : les empennages ne se voient plus à travers l'enveloppe
  const ZB = [[-146, 0], [-42, 0], [62, 0], [160, 54]];
  facS(D.w4boss = { wear: 441, occl: true, w: 540, h: 160, cy: 8, orient: 'none', down: false, sh: 'halo', parts: [
    ...[-146, -42, 62].map(x => ({ p: [[x - 20, 54], [x + 20, 54], [x + 18, 61], [x - 18, 61]], m: 'gm', s: 2 })),
    { p: [[158, -40], [184, -36], [184, -45], [158, -49]], m: 'gm', s: 1 },
    ...zepParts(262, 52, ZB.slice(3)),
    { p: [[251, -5], [264, -1.5], [264, 1.5], [251, 5]], m: 'br', s: 2 },
  ], det(c) {
    const L = 262, H = 52;
    zepDet(c, L, H, ZB.slice(3));
    clipP(c, zepHull(L, H), () => {
      // toile : panneaux alternés entre les couples, poutres longitudinales, couloir de quille
      for (let i = 0; i < 10; i += 2) { const x0 = -L + i * L / 5; F(c, [[x0, -H], [x0 + L / 5, -H], [x0 + L / 5, H], [x0, H]], 'rgba(40,34,26,.07)'); }
      seam(c, `M${-L} -36L${L} -36M${-L} -18L${L} -18M${-L} 20L${L} 20M${-L} 36L${L} 36`, 0.2, 0.8);
      F(c, [[-200, 43], [210, 43], [210, 52], [-200, 52]], 'rgba(30,26,20,.2)'); seam(c, 'M-200 43L210 43', 0.35);
      for (let x = -190; x < 200; x += 26) F(c, [[x, 46], [x + 8, 46], [x + 8, 48], [x, 48]], 'rgba(20,16,12,.45)');
      // trappes de soupapes de gaz sur le dos
      for (let x = -170; x < 140; x += 52.4) F(c, [[x, -51], [x + 10, -51], [x + 10, -48], [x, -48]], FP.fa[3]);
      dots(c, Array.from({ length: 14 }, (_, i) => [-220 + i * 34, -30]), 1.2);
    });
    // gouvernes articulées (bord de fuite plus sombre, nervures)
    for (const s of [-1, 1]) {
      const g = [[-L, s * 0.36 * H], [-0.95 * L, s * 0.5 * H], [-0.95 * L, s * 1.22 * H], [-L, s * 1.22 * H]];
      F(c, g, FP.fa[3]); seam(c, `M${-0.95 * L} ${s * 0.5 * H}L${-0.95 * L} ${s * 1.22 * H}`, 0.55);
      seam(c, `M${-0.9 * L} ${s * 0.66 * H}L${-0.9 * L} ${s * 1.2 * H}M${-0.82 * L} ${s * 0.92 * H}L${-0.82 * L} ${s * 1.2 * H}`, 0.3);
    }
    // nacelles moteur latérales, accrochées au flanc
    for (const x of [-94, 10]) {
      strut(c, `M${x - 10} 22L${x - 8} 29M${x + 8} 22L${x + 6} 29`, 1.4);
      const n = [[x - 16, 29], [x + 13, 29], [x + 18, 34], [x + 13, 40], [x - 16, 40]];
      c.strokeStyle = OUT; c.lineWidth = Math.max(1.2, px(1)); fpoly(c, n); c.stroke(); c.fillStyle = FP.ol[1]; c.fill();
      F(c, [[x - 16, 29], [x + 13, 29], [x + 15.4, 31.4], [x - 16, 31.4]], FP.ol[0]); F(c, [[x - 16, 37], [x + 15.4, 37], [x + 13, 40], [x - 16, 40]], FP.ol[3]);
      F(c, [[x - 12, 33], [x + 1, 33], [x + 1, 35], [x - 12, 35]], FP.dark[1]); // une seule fente (deux hublots côte à côte feraient des yeux)
      seam(c, `M${x + 4} 29L${x + 4} 40`, 0.4);
      fpropS(c, x - 19, 34.5, 10);
    }
    // plate-forme de tir dorsale : rambarde et mitrailleuse
    strut(c, 'M160 -49L160 -55M168 -48L168 -54M176 -47L176 -53M160 -55L184 -51', 0.9, 0.7);
    F(c, [[170, -53], [190, -50.4], [190, -48.8], [170, -51.4]], FP.dark[1]);
    for (const x of [-146, -42, 62]) strut(c, `M${x - 14} 48L${x - 10} 55M${x + 14} 48L${x + 10} 55`, 1.8);
    hiLine(c, 'M-140 -46L120 -47', 0.3, 0.8);
  } });

  /* ---------------- 05 · AÉROPOSTALE 1930 : avions et hydravions en Facettes (dessus, nez en haut) ----------------
     Aucun feu sur les fuselages, aucun rond par paire : mâts et marques en rectangles. */
  const RD = FP.rd;
  const ribs = (c, xs, y0, y1, a = 0.3) => seam(c, xs.map(x => `M${x} ${y0}L${x} ${y1}`).join(''), a);

  // pot d'échappement court (dessus) et traînée de suie vers l'arrière
  const exh = (c, x, y, len, w = 2.4) => {
    const g = c.createLinearGradient(0, y, 0, y + len); g.addColorStop(0, 'rgba(22,18,14,.42)'); g.addColorStop(1, 'rgba(22,18,14,0)');
    c.fillStyle = g; c.fillRect(x - w * 0.5, y, w, len);
    F(c, [[x - 1.1, y - 2.4], [x + 1.1, y - 2.4], [x + 1.1, y + 1.2], [x - 1.1, y + 1.2]], FP.dark[1]);
  };
  // têtes de cylindres d'un moteur en étoile qui dépassent du capot (vues de dessus : blocs à ailettes)
  const cyl = (c, x, y, n, gap, s = 1) => { for (let i = 0; i < n; i++) { const yy = y + i * gap; F(c, [[x, yy], [x + 2.6 * s, yy], [x + 2.6 * s, yy + 2], [x, yy + 2]], FP.gm[2]); seam(c, `M${x + 0.9 * s} ${yy}L${x + 0.9 * s} ${yy + 2}`, 0.5, 0.4); } };
  // aileron : découpe au bord de fuite
  const ail = (c, x0, y0, x1, y1, d = 4) => seam(c, `M${x0} ${y0}L${x1} ${y1}M${x0} ${y0}L${x0} ${y0 + d}M${x1} ${y1}L${x1} ${y1 + d}`, 0.42);

  // monoplan postal à aile haute : aile ivoire effilée, saumons rouges, capot à cylindres, fuselage alu
  efac('w5a', { wear: 501, w: 118, h: 96, cy: 0, parts: [
    { p: [[0, 30], [13, 31], [21, 34], [22, 38], [17, 42], [0, 42]], m: 'iv', s: 1 },
    { p: [[0, -40], [6, -39], [9, -30], [10, -12], [8, 20], [4, 38], [2, 44], [0, 44]], m: 'al', s: 0 },
    { p: [[6, -34], [9, -30], [10, -12], [8, 20], [4, 38], [6, -12]], m: 'al', s: 2 },
    { p: [[0, -22], [50, -20], [56, -17], [58, -11], [56, -4], [44, 4], [0, 8]], m: 'iv', s: 0 },
    { p: [[0, -3], [57.4, -6], [56, -4], [44, 4], [0, 8]], m: 'iv', s: 2 },
    { p: [[45, -20.2], [50, -20], [56, -17], [58, -11], [56, -4], [45, 3.4]], m: 'rd', s: 1 },
    { p: [[0, -47], [8, -46], [10, -40], [9, -35], [0, -34]], m: 'gm', s: 1 },
  ], det(c) {
    F(c, [[-3.4, 12], [3.4, 12], [3.4, 19], [-3.4, 19]], FP.dark[1]);
    F(c, [[-2.6, 9.4], [2.6, 9.4], [3.2, 12], [-3.2, 12]], FP.glass[1]);
    F(c, [[-1.1, 29], [1.1, 29], [1.1, 45], [-1.1, 45]], FP.gm[2]);
    band(c, 7.4, 23, 3.2, RD[1]);
    sym(c, () => {
      ribs(c, [14, 26, 38], -21, 7); ail(c, 22, 1.6, 44, -0.2); seam(c, 'M3 37L19 37.6', 0.4);
      cyl(c, 9, -44, 3, 3); exh(c, 9.4, -32, 16);
      dots(c, [[6, -38], [7, -28], [8, -8], [7, 6]], 0.6);
    });
    seam(c, 'M-9 -41L9 -41', 0.45);
    hiLine(c, 'M-2 -38L-5 -16', 0.55, 0.8); hiLine(c, 'M-12 -20.5L-44 -19.6', 0.45, 0.7);
    fprop(c, 0, -49, 26);
  } });

  // racer trapu : fût bombé derrière un gros capot, ailes basses courtes, verrière en goutte (n'est plus le w5a réduit)
  efac('w5m', { w: 70, h: 58, cy: 0, parts: [
    { p: [[0, 17], [10, 18], [13, 21], [12, 25], [0, 25]], m: 'rd', s: 1 },
    { p: [[0, -24], [8, -23], [10, -14], [9.4, 2], [6, 16], [2.4, 26], [0, 26]], m: 'rd', s: 0 },
    { p: [[6, -20], [10, -14], [9.4, 2], [6, 16], [6, 0]], m: 'rd', s: 2 },
    { p: [[0, -8], [26, -6], [31, -3.4], [32, 0], [29, 4], [0, 8]], m: 'iv', s: 0 },
    { p: [[0, 1.4], [31.8, -0.4], [29, 4], [0, 8]], m: 'iv', s: 2 },
    { p: [[24, -6.2], [26, -6], [31, -3.4], [32, 0], [29, 4], [24, 4.8]], m: 'rd', s: 1 },
    { p: [[0, -28], [9, -27], [10.6, -21], [9.6, -17], [0, -16]], m: 'gm', s: 1 },
    { p: [[0, 6], [2.6, 8], [2.8, 13], [0, 15]], m: 'glass', s: 0 },
  ], det(c) {
    F(c, [[-1, 15], [1, 15], [1, 27], [-1, 27]], FP.gm[2]);
    F(c, [[-1.2, -15], [1.2, -15], [1.2, 5], [-1.2, 5]], FP.iv[1]);
    sym(c, () => { cyl(c, 10, -26, 3, 3); exh(c, 9.6, -15, 10, 2); seam(c, 'M14 -6.6L14 5.6', 0.35); ail(c, 14, 3, 24, 2.2, 3); });
    seam(c, 'M-10 -23L10 -23', 0.45);
    hiLine(c, 'M-2 -21L-4 -6', 0.55, 0.7);
    fprop(c, 0, -29.5, 16);
  } });

  // biplan postal : fuselage olive, plan haut à saumons biseautés, plan bas visible, haubans, mitrailleuse arrière
  efac('w5b', { wear: 509, w: 128, h: 104, cy: 0, parts: [
    { p: [[0, -12], [50, -10], [55, -7], [57, 3], [52, 8], [0, 8]], m: 'fa', s: 2 },
    { p: [[0, 33], [14, 34], [22, 37], [23, 42], [17, 46], [0, 46]], m: 'fa', s: 1 },
    { p: [[0, -40], [6, -39], [10, -24], [11, -8], [8, 24], [4, 40], [2, 46], [0, 46]], m: 'ol', s: 0 },
    { p: [[6, -34], [10, -24], [11, -8], [8, 24], [4, 40], [6, -8]], m: 'ol', s: 2 },
    { p: [[0, -29], [55, -27], [61, -24], [63, -16], [61, -8], [54, -4], [0, -4]], m: 'fa', s: 0 },
    { p: [[0, -13], [62.4, -13], [61, -8], [54, -4], [0, -4]], m: 'fa', s: 2 },
    { p: [[0, -44], [9, -43], [10.6, -37], [9.4, -34], [0, -33]], m: 'gm', s: 1 },
  ], det(c) {
    F(c, [[-5, 2], [5, 2], [5, 10], [-5, 10]], FP.dark[1]);
    F(c, [[-4, 14], [4, 14], [4, 21], [-4, 21]], FP.dark[1]);
    F(c, [[-6, -29], [6, -29], [6, -4], [-6, -4]], hexA(RD[1], 0.6));
    F(c, [[-1.1, 32], [1.1, 32], [1.1, 47], [-1.1, 47]], FP.ol[3]);
    strut(c, 'M2 17L-9 27', 1.3, 0.95); F(c, [[-10.4, 26], [-7.6, 26], [-7.6, 28.6], [-10.4, 28.6]], FP.gm[2]);
    sym(c, () => {
      ribs(c, [20, 34, 48], -28, -4); ail(c, 30, -6.2, 54, -4.6);
      strut(c, 'M44 -4L52 4M52 -4L44 4', 0.7, 0.75);
      F(c, [[39, -6], [42, -6], [42, -2], [39, -2]], FP.wd[3]);
      seam(c, 'M3 40L20 41', 0.4);
      cyl(c, 10, -42, 2, 3.4); exh(c, 10.6, -2, 18, 2.6);
    });
    seam(c, 'M-9.6 -38L9.6 -38', 0.45);
    hiLine(c, 'M-20 -28L-54 -26.4', 0.5, 0.8);
    fprop(c, 0, -46, 26);
  } });

  // trimoteur à tôle ondulée : un moteur dans le nez, deux en nacelles, aile effilée, hublots
  efac('w5c', { wear: 517, w: 196, h: 140, cy: 0, parts: [
    { p: [[0, 50], [26, 51], [36, 55], [37, 61], [30, 65], [0, 66]], m: 'al', s: 1 },
    { p: [[0, -16], [84, -8], [92, -5], [96, 1], [93, 8], [80, 13], [0, 24]], m: 'al', s: 0 },
    { p: [[0, 7], [95.4, 4], [93, 8], [80, 13], [0, 24]], m: 'al', s: 2 },
    { p: [[78, -7.4], [84, -8], [92, -5], [96, 1], [93, 8], [80, 13], [78, 13.4]], m: 'rd', s: 1 },
    { p: [[33, -26], [43, -26], [45, -16], [45, 6], [41, 16], [35, 16], [31, 6], [31, -16]], m: 'al', s: 1 },
    { p: [[32, -32], [44, -32], [45.4, -26], [44, -23], [32, -23], [30.6, -26]], m: 'gm', s: 1 },
    { p: [[0, -62], [8, -58], [13, -40], [16, -10], [13, 30], [6, 60], [0, 66]], m: 'al', s: 0 },
    { p: [[8, -54], [13, -40], [16, -10], [13, 30], [6, 60], [9, -10]], m: 'al', s: 2 },
    { p: [[0, -50], [5, -46], [6, -38], [0, -36]], m: 'glass', s: 0 },
    { p: [[0, -68], [8, -66.6], [10, -62], [8.6, -58], [0, -57]], m: 'gm', s: 1 },
  ], det(c) {
    F(c, [[-1.2, 48], [1.2, 48], [1.2, 67], [-1.2, 67]], FP.gm[2]);
    band(c, 12.6, 30, 3, RD[1]);
    sym(c, () => {
      seam(c, 'M18 -12L82 -4M18 -6L88 0M18 0L90 4M18 6L86 8M18 12L80 12M18 18L60 18', 0.28);
      seam(c, 'M3 -30L3 56M8 -30L8 50', 0.25);
      seam(c, 'M10 56L34 58', 0.4); ail(c, 50, 15.4, 78, 13.4, 4.4);
      for (const y of [-30, -23, 20, 26, 38]) F(c, [[11.6, y], [13.6, y], [13.6, y + 3.6], [11.6, y + 3.6]], FP.dark[1]);
      cyl(c, 45, -31, 2, 3.4); cyl(c, 10, -66, 2, 3.4);
      exh(c, 44, -20, 30, 3); exh(c, 32, -20, 30, 3);
      F(c, [[36, -2], [40, -2], [40, 4], [36, 4]], FP.dark[2]);
    });
    seam(c, 'M-31 -27L-45 -27M31 -27L45 -27', 0.4);
    hiLine(c, 'M-2 -60L-8 -40', 0.55, 0.8); hiLine(c, 'M-20 -14L-80 -7', 0.4, 0.7);
    fprop(c, 0, -70, 22); sym(c, () => fprop(c, 38, -34, 20));
  } });

  // hydravion de course : fuselage rouge effilé, radiateurs de cuivre sur les ailes, deux longs flotteurs redanés
  efac('w5d', { wear: 523, w: 92, h: 136, cy: 0, parts: [
    { p: [[13, -48], [17, -51], [21, -48], [22, -24], [21.4, 6], [20, 22], [17, 34], [14, 22], [12.6, 6], [12, -24]], m: 'al', s: 1 },
    { p: [[0, 40], [14, 41], [19, 44], [20, 49], [15, 53], [0, 54]], m: 'rd', s: 1 },
    { p: [[0, -9], [34, -6.4], [40, -3.6], [42, 1], [39, 6.4], [0, 12]], m: 'rd', s: 0 },
    { p: [[0, 3], [41.6, 1.4], [39, 6.4], [0, 12]], m: 'rd', s: 2 },
    { p: [[0, -62], [5, -58], [8, -40], [9, -10], [7, 30], [3, 54], [0, 60]], m: 'rd', s: 0 },
    { p: [[5, -54], [8, -40], [9, -10], [7, 30], [3, 54], [5, -10]], m: 'rd', s: 2 },
    { p: [[0, -20], [3, -16], [3.6, -7], [0, -5]], m: 'glass', s: 0 },
    { p: [[0, -66], [5.4, -64.6], [7, -58], [0, -56]], m: 'al', s: 1 },
  ], det(c) {
    F(c, [[-1.1, -50], [1.1, -50], [1.1, -22], [-1.1, -22]], hexA(FP.iv[0], 0.8));
    F(c, [[-1.1, -4], [1.1, -4], [1.1, 40], [-1.1, 40]], hexA(FP.iv[0], 0.8));
    F(c, [[-1, 38], [1, 38], [1, 61], [-1, 61]], FP.rd[4]);
    sym(c, () => {
      strut(c, 'M17 -4L8 -2M17 8L8 7M17 -4L8 7', 1.1);
      seam(c, 'M17 -44L17 24', 0.3); seam(c, 'M12.4 2L21.6 2', 0.5);
      F(c, [[13.2, -48.6], [20.8, -48.6], [21.4, -42], [12.6, -42]], FP.gm[1]);
      F(c, [[11, -5.6], [30, -4.6], [30, 1.4], [11, 1.8]], FP.cu[2]);
      seam(c, 'M11 -4L30 -3.2M11 -2.4L30 -1.6M11 -0.8L30 0', 0.4, 0.4);
      ail(c, 26, 4.6, 38, 2.6, 3);
      exh(c, 8, -50, 22, 2);
    });
    hiLine(c, 'M-2 -58L-5 -40', 0.5, 0.8);
    fprop(c, 0, -67, 18);
  } });

  // grand hydravion : coque ivoire à redan, quatre moteurs en tandem, aile effilée, flotteurs de bout d'aile
  efac('w5e', { wear: 529, w: 204, h: 136, cy: 0, parts: [
    { p: [[0, 51], [24, 52], [33, 55], [34, 61], [28, 65], [0, 66]], m: 'al', s: 1 },
    { p: [[0, -64], [8, -60], [14, -40], [16, -10], [14, 30], [6, 60], [0, 64]], m: 'iv', s: 0 },
    { p: [[8, -56], [14, -40], [16, -10], [14, 30], [6, 60], [10, -10]], m: 'iv', s: 2 },
    { p: [[0, -16], [90, -13], [97, -9], [100, -2], [97, 5], [86, 9], [0, 10]], m: 'al', s: 0 },
    { p: [[0, 0], [99.4, -2.6], [97, 5], [86, 9], [0, 10]], m: 'al', s: 2 },
    { p: [[90, -13], [97, -9], [100, -2], [97, 5], [90, 7.6]], m: 'rd', s: 1 },
    { p: [[83, -10], [89, -10], [91, 0], [89.4, 14], [86, 18], [82.6, 14], [81, 0]], m: 'al', s: 1 },
    ...[30, 62].map(x => ({ p: [[x - 5, -30], [x + 5, -30], [x + 6.5, -20], [x + 6.5, 20], [x + 4, 26], [x - 4, 26], [x - 6.5, 20], [x - 6.5, -20]], m: 'al', s: 1 })),
    ...[30, 62].map(x => ({ p: [[x - 5, -33], [x + 5, -33], [x + 6.4, -29], [x + 5, -25], [x - 5, -25], [x - 6.4, -29]], m: 'gm', s: 1 })),
    { p: [[0, -52], [6, -48], [7, -40], [0, -38]], m: 'glass', s: 0 },
  ], det(c) {
    F(c, [[-1.2, 49], [1.2, 49], [1.2, 66], [-1.2, 66]], FP.gm[2]);
    sym(c, () => {
      ribs(c, [44, 74], -15, 9); ail(c, 70, 9.4, 86, 9, 4);
      for (const x of [30, 62]) { seam(c, `M${x} -22L${x} 22`, 0.3); seam(c, `M${x - 6.5} 12L${x + 6.5} 12`, 0.35); exh(c, x + 6, -22, 26, 2.6); }
      for (const y of [-28, -20, -12, 16, 24, 32, 40]) F(c, [[12.6, y], [14.4, y], [14.4, y + 3.6], [12.6, y + 3.6]], FP.dark[1]);
      seam(c, 'M83 6L89 6', 0.45);
    });
    seam(c, 'M-14.6 14L14.6 14', 0.55);
    band(c, 13.6, 44, 3, RD[1]); band(c, 15.6, -18, 2.4, RD[1]);
    hiLine(c, 'M-2 -60L-10 -40', 0.55, 0.8); hiLine(c, 'M-20 -14.6L-86 -12', 0.4, 0.7);
    sym(c, () => { for (const x of [30, 62]) { fprop(c, x, -35, 18); fprop(c, x, 28, 18); } });
  } });

  // nœud du boss : nacelle moteur en tandem (hélice avant et arrière)
  D.w5n = Object.assign({}, EN, fac({ w: 46, h: 96, cy: 0, orient: 'none', parts: [
    { p: [[0, -40], [5, -40], [9, -30], [9, 30], [5, 40], [0, 40]], m: 'al', s: 0 },
    { p: [[5, -40], [9, -30], [9, 30], [5, 40], [6, 0]], m: 'al', s: 2 },
    { p: [[0, -44], [7, -44], [7, -36], [0, -36]], m: 'gm', s: 1 },
    { p: [[0, 36], [7, 36], [7, 44], [0, 44]], m: 'gm', s: 1 },
  ], det(c) {
    sym(c, () => { for (const y of [-20, -12, -4, 4, 12]) F(c, [[6.5, y], [8.5, y], [8.5, y + 4], [6.5, y + 4]], FP.dark[1]); });
    seam(c, 'M-9 -26L9 -26M-9 26L9 26', 0.35);
    hiLine(c, 'M-3 -34L-3 30', 0.5, 0.8);
    fprop(c, 0, -46, 22); fprop(c, 0, 46, 22);
  } }));

  // paquebot des airs : grand hydravion à coque, aile à six moteurs (nœuds), nageoires de flottaison
  // occl : coque et nageoires ne se voient plus à travers l'aile haute
  D.w5boss = Object.assign({}, EN, fac({ wear: 541, occl: true, w: 340, h: 210, cy: 0, orient: 'none', parts: [
    { p: [[0, 72], [56, 74], [58, 86], [0, 90]], m: 'al', s: 1 },
    { p: [[0, 8], [40, 14], [42, 32], [0, 38]], m: 'al', s: 2 },
    { p: [[0, -102], [10, -98], [22, -80], [24, -40], [24, 40], [16, 80], [6, 98], [0, 100]], m: 'iv', s: 0 },
    { p: [[14, -94], [22, -80], [24, -40], [24, 40], [16, 80], [8, 96], [16, 40], [16, -40]], m: 'iv', s: 2 },
    { p: [[0, -26], [162, -22], [166, -8], [162, 10], [0, 16]], m: 'al', s: 0 },
    { p: [[0, -2], [165, -4], [162, 10], [0, 16]], m: 'al', s: 2 },
    { p: [[150, -22], [162, -22], [166, -8], [162, 10], [150, 11]], m: 'rd', s: 1 },
    { p: [[146, 0], [154, 0], [156, 12], [154, 26], [146, 26], [144, 12]], m: 'al', s: 1 },
    ...[36, 86, 136].map(x => ({ p: [[x - 9, -10], [x + 9, -10], [x + 9, 2], [x - 9, 2]], m: 'gm', s: 2 })),
    { p: [[0, -90], [8, -86], [10, -74], [0, -72]], m: 'glass', s: 0 },
    { p: [[0, 70], [4, 70], [4, 92], [0, 92]], m: 'al', s: 2 },
  ], det(c) {
    sym(c, () => {
      // aile : nervures, longeron, bord d'attaque clair, ailerons et volets découpés
      clipP(c, [[24, -25.5], [162, -22], [166, -8], [162, 10], [24, 15.4]], () => {
        let d = ''; for (let x = 32; x < 160; x += 9) d += `M${x} -26L${x} 16`; seam(c, d, 0.14);
        F(c, [[24, -25.5], [166, -22], [166, -20.6], [24, -24]], 'rgba(255,255,255,.4)');
        F(c, [[24, 8], [166, 6], [166, 16], [24, 16]], 'rgba(30,34,40,.12)');
      });
      ail(c, 104, 8.4, 146, 7.6, 4); ail(c, 48, 9.4, 96, 8.6, 4);
      // mâts-haubans entre aile et nageoire, flotteur de bout d'aile à redan
      strut(c, 'M26 18L36 28M40 16L38 30', 1.2, 0.7);
      seam(c, 'M146 14L156 14M147 20L155 20', 0.45);
      seam(c, 'M24 -6L164 -6M60 -24L60 14M110 -23L110 12', 0.3);
      for (const y of [-72, -60, -48, -36, 22, 34, 46, 58]) F(c, [[18.6, y], [21, y], [21, y + 6], [18.6, y + 6]], FP.dark[1]);
      seam(c, 'M8 76L54 80M10 20L40 24', 0.35);
      // empennage : gouverne de profondeur articulée, nervures
      F(c, [[6, 84], [57, 81], [58, 86], [6, 89.6]], FP.al[3]); seam(c, 'M6 84L57 81M20 74L20 90M36 74.6L36 88.6', 0.4);
      // nageoire : nervures et bord clair
      seam(c, 'M14 14L14 36M28 13L28 34', 0.3);
      dots(c, [[30, -18], [80, -16], [130, -16], [30, 10], [80, 8], [130, 6]], 1);
    });
    band(c, 16, 50, 4, RD[1]); band(c, 21, -50, 2.4, RD[1]);
    seam(c, 'M-22 -60L22 -60M-24 30L24 30', 0.35);
    // coque : redan, quille, écoutille d'amarrage, gouvernail de direction, passerelle dorsale
    seam(c, 'M-20 42L0 36L20 42M-14 -30L14 -30', 0.5);
    F(c, [[-5, -66], [5, -66], [5, -58], [-5, -58]], FP.iv[3]); seam(c, 'M-5 -66L5 -66L5 -58L-5 -58Z', 0.5);
    F(c, [[-1.6, 80], [1.6, 80], [1.6, 92], [-1.6, 92]], FP.al[3]); seam(c, 'M-4 80L4 80', 0.5);
    seam(c, 'M-3 -46L-3 -28M3 -46L3 -28M-3 40L-3 68M3 40L3 68', 0.22);
    hiLine(c, 'M-4 -98L-16 -80L-18 -50', 0.55, 1);
  } }));

  /* ---------------- 06 · ATLANTIQUE 1942 : chasseurs, bombardier, sous-marin, cuirassé en Facettes (dessus) ----------------
     Aucun feu ; cheminée unique allongée et barbettes octogonales (pas de ronds sombres par paire). */
  // canon d'aile ou de nez : tube sombre fin
  const gun = (c, x, y0, y1, w = 0.9) => F(c, [[x - w / 2, y0], [x + w / 2, y0], [x + w / 2, y1], [x - w / 2, y1]], FP.dark[1]);
  // chasseur embarqué : aile à saumons arrondis repliable, trois canons par aile, pipes d'échappement, crosse d'appontage
  efac('w6a', { wear: 601, w: 108, h: 96, cy: 0, parts: [
    { p: [[0, 30], [14, 31], [20, 35], [20, 40], [14, 42], [0, 42]], m: 'nv', s: 1 },
    { p: [[0, -14], [30, -12], [46, -8], [52, -3], [52, 3], [46, 7], [30, 10], [0, 14]], m: 'nv', s: 0 },
    { p: [[0, 2], [52, 0], [52, 3], [46, 7], [30, 10], [0, 14]], m: 'nv', s: 2 },
    { p: [[0, -44], [6, -42], [9, -30], [10, -8], [8, 20], [4, 36], [2, 42], [0, 42]], m: 'nv', s: 0 },
    { p: [[6, -38], [9, -30], [10, -8], [8, 20], [4, 36], [6, -8]], m: 'nv', s: 2 },
    { p: [[0, -14], [4, -11], [5, 4], [0, 8]], m: 'glass', s: 0 },
    { p: [[0, -48], [8, -47], [10, -41], [9.6, -35], [0, -34]], m: 'gm', s: 1 },
  ], det(c) {
    F(c, [[-1, 30], [1, 30], [1, 43], [-1, 43]], FP.nv[3]);
    seam(c, 'M-4.6 -6L4.6 -6M-5 0L5 0', 0.45);
    sym(c, () => {
      F(c, [[46, -8], [52, -3], [52, 3], [46, 7]], FP.gm[2]);
      seam(c, 'M22 -12.4L22 10.6', 0.5); seam(c, 'M10 -2L44 -1', 0.3); ail(c, 30, 6.8, 44, 5.2, 3.4);
      for (const x of [25, 28, 31]) gun(c, x, -18, -11.8);
      for (const y of [-32, -28.6, -25.2]) F(c, [[9.2, y], [11.4, y], [11.4, y + 2], [9.2, y + 2]], FP.dark[1]);
      exh(c, 10.2, -24, 18, 2.4);
      seam(c, 'M3 36L18 37', 0.4); dots(c, [[7, -36], [8, -20], [8, 10]], 0.6);
    });
    strut(c, 'M0 38L0 46', 1, 0.9);
    seam(c, 'M-9.6 -42L9.6 -42', 0.45);
    hiLine(c, 'M-2 -40L-6 -16', 0.5, 0.8); hiLine(c, 'M-12 -13L-44 -8.6', 0.4, 0.7);
    fprop(c, 0, -50, 22);
  } });

  // hydravion de catapulte biplace : deux flotteurs sur mâts, longue verrière, mitrailleuse arrière (n'est plus le w6a réduit)
  efac('w6m', { w: 72, h: 64, cy: 0, parts: [
    { p: [[7.6, -9.57], [8, -24], [10.6, -27], [13.2, -24], [13.6, -9.22]], m: 'al', s: 1 },
    { p: [[7.6, 5.48], [13.6, 5.06], [13.2, 10], [10.6, 15], [8, 10]], m: 'al', s: 2 },
    { p: [[0, 20], [9, 21], [13, 24], [12, 27.4], [0, 28]], m: 'nv', s: 1 },
    { p: [[0, -10], [28, -8.4], [33, -5.4], [34, 0], [29, 4], [0, 6]], m: 'nv', s: 0 },
    { p: [[0, -1], [33.8, -1.6], [29, 4], [0, 6]], m: 'nv', s: 2 },
    { p: [[0, -26], [5, -25], [6.4, -18], [6.6, 0], [4.6, 16], [2, 28], [0, 28]], m: 'nv', s: 0 },
    { p: [[4, -22], [6.4, -18], [6.6, 0], [4.6, 16], [4.4, 0]], m: 'nv', s: 2 },
    { p: [[0, -16], [2.8, -14], [3.2, 6], [0, 8]], m: 'glass', s: 0 },
    { p: [[0, -30], [5.6, -29], [7, -25], [6.4, -21], [0, -20]], m: 'gm', s: 1 },
  ], det(c) {
    F(c, [[-0.8, 20], [0.8, 20], [0.8, 29], [-0.8, 29]], FP.nv[3]);
    seam(c, 'M-3 -9L3 -9M-3.2 -2L3.2 -2', 0.45);
    strut(c, 'M1 8L-3 12', 0.9, 0.9);
    sym(c, () => {
      seam(c, 'M8 -20L13.4 -20', 0.45); ail(c, 18, 4.6, 29, 3.6, 2.6);
      F(c, [[30, -6], [33, -5.4], [34, 0], [30, 2]], FP.gm[2]);
      exh(c, 6.8, -20, 10, 1.6);
    });
    hiLine(c, 'M-1.6 -24L-3.4 -12', 0.5, 0.7);
    fprop(c, 0, -31, 14);
  } });

  // chasseur bipoutre : deux poutres-moteurs à prises d'air, nacelle centrale vitrée à quatre canons, aile effilée
  efac('w6b', { wear: 609, w: 140, h: 104, cy: 0, parts: [
    { p: [[0, 40], [34, 40], [34, 48], [0, 48]], m: 'nv', s: 1 },
    { p: [[0, -12], [56, -9], [66, -6], [69, -1], [66, 3], [0, 8]], m: 'nv', s: 0 },
    { p: [[0, -2], [68.4, -3], [66, 3], [0, 8]], m: 'nv', s: 2 },
    { p: [[37.6, -4], [40, -1], [40, 10], [37.4, 12]], m: 'gm', s: 2 },
    { p: [[28, -42], [36, -42], [38, -30], [37, 40], [35, 52], [29, 52], [27, 40], [26, -30]], m: 'nv', s: 1 },
    { p: [[28, 40], [36, 40], [36, 55], [28, 55]], m: 'gm', s: 1 },
    { p: [[27, -46], [37, -46], [38, -42], [37, -39], [27, -39], [26, -42]], m: 'gm', s: 1 },
    { p: [[0, -38], [6, -34], [9, -20], [9, 8], [6, 22], [0, 24]], m: 'nv', s: 0 },
    { p: [[6, -34], [9, -20], [9, 8], [6, 22], [6, -8]], m: 'nv', s: 2 },
    { p: [[0, -28], [4, -24], [5, -10], [0, -6]], m: 'glass', s: 0 },
  ], det(c) {
    seam(c, 'M-4.4 -18L4.4 -18', 0.45);
    sym(c, () => {
      F(c, [[29, 4], [35, 4], [35, 14], [29, 14]], FP.al[2]); seam(c, 'M29 7L35 7M29 10L35 10', 0.4, 0.4);
      seam(c, 'M32 -30L32 2M32 16L32 38M42 -6L56 -5', 0.3); ail(c, 46, 4.6, 64, 3.4, 3);
      for (const y of [-36, -33, -30]) F(c, [[37.2, y], [39, y], [39, y + 1.8], [37.2, y + 1.8]], FP.dark[1]);
      exh(c, 38, -28, 16, 2.4);
      for (const x of [1.6, 4]) gun(c, x, -45, -36, 1);
      dots(c, [[29, 22], [35, 30]], 0.7);
    });
    hiLine(c, 'M-2 -34L-6 -16', 0.5, 0.8); hiLine(c, 'M-12 -11.6L-54 -9', 0.4, 0.7);
    sym(c, () => fprop(c, 32, -48, 18));
  } });

  // quadrimoteur : aile effilée, nez vitré armé, dérives jumelles, tourelle dorsale carrée, soute
  efac('w6c', { wear: 617, w: 204, h: 136, cy: 0, parts: [
    { p: [[0, 48], [30, 49], [37, 52], [37, 60], [0, 64]], m: 'nv', s: 1 },
    { p: [[35, 44], [39.6, 44], [40.6, 52], [40.6, 64], [35, 64]], m: 'nv', s: 2 },
    { p: [[0, -24], [88, -8], [97, -4], [100, 1], [96, 5], [0, 20]], m: 'nv', s: 0 },
    { p: [[0, 4], [99.6, 0], [96, 5], [0, 20]], m: 'nv', s: 2 },
    { p: [[25, -36], [35, -36], [36, -22], [36, 6], [30, 12], [24, 6], [24, -22]], m: 'nv', s: 1 },
    { p: [[56, -28], [64, -28], [65, -16], [65, 4], [60, 8], [55, 4], [55, -16]], m: 'nv', s: 1 },
    { p: [[24.6, -40], [35.4, -40], [36.4, -37], [35.4, -34], [24.6, -34], [23.6, -37]], m: 'gm', s: 1 },
    { p: [[55.6, -32], [64.4, -32], [65.4, -29], [64.4, -26], [55.6, -26], [54.6, -29]], m: 'gm', s: 1 },
    { p: [[0, -64], [8, -60], [12, -40], [13, 0], [11, 40], [6, 62], [0, 66]], m: 'nv', s: 0 },
    { p: [[8, -56], [12, -40], [13, 0], [11, 40], [6, 62], [9, 0]], m: 'nv', s: 2 },
    { p: [[0, -66], [6, -62], [7, -54], [0, -52]], m: 'glass', s: 0 },
    { p: [[0, -44], [5, -40], [5, -32], [0, -30]], m: 'glass', s: 1 },
    { p: [[0, -17], [5.6, -17], [6.4, -11], [5.6, -5], [0, -5]], m: 'gm', s: 1 },
  ], det(c) {
    F(c, [[-0.7, -24], [0.7, -24], [0.7, -17], [-0.7, -17]], FP.dark[1]);
    seam(c, 'M-5 2L5 2M-5 26L5 26M-5 2L-5 26M5 2L5 26', 0.4);
    sym(c, () => {
      seam(c, 'M14 -8L86 0M28 -20L28 16M60 -14L60 12M8 54L30 55', 0.3); ail(c, 70, 9.4, 94, 5.8, 3.6);
      dots(c, [[18, 0], [44, 2], [76, 4]], 0.9);
      gun(c, 1.6, -70, -62); gun(c, 6.4, -13, -9.6, 1); F(c, [[6.4, -12], [13, -12], [13, -11], [6.4, -11]], FP.dark[1]);
      F(c, [[11.2, 18], [13, 18], [13, 25], [11.2, 25]], FP.dark[1]); gun(c, 1.4, 64, 69);
      exh(c, 35, -20, 24, 3); exh(c, 64.4, -14, 20, 2.6);
    });
    hiLine(c, 'M-3 -50L-8 -20', 0.5, 0.8); hiLine(c, 'M-20 -21L-86 -9', 0.4, 0.7);
    sym(c, () => { fprop(c, 30, -42, 18); fprop(c, 60, -34, 16); });
  } });

  // torpille aérienne : empennage-caisson de bois, ogive à coiffe, cerclages
  efac('w6d', { w: 28, h: 104, cy: 0, parts: [
    { p: [[3, 34], [11, 40], [11, 48], [3, 46]], m: 'gm', s: 1 },
    { p: [[0, -48], [5, -42], [7, -30], [7, 36], [4, 44], [0, 46]], m: 'nv', s: 0 },
    { p: [[4, -40], [7, -30], [7, 36], [4, 44], [4, -30]], m: 'nv', s: 2 },
    { p: [[0, -50], [5, -42], [7, -34], [0, -34]], m: 'al', s: 1 },
    { p: [[3, 38], [12, 38], [12, 41.4], [3, 41.4]], m: 'wd', s: 1 },
  ], det(c) {
    band(c, 7, -10, 2, FP.gm[3]); band(c, 7, 20, 2, FP.gm[3]); band(c, 7, -34, 1.4, FP.dark[1]);
    seam(c, 'M-2.4 -6L-2.4 18M2.4 -6L2.4 18', 0.35); F(c, [[-1.6, 4], [1.6, 4], [1.6, 8], [-1.6, 8]], FP.gm[2]);
    hiLine(c, 'M-1.5 -46L-4 -34', 0.55, 0.8); fprop(c, 0, 49, 9);
  } });

  // sous-marin vu de dessus : pont de teck, kiosque à plate-forme antiaérienne, canon de pont, trous d'évent, ballasts
  efac('w6e', { wear: 623, w: 60, h: 186, cy: 0, parts: [
    { p: [[14, 66], [28, 74], [28, 82], [10, 82]], m: 'nv', s: 1 },
    { p: [[16, -56], [26, -50], [26, -44], [16, -44]], m: 'nv', s: 1 },
    { p: [[0, -92], [10, -82], [20, -50], [22, 0], [18, 50], [8, 80], [0, 88]], m: 'gm', s: 0 },
    { p: [[12, -76], [20, -50], [22, 0], [18, 50], [8, 80], [14, 0]], m: 'gm', s: 2 },
    { p: [[0, -80], [4, -70], [7, -40], [7, 40], [4, 70], [0, 76]], m: 'tk', s: 1 },
    { p: [[0, 14], [7.6, 16], [8, 28], [0, 31]], m: 'nv', s: 1 },
    { p: [[0, -26], [9, -20], [9, 14], [0, 20]], m: 'nv', s: 0 },
    { p: [[6, -22], [9, -20], [9, 14], [6, 16]], m: 'nv', s: 2 },
    { p: [[0, -46], [5, -46], [5, -38], [0, -38]], m: 'nv', s: 1 },
    { p: [[0, -58], [1.2, -58], [1.2, -46], [0, -46]], m: 'gm', s: 1 },
  ], det(c) {
    seam(c, 'M-3 -76L-3 -48M3 -76L3 -48M-3 32L-3 72M3 32L3 72', 0.3);
    for (const y of [-70, -62, -54, -32, 40, 48, 56, 64]) seam(c, `M-6.6 ${y}L6.6 ${y}`, 0.22);
    F(c, [[-1, -12], [1, -12], [1, -2], [-1, -2]], FP.dark[1]);
    F(c, [[-0.6, -18], [0.6, -18], [0.6, -14], [-0.6, -14]], FP.gm[0]);
    gun(c, -2.4, 22, 34, 0.9); gun(c, 2.4, 22, 34, 0.9); F(c, [[-3.4, 20], [3.4, 20], [3.4, 24], [-3.4, 24]], FP.gm[2]);
    sym(c, () => {
      seam(c, 'M13 -66L16 -40L17 30L12 62', 0.35);
      for (let y = -36; y <= 28; y += 6) F(c, [[18.4, y], [20.2, y + 0.6], [20.2, y + 2], [18.4, y + 1.4]], FP.dark[1]);
      exh(c, 15, 40, 18, 2.2);
      strut(c, 'M7.4 -40L10 -24M9.6 14L8 40', 0.6, 0.55);
    });
    hiLine(c, 'M-4 -84L-14 -56', 0.45, 0.8);
    fprop(c, 0, 92, 12);
  } });

  // tourelle triple (nœud, s'oriente vers le joueur)
  D.w6n = Object.assign({}, EN, fac({ w: 50, h: 74, cy: -14, orient: 'none', parts: [
    { p: [[6.6, -50], [9.4, -50], [9.4, -8], [6.6, -8]], m: 'gm', s: 1 },
    { p: [[0, -52], [1.4, -52], [1.4, -8], [0, -8]], m: 'gm', s: 1 },
    { p: [[0, -12], [14, -12], [20, -4], [20, 16], [14, 22], [0, 22]], m: 'nv', s: 1 },
    { p: [[0, -12], [14, -12], [18, -6], [0, -6]], m: 'nv', s: 0 },
    { p: [[0, 13], [21, 13], [21, 16], [0, 16]], m: 'gm', s: 2 },
  ], det(c) {
    for (const x of [-8, 0, 8]) F(c, [[x - 1.6, -52], [x + 1.6, -52], [x + 1.6, -50], [x - 1.6, -50]], FP.dark[1]);
    sym(c, () => seam(c, 'M14 -12L14 22', 0.35));
    hiLine(c, 'M-12 -10L12 -10', 0.45, 0.8);
  } }));

  // cuirassé : coque grise, pont de teck, barbettes octogonales, cheminée unique
  D.w6boss = Object.assign({}, EN, fac({ wear: 641, occl: true, w: 176, h: 556, cy: 0, orient: 'none', parts: [
    { p: [[0, -276], [16, -252], [40, -200], [62, -120], [70, 0], [66, 120], [52, 200], [34, 252], [26, 272], [0, 272]], m: 'nv', s: 1 },
    { p: [[16, -252], [40, -200], [62, -120], [70, 0], [66, 120], [52, 200], [34, 252], [26, 272], [22, 262], [28, 246], [46, 196], [58, 120], [62, 0], [54, -120], [34, -196], [12, -244]], m: 'nv', s: 3 },
    { p: [[0, -252], [12, -232], [32, -190], [52, -120], [60, 0], [56, 120], [44, 196], [28, 246], [22, 262], [0, 262]], m: 'tk', s: 1 },
    ...[[0, -150], [0, -100], [46, -18], [0, 190]].map(([x, y]) => ({ p: octo(x, y, 20), m: 'nv', s: 1 })),
    ...[24, 56, 92, 124].map(y => ({ p: [[45, y - 5], [55, y - 5], [55, y + 5], [45, y + 5]], m: 'nv', s: 1 })),
    ...[24, 56, 92, 124].map(y => ({ p: [[49, y - 17], [51, y - 17], [51, y - 5], [49, y - 5]], m: 'gm', s: 1 })),
    { p: [[0, -66], [22, -60], [26, -34], [20, 8], [0, 12]], m: 'nv', s: 0 },
    { p: [[14, -62], [22, -60], [26, -34], [20, 8], [14, 8]], m: 'nv', s: 2 },
    { p: [[0, 30], [12, 32], [14, 80], [10, 90], [0, 92]], m: 'gm', s: 1 },
    { p: [[0, 112], [12, 112], [12, 156], [0, 156]], m: 'nv', s: 1 },
  ], det(c) {
    clipP(c, [[0, -252], [12, -232], [32, -190], [52, -120], [60, 0], [56, 120], [44, 196], [28, 246], [22, 262], [-22, 262], [-28, 246], [-44, 196], [-56, 120], [-60, 0], [-52, -120], [-32, -190], [-12, -232]], () => {
      seam(c, 'M-40 -260L-40 262M-20 -260L-20 262M20 -260L20 262M40 -260L40 262', 0.2);
      // lattes du pont : joints décalés, gouttière sombre le long du bord
      seam(c, 'M-50 -260L-50 262M-30 -260L-30 262M-10 -260L-10 262M10 -260L10 262M30 -260L30 262M50 -260L50 262', 0.09);
      let d = ''; for (let y = -244; y < 260; y += 18) for (let x = -60; x < 60; x += 10) if (((x + 60) / 10 + Math.round(y / 18)) % 3 === 0) d += `M${x} ${y}L${x + 10} ${y}`; seam(c, d, 0.12);
    });
    sym(c, () => seam(c, 'M12 -232L32 -190L52 -120L60 0L56 120L44 196L28 246', 0.35, 1.4));
    // brise-lames en chevron devant la tourelle avant, chaînes d'ancre sur le gaillard
    seam(c, 'M-34 -178L0 -196L34 -178', 0.7, 1.6); seam(c, 'M-33 -175L0 -193L33 -175', 0.25, 0.8);
    c.strokeStyle = 'rgba(40,44,50,.75)'; c.lineWidth = Math.max(0.8, px(0.7)); c.setLineDash([1.6, 1.2]); c.stroke(Art.path('M-8 -240L-5 -206M8 -240L5 -206')); c.setLineDash([]);
    // catapulte en biais et grue sur la plage arrière
    F(c, [[-30, 214], [24, 202], [25, 205.4], [-29, 217.4]], FP.gm[2]); seam(c, 'M-30 214L24 202M-29 217.4L25 205.4', 0.6);
    F(c, [[18, 224], [24, 224], [24, 230], [18, 230]], FP.nv[2]); F(c, [[20.4, 230], [21.6, 230], [21.6, 252], [20.4, 252]], FP.gm[2]);
    // mât, vergue et télémètre (barre transversale) sur la passerelle
    F(c, [[-24, -50], [24, -50], [24, -46.6], [-24, -46.6]], FP.nv[3]); F(c, [[-27, -50.6], [-23, -50.6], [-23, -46], [-27, -46]], FP.gm[2]); F(c, [[23, -50.6], [27, -50.6], [27, -46], [23, -46]], FP.gm[2]);
    F(c, [[-1.2, -30], [1.2, -30], [1.2, 0], [-1.2, 0]], FP.gm[3]); // mât sans vergue (une vergue en travers ferait une croix)
    F(c, [[-9, 40], [9, 40], [9, 82], [-9, 82]], FP.dark[1]);
    for (let y = 44; y < 82; y += 6) F(c, [[-9, y], [9, y], [9, y + 1.4], [-9, y + 1.4]], FP.gm[2]);
    F(c, [[-14, -42], [14, -42], [14, -38], [-14, -38]], FP.gm[3]);
    for (const x of [-12, -6, 0, 6]) F(c, [[x, -58], [x + 4, -58], [x + 4, -55], [x, -55]], hexA(FP.glass[0], 0.85));
    seam(c, 'M-30 240L30 240M-18 -250L18 -250', 0.6, 1.2); // aucun trait sur l'axe qui croise ces lignes (croix)
    sym(c, () => {
      dots(c, [[64, -60], [66, 0], [64, 60], [58, 140], [40, -170]], 1.2); seam(c, 'M14 -26L14 8', 0.35);
      // canots en fuseau de part et d'autre de la cheminée, bossoirs
      const bt = [[24, 38], [28, 44], [28, 72], [24, 78], [20, 72], [20, 44]]; c.strokeStyle = OUT; c.lineWidth = Math.max(1, px(0.8)); fpoly(c, bt); c.stroke(); F(c, bt, FP.iv[2]); F(c, [[21.6, 46], [26.4, 46], [26.4, 70], [21.6, 70]], FP.wd[2]);
      seam(c, 'M28 48L32 48M28 68L32 68', 0.6);
    });
    // affûts antiaériens : tubes jumelés le long de la superstructure, décalés d'un bord à l'autre (pas de paire symétrique)
    for (const [k, ys] of [[1, [-70, 100, 164]], [-1, [-58, 112, 176]]]) for (const y0 of ys) { c.save(); c.scale(k, 1); const y = y0; F(c, [[26, y], [34, y], [34, y + 7], [26, y + 7]], FP.nv[2]); F(c, [[28.6, y - 9], [29.8, y - 9], [29.8, y], [28.6, y]], FP.dark[1]); F(c, [[31, y - 9], [32.2, y - 9], [32.2, y], [31, y]], FP.dark[1]); c.restore(); }
    sym(c, () => {
      // ceinture blindée : plaques le long du flanc
      seam(c, 'M64 -100L64 -60M66 -40L66 0M66 20L66 60M64 80L64 120', 0.4, 0.8);
    });
    // superstructures étagées : passerelle, rouf arrière
    seam(c, 'M-10 124L10 124M-10 140L10 140', 0.4);
    hiLine(c, 'M-6 -270L-30 -210L-56 -130', 0.4, 1.2);
  } }));

  /* ---------------- 07 · ORBITE 1969 : vrais engins spatiaux en Facettes (dessus, nez en haut) ----------------
     Aucun disque à point central (ni hublot rond, ni parabole de face, ni feu) : fentes, grilles, paraboles vues par la tranche. */
  const SO = FP.so;
  function solar(c, x0, y0, w, h, nx, ny) {
    const P = [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]];
    c.strokeStyle = OUT; c.lineWidth = Math.max(1.5, px(1.15)) * 2; c.lineJoin = 'round'; fpoly(c, P); c.stroke();
    F(c, P, SO[2]); F(c, [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h * 0.3], [x0, y0 + h * 0.3]], SO[1]);
    c.strokeStyle = hexA(SO[0], 0.45); c.lineWidth = Math.max(0.5, px(0.5)); c.beginPath();
    for (let i = 1; i < nx; i++) { const x = x0 + w * i / nx; c.moveTo(x, y0); c.lineTo(x, y0 + h); }
    for (let j = 1; j < ny; j++) { const y = y0 + h * j / ny; c.moveTo(x0, y); c.lineTo(x0 + w, y); } c.stroke();
    // reflet en biais, cadre intérieur et longeron (niveau de détail des références)
    const k = Math.min(w, h) * 0.5, cx = v => Math.max(x0, Math.min(x0 + w, v)); F(c, [[cx(x0 + w * 0.18), y0], [cx(x0 + w * 0.18 + k), y0], [cx(x0 + w * 0.18 + k * 0.4), y0 + h], [cx(x0 + w * 0.18 - k * 0.6), y0 + h]], 'rgba(200,220,255,.10)');
    c.strokeStyle = hexA(SO[4], 0.9); c.lineWidth = Math.max(0.8, px(0.7)); c.strokeRect(x0 + 1, y0 + 1, w - 2, h - 2);
    if (w >= h) F(c, [[x0, y0 + h / 2 - 0.6], [x0 + w, y0 + h / 2 - 0.6], [x0 + w, y0 + h / 2 + 0.6], [x0, y0 + h / 2 + 0.6]], FP.al[2]);
    else F(c, [[x0 + w / 2 - 0.6, y0], [x0 + w / 2 + 0.6, y0], [x0 + w / 2 + 0.6, y0 + h], [x0 + w / 2 - 0.6, y0 + h]], FP.al[2]);
  }
  // sphère à facettes (lumière en haut à gauche), sans aucun hublot
  function sphereF(c, x, y, r, P) {
    // fuseaux verticaux (pas d'anneau ni de centre marqué : rien qui évoque une pupille)
    const ring = Array.from({ length: 16 }, (_, i) => [x + Math.cos(i / 16 * TAU) * r, y + Math.sin(i / 16 * TAU) * r]);
    c.strokeStyle = OUT; c.lineWidth = Math.max(1.5, px(1.15)) * 2; c.lineJoin = 'round'; fpoly(c, ring); c.stroke();
    clipP(c, ring, () => {
      const cols = [0, 1, 1, 2, 3, 4]; cols.forEach((k, i) => { const x0 = x - r + i * 2 * r / cols.length, x1 = x0 + 2 * r / cols.length + 0.5; F(c, [[x0, y - r], [x1, y - r], [x1, y + r], [x0, y + r]], P[k]); });
      F(c, [[x - r, y + r * 0.45], [x + r, y + r * 0.45], [x + r, y + r], [x - r, y + r]], 'rgba(7,8,10,.18)');
      let d = ''; for (const k of [-0.66, -0.33, 0, 0.33, 0.66]) d += `M${x + k * r * 0.4} ${y - r}Q${x + k * r * 1.45} ${y} ${x + k * r * 0.4} ${y + r}`; seam(c, d, 0.3);
    });
    hiLine(c, `M${x - r * 0.72} ${y - r * 0.4}Q${x - r * 0.6} ${y - r * 0.8} ${x - r * 0.2} ${y - r * 0.92}`, 0.6, Math.max(0.9, r * 0.05));
  }
  const ant = (c, d, w = 1) => { c.strokeStyle = 'rgba(220,226,232,.85)'; c.lineWidth = Math.max(w, px(0.7)); c.stroke(Art.path(d)); };
  const efacP = (name, o, pre) => { fac(o); const d = o.draw; D[name] = Object.assign({}, EN, o, { draw(c) { pre(c); d(c); } }); };

  // bloc de propulseurs d'attitude (petit carré à tuyères)
  const rcs = (c, x, y, s = 1) => { F(c, [[x - 1.8 * s, y - 1.8 * s], [x + 1.8 * s, y - 1.8 * s], [x + 1.8 * s, y + 1.8 * s], [x - 1.8 * s, y + 1.8 * s]], FP.gm[1]); F(c, [[x - 0.7 * s, y - 2.8 * s], [x + 0.7 * s, y - 2.8 * s], [x + 0.7 * s, y - 1.8 * s], [x - 0.7 * s, y - 1.8 * s]], FP.dark[1]); };
  // persiennes thermiques : lamelles claires et sombres
  const louv = (c, x0, y0, w, n, h = 1.6) => { for (let i = 0; i < n; i++) F(c, [[x0, y0 + i * h * 2], [x0 + w, y0 + i * h * 2], [x0 + w, y0 + i * h * 2 + h], [x0, y0 + i * h * 2 + h]], i % 2 ? FP.al[0] : FP.gm[2]); };
  // rampe de prise en main (trait doré fin)
  const rail = (c, d) => { c.strokeStyle = 'rgba(232,200,120,.75)'; c.lineWidth = Math.max(0.6, px(0.5)); c.stroke(Art.path(d)); };
  // vaisseau à trois modules (orbital, descente, service) et deux ailes solaires
  efacP('w7a', { wear: 701, w: 156, h: 104, cy: 0, parts: [
    { p: [[14, 16], [26, 16], [26, 19], [14, 19]], m: 'al', s: 1 },
    { p: [[0, 4], [14, 4], [14, 40], [10, 44], [0, 44]], m: 'gn', s: 1 },
    { p: [[9, 4], [14, 4], [14, 40], [10, 44], [9, 44]], m: 'gn', s: 3 },
    { p: [[0, -16], [12, -13], [16, 4], [0, 6]], m: 'gn', s: 0 },
    { p: [[0, -44], [5.4, -43], [10, -40], [13, -35], [14, -30], [13, -25], [10, -20], [5.4, -17], [0, -16]], m: 'gn', s: 1 },
  ], det(c) {
    eflame(c, 0, 44, 4, 10, ICE);
    seam(c, 'M-14 18L14 18M-14 30L14 30M-13 -30L13 -30', 0.35);
    band(c, 16, 3.4, 2.2, FP.gm[3]); band(c, 12.4, -16.6, 1.4, FP.gm[2]);
    seam(c, 'M-9 -40L9 -20M-12 -34L4 -18M-4 -42L12 -26M9 -40L-9 -20M12 -34L-4 -18M4 -42L-12 -26', 0.16, 0.4);
    F(c, [[-8, 21], [8, 21], [8, 27], [-8, 27]], FP.al[1]); seam(c, 'M-8 23L8 23M-8 25L8 25', 0.4, 0.4);
    sym(c, () => { dots(c, [[10, 10], [10, 36]], 0.8); rcs(c, 12, 8, 0.9); rcs(c, 12, 40, 0.9); });
    F(c, [[-4, -8], [4, -8], [4, -5], [-4, -5]], hexA(FP.glass[0], 0.8));
    F(c, [[-1.6, -50], [1.6, -50], [1.6, -44], [-1.6, -44]], FP.al[1]);
    ant(c, 'M0 -50L0 -54M-10 -38L-17 -46M11 -21L18 -14');
    hiLine(c, 'M-10 -38L-4 -42', 0.5, 0.8);
  } }, c => sym(c, () => solar(c, 26, 10, 52, 16, 6, 2)));

  // capsule conique sur son adaptateur
  efac('w7b', { wear: 709, w: 80, h: 118, cy: 0, parts: [
    { p: [[0, -4], [22, -4], [32, 46], [0, 46]], m: 'wh', s: 1 },
    { p: [[16, -4], [22, -4], [32, 46], [24, 46]], m: 'wh', s: 3 },
    { p: [[0, -54], [6, -50], [22, -4], [0, -4]], m: 'gm', s: 0 },
    { p: [[0, -60], [3, -60], [3, -53], [0, -53]], m: 'al', s: 1 },
  ], det(c) {
    eflame(c, 0, 46, 6, 12, ICE);
    seam(c, 'M-26 22L26 22M-29 36L29 36', 0.3);
    band(c, 22.4, -5, 3, FP.dark[1]);
    seam(c, 'M-9.5 -40L9.5 -40M-13.7 -28L13.7 -28M-17.8 -16L17.8 -16', 0.35);
    sym(c, () => {
      seam(c, 'M10 -4L14 46', 0.3);
      for (const x of [4, 7]) seam(c, `M${x} -2L${x * 1.3} 46`, 0.18, 0.4);
      dots(c, [[6, 0], [13, 0], [20, 0], [24, 20], [27, 34]], 0.6);
      rcs(c, 15, -20, 0.9); rcs(c, 26, 10, 1);
      rail(c, 'M3 -44L8 -30');
    });
    F(c, [[-5, -30], [5, -30], [5, -27], [-5, -27]], hexA(FP.glass[0], 0.85));
    hiLine(c, 'M-2 -50L-12 -16', 0.5, 0.8);
  } });

  // station à modules : quatre ailes solaires, radiateurs, rampes, port d'amarrage latéral
  efacP('w7c', { wear: 717, w: 176, h: 190, cy: 0, parts: [
    { p: [[18, -64], [26, -64], [26, -61], [18, -61]], m: 'al', s: 1 },
    { p: [[28, 44], [30, 44], [30, 47], [28, 47]], m: 'al', s: 1 },
    { p: [[0, 66], [14, 66], [14, 88], [0, 88]], m: 'al', s: 1 },
    { p: [[14, 72], [21, 72], [21, 81], [14, 81]], m: 'al', s: 2 },
    { p: [[0, -18], [22, -18], [28, -10], [28, 66], [0, 66]], m: 'wh', s: 0 },
    { p: [[20, -18], [22, -18], [28, -10], [28, 66], [20, 66]], m: 'wh', s: 2 },
    { p: [[0, -84], [12, -84], [18, -76], [18, -20], [0, -20]], m: 'wh', s: 1 },
    { p: [[0, -93], [6, -93], [8, -86], [0, -84]], m: 'al', s: 1 },
  ], det(c) {
    eflame(c, 0, 88, 6, 12, ICE);
    F(c, [[-28, -10], [28, -10], [28, -2], [-28, -2]], hexA(FP.go[1], 0.6));
    seam(c, 'M-28 10L28 10M-28 40L28 40M-18 -50L18 -50M-14 76L14 76', 0.3);
    band(c, 18, -21, 1.6, FP.gm[2]); band(c, 28, 63, 2, FP.gm[2]);
    F(c, [[-6, 14], [6, 14], [6, 36], [-6, 36]], FP.al[0]); seam(c, 'M-6 18L6 18M-6 22L6 22M-6 26L6 26M-6 30L6 30M0 14L0 36', 0.3, 0.4);
    louv(c, -8, -44, 16, 5);
    sym(c, () => {
      dots(c, [[24, 20], [24, 54], [14, -70]], 0.9);
      F(c, [[21, 2], [26, 2], [26, 34], [21, 34]], FP.al[1]); seam(c, 'M21 8L26 8M21 14L26 14M21 20L26 20M21 26L26 26', 0.35, 0.4);
      rail(c, 'M10 -78L10 -24M16 44L16 62');
      rcs(c, 25, 58); rcs(c, 15, -80, 0.9);
      F(c, [[16.4, 75], [19, 75], [19, 78], [16.4, 78]], FP.gm[2]);
    });
    F(c, [[-3, -66], [3, -66], [3, -63], [-3, -63]], hexA(FP.glass[0], 0.8));
    hiLine(c, 'M-24 -14L-24 60', 0.5, 0.8);
  } }, c => sym(c, () => { solar(c, 26, -74, 58, 22, 6, 2); solar(c, 30, 34, 56, 24, 6, 2); }));

  // capsule sphérique cerclée de sangles et module d'instruments à persiennes et bouteilles (sans hublot)
  efacP('w7d', { wear: 723, w: 56, h: 104, cy: 0, parts: [
    { p: [[0, 2], [14, 4], [22, 38], [0, 44]], m: 'al', s: 1 },
    { p: [[14, 4], [22, 38], [12, 42], [8, 6]], m: 'al', s: 3 },
  ], det(c) {
    eflame(c, 0, 44, 5, 12, ICE);
    seam(c, 'M-18 24L18 24', 0.35);
    louv(c, -7, 10, 14, 3, 1.5);
    sym(c, () => { F(c, [[15, 8], [18, 20], [16.4, 21], [13.6, 9]], FP.gm[1]); F(c, [[18.6, 24], [21, 34], [19.4, 35], [17, 25]], FP.gm[1]); });
    sphereF(c, 0, -18, 22, FP.wh);
    c.strokeStyle = hexA(FP.al[2], 0.95); c.lineWidth = Math.max(1.4, px(1)); c.stroke(Art.path('M-21.4 -13Q0 -6 21.4 -13M-20.4 -27Q0 -20 20.4 -27'));
    sym(c, () => { F(c, [[19, -15], [22, -15], [22, -11], [19, -11]], FP.gm[2]); F(c, [[18, -29], [21, -29], [21, -25], [18, -25]], FP.gm[2]); });
    ant(c, 'M0 -40L0 -50M14 -34L20 -42');
  } }, () => {});

  // satellite à boîtier doré, persiennes, viseur d'étoiles, parabole vue par la tranche
  efacP('w7e', { wear: 727, w: 168, h: 98, cy: 0, parts: [
    { p: [[18, -2], [30, -2], [30, 2], [18, 2]], m: 'al', s: 1 },
    { p: [[0, -26], [16, -26], [20, -22], [20, 22], [16, 26], [0, 26]], m: 'go', s: 1 },
    { p: [[12, -26], [16, -26], [20, -22], [20, 22], [16, 26], [12, 26]], m: 'go', s: 3 },
    { p: [[12, -32], [17, -32], [17, -26], [12, -26]], m: 'gm', s: 1 },
    { p: [[0, -36], [22, -44], [23, -40], [0, -32]], m: 'wh', s: 1 },
  ], det(c) {
    seam(c, 'M-20 -8L20 -8M-20 8L20 8M-6 -26L-6 26M6 -26L6 26', 0.3);
    louv(c, -5, -6, 10, 3, 1.4);
    seam(c, 'M-17 -22L-9 -14M-15 14L-8 22M14 -20L9 -12M10 12L16 20', 0.22, 0.4);
    sym(c, () => { rcs(c, 17, 24, 0.9); F(c, [[13, -30.6], [16, -30.6], [16, -29], [13, -29]], FP.dark[1]); });
    ant(c, 'M0 -26L0 -46', 1.2); F(c, [[-1.6, -50], [1.6, -50], [1.6, -46], [-1.6, -46]], FP.al[1]);
    ant(c, 'M-16 26L-22 40', 0.8);
    hiLine(c, 'M-18 -20L-18 16', 0.5, 0.8);
  } }, c => sym(c, () => solar(c, 28, -12, 52, 24, 6, 2)));

  // premier satellite : sphère polie et quatre antennes
  efacP('w7m', { w: 44, h: 84, cy: 4, parts: [], det(c) {
    sym(c, () => ant(c, 'M5 -20L10 38M8 -18L18 30'));
    sphereF(c, 0, -26, 13, FP.al);
    seam(c, 'M-13 -26Q0 -22 13 -26', 0.35);
  } }, () => {});

  // nœud : aile solaire du télescope (tourne autour du boss)
  mk('w7n', { w: 40, h: 112, cy: 0, orient: 'none', down: false, facet: true }, c => {
    F(c, [[-1.2, 46], [1.2, 46], [1.2, 56], [-1.2, 56]], FP.al[2]);
    solar(c, -16, -52, 32, 100, 2, 8);
  });

  // station-atelier : atelier doré et blanc, une seule aile solaire (l'autre arrachée), télescope à grille
  // occl : chaque pièce cache les traits de celles qu'elle recouvre
  facS(D.w7boss = { occl: true, w: 270, h: 300, cy: 4, orient: 'none', down: false, parts: [
    { p: [[28, 34], [36, 34], [36, 40], [28, 40]], m: 'al', s: 1 },
    { p: [[-34, 30], [-60, 26], [-55, 29], [-62, 31], [-56, 33], [-58, 35], [-34, 38]], m: 'so', s: 2 },
    { p: [[-26, -10], [26, -10], [34, -2], [34, 132], [26, 140], [-26, 140], [-34, 132], [-34, -2]], m: 'wh', s: 1 },
    { p: [[-26, -10], [-12, -10], [-12, 140], [-26, 140], [-34, 132], [-34, -2]], m: 'wh', s: 0 },
    { p: [[12, -10], [26, -10], [34, -2], [34, 132], [26, 140], [12, 140]], m: 'wh', s: 2 },
    { p: [[-26, -10], [-12, -10], [-12, 50], [-34, 50], [-34, -2]], m: 'go', s: 1 },
    { p: [[-12, -10], [12, -10], [12, 50], [-12, 50]], m: 'go', s: 2 },
    { p: [[12, -10], [26, -10], [34, -2], [34, 50], [12, 50]], m: 'go', s: 3 },
    { p: [[-14, -54], [14, -54], [14, -8], [-14, -8]], m: 'al', s: 1 },
    { p: [[6, -54], [14, -54], [14, -8], [6, -8]], m: 'al', s: 2 },
    { p: [[-6, -36], [24, -36], [24, -26], [-6, -26]], m: 'al', s: 2 },
    { p: [[-10, -142], [10, -142], [10, -110], [-10, -110]], m: 'al', s: 1 },
    { p: [[-10, -142], [-4, -154], [4, -154], [10, -142]], m: 'gm', s: 1 },
    { p: octo(0, -82, 30), m: 'wh', s: 1 },
    { p: [[-27.7, -70.5], [-27.7, -93.5], [-11.5, -109.7], [11.5, -109.7]], m: 'wh', s: 0 },
    { p: [[-15, -97], [15, -97], [15, -67], [-15, -67]], m: 'go', s: 1 },
  ], det(c) {
    // pare-soleil doré : nervures en éventail, plis
    clipP(c, [[-26, -10], [26, -10], [34, -2], [34, 50], [-34, 50], [-34, -2]], () => {
      seam(c, 'M0 -10L-34 30M0 -10L34 30M0 -10L-20 50M0 -10L20 50', 0.3, 0.7);
      for (const y of [6, 22, 38]) F(c, [[-34, y], [34, y], [34, y + 1.2], [-34, y + 1.2]], 'rgba(255,246,210,.25)');
    });
    // atelier : sangles du bouclier anti-météorites, grilles d'aération, éraflures
    clipP(c, [[-34, 50], [34, 50], [34, 132], [26, 140], [-26, 140], [-34, 132]], () => {
      for (const y of [60, 74, 100, 112, 130]) F(c, [[-34, y], [34, y], [34, y + 2], [-34, y + 2]], 'rgba(150,158,170,.35)');
      for (let i = 0; i < 26; i++) { const x = -30 + ((i * 37) % 60), y = 54 + ((i * 53) % 82); F(c, [[x, y], [x + 1.6, y], [x + 1.6, y + 0.8], [x, y + 0.8]], 'rgba(7,8,10,.18)'); }
    });
    vents(c, -30, 78, 4, 12, 3.4);
    F(c, [[-22, 116], [22, 116], [22, 128], [-22, 128]], FP.wh[3]); for (let x = -20; x < 22; x += 4) F(c, [[x, 117], [x + 2, 117], [x + 2, 127], [x, 127]], FP.wh[1]);
    // sas : treillis et bandes, adaptateur d'amarrage à anneaux plats
    seam(c, 'M-14 -50L6 -40L-14 -30L6 -20L-14 -12', 0.25, 0.7); // treillis en zigzag (un grand X ferait une croix)
    for (const y of [-48, -20, -14]) F(c, [[-14, y], [14, y], [14, y + 1.4], [-14, y + 1.4]], FP.al[3]);
    F(c, [[-10, -138], [10, -138], [10, -135.6], [-10, -135.6]], FP.al[3]); F(c, [[-10, -118], [10, -118], [10, -115.6], [-10, -115.6]], FP.al[3]);
    // moignon de l'aile arrachée : bord déchiqueté, câbles pendants
    seam(c, 'M-34 34L-55 31', 0.5);
    solar(c, 34, 22, 94, 30, 8, 2);
    ant(c, 'M-58 30L-68 22'); ant(c, 'M-60 32L-70 38');
    F(c, [[30, 36], [34, 36], [34, 38], [30, 38]], FP.gm[2]);
    for (let y = -92; y < -68; y += 5) F(c, [[-12, y], [12, y], [12, y + 2], [-12, y + 2]], FP.dark[1]);
    seam(c, 'M-34 50L34 50M-34 90L34 90M-34 120L34 120M-14 -30L14 -30M-10 -126L10 -126', 0.35);
    // (plus de points par paire sur l'atelier : avec la grille entre eux, ils faisaient un visage)
    F(c, [[-4, 140], [4, 140], [4, 146], [-4, 146]], FP.al[2]);
    hiLine(c, 'M-30 54L-30 128', 0.6, 1);
  } });

  /* ---------------- 08 · ESCADRE : space-opéra en Facettes (nacre, acier, filets mauves) ----------------
     Aucun feu ; tourelles en blocs, moyeu de la station en losange (pas de disque à centre sombre). */
  const MV = FP.mv, MVF = '#E6B8E0';
  efac('w8a', { wear: 801, w: 112, h: 104, cy: 0, parts: [
    { p: [[44, -8], [49, -8], [49, 32], [44, 32]], m: 'gm', s: 2 },
    { p: [[8, -10], [44, 14], [50, 32], [40, 32], [8, 28]], m: 'gm', s: 1 },
    { p: [[8, 14], [44, 20], [50, 32], [40, 32], [8, 28]], m: 'gm', s: 2 },
    { p: [[4, 38], [10, 38], [10, 46], [4, 46]], m: 'gm', s: 2 },
    { p: [[0, -50], [5, -42], [10, -20], [12, 10], [10, 36], [6, 44], [0, 44]], m: 'pe', s: 0 },
    { p: [[6, -40], [10, -20], [12, 10], [10, 36], [6, 44], [7, 10]], m: 'pe', s: 2 },
    { p: [[0, -36], [3, -30], [3.6, -20], [0, -16]], m: 'glass', s: 0 },
  ], det(c) {
    sym(c, () => {
      eflame(c, 7, 46, 3, 10, MVF); F(c, [[14, -4], [46, 20], [45, 23], [13, -1]], MV[1]);
      seam(c, 'M8 0L8 30M12 -10L12 30M20 6L20 30M30 12L30 31M14 24L44 26', 0.3);
      F(c, [[44, -10], [49, -10], [49, -8], [44, -8]], FP.dark[1]);
      F(c, [[46, -18], [47.4, -18], [47.4, -10], [46, -10]], FP.gm[3]);
      intake(c, 7.4, -22, 3, 9); plate(c, 22, 18, 6, 3); plate(c, 34, 22, 5, 3);
      seam(c, 'M3 -8L9 -8', 0.4);
    });
    F(c, [[-1.2, -10], [1.2, -10], [1.2, 34], [-1.2, 34]], MV[2]);
    hiLine(c, 'M-2 -46L-7 -20', 0.6, 0.8);
  } });

  efac('w8b', { wear: 809, w: 114, h: 124, cy: 0, parts: [
    { p: [[0, -6], [26, -4], [26, 16], [0, 18]], m: 'gm', s: 1 },
    { p: [[28, 18], [50, 38], [48, 52], [30, 46]], m: 'gm', s: 1 },
    { p: [[22, -56], [26, -60], [30, -56], [32, -30], [32, 40], [30, 52], [22, 52], [20, 40], [20, -30]], m: 'pe', s: 1 },
    { p: [[0, -38], [6, -32], [9, -12], [9, 8], [6, 20], [0, 22]], m: 'pe', s: 0 },
    { p: [[0, -30], [4, -26], [4.6, -16], [0, -12]], m: 'glass', s: 0 },
  ], det(c) {
    sym(c, () => {
      eflame(c, 26, 52, 4, 12, MVF); F(c, [[25.4, -40], [26.6, -40], [26.6, -26], [25.4, -26]], MV[1]); F(c, [[25.4, 26], [26.6, 26], [26.6, 30], [25.4, 30]], MV[1]);
      seam(c, 'M20 -20L32 -20M20 20L32 20M6 0L24 0M12 -5L12 17M36 30L46 46', 0.35);
      vents(c, 22, -14, 6, 8, 3.4); plate(c, 22.6, 4, 7, 4); plate(c, 33, 30, 5, 4);
      F(c, [[25.2, -66], [26.8, -66], [26.8, -58], [25.2, -58]], FP.gm[3]);
    });
    seam(c, 'M-6 -4L6 -4M-7 10L7 10', 0.4);
    hiLine(c, 'M-2 -34L-7 -12', 0.55, 0.8);
  } });

  efac('w8c', { wear: 817, w: 130, h: 180, cy: 0, parts: [
    { p: [[28, -30], [38, -30], [41, -20], [41, 70], [34, 78], [28, 70], [26, -20]], m: 'gm', s: 1 },
    { p: [[0, -86], [10, -78], [20, -52], [22, -20], [26, 30], [28, 62], [26, 80], [24, 86], [0, 86]], m: 'pe', s: 0 },
    { p: [[14, -70], [20, -52], [22, -20], [26, 30], [28, 62], [26, 80], [24, 86], [18, 86], [20, 30], [16, -20]], m: 'pe', s: 2 },
    { p: [[2, -58], [4.4, -58], [4.4, -40], [2, -40]], m: 'gm', s: 2 },
    { p: [[0, -40], [8, -40], [11, -34], [11, -22], [8, -18], [0, -18]], m: 'gm', s: 1 },
    { p: [[12, -6], [18, -6], [20, -2], [20, 4], [12, 4]], m: 'gm', s: 1 },
    { p: [[0, 10], [12, 10], [12, 34], [0, 34]], m: 'gm', s: 2 },
    { p: [[0, 54], [27, 54], [27.6, 60], [0, 60]], m: 'mv', s: 1 },
    { p: [[0, -68], [8, -66], [9, -60], [0, -60]], m: 'glass', s: 0 },
  ], det(c) {
    for (const x of [-12, 0, 12]) eflame(c, x, 86, 4, 12, MVF);
    sym(c, () => {
      eflame(c, 34, 78, 4, 12, MVF);
      seam(c, 'M20 -40L20 40M34 -20L34 66M10 -60L20 -60M4 -14L22 -14M4 40L26 40M14 -46L20 -46', 0.3);
      F(c, [[15, -16], [16.4, -16], [16.4, -6], [15, -6]], FP.gm[3]);
      plate(c, 21, 10, 4, 10); plate(c, 14, 44, 8, 4); plate(c, 30, 0, 8, 3, FP.gm[3]); plate(c, 30, 40, 8, 3, FP.gm[3]);
      vents(c, 29, 16, 5, 9, 3);
    });
    vents(c, -10, 64, 4, 20, 3);
    for (let y = 13; y < 33; y += 5) F(c, [[-10, y], [10, y], [10, y + 1.6], [-10, y + 1.6]], FP.dark[1]);
    seam(c, 'M-11 -28L11 -28', 0.4);
    hiLine(c, 'M-3 -82L-12 -60L-14 -20', 0.55, 0.9);
  } });

  efac('w8d', { wear: 823, w: 54, h: 128, cy: 0, parts: [
    { p: [[6, 8], [26, 36], [24, 48], [6, 42]], m: 'gm', s: 1 },
    { p: [[4, -40], [12, -32], [12, -28], [5, -30]], m: 'gm', s: 1 },
    { p: [[0, -64], [4, -50], [9, -20], [10, 30], [8, 50], [0, 56]], m: 'pe', s: 0 },
    { p: [[4, -50], [9, -20], [10, 30], [8, 50], [5, 30]], m: 'pe', s: 2 },
    { p: [[0, -28], [3, -22], [3.6, -12], [0, -8]], m: 'glass', s: 0 },
  ], det(c) {
    eflame(c, 0, 56, 4, 14, MVF);
    F(c, [[-1.4, -44], [1.4, -44], [1.4, -30], [-1.4, -30]], MV[1]); F(c, [[-1.4, -6], [1.4, -6], [1.4, 34], [-1.4, 34]], MV[1]);
    sym(c, () => { F(c, [[14, 22], [24, 36], [23, 38], [13, 24]], MV[1]); seam(c, 'M6 40L10 46M4 -2L9 -2M4 20L10 20', 0.4); intake(c, 6, -6, 2.6, 10); plate(c, 4, 36, 4, 6); });
    hiLine(c, 'M-1.5 -58L-6 -24', 0.6, 0.8);
  } });

  efac('w8e', { wear: 829, w: 156, h: 104, cy: 0, parts: [
    { p: [[0, -46], [20, -38], [74, 12], [76, 24], [40, 28], [16, 40], [0, 42]], m: 'gm', s: 0 },
    { p: [[20, -38], [74, 12], [76, 24], [40, 28], [30, 8]], m: 'gm', s: 2 },
    { p: [[66, 6], [72, 4], [74, 22], [68, 24]], m: 'gm', s: 1 },
    { p: [[0, -44], [8, -34], [12, 0], [10, 30], [0, 34]], m: 'pe', s: 0 },
    { p: [[0, -36], [4, -30], [4.6, -20], [0, -16]], m: 'glass', s: 0 },
  ], det(c) {
    sym(c, () => {
      eflame(c, 12, 40, 3.6, 10, MVF); eflame(c, 36, 28, 3.2, 9, MVF); F(c, [[22, -38], [74, 12], [73, 15], [21, -35]], MV[1]);
      seam(c, 'M30 8L60 22M14 -10L40 -4M24 -26L24 24M40 -10L40 26M54 4L54 26', 0.35);
      F(c, [[42, -14], [43.4, -14], [43.4, -4], [42, -4]], FP.gm[3]); plate(c, 40, -4, 5, 4);
      plate(c, 18, 12, 10, 4); plate(c, 46, 16, 6, 4); vents(c, 26, 28, 3, 10, 2.8);
    });
    for (let y = -4; y < 20; y += 5) F(c, [[-7, y], [7, y], [7, y + 1.6], [-7, y + 1.6]], FP.dark[1]);
    hiLine(c, 'M-3 -40L-10 -10', 0.55, 0.8);
  } });

  efac('w8m', { w: 60, h: 60, cy: 0, parts: [
    { p: [[4, -6], [24, 14], [22, 22], [4, 18]], m: 'gm', s: 1 },
    { p: [[0, -28], [4, -20], [7, 0], [6, 20], [0, 24]], m: 'pe', s: 0 },
  ], det(c) {
    eflame(c, 0, 24, 3, 8, MVF);
    sym(c, () => { F(c, [[8, 2], [22, 15], [21, 17], [7, 5]], MV[1]); seam(c, 'M4 6L7 6M12 10L12 19', 0.4); F(c, [[22, 12], [23.4, 12], [23.4, 6], [22, 6]], FP.gm[3]); });
    F(c, [[-0.8, -18], [0.8, -18], [0.8, 16], [-0.8, 16]], MV[2]);
  } });

  // tourelle double de la station (tourne avec l'anneau) — grille d'évent unique, ni points ni trait en « bouche »
  D.w8n = Object.assign({}, EN, { down: false }, fac({ w: 50, h: 70, cy: -14, orient: 'none', parts: [
    { p: [[3, -46], [6, -46], [6, -8], [3, -8]], m: 'gm', s: 1 },
    { p: [[0, -12], [12, -12], [18, -4], [18, 14], [12, 20], [0, 20]], m: 'pe', s: 1 },
    { p: [[0, -12], [12, -12], [16, -6], [0, -6]], m: 'pe', s: 0 },
    { p: [[0, 12], [18.6, 12], [18.6, 15], [0, 15]], m: 'mv', s: 1 },
  ], det(c) {
    sym(c, () => { F(c, [[2.6, -48], [6.4, -48], [6.4, -46], [2.6, -46]], FP.dark[1]); seam(c, 'M12 -6L16 0L16 10', 0.35); });
    vents(c, -7, -2, 4, 14, 3);
  } }));

  // station en anneau : couronne à segments, quatre rayons, moyeu en losange (aucune lumière centrale)
  D.w8boss = Object.assign({}, EN, { w: 360, h: 360, cy: 0, orient: 'none', down: false, facet: true, draw(c) {
    // six rayons en treillis (quatre feraient une croix dans un cercle), anneau à modules, moyeu hexagonal en pyramide
    const ow = Math.max(1.5, px(1.15)), shade = am => Math.max(0, Math.min(4, Math.round((1 + 0.6 * Math.cos(am) + 0.8 * Math.sin(am)) * 1.6)));
    for (let i = 0; i < 6; i++) {
      c.save(); c.rotate(i / 6 * TAU + Math.PI / 6);
      const sp = [[-6, 30], [6, 30], [6, 132], [-6, 132]]; c.strokeStyle = OUT; c.lineWidth = ow * 2; fpoly(c, sp); c.stroke();
      F(c, sp, FP.gm[2]); F(c, [[-6, 30], [-1, 30], [-1, 132], [-6, 132]], FP.gm[1]);
      seam(c, 'M-6 38L6 50L-6 62L6 74L-6 86L6 98L-6 110L6 122', 0.45);
      F(c, [[-8, 76], [8, 76], [8, 86], [-8, 86]], FP.pe[2]); F(c, [[-8, 76], [8, 76], [8, 77.4], [-8, 77.4]], 'rgba(255,255,255,.4)'); seam(c, 'M-8 76L8 76L8 86L-8 86Z', 0.55);
      c.restore();
    }
    const n = 24, R1 = 172, R0 = 128, P = (r, i) => [Math.cos(i / n * TAU) * r, Math.sin(i / n * TAU) * r];
    const outer = Array.from({ length: n }, (_, i) => P(R1, i)), inner = Array.from({ length: n }, (_, i) => P(R0, i));
    // ailettes de radiateur sur le bord extérieur (un module sur trois)
    for (let i = 1; i < n; i += 3) { const a = (i + 0.5) / n * TAU; c.save(); c.rotate(a); const f = [[R1 - 2, -7], [R1 + 9, -5], [R1 + 9, 5], [R1 - 2, 7]]; c.strokeStyle = OUT; c.lineWidth = ow * 1.6; fpoly(c, f); c.stroke(); F(c, f, FP.pe[3]); seam(c, `M${R1 + 1} -3L${R1 + 9} -3M${R1 + 1} 0L${R1 + 9} 0M${R1 + 1} 3L${R1 + 9} 3`, 0.5); c.restore(); }
    c.strokeStyle = OUT; c.lineWidth = ow * 2; c.lineJoin = 'round'; fpoly(c, outer); c.stroke(); fpoly(c, inner); c.stroke();
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, k = shade((i + 0.5) / n * TAU);
      F(c, [outer[i], outer[j], P(150, j), P(150, i)], FP.pe[k]); F(c, [P(150, i), P(150, j), inner[j], inner[i]], FP.pe[Math.min(4, k + 1)]);
    }
    c.strokeStyle = MV[1]; c.lineWidth = 2.6; fpoly(c, Array.from({ length: n }, (_, i) => P(150, i))); c.stroke();
    c.strokeStyle = 'rgba(7,8,10,.45)'; c.lineWidth = Math.max(0.6, px(0.5)); c.beginPath(); for (let i = 0; i < n; i += 2) { c.moveTo(...inner[i]); c.lineTo(...outer[i]); } c.stroke();
    // modules de l'anneau : fentes, plaques rapportées, grilles, selon le type
    for (let i = 0; i < n; i++) {
      const t = i % 3; c.save(); c.rotate((i + 0.5) / n * TAU);
      if (t === 0) { F(c, [[158, -4.5], [166, -4.5], [166, 4.5], [158, 4.5]], 'rgba(40,32,46,.72)'); F(c, [[136, -3], [143, -3], [143, 3], [136, 3]], 'rgba(40,32,46,.72)'); }
      else if (t === 1) { plate(c, 154, -6, 12, 5, FP.pe[3]); for (let k = 0; k < 4; k++) F(c, [[132 + k * 3.4, -5], [133.6 + k * 3.4, -5], [133.6 + k * 3.4, 5], [132 + k * 3.4, 5]], 'rgba(40,32,46,.5)'); }
      else { F(c, [[156, -2], [168, -2], [168, 2], [156, 2]], 'rgba(40,32,46,.6)'); seam(c, 'M134 -6L146 -6M134 6L146 6', 0.4); }
      c.restore();
    }
    // moyeu : pyramide hexagonale à facettes (aucun centre clair), ports d'amarrage au pied de chaque rayon
    const hub = Array.from({ length: 6 }, (_, i) => [Math.cos(i / 6 * TAU + Math.PI / 6) * 44, Math.sin(i / 6 * TAU + Math.PI / 6) * 44]);
    c.strokeStyle = OUT; c.lineWidth = ow * 2; fpoly(c, hub); c.stroke();
    for (let i = 0; i < 6; i++) { const j = (i + 1) % 6, am = (i + 0.5) / 6 * TAU + Math.PI / 6; F(c, [[0, 0], hub[i], hub[j]], FP.gm[Math.max(0, Math.min(4, shade(am) - 0))]); }
    c.strokeStyle = 'rgba(7,8,10,.5)'; c.lineWidth = Math.max(0.6, px(0.5)); c.beginPath(); for (const [x, y] of hub) { c.moveTo(0, 0); c.lineTo(x, y); } c.stroke();
    for (let i = 0; i < 6; i++) { c.save(); c.rotate(i / 6 * TAU + Math.PI / 6); F(c, [[30, -6], [40, -6], [40, 6], [30, 6]], FP.gm[3]); seam(c, 'M30 -6L40 -6L40 6L30 6Z', 0.6); c.restore(); }
  } });

  /* ---------------- 09 · NÉO-TOKYO : jets et appareils à soufflantes en Facettes (blanc, bleu nuit, orange) ----------------
     Soufflantes à pales visibles et moyeu sans contraste ; noyau du boss carré à lamelles (aucun disque à point lumineux). */
  const NB = FP.nb, OR = FP.or;
  function ffan(c, x, y, r, a0 = 0.2) {
    const ow = Math.max(1.5, px(1.15)), ri = r * 0.78, ring = (rr) => Array.from({ length: 16 }, (_, i) => [x + Math.cos(i / 16 * TAU) * rr, y + Math.sin(i / 16 * TAU) * rr]);
    const O = ring(r), I = ring(ri);
    c.strokeStyle = OUT; c.lineWidth = ow * 2; c.lineJoin = 'round'; fpoly(c, O); c.stroke();
    for (let i = 0; i < 16; i++) { const j = (i + 1) % 16, am = (i + 0.5) / 16 * TAU, v = -0.6 * Math.cos(am) - 0.8 * Math.sin(am); F(c, [O[i], O[j], I[j], I[i]], FP.wh[Math.max(0, Math.min(4, Math.round((1 - v) * 2)))]); }
    F(c, I, FP.al[3]);
    for (let i = 0; i < 7; i++) {
      const a = a0 + i / 7 * TAU, b = a + 0.5, h = r * 0.16;
      F(c, [[x + Math.cos(a) * h, y + Math.sin(a) * h], [x + Math.cos(a + 0.12) * ri, y + Math.sin(a + 0.12) * ri], [x + Math.cos(b) * ri, y + Math.sin(b) * ri], [x + Math.cos(b - 0.2) * h, y + Math.sin(b - 0.2) * h]], FP.al[i % 2 ? 1 : 2]);
    }
    c.lineWidth = Math.max(0.6, px(0.5)); c.strokeStyle = 'rgba(7,8,10,.5)'; fpoly(c, I); c.stroke();
    F(c, octo(x, y, r * 0.17), FP.al[2]);
  }

  efac('w9a', { wear: 901, w: 114, h: 120, cy: 0, parts: [
    { p: [[8, -38], [22, -28], [22, -22], [8, -22]], m: 'nb', s: 1 },
    { p: [[12, -6], [50, 24], [53, 37], [40, 39], [12, 38]], m: 'wh', s: 1 },
    { p: [[12, 26], [50, 28], [53, 37], [40, 39], [12, 38]], m: 'wh', s: 3 },
    { p: [[44, 18], [50, 24], [53, 37], [46, 38]], m: 'nb', s: 1 },
    { p: [[10, 38], [24, 50], [26, 60], [12, 58]], m: 'nb', s: 1 },
    { p: [[0, -58], [5, -52], [9, -32], [12.5, -2], [14, 30], [14, 48], [13, 54], [0, 54]], m: 'wh', s: 0 },
    { p: [[7, -42], [9, -32], [12.5, -2], [14, 30], [14, 48], [13, 54], [9, 54], [10, -2]], m: 'wh', s: 2 },
    { p: [[0, -46], [4, -40], [6, -28], [0, -18]], m: 'glass', s: 0 },
  ], det(c) {
    band(c, 13.6, 34, 4, OR[1]);
    sym(c, () => {
      eflame(c, 8, 54, 4, 12, CYAN); F(c, [[9, -14], [12, -12], [12, -2], [9, -4]], FP.dark[1]);
      seam(c, 'M16 26L48 32M12 0L12 36M22 6L22 30M32 14L32 34M10 42L22 52', 0.3);
      missile(c, 30, 8, 20); plate(c, 36, 28, 6, 3); F(c, [[47, 22], [48.4, 22], [48.4, 14], [47, 14]], FP.gm[3]);
    });
    vents(c, -4, 4, 4, 8, 3); seam(c, 'M-9 -30L9 -30M-12 20L12 20', 0.35);
    hiLine(c, 'M-2 -52L-8 -24', 0.6, 0.8);
  } });

  efac('w9b', { wear: 909, w: 136, h: 116, cy: 0, parts: [
    { p: [[0, -6], [40, -4], [40, 10], [0, 12]], m: 'nb', s: 1 },
    { p: [[10, 40], [26, 54], [26, 62], [10, 58]], m: 'nb', s: 1 },
    { p: [[0, -50], [6, -44], [11, -22], [14, 20], [10, 44], [8, 52], [0, 52]], m: 'wh', s: 0 },
    { p: [[7, -40], [11, -22], [14, 20], [10, 44], [8, 52], [9, 20]], m: 'wh', s: 2 },
    { p: [[0, -60], [1.5, -60], [1.5, -48], [0, -48]], m: 'gm', s: 1 },
    { p: [[0, -40], [4, -34], [5, -22], [0, -14]], m: 'glass', s: 0 },
  ], det(c) {
    band(c, 12, 26, 4, OR[1]); eflame(c, 0, 52, 4, 10, CYAN);
    sym(c, () => { seam(c, 'M12 0L36 0M8 30L12 40M12 -14L12 16', 0.3); for (const x of [18, 26]) F(c, [[x, -4.6], [x + 3, -4.6], [x + 5, 10.6], [x + 2, 10.6]], OR[2]); ffan(c, 50, 2, 18, 0.3); });
    vents(c, -5, -8, 4, 10, 3); F(c, [[-2.4, 32], [2.4, 32], [2.4, 40], [-2.4, 40]], FP.gm[2]);
    hiLine(c, 'M-2 -46L-9 -20', 0.6, 0.8);
  } });

  efac('w9c', { wear: 917, w: 164, h: 156, cy: 0, parts: [
    { p: [[24, -40], [48, -40], [48, -30], [24, -28]], m: 'nb', s: 1 },
    { p: [[30, 30], [50, 30], [50, 42], [30, 42]], m: 'nb', s: 1 },
    { p: [[0, -74], [20, -62], [38, -26], [40, 44], [28, 64], [0, 68]], m: 'wh', s: 0 },
    { p: [[28, -46], [38, -26], [40, 44], [28, 64], [30, 40], [30, -24]], m: 'wh', s: 2 },
    { p: [[0, -22], [38.6, -22], [39.2, -15], [0, -15]], m: 'nb', s: 1 },
    { p: [[0, -66], [7, -58], [9, -46], [0, -38]], m: 'glass', s: 0 },
  ], det(c) {
    band(c, 26, 48, 4, OR[1]);
    sym(c, () => { eflame(c, 14, 66, 4, 11, CYAN); seam(c, 'M14 -6L38 -6M14 26L39 26M14 -10L14 60', 0.3); plate(c, 30, -2, 6, 4); plate(c, 30, 32, 6, 4); seam(c, 'M20 -36L20 -24M24 44L24 60', 0.35); F(c, [[38.6, -12], [41, -12], [41, 20], [38.6, 20]], FP.gm[2]); ffan(c, 60, -36, 20, 0.2); ffan(c, 60, 36, 20, 0.7); });
    vents(c, -8, 2, 5, 16, 3.4); seam(c, 'M-10 -30L10 -30M-12 -30L-12 0M12 -30L12 0', 0.4);
    hiLine(c, 'M-4 -70L-18 -40', 0.6, 0.9);
  } });

  efac('w9d', { w: 36, h: 116, cy: 0, parts: [
    { p: [[5, 30], [16, 42], [16, 52], [5, 50]], m: 'nb', s: 1 },
    { p: [[4, -30], [11, -24], [11, -18], [4, -16]], m: 'nb', s: 1 },
    { p: [[0, -56], [5, -46], [7, -30], [7, 40], [6, 50], [0, 50]], m: 'wh', s: 0 },
    { p: [[4, -42], [7, -30], [7, 40], [6, 50], [5, 0]], m: 'wh', s: 2 },
  ], det(c) { band(c, 7, -24, 5, OR[1]); band(c, 7, 30, 1.4, FP.gm[3]); eflame(c, 0, 52, 4, 14, CYAN); seam(c, 'M-7 10L7 10M-7 -8L7 -8M0 -8L0 10', 0.35); F(c, [[-1.6, 36], [1.6, 36], [1.6, 44], [-1.6, 44]], FP.gm[2]); hiLine(c, 'M-1.5 -50L-5 -30', 0.6, 0.8); } });

  // avion à soufflante de sustentation : grille rectangulaire au centre
  efac('w9e', { wear: 929, w: 156, h: 136, cy: 0, parts: [
    { p: [[6, 46], [28, 56], [29, 63], [6, 60]], m: 'nb', s: 1 },
    { p: [[8, -12], [70, 22], [72, 31], [56, 31], [8, 18]], m: 'wh', s: 1 },
    { p: [[8, 10], [70, 26], [72, 31], [56, 31], [8, 18]], m: 'wh', s: 3 },
    { p: [[26, -26], [34, -26], [36, -16], [36, 16], [30, 22], [24, 16], [24, -16]], m: 'al', s: 1 },
    { p: [[0, -62], [7, -56], [11, -32], [11, 30], [6, 56], [0, 64]], m: 'wh', s: 0 },
    { p: [[7, -52], [11, -32], [11, 30], [6, 56], [8, 0]], m: 'wh', s: 2 },
    { p: [[0, -8], [18, -8], [20, -4], [20, 22], [18, 26], [0, 26]], m: 'nb', s: 1 },
    { p: [[0, -54], [5, -48], [6, -40], [0, -34]], m: 'glass', s: 0 },
  ], det(c) {
    for (let y = -4; y < 24; y += 4) F(c, [[-17, y], [17, y], [17, y + 1.6], [-17, y + 1.6]], FP.wh[3]);
    sym(c, () => { eflame(c, 30, 22, 3.6, 10, CYAN); seam(c, 'M14 6L66 26M30 -18L30 14M48 10L48 30M60 18L60 30', 0.3); missile(c, 46, 14, 16); missile(c, 54, 18, 13); plate(c, 25, -12, 4, 6); });
    band(c, 9, 40, 3, OR[1]); seam(c, 'M-11 -24L11 -24M-11 34L11 34', 0.4);
    hiLine(c, 'M-2 -58L-8 -32', 0.6, 0.8);
  } });

  efac('w9m', { w: 54, h: 54, cy: 0, parts: [
    { p: [[2, -4], [15, -17], [18, -15], [5, -1]], m: 'nb', s: 1 },
    { p: [[2, 4], [15, 17], [18, 15], [5, 1]], m: 'nb', s: 1 },
    { p: [[0, -12], [9, -9], [10, 8], [0, 12]], m: 'wh', s: 0 },
  ], det(c) { band(c, 9, 2, 2.4, OR[1]); sym(c, () => { ffan(c, 17, -17, 9, 0.2); ffan(c, 17, 17, 9, 0.6); }); } });

  // nœud : nacelle-canon blindée posée sur les soufflantes du boss
  D.w9n = Object.assign({}, EN, fac({ w: 60, h: 60, cy: 0, orient: 'none', parts: [
    { p: [[4, -34], [7, -34], [7, -18], [4, -18]], m: 'nb', s: 2 },
    { p: [[0, -20], [14, -20], [20, -12], [20, 14], [14, 20], [0, 20]], m: 'wh', s: 1 },
    { p: [[0, -20], [14, -20], [18, -14], [0, -14]], m: 'wh', s: 0 },
    { p: [[0, 8], [20, 8], [20, 12], [0, 12]], m: 'nb', s: 1 },
  ], det(c) {
    // ni points, ni barre, ni grille au centre (formaient un visage) : une seule trappe rectangulaire, bande orange sur la tranche
    sym(c, () => { F(c, [[3.6, -36], [7.4, -36], [7.4, -34], [3.6, -34]], FP.dark[1]); seam(c, 'M14 -14L14 8', 0.35); });
    seam(c, 'M-8 -12L8 -12L8 4L-8 4Z', 0.4); F(c, [[-20, 12], [20, 12], [20, 14.4], [-20, 14.4]], OR[1]);
  } }));

  // porte-appareils : deux ponts d'envol, îlot, noyau carré à lamelles, quatre soufflantes d'angle
  facS(D.w9boss = { occl: true, w: 330, h: 310, cy: 0, orient: 'none', down: true, parts: [
    { p: [[0, -146], [44, -140], [100, -96], [116, -24], [116, 84], [84, 134], [0, 146], [-84, 134], [-116, 84], [-116, -24], [-100, -96], [-44, -140]], m: 'wh', s: 1 },
    { p: [[-44, -140], [-100, -96], [-116, -24], [-116, 84], [-84, 134], [-60, 138], [-90, 84], [-92, -24], [-78, -92], [-36, -128]], m: 'wh', s: 0 },
    { p: [[44, -140], [100, -96], [116, -24], [116, 84], [84, 134], [60, 138], [90, 84], [92, -24], [78, -92], [36, -128]], m: 'wh', s: 2 },
    { p: [[-22, -136], [22, -136], [22, -54], [-22, -54]], m: 'nb', s: 2 },
    { p: [[-22, 54], [22, 54], [22, 136], [-22, 136]], m: 'nb', s: 2 },
    { p: [[-36, -36], [36, -36], [36, 36], [-36, 36]], m: 'nb', s: 3 },
    { p: [[-36, -36], [36, -36], [28, -28], [-28, -28]], m: 'nb', s: 1 },
    { p: [[-36, -36], [-28, -28], [-28, 28], [-36, 36]], m: 'nb', s: 2 },
    { p: [[70, -36], [100, -36], [100, 28], [70, 28]], m: 'wh', s: 1 },
    { p: [[70, -36], [100, -36], [96, -30], [74, -30]], m: 'wh', s: 0 },
    { p: [[96, -30], [100, -36], [100, 28], [96, 24]], m: 'wh', s: 3 },
  ], det(c) {
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) { const y = -24 + i * 9; F(c, [[-24, y], [24, y], [24, y + 3.4], [-24, y + 3.4]], hexA(CYAN, 0.4 + (i % 2) * 0.35)); }
    c.restore();
    F(c, [[-116, -6], [-36, -6], [-36, 0], [-116, 0]], hexA(OR[1], 0.85)); F(c, [[36, -6], [70, -6], [70, 0], [36, 0]], hexA(OR[1], 0.85)); F(c, [[100, -6], [116, -6], [116, 0], [100, 0]], hexA(OR[1], 0.85));
    for (const y0 of [-130, 60]) for (let y = y0; y < y0 + 72; y += 16) F(c, [[-1.2, y], [1.2, y], [1.2, y + 8], [-1.2, y + 8]], 'rgba(255,255,255,.8)');
    F(c, [[74, -24], [96, -24], [96, -18], [74, -18]], hexA(FP.glass[0], 0.9));
    seam(c, 'M-116 -40L-36 -40M36 -40L116 -40M-116 40L116 40M-60 -138L-60 138M60 -138L60 138', 0.25, 0.8);
    // pistes : bords clairs, seuils en touches, brins d'arrêt, traces de pneus
    for (const [y0, y1, d] of [[-136, -54, 1], [54, 136, -1]]) {
      F(c, [[-21, y0], [-19.6, y0], [-19.6, y1], [-21, y1]], 'rgba(255,255,255,.55)'); F(c, [[19.6, y0], [21, y0], [21, y1], [19.6, y1]], 'rgba(255,255,255,.55)');
      const ys = d > 0 ? y0 + 3 : y1 - 9; for (let x = -17; x < 17; x += 5) F(c, [[x, ys], [x + 3, ys], [x + 3, ys + 6], [x, ys + 6]], 'rgba(255,255,255,.7)');
      seam(c, [0, 1, 2].map(i => { const y = (d > 0 ? y1 - 10 : y0 + 10) - d * i * 6; return `M-20 ${y}L-4 ${y}M4 ${y}L20 ${y}`; }).join(''), 0.6, 0.7); // coupés sur l'axe (pas de croix)
      for (let i = 0; i < 5; i++) { const x = -15 + ((i * 7) % 9), y = (d > 0 ? y0 + 16 : y1 - 34) + i * 3.4; F(c, [[x, y], [x + 1.2, y], [x + 1.2, y + 16], [x, y + 16]], 'rgba(7,8,10,.22)'); }
    }
    // ascenseur d'appareils (contour et bandes de danger), passerelles le long des bords
    seam(c, 'M-104 46L-70 46L-70 76L-104 76Z', 0.55, 0.8);
    for (let x = -102; x < -72; x += 6) F(c, [[x, 47], [x + 3, 47], [x + 1.6, 49.6], [x - 1.4, 49.6]], hexA(OR[1], 0.8));
    sym(c, () => { F(c, [[112, -20], [116, -20], [116, 80], [112, 80]], FP.gm[2]); for (let y = -18; y < 80; y += 7) F(c, [[111, y], [116, y], [116, y + 1], [111, y + 1]], FP.gm[0]); });
    // appareils garés sur le pont (silhouettes en delta, placées sans symétrie)
    for (const [x, y, a] of [[-84, -58, 0.3], [-66, -76, 0.3], [-86, 104, -0.2], [52, -104, -0.5]]) {
      c.save(); c.translate(x, y); c.rotate(a); const j = [[0, -9], [2, -4], [7, 5], [2, 4], [1.6, 7], [-1.6, 7], [-2, 4], [-7, 5], [-2, -4]];
      c.strokeStyle = OUT; c.lineWidth = Math.max(0.8, px(0.6)); fpoly(c, j); c.stroke(); F(c, j, NB[1]); F(c, [[0, -7], [1, -3], [-1, -3]], hexA(FP.glass[0], 0.9)); c.restore();
    }
    // îlot : barre radar et mât sans vergue
    F(c, [[76, -32], [94, -32], [94, -29], [76, -29]], FP.gm[2]); F(c, [[84.4, -12], [85.6, -12], [85.6, 18], [84.4, 18]], FP.gm[3]);
    dots(c, [[-90, 10], [90, 50], [-30, -100], [30, 100], [64, 112]], 1.3); // (aucune paire symétrique)
    for (const [x, y, a] of [[-104, -86, 0.2], [104, -86, 0.7], [-104, 86, 1.1], [104, 86, 1.6]]) ffan(c, x, y, 32, a);
    hiLine(c, 'M-40 -138L-96 -94L-112 -26', 0.55, 1.1);
  } });

  /* ---------------- 10 · FRÉQUENCE ZÉRO : or et lapis en Facettes, entrelacs géométriques ----------------
     Médaillons en étoiles à facettes pleines (khatam) : aucun anneau concentrique, aucun centre sombre ni lumineux. */
  const LA = FP.la, GO = FP.go;
  // entrelacs d'étoiles à huit branches, découpé à la forme
  const girihF = (c, pts, r = 10) => clipP(c, pts, () => {
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    c.strokeStyle = hexA(GO[0], 0.4); c.lineWidth = Math.max(0.7, px(0.6)); c.beginPath();
    for (let x = x0 - r; x < x1 + r; x += r * 2) for (let y = y0 - r; y < y1 + r; y += r * 2) for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, b = (i + 3) / 8 * TAU; c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); c.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r); }
    c.stroke();
  });
  // étoile à n branches taillée en pyramide (facettes triangulaires vers le centre)
  function starF(c, x, y, n, R, r, a0, P, ow = Math.max(1.5, px(1.15))) {
    const V = Array.from({ length: n * 2 }, (_, k) => { const a = a0 + k / (n * 2) * TAU, rr = k % 2 ? r : R; return [x + Math.cos(a) * rr, y + Math.sin(a) * rr]; });
    c.strokeStyle = OUT; c.lineWidth = ow * 2; c.lineJoin = 'round'; fpoly(c, V); c.stroke();
    for (let k = 0; k < n * 2; k++) {
      const j = (k + 1) % (n * 2), am = a0 + (k + 0.5) / (n * 2) * TAU, v = -0.6 * Math.cos(am) - 0.8 * Math.sin(am);
      F(c, [[x, y], V[k], V[j]], P[Math.max(0, Math.min(4, Math.round((1 - v) * 1.5 + (k % 2) * 0.7)))]);
    }
    return V;
  }
  // chevrons gravés (pointe vers l'arrière), en colonne sur l'axe x
  const chev = (c, x, y0, n, w = 2.4, gap = 6, col = GO[0]) => { c.strokeStyle = col; c.lineWidth = Math.max(0.7, px(0.6)); c.beginPath(); for (let i = 0; i < n; i++) { const y = y0 + i * gap; c.moveTo(x - w, y); c.lineTo(x, y + w * 0.7); c.lineTo(x + w, y); } c.stroke(); };
  // lame d'arme dorée (canon effilé vers l'avant)
  const blade = (c, x, y, l, w = 1.6) => { F(c, [[x - w, y], [x, y - l], [x + w, y]], GO[1]); F(c, [[x, y], [x, y - l], [x + w, y]], GO[3]); c.strokeStyle = 'rgba(7,8,10,.6)'; c.lineWidth = Math.max(0.5, px(0.45)); fpoly(c, [[x - w, y], [x, y - l], [x + w, y]]); c.stroke(); };
  const edge = (c, pts, col = GO[1], w = 1.8) => { c.strokeStyle = col; c.lineWidth = Math.max(w, px(0.9)); c.beginPath(); pts.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.stroke(); };

  efac('w10a', { wear: 1001, w: 104, h: 112, cy: 0, parts: [
    { p: [[8, -22], [52, 26], [52, 38], [8, 34]], m: 'la', s: 1 },
    { p: [[46, 18], [51, 8], [52, 26], [52, 38], [47, 36]], m: 'go', s: 1 },
    { p: [[0, -56], [5, -48], [10, -22], [12, 20], [10, 42], [9, 48], [0, 48]], m: 'go', s: 0 },
    { p: [[6, -44], [10, -22], [12, 20], [10, 42], [9, 48], [8, 20]], m: 'go', s: 2 },
    { p: [[0, -40], [4, -34], [5.5, -22], [0, -14]], m: 'la', s: 3 },
  ], det(c) {
    eflame(c, 0, 48, 5, 12, GOLD);
    sym(c, () => { girihF(c, [[10, -18], [46, 21], [47, 36], [10, 34]], 7); edge(c, [[10, -20], [46, 20]]); edge(c, [[12, 34], [46, 36]], GO[2], 1.2); seam(c, 'M8 -10L8 40', 0.35); blade(c, 20, -6, 12); });
    F(c, [[-2.4, -8], [2.4, -8], [2.4, 38], [-2.4, 38]], LA[2]); F(c, [[-2.4, -8], [0, -8], [0, 38], [-2.4, 38]], LA[1]); chev(c, 0, -4, 7, 2.2, 6);
    hiLine(c, 'M-2 -52L-8 -24', 0.6, 0.8);
  } });

  efac('w10b', { wear: 1009, w: 116, h: 120, cy: 0, parts: [
    { p: [[0, -8], [28, -6], [28, 14], [0, 16]], m: 'la', s: 1 },
    { p: [[30, 22], [52, 42], [50, 54], [30, 48]], m: 'la', s: 1 },
    { p: [[24, -56], [28, -60], [32, -56], [36, -20], [36, 40], [34, 54], [22, 54], [20, 40], [20, -20]], m: 'go', s: 1 },
    { p: [[0, -40], [8, -32], [11, -10], [10, 10], [7, 24], [0, 24]], m: 'la', s: 0 },
    { p: [[0, -32], [4, -28], [5, -18], [0, -14]], m: 'la', s: 3 },
  ], det(c) {
    sym(c, () => { eflame(c, 28, 54, 4, 12, GOLD); F(c, [[26.4, -34], [29.6, -34], [29.6, 30], [26.4, 30]], LA[2]); chev(c, 28, -30, 9, 1.4, 6.4); seam(c, 'M20 -10L36 -10M20 26L36 26M20 40L36 40', 0.35); girihF(c, [[30, 22], [52, 42], [50, 54], [30, 48]], 6); edge(c, [[30, 22], [52, 42]]); blade(c, 34, -40, 10, 1.3); });
    girihF(c, [[0, -40], [8, -32], [11, -10], [10, 10], [7, 24], [-7, 24], [-10, 10], [-11, -10], [-8, -32]], 6);
    hiLine(c, 'M-2 -36L-8 -10', 0.55, 0.8);
  } });

  efac('w10c', { wear: 1017, w: 146, h: 170, cy: 0, parts: [
    { p: [[38, -46], [50, -46], [52, -36], [52, 40], [44, 50], [36, 40], [36, -36]], m: 'go', s: 1 },
    { p: [[0, -80], [12, -70], [24, -42], [28, 20], [24, 60], [18, 78], [16, 82], [0, 82]], m: 'la', s: 0 },
    { p: [[18, -58], [24, -42], [28, 20], [24, 60], [18, 78], [16, 82], [20, 20]], m: 'la', s: 2 },
    { p: [[0, -6], [26.6, -6], [27.2, -1], [0, -1]], m: 'go', s: 1 },
    { p: [[0, 40], [25.6, 40], [25, 45], [0, 45]], m: 'go', s: 1 },
    { p: [[0, -66], [6, -58], [8, -46], [0, -38]], m: 'glass', s: 0 },
  ], det(c) {
    girihF(c, [[0, -80], [12, -70], [24, -42], [28, 20], [24, 60], [18, 78], [-18, 78], [-24, 60], [-28, 20], [-24, -42], [-12, -70]], 10);
    F(c, [[-1.2, -80], [1.2, -80], [1.2, 82], [-1.2, 82]], GO[1]);
    starF(c, 0, 20, 8, 13, 9, -Math.PI / 2, GO);
    for (const x of [-10, 10]) eflame(c, x, 82, 4, 12, GOLD);
    sym(c, () => { eflame(c, 44, 50, 5, 13, GOLD); seam(c, 'M44 -40L44 -16M44 8L44 40M36 -16L52 -16M36 8L52 8', 0.35); F(c, [[42.4, -14], [45.6, -14], [45.6, 6], [42.4, 6]], LA[2]); chev(c, 44, -12, 3, 1.4, 6); blade(c, 44, -46, 14, 1.8); edge(c, [[12, -70], [24, -42], [28, 20], [24, 60]], GO[1], 1.4); });
    hiLine(c, 'M-4 -76L-18 -50', 0.55, 0.9);
  } });

  efac('w10d', { w: 36, h: 118, cy: 0, parts: [
    { p: [[5, 28], [16, 42], [16, 54], [5, 50]], m: 'la', s: 1 },
    { p: [[0, -60], [4, -42], [7, -12], [7, 40], [6, 52], [0, 52]], m: 'go', s: 0 },
    { p: [[4, -42], [7, -12], [7, 40], [6, 52], [5, 0]], m: 'go', s: 2 },
  ], det(c) { F(c, [[-3, -30], [3, -30], [3, 30], [-3, 30]], LA[2]); F(c, [[-3, -30], [0, -30], [0, 30], [-3, 30]], LA[1]); chev(c, 0, -26, 9, 2.2, 6.4); sym(c, () => edge(c, [[5, 28], [16, 42]], GO[0], 1.2)); eflame(c, 0, 54, 4, 14, GOLD); hiLine(c, 'M-1.5 -54L-5 -32', 0.6, 0.8); } });

  efac('w10e', { wear: 1029, w: 140, h: 124, cy: 0, parts: [
    { p: [[0, -40], [24, -34], [66, 10], [64, 24], [30, 30], [14, 44], [0, 46]], m: 'la', s: 1 },
    { p: [[24, -34], [66, 10], [64, 24], [30, 30], [36, 6]], m: 'la', s: 2 },
    { p: [[60, 4], [66, -6], [68, 10], [66, 26], [62, 24]], m: 'go', s: 1 },
  ], det(c) {
    girihF(c, [[0, -40], [24, -34], [66, 10], [64, 24], [30, 30], [14, 44], [0, 46], [-14, 44], [-30, 30], [-64, 24], [-66, 10], [-24, -34]], 9);
    sym(c, () => { edge(c, [[24, -34], [60, 4]]); edge(c, [[30, 30], [14, 44]], GO[2], 1.2); eflame(c, 14, 44, 4, 11, GOLD); blade(c, 40, -10, 12); blade(c, 48, -2, 10, 1.4); });
    starF(c, 0, 2, 8, 26, 18, -Math.PI / 2, GO);
    hiLine(c, 'M-20 -34L-60 6', 0.5, 0.9);
  } });

  // petit chevron d'or, incrustation de lapis
  efac('w10m', { w: 42, h: 56, cy: 0, parts: [
    { p: [[0, -26], [14, 6], [8, 12], [0, 6]], m: 'go', s: 0 },
    { p: [[0, -14], [6, 2], [3, 4], [0, 1]], m: 'la', s: 1 },
  ], det(c) { eflame(c, 0, 8, 3, 8, GOLD); sym(c, () => edge(c, [[2, -18], [12, 5]], GO[3], 0.8)); hiLine(c, 'M-1 -22L-8 0', 0.55, 0.8); } });

  // nœud : étoile d'or taillée (tourne autour du boss)
  mk('w10n', { w: 52, h: 52, cy: 0, orient: 'none', down: false, facet: true }, c => starF(c, 0, 0, 8, 25, 17, -Math.PI / 2, GO));

  // grande étoile de lapis à entrelacs, étoile d'or, cœur taillé en pyramide (aucun disque)
  mk('w10boss', { w: 360, h: 360, cy: 0, orient: 'none', down: false, facet: true }, c => {
    const V = starF(c, 0, 0, 8, 172, 118, -Math.PI / 2, LA, Math.max(2, px(1.4)));
    girihF(c, V, 18);
    c.strokeStyle = GOLD; c.lineWidth = 3; fpoly(c, V); c.stroke();
    // branches de lapis : chevrons gravés vers la pointe (sans trait central : il ferait plume)
    for (let i = 0; i < 8; i++) { c.save(); c.rotate(i / 8 * TAU); chev(c, 0, -130, 3, 6, 9, hexA(GO[0], 0.7)); c.restore(); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU - Math.PI / 2, x = Math.cos(a) * 142, y = Math.sin(a) * 142, O = octo(x, y, 10); c.strokeStyle = OUT; c.lineWidth = 3; fpoly(c, O); c.stroke(); F(c, O, GO[2]); F(c, [O[3], O[4], O[5], O[6], [x, y]], GO[1]); }
    // lames d'or dans les creux de la grande étoile (vers l'extérieur)
    for (let i = 0; i < 8; i++) { c.save(); c.rotate((i + 0.5) / 8 * TAU); c.strokeStyle = OUT; c.lineWidth = 2.6; fpoly(c, [[-4.4, -112], [0, -150], [4.4, -112]]); c.stroke(); blade(c, 0, -112, 38, 4.4); c.restore(); }
    const V2 = starF(c, 0, 0, 8, 112, 78, -Math.PI / 2 + Math.PI / 8, GO);
    // filets d'or gravés parallèles aux bords de l'étoile d'or, incrustations de lapis en losange sur ses pointes
    c.save(); c.scale(0.86, 0.86); c.strokeStyle = hexA(GO[4], 0.55); c.lineWidth = Math.max(0.8, px(0.6)); fpoly(c, V2); c.stroke(); c.restore();
    for (let i = 0; i < 8; i++) { c.save(); c.rotate(i / 8 * TAU + Math.PI / 8); const d = [[0, -100], [4, -90], [0, -80], [-4, -90]]; c.strokeStyle = OUT; c.lineWidth = 1.6; fpoly(c, d); c.stroke(); F(c, d, LA[1]); F(c, [[0, -100], [4, -90], [0, -90]], LA[0]); c.restore(); }
    starF(c, 0, 0, 8, 60, 44, -Math.PI / 2, GO);
    c.save(); c.scale(0.8, 0.8); c.strokeStyle = hexA(GO[4], 0.5); c.lineWidth = Math.max(0.8, px(0.6)); fpoly(c, Array.from({ length: 16 }, (_, k) => { const a = -Math.PI / 2 + k / 16 * TAU, rr = k % 2 ? 44 : 60; return [Math.cos(a) * rr, Math.sin(a) * rr]; })); c.stroke(); c.restore();
  });

  /* ---------------- 11 · 1902, LE VOYAGE : accessoires de théâtre en carton, tôle et laiton ----------------
     Univers en noir et blanc (filtre sur l'écran de jeu) : les tons sont choisis pour leur valeur (clair / foncé), pas leur teinte.
     Aucun visage : la Lune est un disque à cratères, les étoiles sont des étoiles de carton nues. */
  const IV = FP.iv, BR2 = FP.br, WD = FP.wd;
  // rangée de rivets en travers de la coque (une rangée, jamais une paire)
  const rivRow = (c, y, x0, x1, n) => { const p = []; for (let i = 0; i < n; i++) p.push([x0 + (x1 - x0) * i / (n - 1), y]); dots(c, p, 0.75); };
  // hélice vue de dessus : deux pales fines croisées, sans disque ni moyeu rond
  const blades2 = (c, x, y, r, a = 0.4) => { for (let i = 0; i < 2; i++) { c.save(); c.translate(x, y); c.rotate(a + i * Math.PI / 2); const bl = [[-r * 0.08, -r], [r * 0.08, -r], [r * 0.05, r], [-r * 0.05, r]]; c.strokeStyle = OUT; c.lineWidth = Math.max(1, px(0.8)); fpoly(c, bl); c.stroke(); c.fillStyle = WD[1]; c.fill(); c.restore(); } };
  // traînée peinte (bandes qui s'effilent vers l'arrière) : décor de théâtre, pas une flamme
  const paintTail = (c, y, w, len, col = IV[1]) => { for (const [x, k] of [[0, 1], [-w * 0.55, 0.7], [w * 0.55, 0.62]]) { c.strokeStyle = OUT; c.lineWidth = Math.max(1, px(0.8)); fpoly(c, [[x - w * 0.22, y], [x + w * 0.22, y], [x, y + len * k]]); c.stroke(); c.fillStyle = col; c.fill(); } };

  // Obus-fusée : coque d'obus à ogive, quatre ailettes, bandes rivetées
  efac('w11a', { wear: 1101, w: 62, h: 124, cy: 0, parts: [
    { p: [[14, 20], [30, 40], [30, 54], [14, 46]], m: 'gm', s: 1 },
    { p: [[0, -60], [7, -50], [13, -32], [16, -8], [16, 38], [14, 46], [0, 46]], m: 'al', s: 0 },
    { p: [[0, -60], [7, -50], [11, -38], [0, -38]], m: 'br', s: 1 },
    { p: [[0, 46], [11, 46], [9, 54], [0, 54]], m: 'dark', s: 0 },
  ], det(c) {
    seam(c, 'M-11 -38L11 -38M-16 -8L16 -8M-16 22L16 22', 0.5); rivRow(c, -34, -10, 10, 6); rivRow(c, -4, -13, 13, 7); rivRow(c, 26, -13, 13, 7);
    F(c, [[-1.6, -28], [1.6, -28], [1.6, -14], [-1.6, -14]], FP.glass[1]);
    hiLine(c, 'M-4 -54L-12 -20L-13 30', 0.55, 0.9); eflame(c, 0, 54, 5, 14, '#F2E6CC');
  } });

  // Aérostat rayé : petit ballon en fuseau peint à bandes, nacelle-canon dessous, gouvernail de toile
  efac('w11b', { wear: 1109, w: 64, h: 120, cy: 0, parts: [
    { p: [[0, 34], [14, 46], [14, 56], [0, 52]], m: 'fa', s: 1 },
    { p: [[0, -56], [10, -46], [17, -22], [18, 6], [15, 30], [8, 44], [0, 48]], m: 'iv', s: 0 },
    { p: [[0, -10], [7, -10], [7, 20], [0, 20]], m: 'wd', s: 1 },
  ], det(c) {
    clipP(c, [[0, -56], [10, -46], [17, -22], [18, 6], [15, 30], [8, 44], [0, 48], [-8, 44], [-15, 30], [-18, 6], [-17, -22], [-10, -46]], () => { for (let y = -50; y < 50; y += 12) F(c, [[-20, y], [20, y], [20, y + 5], [-20, y + 5]], 'rgba(30,24,18,.35)'); });
    F(c, [[-1.8, 18], [1.8, 18], [1.8, 30], [-1.8, 30]], FP.gm[1]); seam(c, 'M0 -56L0 48', 0.25);
    hiLine(c, 'M-5 -48L-14 -18', 0.6, 0.9);
  } });

  // Grand obus blindé : coque épaisse, six ailettes, ceintures de tôle rivetées, fentes de visée sur l'axe
  efac('w11c', { wear: 1117, w: 120, h: 168, cy: 0, parts: [
    { p: [[22, 26], [56, 56], [56, 74], [22, 62]], m: 'gm', s: 1 },
    { p: [[16, -10], [34, 6], [34, 18], [16, 10]], m: 'gm', s: 2 },
    { p: [[0, -82], [12, -70], [22, -46], [27, -14], [28, 52], [24, 64], [0, 64]], m: 'al', s: 1 },
    { p: [[0, -82], [12, -70], [18, -56], [0, -56]], m: 'br', s: 0 },
    { p: [[0, -30], [28, -30], [28, -22], [0, -22]], m: 'br', s: 1 },
    { p: [[0, 30], [28, 30], [28, 38], [0, 38]], m: 'br', s: 1 },
    { p: [[0, 64], [18, 64], [15, 76], [0, 76]], m: 'dark', s: 0 },
  ], det(c) {
    rivRow(c, -52, -14, 14, 7); rivRow(c, -26, -24, 24, 9); rivRow(c, 34, -24, 24, 9); rivRow(c, 58, -20, 20, 8);
    seam(c, 'M-27 -2L27 -2M-28 16L28 16', 0.45);
    F(c, [[-2, -48], [2, -48], [2, -36], [-2, -36]], FP.glass[1]); F(c, [[-2, -14], [2, -14], [2, 10], [-2, 10]], FP.glass[1]);
    plate(c, 8, 42, 14, 12); hiLine(c, 'M-6 -76L-20 -40L-24 40', 0.55, 1);
    for (const x of [-8, 8]) eflame(c, x, 76, 5, 15, '#F2E6CC');
  } });

  // Comète : fléchette de tôle à traîne peinte (bandes de carton effilées)
  efac('w11d', { w: 44, h: 130, cy: 0, parts: [
    { p: [[0, -64], [6, -46], [9, -14], [8, 14], [0, 20]], m: 'al', s: 0 },
    { p: [[6, 0], [16, 16], [16, 24], [6, 16]], m: 'gm', s: 1 },
  ], det(c) { paintTail(c, 18, 9, 44); F(c, [[-1.4, -40], [1.4, -40], [1.4, -26], [-1.4, -26]], FP.glass[1]); rivRow(c, -10, -6, 6, 4); hiLine(c, 'M-2 -58L-6 -20', 0.6, 0.8); } });

  // Cerf-volant cellulaire (Hargrave, 1893) : deux cellules de toile reliées par des longerons, haubans croisés
  efac('w11e', { wear: 1129, w: 132, h: 130, cy: 0, parts: [
    { p: [[2, -50], [4, -50], [4, 50], [2, 50]], m: 'wd', s: 1 },
    { p: [[0, -58], [60, -58], [60, -20], [0, -20]], m: 'fa', s: 0 },
    { p: [[0, 18], [60, 18], [60, 56], [0, 56]], m: 'fa', s: 1 },
  ], det(c) {
    sym(c, () => { seam(c, 'M0 -58L60 -20M60 -58L0 -20M0 18L60 56M60 18L0 56', 0.35); F(c, [[56, -58], [60, -58], [60, -20], [56, -20]], WD[2]); F(c, [[56, 18], [60, 18], [60, 56], [56, 56]], WD[2]); seam(c, 'M20 -58L20 -20M40 -58L40 -20M20 18L20 56M40 18L40 56', 0.25); });
    F(c, [[-62, -40], [62, -40], [62, -37], [-62, -37]], WD[1]); F(c, [[-62, 36], [62, 36], [62, 39], [-62, 39]], WD[1]);
    hiLine(c, 'M-58 -56L-4 -56M-58 20L-4 20', 0.5, 0.9);
  } });

  // petit obus de mitraille
  efac('w11m', { w: 26, h: 50, cy: 0, parts: [
    { p: [[0, -24], [5, -16], [7, 0], [7, 16], [0, 18]], m: 'al', s: 0 },
    { p: [[5, 8], [11, 18], [11, 23], [5, 18]], m: 'gm', s: 1 },
  ], det(c) { rivRow(c, -4, -5, 5, 3); eflame(c, 0, 18, 3, 9, '#F2E6CC'); hiLine(c, 'M-1.5 -20L-4 -4', 0.6, 0.7); } });

  // nœud : étoile de carton à cinq branches, accrochée à son fil
  mk('w11n', { w: 58, h: 66, cy: 4, orient: 'none', down: false, facet: true }, c => {
    c.strokeStyle = 'rgba(230,230,230,.7)'; c.lineWidth = Math.max(0.8, px(0.6)); c.beginPath(); c.moveTo(0, -24); c.lineTo(0, -34); c.stroke();
    starF(c, 0, 4, 5, 28, 12, -Math.PI / 2, IV);
    c.strokeStyle = 'rgba(40,34,26,.25)'; c.lineWidth = Math.max(0.6, px(0.45)); c.beginPath(); for (let k = -24; k < 26; k += 5) { c.moveTo(k, -20); c.lineTo(k + 12, 28); } c.stroke();
  });

  // La Lune de théâtre : grand disque peint à cratères (sans visage), suspendu à un portique de bois par cordes et moufles
  mk('w11boss', { w: 330, h: 330, cy: 0, orient: 'none', down: false, facet: true }, c => {
    const beam = [[-160, -152], [160, -152], [160, -136], [-160, -136]];
    for (const x of [-150, 140]) { const post = [[x, -150], [x + 10, -150], [x + 10, 150], [x, 150]]; c.strokeStyle = OUT; c.lineWidth = 3; fpoly(c, post); c.stroke(); F(c, post, WD[2]); F(c, [[x, -150], [x + 3, -150], [x + 3, 150], [x, 150]], WD[1]); }
    c.strokeStyle = OUT; c.lineWidth = 3; fpoly(c, beam); c.stroke(); F(c, beam, WD[1]); F(c, [[-160, -152], [160, -152], [160, -148], [-160, -148]], WD[0]);
    seam(c, 'M-100 -152L-100 -136M-30 -152L-30 -136M50 -152L50 -136M120 -152L120 -136', 0.5);
    // cordes et moufles (placées sans symétrie)
    c.strokeStyle = '#D8D2C2'; c.lineWidth = 2;
    for (const [x0, x1, y1] of [[-96, -78, -88], [44, 70, -96], [118, 96, -40]]) { c.beginPath(); c.moveTo(x0, -136); c.lineTo(x1, y1); c.stroke(); }
    for (const [x, y] of [[-100, -128], [42, -128]]) { const b = [[x - 7, y], [x + 7, y], [x + 7, y + 16], [x - 7, y + 16]]; c.strokeStyle = OUT; c.lineWidth = 2; fpoly(c, b); c.stroke(); F(c, b, BR2[1]); }
    // contrepoids : sacs de sable (deux à droite, un à gauche, à des hauteurs différentes)
    c.strokeStyle = '#D8D2C2'; c.lineWidth = 1.6; for (const [x, y] of [[-132, 60], [124, 20], [130, 96]]) { c.beginPath(); c.moveTo(x, -136); c.lineTo(x, y - 14); c.stroke(); }
    for (const [x, y] of [[-132, 60], [124, 20], [130, 96]]) { const s = [[x - 11, y - 14], [x + 11, y - 14], [x + 13, y + 12], [x - 13, y + 12]]; c.strokeStyle = OUT; c.lineWidth = 2; fpoly(c, s); c.stroke(); F(c, s, FP.fa[2]); seam(c, `M${x - 12} ${y - 2}L${x + 12} ${y - 2}`, 0.4); }
    // le disque peint, bord de carton épais
    c.fillStyle = OUT; c.beginPath(); c.arc(0, 14, 120, 0, TAU); c.fill();
    BG.moon(c, 0, 14, 115, 1902, ['#F4F2EC', '#BDBAB2', '#6E6C66'], '20,20,22');
    c.strokeStyle = 'rgba(40,36,30,.5)'; c.lineWidth = 3; c.beginPath(); c.arc(0, 14, 117, 0, TAU); c.stroke();
    // tasseaux de fixation au dos (visibles sur le bord)
    for (const a of [-2.2, -0.7, 1.4]) { const x = Math.cos(a) * 116, y = 14 + Math.sin(a) * 116; F(c, [[x - 5, y - 5], [x + 5, y - 5], [x + 5, y + 5], [x - 5, y + 5]], WD[1]); }
  });

  /* ---------------- 12 · RELIEF : maquettes de bois, papier et laiton au-dessus d'un plan-relief ----------------
     Projets réels de machines volantes (1784-1868) construits en maquettes ; l'univers est vu en fausse 3D (horizon, sol en perspective). */
  // nervures de toile (ailes de maquette)
  const ribsM = (c, x0, y0, x1, y1, n, a = 0.3) => { c.strokeStyle = `rgba(60,44,28,${a})`; c.lineWidth = Math.max(0.6, px(0.5)); c.beginPath(); for (let i = 1; i < n; i++) { const x = x0 + (x1 - x0) * i / n; c.moveTo(x, y0); c.lineTo(x, y1); } c.stroke(); };

  // « Aerial Steam Carriage » (Henson, 1842) : grande aile rectangulaire à nervures, deux hélices propulsives, queue en éventail
  efac('w12a', { wear: 1201, w: 150, h: 110, cy: 0, parts: [
    { p: [[0, 30], [14, 34], [24, 52], [0, 54]], m: 'fa', s: 1 },
    { p: [[6, -22], [74, -18], [74, 6], [6, 4]], m: 'fa', s: 0 },
    { p: [[0, -46], [6, -36], [8, -10], [7, 32], [0, 36]], m: 'wd', s: 1 },
  ], det(c) {
    sym(c, () => { ribsM(c, 6, -21, 74, 5, 9); F(c, [[6, -22], [74, -18], [74, -16], [6, -20]], WD[1]); blades2(c, 22, 14, 11, 0.5); });
    F(c, [[-1.6, -30], [1.6, -30], [1.6, -18], [-1.6, -18]], FP.gm[2]); seam(c, 'M0 34L0 54', 0.3);
    hiLine(c, 'M-60 -19L-8 -21', 0.5, 0.9);
  } });

  // planeur de Cayley (1853) : aile en cerf-volant, fuselage-barque, empennage en croix
  efac('w12b', { wear: 1209, w: 120, h: 116, cy: 0, parts: [
    { p: [[0, 26], [22, 40], [0, 46]], m: 'fa', s: 1 },
    { p: [[0, -34], [58, -8], [52, 0], [0, -4]], m: 'iv', s: 0 },
    { p: [[0, -52], [6, -40], [7, -6], [5, 44], [0, 50]], m: 'wd', s: 0 },
  ], det(c) {
    sym(c, () => { ribsM(c, 4, -30, 50, -4, 5, 0.25); seam(c, 'M4 -34L54 -6', 0.3); });
    F(c, [[-0.8, 24], [0.8, 24], [0.8, 54], [-0.8, 54]], WD[2]); F(c, [[-2, -28], [2, -28], [2, -16], [-2, -16]], BR2[1]);
    hiLine(c, 'M-4 -46L-6 -10', 0.6, 0.8);
  } });

  // dirigeable de Meusnier (1784) : enveloppe en fuseau, filet de cordes, nacelle-barque, trois hélices
  efac('w12c', { wear: 1217, w: 112, h: 176, cy: 0, parts: [
    { p: [[0, -84], [18, -70], [32, -34], [36, 6], [32, 44], [18, 74], [0, 84]], m: 'iv', s: 0 },
    { p: [[0, -24], [9, -22], [10, 30], [0, 34]], m: 'wd', s: 1 },
  ], det(c) {
    sym(c, () => { seam(c, 'M18 -70C30 -30 30 40 18 74M30 -40L10 -22M34 0L10 0M30 40L10 30', 0.3); });
    for (let y = -60; y <= 60; y += 20) seam(c, `M${-Math.sqrt(Math.max(0, 1 - (y / 84) ** 2)) * 34} ${y}L${Math.sqrt(Math.max(0, 1 - (y / 84) ** 2)) * 34} ${y}`, 0.18);
    blades2(c, 0, 40, 9, 0.3); blades2(c, -14, 8, 7, 0.9); blades2(c, 14, -4, 7, 0.2);
    hiLine(c, 'M-8 -78L-28 -40L-32 0', 0.55, 1);
  } });

  // fusée de Congreve (1804) : corps de tôle, ogive, longue baguette de guidage
  efac('w12d', { w: 34, h: 140, cy: 0, parts: [
    { p: [[0, 10], [1.4, 10], [1.4, 68], [0, 68]], m: 'wd', s: 1 },
    { p: [[0, -68], [6, -56], [8, -40], [8, 12], [0, 12]], m: 'fe', s: 1 },
    { p: [[0, -68], [6, -56], [7, -50], [0, -50]], m: 'br', s: 0 },
  ], det(c) { rivRow(c, -30, -6, 6, 4); rivRow(c, -6, -6, 6, 4); eflame(c, 0, 12, 6, 16, '#F2B36E'); hiLine(c, 'M-2 -62L-5 -40', 0.6, 0.8); } });

  // triplan de Stringfellow (1868) : trois plans décalés (bords de fuite visibles), deux hélices
  efac('w12e', { wear: 1229, w: 140, h: 120, cy: 0, parts: [
    { p: [[0, 34], [20, 40], [22, 50], [0, 52]], m: 'fa', s: 1 },
    { p: [[6, -8], [66, -8], [66, 14], [6, 14]], m: 'fa', s: 2 },
    { p: [[6, -20], [66, -20], [66, 2], [6, 2]], m: 'fa', s: 1 },
    { p: [[6, -32], [66, -32], [66, -10], [6, -10]], m: 'iv', s: 0 },
    { p: [[0, -48], [6, -40], [7, 0], [6, 40], [0, 44]], m: 'wd', s: 1 },
  ], det(c) {
    sym(c, () => { ribsM(c, 6, -31, 66, -11, 7, 0.22); blades2(c, 26, 22, 9, 0.6); seam(c, 'M66 -32L66 14', 0.4); });
    hiLine(c, 'M-62 -31L-8 -31', 0.5, 0.9);
  } });

  // fléchette de papier plié (maquette)
  efac('w12m', { w: 40, h: 56, cy: 0, parts: [
    { p: [[0, -26], [16, 18], [4, 14], [0, 22]], m: 'wh', s: 0 },
    { p: [[0, -26], [4, 14], [0, 22]], m: 'wh', s: 2 },
  ], det(c) { seam(c, 'M0 -26L0 22', 0.35); } });

  // nœud : canon de bastion sur affût de bois (pointe vers le joueur)
  mk('w12n', { w: 46, h: 62, cy: 4, orient: 'none', down: false, facet: true }, c => {
    const base = [[-16, -18], [16, -18], [18, 10], [-18, 10]]; c.strokeStyle = OUT; c.lineWidth = Math.max(2, px(1.4)); fpoly(c, base); c.stroke(); F(c, base, WD[1]); F(c, [[-16, -18], [16, -18], [16, -14], [-16, -14]], WD[0]);
    const bar = [[-5, -10], [5, -10], [4, 30], [-4, 30]]; fpoly(c, bar); c.stroke(); F(c, bar, FP.fe[1]); F(c, [[-5, -10], [0, -10], [0, 30], [-4, 30]], FP.fe[0]);
    F(c, [[-5.5, 24], [5.5, 24], [5.5, 30], [-5.5, 30]], BR2[1]); seam(c, 'M-12 -4L12 -4', 0.4);
  });

  // La Citadelle : forteresse bastionnée à cinq pointes (tracé à la Vauban) de plan-relief, glacis, fossé, casernes
  mk('w12boss', { w: 340, h: 340, cy: 0, orient: 'none', down: false, facet: true }, c => {
    const star = (R, r, a0 = -Math.PI / 2) => Array.from({ length: 10 }, (_, k) => { const a = a0 + k / 10 * TAU, rr = k % 2 ? r : R; return [Math.cos(a) * rr, Math.sin(a) * rr]; });
    const glacis = star(168, 120), ditch = star(150, 104), wall = star(138, 92), inner = star(112, 78);
    c.strokeStyle = OUT; c.lineWidth = 4; fpoly(c, glacis); c.stroke(); F(c, glacis, '#9AA67A');
    F(c, ditch, '#3E5A5E'); F(c, wall, '#B8A47E'); F(c, inner, '#D6C8A4');
    c.strokeStyle = 'rgba(60,44,28,.55)'; c.lineWidth = 1.6; fpoly(c, wall); c.stroke(); fpoly(c, inner); c.stroke();
    // demi-lunes (ravelins) entre les bastions
    for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k + 0.5) / 5 * TAU, cx = Math.cos(a) * 96, cy = Math.sin(a) * 96, t = [[cx + Math.cos(a) * 20, cy + Math.sin(a) * 20], [cx + Math.cos(a + 1.7) * 13, cy + Math.sin(a + 1.7) * 13], [cx + Math.cos(a - 1.7) * 13, cy + Math.sin(a - 1.7) * 13]]; c.strokeStyle = OUT; c.lineWidth = 2; fpoly(c, t); c.stroke(); F(c, t, '#B8A47E'); }
    // casernes, magasins et place d'armes (disposés sans symétrie, aucun repère au centre)
    for (const [x, y, w, h, a] of [[-60, -34, 48, 16, 0.2], [18, -58, 40, 14, -0.15], [34, 22, 16, 46, 0.1], [-46, 30, 52, 14, -0.1], [-8, 56, 24, 12, 0.4]]) {
      c.save(); c.translate(x, y); c.rotate(a); const b = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
      c.strokeStyle = OUT; c.lineWidth = 1.6; fpoly(c, b); c.stroke(); F(c, b, '#8E4E30'); F(c, [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, 0], [-w / 2, 0]], '#B37050'); c.restore();
    }
    c.strokeStyle = 'rgba(120,100,70,.35)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-96, 64); c.lineTo(-20, 8); c.lineTo(70, -40); c.stroke();
    // embrasures sur le rempart, chemin couvert sur le glacis
    c.strokeStyle = 'rgba(40,30,20,.5)'; c.lineWidth = 1; c.setLineDash([3, 5]); fpoly(c, star(158, 112)); c.stroke(); c.setLineDash([]);
    c.strokeStyle = 'rgba(255,248,230,.45)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-138 * Math.cos(0.31), -138 * Math.sin(0.31)); c.lineTo(0, -138); c.stroke();
  });

  /* ---------------- convoi à escorter (idée du bloc 4) : cargo porte-conteneurs, vue de dessus, nez en haut ---------------- */
  D.convoy = fac({ wear: 77, w: 44, h: 132, cy: 0, parts: [
    { p: [[0, -66], [9, -56], [17, -36], [19, -10], [19, 44], [16, 58], [0, 62]], m: 'gm', s: 1 },
    { p: [[0, 36], [15, 36], [15, 54], [0, 54]], m: 'wh', s: 0 },
  ], det(c) {
    const cols = [FP.rd[1], FP.nv[1], FP.or[1], FP.gn[1], FP.nv[2], FP.rd[2]];
    for (let i = 0; i < 6; i++) { const y = -42 + i * 12.5; F(c, [[-15, y], [-1, y], [-1, y + 10.5], [-15, y + 10.5]], cols[i]); F(c, [[1, y], [15, y], [15, y + 10.5], [1, y + 10.5]], cols[(i * 4 + 1) % 6]); seam(c, `M-15 ${y + 5}L15 ${y + 5}`, 0.25); }
    F(c, [[-10, 38], [10, 38], [10, 41], [-10, 41]], FP.glass[1]); F(c, [[3, 44], [9, 44], [9, 52], [3, 52]], FP.dark[2]);
    seam(c, 'M0 -66L0 -46', 0.4); hiLine(c, 'M-6 -58L-16 -30', 0.5, 0.8); eflame(c, 0, 62, 5, 14, '#F2C08A');
  } });

  Art.kit = { S, paint, glass, lamp, nozzle, prop, rotor, fan, TN, eline, clipTo, fill, strk, rivets, nac, jet, sy, px };
})();
