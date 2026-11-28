'use strict';
/* =========================================================
   INTERFÉRENCE — bibliothèque graphique
   Vaisseaux vectoriels courbes, ombrés « métal », mis en cache.
   Aucun visage, aucun être vivant : uniquement des machines,
   des phénomènes météo et de la géométrie.
   ========================================================= */
const Art = (() => {
  const AMBER = '#E8A15A', MINT = '#8AD6A8', CRIMSON = '#C8645A', ICE = '#A9CFE0', GOLDL = '#E9C979', WARM = '#F0C88A', SEAM = '#D9705F';
  const MAT = {
    pearl:   ['#5E6066', '#E4E5E8', '#F8F8F9', '#6C6E74'],
    wing:    ['#F4F4F6', '#DADBDF', '#BFC1C6', '#7C7E84'],
    graphite:['#141518', '#3E4046', '#2A2B2F', '#131416'],
    gun:     ['#17181B', '#4A4C52', '#2C2D31', '#141518'],
    glass:   ['#0C0F14', '#4A5464', '#283040', '#0C0F14'],
    steel:   ['#2E343C', '#9AA4AF', '#C3CBD4', '#3A424C'],
    alu:     ['#6E7278', '#D9DCE0', '#F2F3F5', '#7E8288'],
    brass:   ['#5A4220', '#C29A55', '#E8CF98', '#6E5228'],
    copper:  ['#4A2A1A', '#B8734A', '#E0A57E', '#5A3220'],
    iron:    ['#1C2629', '#56696D', '#86999C', '#243136'],
    olive:   ['#33302A', '#7E7A62', '#999478', '#3D3A2F'],
    navy:    ['#262E38', '#75808D', '#A0A9B4', '#303843'],
    fabric:  ['#5C5446', '#ADA591', '#CEC6B2', '#6A6252'],
    redfab:  ['#4A2A24', '#8A5A4C', '#A8766A', '#55332C'],
    sand:    ['#6A5642', '#BFA582', '#DCC6A2', '#7A6550'],
    ivory:   ['#77705F', '#DED6C2', '#F2ECDC', '#878070'],
    lapis:   ['#091A3C', '#284A88', '#3A5FA0', '#0F2654'],
    gold:    ['#5E4612', '#BF9A45', '#EBD38A', '#7A5C1E'],
    white:   ['#94969E', '#ECEDF0', '#FFFFFF', '#A0A2AA'],
    dark:    ['#0A0B0C', '#26272B', '#34363B', '#0F1012'],
    mecha:   ['#5A6068', '#D8DEE4', '#EEF2F6', '#68707A'],
    cloud:   ['#5E5A62', '#A9A4AA', '#C9C3C6', '#6E686E'],
    solar:   ['#141C2C', '#34466A', '#4A5E86', '#18223A'],
  };
  const SPH = {
    iron: ['#A7BABD', '#56696D', '#121A1C'], brass: ['#F3DFAE', '#B8904A', '#3E2C12'], silver: ['#FFFFFF', '#A9AEB4', '#33373D'],
    gold: ['#FFF0BE', '#C9A24A', '#4E3A10'], graphite: ['#6A6C72', '#2A2B2F', '#0B0C0E'], pale: ['#FFFFFF', '#DADCE0', '#8A8E94'],
    gray: ['#D0D0D0', '#7E7E7E', '#262626'], rock: ['#9C958C', '#5E5852', '#1E1C1A'],
  };

  /* ---------- générateurs de chemins SVG ---------- */
  const n2 = v => +v.toFixed(2);
  const C = (cx, cy, r) => `M${n2(cx - r)} ${n2(cy)}A${r} ${r} 0 1 0 ${n2(cx + r)} ${n2(cy)}A${r} ${r} 0 1 0 ${n2(cx - r)} ${n2(cy)}Z`;
  const E = (cx, cy, rx, ry) => `M${n2(cx - rx)} ${n2(cy)}A${rx} ${ry} 0 1 0 ${n2(cx + rx)} ${n2(cy)}A${rx} ${ry} 0 1 0 ${n2(cx - rx)} ${n2(cy)}Z`;
  const RR = (x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); return `M${n2(x + r)} ${n2(y)}H${n2(x + w - r)}A${r} ${r} 0 0 1 ${n2(x + w)} ${n2(y + r)}V${n2(y + h - r)}A${r} ${r} 0 0 1 ${n2(x + w - r)} ${n2(y + h)}H${n2(x + r)}A${r} ${r} 0 0 1 ${n2(x)} ${n2(y + h - r)}V${n2(y + r)}A${r} ${r} 0 0 1 ${n2(x + r)} ${n2(y)}Z`; };
  const POLY = (n, r, rot = -Math.PI / 2, cx = 0, cy = 0) => { let d = ''; for (let i = 0; i < n; i++) { const a = rot + i / n * TAU; d += (i ? 'L' : 'M') + n2(cx + Math.cos(a) * r) + ' ' + n2(cy + Math.sin(a) * r); } return d + 'Z'; };
  const STAR = (n, ro, ri, rot = -Math.PI / 2, cx = 0, cy = 0) => { let d = ''; for (let i = 0; i < n * 2; i++) { const a = rot + i / (n * 2) * TAU, r = i % 2 ? ri : ro; d += (i ? 'L' : 'M') + n2(cx + Math.cos(a) * r) + ' ' + n2(cy + Math.sin(a) * r); } return d + 'Z'; };
  const GEAR = (r, teeth, depth = 0.17, rot = 0, cx = 0, cy = 0) => { let d = ''; const n = teeth * 4; for (let i = 0; i < n; i++) { const a = rot + i / n * TAU, k = i % 4, rr = (k === 0 || k === 1) ? r : r * (1 - depth); d += (i ? 'L' : 'M') + n2(cx + Math.cos(a) * rr) + ' ' + n2(cy + Math.sin(a) * rr); } return d + 'Z'; };

  /* ---------- primitives de dessin ---------- */
  const PC = new Map();
  const path = d => { let p = PC.get(d); if (!p) { p = new Path2D(d); PC.set(d, p); } return p; };
  function grad(c, m, x0, y0, x1, y1) {
    const s = MAT[m]; const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, s[0]); g.addColorStop(0.35, s[1]); g.addColorStop(0.55, s[2]); g.addColorStop(1, s[3]);
    return g;
  }
  // F : remplit un chemin avec une matière (dégradé métal), lisère de lumière et arête
  function F(c, d, m, bb, o = {}) {
    const p = path(d); const [x0, y0, x1, y1] = bb;
    if (MAT[m]) c.fillStyle = o.dir === 'v' ? grad(c, m, 0, y0, 0, y1) : o.dir === 'd' ? grad(c, m, x0, y0, x1, y1) : grad(c, m, x0, 0, x1, 0);
    else c.fillStyle = m;
    c.globalAlpha = o.a == null ? 1 : o.a;
    c.fill(p, o.rule || 'nonzero');
    c.globalAlpha = 1;
    if (o.rim !== false) {
      const g = c.createLinearGradient(0, y0, 0, y0 + (y1 - y0) * 0.6);
      g.addColorStop(0, `rgba(255,255,255,${o.rim == null ? 0.45 : o.rim})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.strokeStyle = g; c.lineWidth = o.rw || 1.2; c.stroke(p);
    }
    if (o.edge) { c.strokeStyle = `rgba(0,0,0,${o.edge})`; c.lineWidth = o.ew || 1; c.stroke(p); }
  }
  function L(c, d, col = 'rgba(0,0,0,.28)', w = 0.9) { c.strokeStyle = col; c.lineWidth = w; c.stroke(path(d)); }
  function sym(c, fn) { fn(); c.save(); c.scale(-1, 1); fn(); c.restore(); }
  function rot(c, a, fn) { c.save(); c.rotate(a); fn(); c.restore(); }
  function at(c, x, y, fn) { c.save(); c.translate(x, y); fn(); c.restore(); }
  function sphere(c, x, y, r, m = 'silver') {
    const s = SPH[m]; const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.08, x, y, r);
    g.addColorStop(0, s[0]); g.addColorStop(0.5, s[1]); g.addColorStop(1, s[2]);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  function halo(c, x, y, r, col, a = 1) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hexA(col, a)); g.addColorStop(0.35, hexA(col, a * 0.45)); g.addColorStop(1, hexA(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }

  /* =========================================================
     DÉFINITIONS — unités de dessin, origine au centre.
     orient : 'down' (pointe vers le bas, tourne selon la trajectoire),
              'side' (vu de profil, se retourne selon le sens),
              'none' (fixe), 'spin' (tourne sur lui-même)
     ========================================================= */
  const DEF = {};

  /* Vaisseaux, véhicules, ennemis et boss : voir js/ships.js */

  /* ---------------- SATURN V (ultime d'Apollo) ---------------- */
  DEF.saturn = { w: 70, h: 470, cy: 0, sh: 'none', draw(c) {
    F(c, 'M0 -232L3 -214L3 -200L-3 -200L-3 -214Z', 'alu', [-3, -232, 3, -200]);
    F(c, 'M-12 -200L12 -200L22 -160L-22 -160Z', 'white', [-22, -200, 22, -160]);
    F(c, RR(-22, -160, 44, 70, 2), 'white', [-22, -160, 22, -90]);
    F(c, 'M-22 -90L22 -90L32 -60L-32 -60Z', 'white', [-32, -90, 32, -60]);
    F(c, RR(-32, -60, 64, 120, 2), 'white', [-32, -60, 32, 60]);
    F(c, RR(-32, 60, 64, 150, 2), 'white', [-32, 60, 32, 210]);
    F(c, 'M-32 -40L0 -40L0 0L-32 0Z', 'rgba(20,20,22,.9)', [-32, -40, 0, 0], { rim: false });
    F(c, 'M0 80L32 80L32 140L0 140Z', 'rgba(20,20,22,.9)', [0, 80, 32, 140], { rim: false });
    F(c, 'M-32 150L0 150L0 200L-32 200Z', 'rgba(20,20,22,.9)', [-32, 150, 0, 200], { rim: false });
    L(c, 'M-32 60L32 60M-32 -60L32 -60', 'rgba(0,0,0,.3)', 1.2);
    sym(c, () => F(c, 'M32 180L44 214L32 210Z', 'white', [32, 180, 44, 214]));
    for (const x of [-18, -6, 6, 18]) F(c, `M${x - 6} 210L${x + 6} 210L${x + 9} 234L${x - 9} 234Z`, 'gun', [x - 9, 210, x + 9, 234], { dir: 'v' });
  } };

  /* ---------------- PROJECTILES & OBJETS (sans ombre) ---------------- */
  const glowy = (col, r) => c => halo(c, 0, 0, r, col, 0.7);
  // tirs du joueur : tons FROIDS et translucides (retours n° 2 : on les confondait avec les tirs ennemis, chauds)
  const COOL = '#6FDCF0';
  DEF.p_imp = { w: 12, h: 34, sh: 'none', pad: 4, draw(c) { halo(c, 0, 0, 12, COOL, 0.42); F(c, RR(-1.7, -12, 3.4, 24, 1.7), '#E6FBFF', [-2, -12, 2, 12], { rim: false, a: 0.82 }); } };
  DEF.p_plasma = { w: 30, h: 30, sh: 'none', pad: 4, draw(c) { halo(c, 0, 0, 15, '#5FA2FF', 0.7); c.globalAlpha = 0.85; sphere(c, 0, 0, 6, 'pale'); c.globalAlpha = 1; } };
  DEF.p_missile = { w: 12, h: 26, sh: 'none', pad: 3, draw(c) { sym(c, () => F(c, 'M2 4L6 10L2 9Z', '#C8CCD2', [2, 4, 6, 10], { rim: false })); F(c, 'M0 -12C2 -10 2.5 -6 2.5 -2L2.5 10L-2.5 10L-2.5 -2C-2.5 -6 -2 -10 0 -12Z', 'alu', [-2.5, -12, 2.5, 10], { rim: false }); F(c, RR(-2.5, -4, 5, 2.4, 1), SEAM, [-2.5, -4, 2.5, -1.6], { rim: false }); } };
  DEF.p_blade = { w: 40, h: 60, sh: 'none', pad: 6, draw(c) { halo(c, 0, 0, 30, COOL, 0.35); F(c, 'M0 -28C10 -14 12 8 0 28C4 8 2 -12 -10 -24C-6 -26 -3 -28 0 -28Z', 'wing', [-10, -28, 12, 28], { rim: 0.6 }); } };
  DEF.p_shard = { w: 10, h: 18, sh: 'none', pad: 3, draw(c) { halo(c, 0, 0, 9, COOL, 0.45); F(c, 'M0 -8L3 0L0 8L-3 0Z', '#DDF6FF', [-3, -8, 3, 8], { rim: false, a: 0.85 }); } };
  // drone d'appui : petit chasseur effilé (jamais une sphère : deux drones côte à côte feraient des yeux)
  DEF.p_drone = { w: 32, h: 50, sh: 'drop', draw(c) {
    sym(c, () => { F(c, 'M3 -2L15 11L15 14.5L3 11Z', 'wing', [3, -2, 15, 15], { rim: 0.5, edge: 0.5 }); F(c, 'M2.6 11L8 19L7.4 21.5L2.6 18Z', 'gun', [2.6, 11, 8, 21.5], { rim: false }); });
    F(c, 'M0 -23L2.6 -13L3.8 4L3 19L-3 19L-3.8 4L-2.6 -13Z', 'pearl', [-4, -23, 4, 19], { rim: 0.6, edge: 0.55 });
    F(c, RR(-1.3, -15, 2.6, 8, 1.3), 'glass', [-1.3, -15, 1.3, -7], { rim: false });
    L(c, 'M0 0L0 15', AMBER, 1.3);
  } };

  // tirs ennemis : toujours CHAUDS et vifs (halo rouge-orangé, cœur orange) cernés de sombre ; ceux du joueur sont froids et translucides
  const HOT = '#FF6A3A', HOT2 = '#FF9A48';
  DEF.b_packet = { w: 14, h: 26, sh: 'none', pad: 4, draw(c) { halo(c, 0, 0, 12, HOT, 0.55); F(c, RR(-2.4, -8, 4.8, 16, 2.4), '#FFB547', [-2, -8, 2, 8], { rim: false, edge: 0.85, ew: 1.6 }); } };
  DEF.b_cog = { w: 16, h: 16, sh: 'none', pad: 3, draw(c) { halo(c, 0, 0, 10, HOT2, 0.5); F(c, GEAR(7, 7, 0.28) + C(0, 0, 2.2), 'brass', [-7, -7, 7, 7], { rule: 'evenodd', rim: false, edge: 0.85, ew: 1.6 }); } };
  DEF.b_ball = { w: 16, h: 16, sh: 'none', pad: 3, draw(c) { halo(c, 0, 0, 11, HOT, 0.7); sphere(c, 0, 0, 5.6, 'iron'); c.strokeStyle = 'rgba(20,8,4,.9)'; c.lineWidth = 2.2; c.beginPath(); c.arc(0, 0, 7.8, 0, TAU); c.stroke(); c.strokeStyle = '#FF7A34'; c.lineWidth = 1.8; c.beginPath(); c.arc(0, 0, 6.2, 0, TAU); c.stroke(); } };
  DEF.b_bubble = { w: 18, h: 18, sh: 'none', pad: 3, draw(c) { halo(c, 0, 0, 10, HOT, 0.35); c.strokeStyle = 'rgba(20,8,4,.85)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 8.4, 0, TAU); c.stroke(); c.strokeStyle = '#FF8A44'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 7, 0, TAU); c.stroke(); c.fillStyle = 'rgba(255,110,50,.38)'; c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(-2.5, -2.5, 1.6, 0, TAU); c.fill(); } };
  DEF.b_torp = { w: 10, h: 30, sh: 'none', pad: 4, draw(c) { halo(c, 0, 10, 7, HOT, 0.55); F(c, 'M0 13C2.5 11 3 6 3 2L3 -12L-3 -12L-3 2C-3 6 -2.5 11 0 13Z', 'brass', [-3, -12, 3, 13], { rim: false, edge: 0.85, ew: 1.6 }); L(c, 'M-4 -13L4 -13', '#C29A55', 1.6); } };
  DEF.b_tracer = { w: 12, h: 28, sh: 'none', pad: 4, draw(c) { halo(c, 0, 0, 10, HOT2, 0.6); F(c, RR(-1.6, -9, 3.2, 18, 1.6), '#FFC94F', [-2, -9, 2, 9], { rim: false, edge: 0.85, ew: 1.6 }); } };
  DEF.b_bomb = { w: 14, h: 26, sh: 'none', pad: 4, draw(c) { halo(c, 0, 4, 9, HOT, 0.45); sym(c, () => F(c, 'M2 -10L6 -14L6 -7L2 -6Z', '#3A372C', [2, -14, 6, -6], { rim: false })); F(c, 'M0 11C4 8 5 3 5 -1C5 -6 3 -9 0 -9C-3 -9 -5 -6 -5 -1C-5 3 -4 8 0 11Z', 'olive', [-5, -9, 5, 11], { rim: false, edge: 0.85, ew: 1.6 }); } };
  DEF.b_hail = { w: 14, h: 14, sh: 'none', pad: 3, draw(c) { halo(c, 0, 0, 9, HOT, 0.55); F(c, POLY(6, 5, 0.3), '#FFAE55', [-5, -5, 5, 5], { rim: false, edge: 0.85, ew: 1.6 }); } };
  DEF.b_shell = { w: 10, h: 20, sh: 'none', pad: 3, draw(c) { halo(c, 0, 2, 9, HOT, 0.5); F(c, 'M0 8C2.4 6 2.6 3 2.6 0L2.6 -7L-2.6 -7L-2.6 0C-2.6 3 -2.4 6 0 8Z', '#4A4C52', [-3, -7, 3, 8], { rim: false, edge: 0.85, ew: 1.6 }); F(c, C(0, 5, 1.6), '#F0C88A', [-2, 3, 2, 7], { rim: false }); } };
  DEF.b_pellet = { w: 16, h: 16, sh: 'none', pad: 3, draw(c) { halo(c, 0, 0, 10, HOT, 0.65); F(c, C(0, 0, 3.2), '#FFB044', [-3, -3, 3, 3], { rim: false, edge: 0.85, ew: 1.6 }); } };
  DEF.b_shard = { w: 12, h: 14, sh: 'none', pad: 4, draw(c) { halo(c, 0, 0, 9, HOT, 0.6); F(c, 'M0 -6L5 4L-4 5Z', '#FF9A48', [-5, -6, 5, 5], { rim: false, edge: 0.85, ew: 1.6 }); } };
  DEF.b_laser = { w: 12, h: 30, sh: 'none', pad: 4, draw(c) { halo(c, 0, 0, 11, '#FF4A3A', 0.6); F(c, RR(-1.8, -10, 3.6, 20, 1.8), '#FF9A55', [-2, -10, 2, 10], { rim: false, edge: 0.85, ew: 1.6 }); } };
  DEF.b_beamlet = { w: 12, h: 32, sh: 'none', pad: 4, draw(c) { halo(c, 0, 0, 12, '#FF5A48', 0.6); F(c, RR(-1.8, -11, 3.6, 22, 1.8), '#FFA45A', [-2, -11, 2, 11], { rim: false, edge: 0.85, ew: 1.6 }); } };
  DEF.b_tile = { w: 14, h: 18, sh: 'none', pad: 3, draw(c) { halo(c, 0, 0, 10, HOT2, 0.5); F(c, 'M0 -7L4.5 0L0 7L-4.5 0Z', 'gold', [-4.5, -7, 4.5, 7], { rim: false, edge: 0.85, ew: 1.6 }); } };
  DEF.b_glitch = { w: 14, h: 14, sh: 'none', pad: 4, draw(c) { halo(c, 0, 0, 9, '#FF4A4A', 0.5); F(c, RR(-3, -5, 8, 8, 0), 'rgba(255,255,255,.85)', [-3, -5, 5, 3], { rim: false }); F(c, RR(-5, -3, 8, 8, 0), '#050506', [-5, -3, 3, 5], { rim: false }); } };
  // parasite du Bruit (idée « Le Bruit attaque l'interface ») : amas de blocs décalés en couleurs de brouillage, griffes en coin
  DEF.parasite = { w: 50, h: 36, sh: 'none', pad: 6, draw(c) {
    halo(c, 0, 0, 30, '#78FFF0', 0.25);
    for (const [x, y, k] of [[-25, -18, 1], [25, -18, -1], [-25, 18, 1], [25, 18, -1]]) F(c, `M${x} ${y}L${x + k * 9} ${y + (y < 0 ? 4 : -4)}L${x + k * 4} ${y + (y < 0 ? 9 : -9)}Z`, '#0A0B0D', [x - 9, y - 9, x + 9, y + 9], { rim: false });
    F(c, RR(-20, -13, 34, 24, 0), '#2EE6D6', [-20, -13, 14, 11], { rim: false });
    F(c, RR(-14, -11, 34, 24, 0), '#E2408A', [-14, -11, 20, 13], { rim: false });
    F(c, RR(-17, -12, 34, 24, 0), '#0A0B0D', [-17, -12, 17, 12], { rim: false });
    for (const [y, w, x] of [[-8, 22, -12], [-3, 12, 2], [2, 26, -14], [7, 16, -4]]) F(c, RR(x, y, w, 2.2, 0), y % 2 ? '#FFFFFF' : '#9FF6EE', [x, y, x + w, y + 2.2], { rim: false });
  } };
  // 1902 : étoile de carton (contour noir épais, lisible en noir et blanc)
  DEF.b_star = { w: 26, h: 26, sh: 'none', pad: 5, draw(c) { halo(c, 0, 0, 15, '#FFFFFF', 0.55); c.lineJoin = 'round'; c.strokeStyle = '#050505'; c.lineWidth = 3.2; c.stroke(path(STAR(5, 10, 4.4))); F(c, STAR(5, 10, 4.4), '#FFFFFF', [-10, -10, 10, 10], { rim: false }); } };
  DEF.b_spark = { w: 14, h: 14, sh: 'none', pad: 3, draw(c) { halo(c, 0, 0, 9, HOT2, 0.75); F(c, C(0, 0, 2.4), '#FFC24A', [-2, -2, 2, 2], { rim: false, edge: 0.85, ew: 1.6 }); } };

  // objets à ramasser
  DEF.pk_cr = { w: 18, h: 22, sh: 'none', pad: 4, draw(c) { halo(c, 0, 0, 13, GOLDL, 0.35); F(c, 'M0 -9L7 0L0 9L-7 0Z', 'gold', [-7, -9, 7, 9], { rim: 0.7 }); L(c, 'M-3.5 -4.5L0 0L3.5 -4.5', 'rgba(255,255,255,.55)', 0.8); } };
  // amélioration d'arme : jeton en losange à double chevron montant (ni sphère à marque centrale, ni « + »)
  DEF.pk_up = { w: 30, h: 30, sh: 'none', pad: 4, draw(c) { halo(c, 0, 0, 16, '#FFFFFF', 0.45); F(c, 'M0 -11L10 0L0 11L-10 0Z', '#F4F6F8', [-10, -11, 10, 11], { rim: 0.8 }); L(c, 'M0 -11L10 0L0 11L-10 0Z', '#2A2B2F', 1.2); L(c, 'M-4.5 0.5L0 -4L4.5 0.5M-4.5 5L0 0.5L4.5 5', '#2A2B2F', 1.8); } };
  const HEXP = (r) => 'M0 ' + (-r) + 'L' + (r * 0.87) + ' ' + (-r / 2) + 'L' + (r * 0.87) + ' ' + (r / 2) + 'L0 ' + r + 'L' + (-r * 0.87) + ' ' + (r / 2) + 'L' + (-r * 0.87) + ' ' + (-r / 2) + 'Z';
  // cellule de bouclier (recharge 1 point)
  // cellule en cube isométrique (trois faces), sans hexagone concentrique ni « + »
  DEF.pk_hp = { w: 30, h: 30, sh: 'none', pad: 4, draw(c) { halo(c, 0, 0, 17, ICE, 0.5); F(c, HEXP(10), '#9CCBE8', [-9, -10, 9, 10], { rim: false }); F(c, 'M0 -10L8.7 -5L0 0L-8.7 -5Z', '#F2FAFF', [-9, -10, 9, 0], { rim: false }); F(c, 'M0 0L8.7 -5L8.7 5L0 10Z', '#5E9FC8', [0, -5, 9, 10], { rim: false }); L(c, HEXP(10), '#2F6F9A', 1.4); L(c, 'M0 0L0 10M0 0L8.7 -5M0 0L-8.7 -5', '#2F6F9A', 1); } };
  DEF.pk_sh = DEF.pk_hp;

  /* ---------------- CACHE ---------------- */
  let DPR = 1;
  const cache = new Map();
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  function setDPR(d) { if (Math.abs(d - DPR) > 0.01) { DPR = d; cache.clear(); } }
  const R = { sc: 1, dpr: 1, flip: false };
  function make(name, px) {
    const D = DEF[name]; if (!D) throw new Error('Sprite inconnu : ' + name);
    const sc = px / D.w, sh = D.sh || 'drop';
    R.sc = sc; R.dpr = DPR; R.flip = !!D.down;
    const padPx = D.pad != null ? D.pad : (sh === 'none' ? 4 : 6 + Math.min(px * 0.14, 26));
    const lw = D.w * sc + padPx * 2, lh = D.h * sc + padPx * 2;
    const cw = Math.max(2, Math.ceil(lw * DPR)), ch = Math.max(2, Math.ceil(lh * DPR));
    const tmp = mk(cw, ch), c = tmp.getContext('2d');
    c.setTransform(sc * DPR, 0, 0, sc * DPR * (D.down ? -1 : 1), cw / 2, ch / 2);
    c.translate(-(D.cx || 0), -(D.cy || 0));
    c.lineJoin = 'round'; c.lineCap = 'round';
    D.draw(c);
    let out = tmp;
    if (sh !== 'none') {
      out = mk(cw, ch); const o = out.getContext('2d');
      o.shadowColor = sh === 'halo' ? 'rgba(0,0,0,.30)' : 'rgba(0,0,0,.45)';
      o.shadowBlur = clamp(px * (sh === 'halo' ? 0.05 : 0.11), 2, 18) * DPR;
      o.shadowOffsetY = sh === 'halo' ? 0 : clamp(px * 0.07, 2, 12) * DPR;
      o.drawImage(tmp, 0, 0);
    }
    const fl = mk(cw, ch), f = fl.getContext('2d');
    f.drawImage(tmp, 0, 0); f.globalCompositeOperation = 'source-in'; f.fillStyle = '#ffffff'; f.fillRect(0, 0, cw, ch);
    return { cv: out, fl, w: lw, h: lh, sc, D };
  }
  function get(name, px) {
    px = Math.max(4, Math.round(px));
    const k = name + '|' + px; let s = cache.get(k);
    if (!s) { s = make(name, px); cache.set(k, s); }
    return s;
  }
  function draw(c, name, x, y, px, r = 0, flip = false, alpha = 1, flash = 0) {
    const s = get(name, px);
    const ox = (s.D.cx || 0) * s.sc - s.w / 2, oy = (s.D.cy || 0) * (s.D.down ? -1 : 1) * s.sc - s.h / 2;
    c.save(); c.translate(x, y); if (r) c.rotate(r); if (flip) c.scale(-1, 1);
    if (alpha !== 1) c.globalAlpha = alpha;
    c.drawImage(s.cv, ox, oy, s.w, s.h);
    if (flash > 0) { c.globalAlpha = alpha * Math.min(1, flash); c.drawImage(s.fl, ox, oy, s.w, s.h); }
    c.restore();
  }
  // liseré lumineux : silhouette teintée (cache par couleur), agrandie de « grow » autour du point d'ancrage
  function rim(c, name, x, y, px, r, col, a, grow = 1.1) {
    const s = get(name, px); s.tn = s.tn || {}; let t = s.tn[col];
    if (!t) { t = s.tn[col] = mk(s.fl.width, s.fl.height); const g = t.getContext('2d'); g.drawImage(s.fl, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, t.width, t.height); }
    const ox = (s.D.cx || 0) * s.sc - s.w / 2, oy = (s.D.cy || 0) * (s.D.down ? -1 : 1) * s.sc - s.h / 2;
    c.save(); c.translate(x, y); if (r) c.rotate(r); c.scale(grow, grow); c.globalAlpha *= a; c.drawImage(t, ox, oy, s.w, s.h); c.restore();
  }
  // pièces d'amélioration (canons, blindage, ailettes de refroidissement) posées sur la coque et découpées à sa silhouette ;
  // L = { cannon, hull, rate } niveaux achetés ; un bitmap par vaisseau, taille et niveaux
  function parts(c, name, x, y, px, r, L, a = 1) {
    const nc = L.cannon || 0, nh = L.hull || 0, nr = L.rate || 0; if (!nc && !nh && !nr) return;
    const s = get(name, px), key = nc + '' + nh + nr; s.pt = s.pt || {}; let t = s.pt[key];
    if (!t) {
      t = s.pt[key] = mk(s.fl.width, s.fl.height); const g = t.getContext('2d'), k = s.fl.width / s.w, D = s.D;
      const ax = s.w / 2 - (D.cx || 0) * s.sc, ay = s.h / 2 - (D.cy || 0) * (D.down ? -1 : 1) * s.sc, w = D.w * s.sc, h = D.h * s.sc;
      g.setTransform(k, 0, 0, k, ax * k, ay * k); g.lineJoin = 'round';
      const box = (x0, y0, bw, bh, f) => { g.fillStyle = f; g.fillRect(x0, y0, bw, bh); g.strokeStyle = '#07080A'; g.lineWidth = Math.max(0.8, w * 0.008); g.strokeRect(x0, y0, bw, bh); };
      // canons : une paire au niveau 1, deux paires dès le niveau 3, plus longs à chaque niveau, bout clair
      const bw = Math.max(1.6, w * 0.024), len = h * (0.12 + 0.025 * nc);
      for (const [cx, y0, n] of [[0.075, -0.06, 1], [0.11, 0.04, 3]]) if (nc >= n) for (const sx of [-1, 1]) { const l = len * (n === 1 ? 1 : 0.7), X = sx * w * cx - bw / 2, Y = h * y0 - l; box(X, Y, bw, l, '#3A404A'); g.fillStyle = '#E8EEF4'; g.fillRect(X, Y, bw, Math.max(1.2, bw * 0.6)); }
      // blindage : plaques sur les ailes, une de plus par niveau (3 au plus par côté)
      for (let j = 0; j < Math.min(3, nh); j++) for (const sx of [-1, 1]) { const pw = w * 0.075, ph = h * 0.045; box(sx * w * (0.14 + 0.08 * j) - pw / 2, h * 0.12, pw, ph, '#68717E'); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(sx * w * (0.14 + 0.08 * j) - pw / 2, h * 0.12, pw, Math.max(1, ph * 0.25)); }
      // cadence : ailettes de refroidissement orangées près de la tuyère
      g.strokeStyle = '#F0A050'; g.lineWidth = Math.max(1.2, w * 0.016); g.lineCap = 'round'; g.beginPath();
      for (let j = 0; j < Math.min(4, nr); j++) { const Y = h * (0.24 + 0.032 * j); g.moveTo(-w * 0.075, Y); g.lineTo(-w * 0.035, Y); g.moveTo(w * 0.035, Y); g.lineTo(w * 0.075, Y); }
      g.stroke();
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-in'; g.drawImage(s.fl, 0, 0);
    }
    const ox = (s.D.cx || 0) * s.sc - s.w / 2, oy = (s.D.cy || 0) * (s.D.down ? -1 : 1) * s.sc - s.h / 2;
    c.save(); c.translate(x, y); if (r) c.rotate(r); if (a !== 1) c.globalAlpha *= a; c.drawImage(t, ox, oy, s.w, s.h); c.restore();
  }
  // ombre portée au sol (univers en relief) : silhouette noire du sprite, créée à la demande
  function shadow(c, name, x, y, px, r = 0, flip = false, a = 0.3) {
    const s = get(name, px);
    if (!s.bk) { s.bk = mk(s.fl.width, s.fl.height); const b = s.bk.getContext('2d'); b.drawImage(s.fl, 0, 0); b.globalCompositeOperation = 'source-in'; b.fillStyle = '#10140C'; b.fillRect(0, 0, s.bk.width, s.bk.height); }
    const ox = (s.D.cx || 0) * s.sc - s.w / 2, oy = (s.D.cy || 0) * (s.D.down ? -1 : 1) * s.sc - s.h / 2;
    c.save(); c.translate(x, y); if (r) c.rotate(r); if (flip) c.scale(-1, 1); c.globalAlpha = a; c.drawImage(s.bk, ox, oy, s.w, s.h); c.restore();
  }
  // halos lumineux réutilisables
  const gcache = new Map();
  function glowTex(col) {
    let t = gcache.get(col); if (t) return t;
    t = mk(64, 64); const c = t.getContext('2d'); const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, hexA(col, 1)); g.addColorStop(0.22, hexA(col, 0.6)); g.addColorStop(0.55, hexA(col, 0.14)); g.addColorStop(1, hexA(col, 0));
    c.fillStyle = g; c.fillRect(0, 0, 64, 64); gcache.set(col, t); return t;
  }
  function glow(c, x, y, r, col, a = 1) { if (a <= 0 || r <= 0) return; const pa = c.globalAlpha; c.globalAlpha = pa * a; c.drawImage(glowTex(col), x - r, y - r, r * 2, r * 2); c.globalAlpha = pa; }
  // flammes de réacteur d'un sprite (D.flame, unités sprite) : pointe vers l'arrière, vacille avec t
  function flames(c, D, x, y, sc, t, dir = 1) {
    if (!D.flame) return;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const [fx, fy, w, len, col = '#F2A65A'] of D.flame) {
      const k = 0.82 + Math.sin(t * 41 + fx) * 0.1 + Math.sin(t * 67 + fx * 3) * 0.08, X = x + fx * sc, Y = y + fy * sc * dir, W = Math.max(1.6, w * sc), L = Math.max(5, len * sc * k) * dir;
      const g = c.createLinearGradient(0, Y, 0, Y + L); g.addColorStop(0, hexA(col, 0.95)); g.addColorStop(0.55, hexA(col, 0.4)); g.addColorStop(1, hexA(col, 0));
      c.fillStyle = g; c.beginPath(); c.moveTo(X - W, Y); c.quadraticCurveTo(X - W * 0.6, Y + L * 0.5, X, Y + L); c.quadraticCurveTo(X + W * 0.6, Y + L * 0.5, X + W, Y); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,246,230,.9)'; c.beginPath(); c.moveTo(X - W * 0.45, Y); c.quadraticCurveTo(X, Y + L * 0.45, X + W * 0.45, Y); c.closePath(); c.fill();
      glow(c, X, Y + L * 0.15, W * 2.6, col, 0.35);
    }
    c.restore();
  }
  // dimensions d'affichage (pour placer moteurs, canons…)
  function scale(name, px) { return px / DEF[name].w; }

  return { R, DEF, MAT, SPH, C, E, RR, POLY, STAR, GEAR, F, L, sym, rot, at, sphere, halo, path, get, draw, rim, parts, shadow, glow, glowTex, flames, setDPR, scale, AMBER, MINT, CRIMSON, ICE, GOLDL, WARM, SEAM };
})();
