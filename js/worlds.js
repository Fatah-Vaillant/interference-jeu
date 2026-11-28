'use strict';
/* =========================================================
   INTERFÉRENCE — les 12 univers (fréquences)
   Décor, ennemis, boss, histoire et anecdote réelle.
   ========================================================= */
const BG = {
  grad(c, stops, y0 = 0, y1 = H) { const g = c.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, col]) => g.addColorStop(o, col)); c.fillStyle = g; c.fillRect(0, y0, W, y1 - y0); },
  blob(c, x, y, rx, ry, col, a) {
    c.save(); c.translate(x, y); c.scale(1, ry / rx);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, hexA(col, a)); g.addColorStop(1, hexA(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
  },
  stars(c, n, seed, alpha = 0.8, maxY = H, size = 1.3) {
    const r = seeded(seed);
    for (let i = 0; i < n; i++) { c.fillStyle = `rgba(255,255,255,${(0.15 + r() * 0.85) * alpha})`; const s = r() < 0.08 ? size * 1.6 : size; c.fillRect(r() * W, r() * maxY, s, s); }
  },
  vignette(c, a = 0.55, col = '0,0,0') {
    const g = c.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.5, H * 0.8);
    g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},${a})`); c.fillStyle = g; c.fillRect(0, 0, W, H);
  },
};

const WORLDS = [
  /* ===================== 01 · LE BUREAU ===================== */
  {
    key: 'bureau', year: '', accent: '#8AD6A8', bgc: '#0B0C0F',
    view: 'top', vehicle: null, move: 'free', boom: 'tech', light: false,
    enemies: ['w1a', 'w1b', 'w1c', 'w1d', 'w1e', 'w1m'], scale: [1.15, 1.15, 1.2, 1.6, 1.2, 1.15],
    eb: 'b_packet', eb2: 'b_packet', esfx: 'e_zap',
    boss: { spr: 'w1boss', w: 290, ty: 0.25, move: 'sway', pats: ['radial', 'aimed', 'spiral', 'wall'],
      nodes: { mode: 'orbit', n: 6, r: 150, ry: 0.62, spr: 'w1n', w: 42, spin: 0.5 },
      deco(c, B, t) {
        // barre de balayage qui parcourt le noyau à fentes (aucun anneau autour du centre)
        const y = Math.sin(t * 2.2) * 24; c.save(); c.translate(B.x, B.y); c.globalCompositeOperation = 'lighter';
        c.fillStyle = 'rgba(138,214,168,.55)'; c.fillRect(-14, y - 1.5, 28, 3);
        c.fillStyle = 'rgba(138,214,168,.16)'; c.fillRect(-14, y - 7, 28, 14);
        c.restore();
      } },
    bgStatic(c) {
      BG.grad(c, [[0, '#090A0D'], [1, '#101318']]);
      const vy = H * 0.4, vx = W / 2; c.strokeStyle = 'rgba(138,214,168,.06)'; c.lineWidth = 1;
      for (let i = -14; i <= 14; i++) { c.beginPath(); c.moveTo(vx, vy); c.lineTo(vx + i * 80, H); c.stroke(); }
      for (let k = 1; k < 16; k++) { const y = vy + (H - vy) * Math.pow(k / 16, 2.1); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      BG.grad(c, [[0, '#090A0D'], [1, 'rgba(9,10,13,0)']], vy - 2, vy + 220);
      // (retour du 22/11) plus de baies latérales à voyants : les bandes de traits et de points sur les bords sont retirées
      BG.vignette(c, 0.5);
    },
    bgDyn(c, t) {
      c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1.5; c.beginPath();
      for (let x = 0; x <= W; x += 6) { const y = H * 0.34 + Math.sin(x * 0.018 + t * 1.2) * 26 * Math.sin(t * 0.4) + Math.sin(x * 0.07 - t * 3) * 4; x ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
      c.fillStyle = 'rgba(138,214,168,.2)';
      for (let i = 0; i < 9; i++) { const x = 60 + i * 52; const y = ((t * (60 + i * 13)) + i * 137) % (H + 40) - 20; c.fillRect(x, y, 2, 14); }
    },
  },

  /* ===================== 02 · DE LA TERRE À LA LUNE, 1865 ===================== */
  {
    key: 'columbiad', year: '1865', accent: '#E3C68E', bgc: '#0C1020', era: 'columbiad',
    view: 'top', vehicle: null, move: 'free', boom: 'brass', light: false,
    enemies: ['w2a', 'w2b', 'w2c', 'w2d', 'w2e', 'w2m'], scale: [1.7, 1.2, 1.55, 1.7, 1.2, 1.6],
    eb: 'b_cog', eb2: 'b_ball', esfx: 'e_tick',
    boss: { spr: 'w2boss', w: 230, ty: 0.26, move: 'sway', pats: ['radial', 'aimed', 'rain', 'spiral'],
      nodes: { mode: 'fixed', spr: 'w2n', w: 40, pts: [[-23, -109], [23, -109], [-23, 109], [23, 109]] },
      deco(c, B, t) {
        // reflet qui balaie les six rotors (sensation de rotation)
        const k = B.w / Art.DEF.w2boss.w; c.save(); c.translate(B.x, B.y); c.rotate(B.rot || 0); c.scale(k, k);
        c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,240,210,.16)';
        for (const sx of [-1, 1]) for (const [i, y] of [-84, 0, 84].entries()) {
          const a = t * 9 * sx + i * 1.3; c.beginPath(); c.moveTo(sx * 70, y); c.arc(sx * 70, y, 43, a, a + 0.55); c.closePath(); c.fill();
          c.beginPath(); c.moveTo(sx * 70, y); c.arc(sx * 70, y, 43, a + Math.PI, a + Math.PI + 0.55); c.closePath(); c.fill();
        }
        c.restore();
      } },
    bgStatic(c) {
      BG.grad(c, [[0, '#0A0E1C'], [1, '#151B30']]);
      const r = seeded(21);
      c.strokeStyle = 'rgba(236,224,196,.55)'; c.lineWidth = 0.8;
      for (let i = 0; i < 90; i++) { const x = r() * W, y = r() * H, s = 1 + r() * 2.2; c.beginPath(); c.moveTo(x - s, y); c.lineTo(x + s, y); c.moveTo(x, y - s); c.lineTo(x, y + s); c.stroke(); }
      c.strokeStyle = 'rgba(232,207,152,.07)'; c.lineWidth = 1;
      for (let k = 1; k < 5; k++) { c.beginPath(); c.ellipse(W / 2, H * 0.46, 120 * k, 44 * k, -0.2, 0, TAU); c.stroke(); }
      BG.moon(c, W - 92, 132, 74, 2024);
      c.fillStyle = 'rgba(200,190,160,.5)'; c.beginPath(); c.arc(74, H - 150, 34, 0, TAU); c.fill();
      c.fillStyle = '#121828'; c.beginPath(); c.arc(86, H - 158, 34, 0, TAU); c.fill();
      BG.vignette(c, 0.55);
    },
    bgDyn(c, t) {
      const k = Math.floor(t / 7), ph = (t % 7) / 7;
      if (ph < 0.12) { const r = seeded(k * 7 + 3); const x = r() * W, y = r() * H * 0.5, L = ph / 0.12; c.strokeStyle = `rgba(236,224,196,${0.5 * (1 - L)})`; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + L * 140, y + L * 60); c.lineTo(x + L * 140 - 40, y + L * 60 - 17); c.stroke(); }
    },
  },

  /* ===================== 03 · VINGT MILLE LIEUES, 1870 ===================== */
  {
    key: 'abysses', year: '1870', accent: '#9FD3D6', bgc: '#071820',
    view: 'side', vehicle: 'nautSide', move: 'float', boom: 'bubble', light: false,
    enemies: ['w3a', 'w3b', 'w3c', 'w3d', 'w3e', 'w3m'], scale: [1.55, 1.55, 1.5, 1.7, 1.45, 1.1],
    eb: 'b_bubble', eb2: 'b_torp', esfx: 'e_bloop', bspeed: 0.82,
    boss: { spr: 'w3boss', w: 520, ty: 0.2, move: 'drift', pats: ['rain', 'mines', 'aimed', 'wall'],
      nodes: { mode: 'fixed', spr: 'w3n', w: 56, pts: [[-145, 70], [-48, 72], [48, 72], [145, 70]] },
      deco(c, B, t) {
        for (let i = 0; i < 3; i++) { const p = ((t * 0.7 + i / 3) % 1); Art.glow(c, B.x - 250 - p * 40, B.y - 10 + Math.sin(t * 3 + i) * 12 - p * 50, 6, '#BFE6EA', 0.5 * (1 - p)); }
      } },
    bgStatic(c) {
      BG.grad(c, [[0, '#1F5464'], [0.18, '#123A48'], [0.55, '#0A2430'], [1, '#04101A']]);
      c.strokeStyle = 'rgba(220,245,250,.22)'; c.lineWidth = 2; c.beginPath();
      for (let x = 0; x <= W; x += 8) { const y = 30 + Math.sin(x * 0.04) * 4; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
      BG.vignette(c, 0.6);
    },
    bgDyn(c, t) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const x0 = 60 + i * 140 + Math.sin(t * 0.3 + i) * 30, sw = 30 + i * 6, sk = 90 + Math.sin(t * 0.2 + i * 2) * 40;
        const g = c.createLinearGradient(0, 0, 0, H * 0.8); g.addColorStop(0, 'rgba(200,240,245,.08)'); g.addColorStop(1, 'rgba(200,240,245,0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(x0 - sw, 0); c.lineTo(x0 + sw, 0); c.lineTo(x0 + sw * 2.4 + sk, H * 0.8); c.lineTo(x0 - sw * 0.8 + sk, H * 0.8); c.fill();
      }
      c.restore();
      c.fillStyle = 'rgba(210,235,240,.35)';
      for (let i = 0; i < 46; i++) { const x = (i * 97.7 + Math.sin(t * 0.5 + i) * 10) % W, y = ((i * 211.3) + t * (8 + (i % 5) * 4)) % H; c.fillRect(x, y, 1.6, 1.6); }
      c.strokeStyle = 'rgba(220,245,250,.3)'; c.lineWidth = 1;
      for (let i = 0; i < 12; i++) { const x = (i * 53 + 20 + Math.sin(t * 2 + i) * 6) % W, y = H - ((t * (30 + i * 4) + i * 140) % (H + 30)); c.beginPath(); c.arc(x, y, 2 + (i % 3), 0, TAU); c.stroke(); }
      c.strokeStyle = 'rgba(14,52,52,.9)'; c.lineWidth = 7; c.lineCap = 'round';
      for (const [bx, n] of [[24, 0], [50, 1], [W - 30, 2], [W - 56, 3]]) {
        c.beginPath(); c.moveTo(bx, H); for (let k = 1; k <= 8; k++) c.lineTo(bx + Math.sin(t * 0.9 + k * 0.6 + n) * k * 2.2, H - k * 34); c.stroke();
      }
    },
  },

  /* ===================== 04 · SOMME, 1917 ===================== */
  {
    key: 'somme', year: '1917', accent: '#C9B48A', bgc: '#3A352E',
    view: 'side', vehicle: 'tank', move: 'x', boom: 'smoke', light: true, ground: true,
    enemies: ['w4a', 'w4b', 'w4c', 'w4d', 'w4e', 'w4d'], scale: [1.45, 1.45, 1.8, 1.45, 1.35, 1.05],
    eb: 'b_bomb', eb2: 'b_tracer', esfx: 'e_mg', bspeed: 0.85, // char : on n'esquive qu'à l'horizontale, tirs du boss plus lents (défi juste)
    boss: { spr: 'w4boss', w: 500, ty: 0.22, move: 'drift', pats: ['bombs', 'aimed', 'wall', 'rain'],
      nodes: { mode: 'fixed', spr: 'w4n', w: 66, pts: [[-135, 72], [-39, 74], [57, 74]] } },
    bgStatic(c) {
      BG.grad(c, [[0, '#2C2925'], [0.55, '#5C5446'], [0.86, '#8C826C'], [1, '#8C826C']]);
      const hz = H - 170, r = seeded(41);
      for (let i = 0; i < 5; i++) BG.blob(c, 40 + r() * (W - 80), hz - 60 - r() * 120, 30 + r() * 30, 90 + r() * 80, '#3A352E', 0.22);
      c.fillStyle = '#4A443A';
      for (let x = 0; x < W; x += 30 + r() * 40) { const h = 14 + r() * 40; c.fillRect(x, hz - h, 3 + r() * 3, h); if (r() < 0.5) c.fillRect(x - 6, hz - h + 8, 12, 2); }
      c.beginPath(); c.moveTo(0, hz); for (let x = 0; x <= W; x += 16) c.lineTo(x, hz - 6 - r() * 8); c.lineTo(W, hz + 4); c.lineTo(0, hz + 4); c.fill();
      BG.grad(c, [[0, '#3A342B'], [1, '#1B1915']], hz, H);
      BG.vignette(c, 0.45, '20,16,10');
    },
    bgDyn(c, t) {
      for (let i = 0; i < 4; i++) { const x = ((i * 190 + t * (6 + i * 3)) % (W + 300)) - 150; BG.blob(c, x, 120 + i * 120, 150, 30, '#E8DFCC', 0.08); }
      const k = Math.floor(t / 3.3), ph = (t % 3.3) / 3.3;
      if (ph < 0.08) { const r = seeded(k + 9); Art.glow(c, r() * W, H - 176, 50, '#F0C88A', (1 - ph / 0.08) * 0.45); }
    },
  },

  /* ===================== 05 · AÉROPOSTALE, 1930 ===================== */
  {
    key: 'aero', year: '1930', accent: '#E3B08E', bgc: '#3A3A56',
    view: 'top', vehicle: 'late', move: 'free', boom: 'sky', light: true, wind: true,
    enemies: ['w5a', 'w5b', 'w5c', 'w5d', 'w5e', 'w5m'], scale: [1.2, 1.25, 1.4, 1.6, 1.4, 1.2],
    eb: 'b_hail', eb2: 'b_spark', esfx: 'e_wind',
    boss: { spr: 'w5boss', w: 320, ty: 0.26, move: 'sway', pats: ['spiral', 'radial', 'rain', 'beam'],
      nodes: { mode: 'fixed', spr: 'w5n', w: 40, pts: [[-128, 2], [-81, 2], [-34, 2], [34, 2], [81, 2], [128, 2]] } },
    bgStatic(c) {
      BG.grad(c, [[0, '#272E4A'], [0.4, '#4C5274'], [0.72, '#9C7E86'], [1, '#D2AE94']]);
      Art.glow(c, W * 0.72, H * 0.74, 180, '#F6D8A8', 0.5);
      const r = seeded(51);
      const layer = (base, amp, col, a, snow) => {
        c.fillStyle = hexA(col, a); c.beginPath(); c.moveTo(0, H); const pts = [];
        for (let x = 0; x <= W + 40; x += 40) { const y = base - r() * amp; pts.push([x, y]); c.lineTo(x, y); }
        c.lineTo(W, H); c.fill();
        if (snow) { c.fillStyle = 'rgba(255,255,255,.22)'; for (const [x, y] of pts) if (y < base - amp * 0.6) { c.beginPath(); c.moveTo(x, y); c.lineTo(x - 10, y + 12); c.lineTo(x + 10, y + 12); c.fill(); } }
      };
      layer(H - 210, 110, '#6E6A8A', 0.55, true); layer(H - 130, 80, '#4C4866', 0.85, false); layer(H - 60, 50, '#2C2A40', 1, false);
    },
    bgDyn(c, t) {
      const L = [[0.25, 22, 70, 18], [0.32, 46, 110, 26], [0.16, 95, 200, 50]];
      L.forEach(([a, sp, rx, ry], k) => { for (let i = 0; i < 4; i++) { const y = ((t * sp + i * 300 + k * 150) % (H + 300)) - 150, x = (i * 173 + k * 91) % W; BG.blob(c, x, y, rx, ry, '#FFF4EA', a); BG.blob(c, x + rx * 0.5, y + 8, rx * 0.7, ry * 0.8, '#FFF4EA', a * 0.8); } });
    },
  },

  /* ===================== 06 · ATLANTIQUE, 1942 ===================== */
  {
    key: 'atlantique', year: '1942', accent: '#A9B9C6', bgc: '#17232B',
    view: 'top', vehicle: 'destroyer', move: 'x', boom: 'smoke', light: false, sea: true,
    enemies: ['w6a', 'w6b', 'w6c', 'w6d', 'w6e', 'w6m'], scale: [1.15, 1.25, 1.4, 1.7, 1.75, 1.2],
    eb: 'b_shell', eb2: 'b_tracer', esfx: 'e_flak',
    boss: { spr: 'w6boss', w: 170, ty: 0.27, move: 'slow', pats: ['broadside', 'aimed', 'rain', 'wall'],
      nodes: { mode: 'fixed', spr: 'w6n', w: 44, aim: true, pts: [[0, 145], [0, 97], [-44, 17], [44, 17], [0, -184]] } },
    bgStatic(c) {
      BG.grad(c, [[0, '#1A2730'], [1, '#22323D']]);
      BG.grad(c, [[0, 'rgba(210,220,226,.12)'], [1, 'rgba(210,220,226,0)']], 0, 180);
    },
    tile: null,
    bgDyn(c, t) {
      if (!this.tile) {
        const cv = document.createElement('canvas'); cv.width = W; cv.height = 360; const x = cv.getContext('2d'); const r = seeded(61);
        for (let i = 0; i < 150; i++) { const px = r() * W, py = r() * 360, w = 6 + r() * 22; x.strokeStyle = `rgba(220,232,240,${0.04 + r() * 0.1})`; x.lineWidth = 1 + r(); x.beginPath(); x.moveTo(px - w, py); x.quadraticCurveTo(px, py - 4 - r() * 3, px + w, py); x.stroke(); }
        this.tile = cv;
      }
      for (const [sp, a, sc] of [[34, 0.7, 1], [64, 1, 1.3]]) { c.globalAlpha = a; const hh = 360 * sc, off = (t * sp) % hh; for (let y = -hh + off; y < H; y += hh) c.drawImage(this.tile, 0, y, W, hh); }
      c.globalAlpha = 1;
    },
  },

  /* ===================== 07 · ORBITE, 1969 ===================== */
  {
    key: 'orbite', year: '1969', accent: '#A9CFE0', bgc: '#040507',
    view: 'top', vehicle: null, move: 'free', boom: 'space', light: false,
    enemies: ['w7a', 'w7b', 'w7c', 'w7d', 'w7e', 'w7m'], scale: [1.35, 1.4, 1.45, 1.5, 1.35, 1.4],
    eb: 'b_pellet', eb2: 'b_shard', esfx: 'e_soft',
    boss: { spr: 'w7boss', w: 250, ty: 0.25, move: 'sway', pats: ['radial', 'aimed', 'spiral', 'rain'],
      nodes: { mode: 'orbit', n: 4, r: 74, ry: 1, cy: -76, spr: 'w7n', w: 34, spin: 0.35, rotate: true } },
    bgStatic(c) {
      c.fillStyle = '#040507'; c.fillRect(0, 0, W, H);
      BG.stars(c, 260, 71, 0.9, H * 0.8);
      const ex = W / 2, ey = H + 560, er = 760;
      const g = c.createRadialGradient(ex, ey - er * 0.6, er * 0.2, ex, ey, er); g.addColorStop(0, '#3A6A90'); g.addColorStop(0.75, '#16324C'); g.addColorStop(1, '#0B1826');
      c.fillStyle = g; c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.fill();
      c.save(); c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.clip(); const r = seeded(72);
      for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.08})`; c.beginPath(); c.ellipse(r() * W, ey - er + r() * 220, 30 + r() * 80, 6 + r() * 12, r() * 0.6 - 0.3, 0, TAU); c.fill(); }
      c.restore();
      c.save(); c.shadowColor = 'rgba(156,199,234,.9)'; c.shadowBlur = 24; c.strokeStyle = 'rgba(170,210,240,.75)'; c.lineWidth = 4; c.beginPath(); c.arc(ex, ey, er + 1, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.restore();
      BG.moon(c, W - 84, 140, 40, 1969, ['#E2E2DE', '#A8A8A4', '#5A5A58'], '4,5,7');
    },
    bgDyn(c, t) { Art.glow(c, 40, 60, 140, '#FFF4E0', 0.1 + Math.sin(t * 0.3) * 0.02); },
  },

  /* ===================== 08 · ESCADRE ===================== */
  {
    key: 'escadre', year: '', accent: '#C9A3B8', bgc: '#0B0910',
    view: 'top', vehicle: null, move: 'free', boom: 'space', light: false,
    enemies: ['w8a', 'w8b', 'w8c', 'w8d', 'w8e', 'w8m'], scale: [1.15, 1.2, 1.3, 1.7, 1.25, 1.2],
    eb: 'b_laser', eb2: 'b_laser', esfx: 'e_pew',
    boss: { spr: 'w8boss', w: 320, ty: 0.27, move: 'sway', spinSprite: 0.12, pats: ['radial', 'beam', 'spiral', 'aimed'],
      nodes: { mode: 'orbit', n: 6, r: 133, ry: 1, spr: 'w8n', w: 40, spin: 0.4, rotate: true } },
    bgStatic(c) {
      BG.grad(c, [[0, '#09080E'], [1, '#14101C']]);
      const r = seeded(81);
      for (let i = 0; i < 7; i++) BG.blob(c, r() * W, r() * H, 140 + r() * 160, 90 + r() * 120, ['#4E3E72', '#24505A', '#6A3A4A'][i % 3], 0.16 + r() * 0.08);
      BG.stars(c, 220, 82, 0.8);
      c.save(); const gx = -40, gy = 210, gr = 200;
      c.beginPath(); c.arc(gx, gy, gr, 0, TAU); c.clip();
      const g = c.createLinearGradient(gx - gr, gy - gr, gx + gr, gy + gr); g.addColorStop(0, '#5A4A64'); g.addColorStop(0.5, '#3A3046'); g.addColorStop(1, '#1A1622');
      c.fillStyle = g; c.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
      for (let i = 0; i < 9; i++) { c.fillStyle = `rgba(${i % 2 ? '120,96,110' : '40,32,48'},.18)`; c.fillRect(gx - gr, gy - gr + i * 44 + r() * 10, gr * 2, 10 + r() * 16); }
      c.restore();
      c.strokeStyle = 'rgba(190,170,200,.22)'; c.lineWidth = 6; c.beginPath(); c.ellipse(gx, gy, gr * 1.6, gr * 0.28, -0.35, -0.6, 2.4); c.stroke();
      for (const [x, y, s] of [[W * 0.7, H * 0.62, 1], [W * 0.25, H * 0.82, 0.7]]) {
        c.fillStyle = '#16131D'; c.beginPath(); c.moveTo(x - 90 * s, y); c.lineTo(x + 70 * s, y - 8 * s); c.lineTo(x + 100 * s, y); c.lineTo(x + 70 * s, y + 8 * s); c.closePath(); c.fill();
        c.fillStyle = 'rgba(232,161,90,.5)'; for (let k = 0; k < 6; k++) c.fillRect(x - 60 * s + k * 22 * s, y - 1, 2, 2);
      }
      BG.vignette(c, 0.5);
    },
    bgDyn(c, t) {
      c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1;
      for (let i = 0; i < 26; i++) { const x = (i * 83.3) % W, y = ((t * (120 + (i % 4) * 80)) + i * 177) % (H + 60) - 30; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 10 + (i % 4) * 6); c.stroke(); }
    },
  },

  /* ===================== 09 · NÉO-TOKYO ===================== */
  {
    key: 'neotokyo', year: '', accent: '#9CC8E8', bgc: '#0B1222',
    view: 'top', vehicle: null, move: 'free', boom: 'neo', light: false,
    enemies: ['w9a', 'w9b', 'w9c', 'w9d', 'w9e', 'w9m'], scale: [1.15, 1.2, 1.3, 1.7, 1.25, 1.2],
    eb: 'b_beamlet', eb2: 'b_beamlet', esfx: 'e_servo',
    boss: { spr: 'w9boss', w: 320, ty: 0.26, move: 'sway', pats: ['beam', 'spiral', 'radial', 'aimed', 'wall'],
      nodes: { mode: 'fixed', spr: 'w9n', w: 64, pts: [[-101, -83], [101, -83], [-101, 83], [101, 83]] },
      deco(c, B, t) {
        // barre de balayage sur le noyau carré à lamelles (aucun halo ni anneau autour du centre)
        const k = B.w / Art.DEF.w9boss.w, y = Math.sin(t * 2.4) * 28; c.save(); c.translate(B.x, B.y); c.rotate(B.rot || 0); c.scale(k, k);
        c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(156,200,232,.6)'; c.fillRect(-28, y - 1.5, 56, 3);
        c.fillStyle = 'rgba(156,200,232,.16)'; c.fillRect(-28, y - 8, 56, 16);
        c.restore();
      } },
    bgStatic(c) {
      BG.grad(c, [[0, '#0A1120'], [0.6, '#132038'], [1, '#1B2942']]);
      BG.stars(c, 70, 91, 0.5, H * 0.5);
      Art.glow(c, 92, 150, 90, '#DCE6F2', 0.25); c.fillStyle = '#E4EAF2'; c.beginPath(); c.arc(92, 150, 26, 0, TAU); c.fill();
      const r = seeded(92);
      const skyline = (base, hmin, hmax, col, lit) => {
        let x = -10;
        while (x < W) {
          const w = 24 + r() * 46, h = hmin + r() * (hmax - hmin);
          c.fillStyle = col; c.fillRect(x, base - h, w, h + (H - base));
          if (r() < 0.25) { c.fillRect(x + w / 2 - 1, base - h - 26, 2, 26); this._lights.push([x + w / 2, base - h - 26]); }
          if (lit) for (let yy = base - h + 8; yy < base - 4; yy += 9) for (let xx = x + 5; xx < x + w - 5; xx += 7) if (r() < 0.17) { c.fillStyle = r() < 0.6 ? 'rgba(232,194,122,.5)' : 'rgba(156,200,232,.4)'; c.fillRect(xx, yy, 3, 4); }
          x += w + 2;
        }
      };
      this._lights = [];
      skyline(H - 300, 60, 220, '#18253C', false);
      skyline(H - 170, 50, 200, '#101A2C', true);
      skyline(H - 60, 30, 120, '#0A111E', true);
      c.strokeStyle = '#0C1424'; c.lineWidth = 2;
      for (const px of [36, W - 36]) { c.beginPath(); c.moveTo(px - 18, H); c.lineTo(px, H - 330); c.lineTo(px + 18, H); c.moveTo(px - 26, H - 280); c.lineTo(px + 26, H - 280); c.moveTo(px - 12, H - 200); c.lineTo(px + 12, H - 200); c.stroke(); }
      c.strokeStyle = 'rgba(12,20,36,.9)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(10, H - 280); c.quadraticCurveTo(W / 2, H - 200, W - 10, H - 280); c.stroke();
      c.beginPath(); c.moveTo(10, H - 270); c.quadraticCurveTo(W / 2, H - 186, W - 10, H - 270); c.stroke();
    },
    _lights: [],
    bgDyn(c, t) {
      for (const [x, y] of this._lights) { const a = Math.sin(t * 2 + x) > 0.2 ? 0.8 : 0.15; Art.glow(c, x, y, 7, '#C8645A', a); }
      c.strokeStyle = 'rgba(200,220,240,.07)'; c.lineWidth = 1;
      for (let i = 0; i < 40; i++) { const x = (i * 61 + t * 60) % (W + 40) - 20, y = (i * 137 + t * 520) % H; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 5, y + 16); c.stroke(); }
    },
  },

  /* ===================== 10 · FRÉQUENCE ZÉRO ===================== */
  {
    key: 'zero', year: '', accent: '#E9C979', bgc: '#0A1834',
    view: 'top', vehicle: null, move: 'free', boom: 'gold', light: false, glitch: true,
    enemies: ['w10a', 'w10b', 'w10c', 'w10d', 'w10e', 'w10m'], scale: [1.15, 1.2, 1.4, 1.7, 1.25, 1.2],
    eb: 'b_tile', eb2: 'b_glitch', esfx: 'e_glitch',
    boss: { spr: 'w10boss', w: 320, ty: 0.26, move: 'sway', spinSprite: 0.15, pats: ['spiral', 'radial', 'beam', 'rain', 'mines', 'aimed'],
      nodes: { mode: 'orbit', n: 8, r: 170, ry: 0.8, spr: 'w10n', w: 44, spin: 0.6 },
      deco(c, B, t) {
        // parasites : bandes horizontales qui glissent sur la coque (aucun arc autour du centre)
        c.save(); c.translate(B.x, B.y); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) {
          const y = ((t * 70 + i * 53) % 200) - 100, w = 60 + ((i * 37 + Math.floor(t * 6)) % 5) * 14;
          c.fillStyle = ['rgba(255,60,140,.32)', 'rgba(60,240,255,.32)', 'rgba(233,201,121,.36)'][i]; c.fillRect(-w / 2 + Math.sin(t * 9 + i) * 8, y, w, 2.5);
        }
        c.restore();
      } },
    bgStatic(c) {
      BG.grad(c, [[0, '#091630'], [0.5, '#0E2A5C'], [1, '#081631']]);
      c.strokeStyle = 'rgba(233,201,121,.13)'; c.lineWidth = 1.3;
      const s = 90;
      for (let y = 0; y < H + s; y += s) for (let x = 0; x < W + s; x += s) {
        c.save(); c.translate(x + ((y / s) % 2 ? s / 2 : 0), y);
        c.stroke(Art.path(Art.STAR(8, 34, 22))); c.stroke(Art.path(Art.POLY(8, 46, Math.PI / 8)));
        c.restore();
      }
      BG.vignette(c, 0.7, '4,8,20');
    },
    bgDyn(c, t, g) {
      c.save(); c.translate(W / 2, H * 0.38); c.rotate(t * 0.05); c.strokeStyle = 'rgba(233,201,121,.1)'; c.lineWidth = 2; c.stroke(Art.path(Art.STAR(16, 270, 220))); c.restore();
      const lvl = g ? (g.mode === 'inf' ? 2 : g.m) : 1;
      const k = Math.floor(t * 3), r = seeded(k + 1); // bandes de brouillage : 3 changements par seconde au plus
      if (r() < 0.25 + lvl * 0.12) for (let i = 0; i < 2 + lvl; i++) { const y = r() * H, h = 2 + r() * 14; c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.06)'; c.fillRect(0, y, W, h); }
    },
  },
  /* ===================== 11 · 1902, LE VOYAGE (cinéma muet) =====================
     Tout l'écran de jeu passe en noir et blanc (classe « bw » posée par UI.worldTheme) ; grain, poussières,
     rayures et papillotement par-dessus (overlay), ouverture et fermeture à l'iris, briefing en cartons. */
  {
    key: 'muet', year: '1902', accent: '#E8E6E0', bgc: '#101010', bw: true, silent: true, era: 'columbiad',
    view: 'top', vehicle: null, move: 'free', boom: 'film', light: false,
    enemies: ['w11a', 'w11b', 'w11c', 'w11d', 'w11e', 'w11m'], scale: [1.2, 1.3, 1.45, 1.65, 1.45, 1.2],
    eb: 'b_star', eb2: 'b_ball', esfx: 'e_tick',
    boss: { spr: 'w11boss', w: 330, ty: 0.25, move: 'sway', pats: ['radial', 'rain', 'aimed', 'spiral'],
      nodes: { mode: 'orbit', n: 5, r: 178, ry: 0.72, spr: 'w11n', w: 46, spin: 0.45 } },
    bgStatic(c) {
      // toile de fond peinte : ciel de théâtre en grisaille, coups de brosse horizontaux
      BG.grad(c, [[0, '#121212'], [0.55, '#2A2A29'], [1, '#3C3B38']]);
      const r = seeded(1902);
      for (let i = 0; i < 46; i++) { const y = r() * H, x = r() * W - 80, l = 120 + r() * 260; c.fillStyle = `rgba(${r() < 0.5 ? '255,255,250' : '0,0,0'},${0.02 + r() * 0.04})`; c.fillRect(x, y, l, 2 + r() * 7); }
      BG.moon(c, 78, 118, 42, 1903, ['#E8E6E0', '#A8A6A0', '#585754'], '14,14,14');
      BG.vignette(c, 0.8, '0,0,0');
    },
    bgDyn() {},
    overlay(c, t, g) {
      // pellicule : papillotement, poussières (changent 12 fois par seconde), rayures verticales, coins arrondis de la fenêtre
      // papillotement plein écran : variation lente et continue (moins d'une oscillation par seconde, jamais un flash), poussières à part
      const k = Math.floor(t * 12), r = seeded(k * 7 + 3), calm = Store.d.set.calm, fv = 0.04 * Math.sin(t * 4.1) * Math.sin(t * 1.3);
      c.fillStyle = fv > 0 ? `rgba(255,255,255,${fv * (calm ? 0.3 : 1)})` : `rgba(0,0,0,${-fv * 1.6 * (calm ? 0.3 : 1)})`; c.fillRect(0, 0, W, H);
      if (!calm) {
        for (let i = 0; i < 9; i++) { const x = r() * W, y = r() * H, s = 1 + r() * 2.4; c.fillStyle = r() < 0.6 ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.4)'; c.fillRect(x, y, s, s * (0.6 + r() * 2.2)); }
        if (r() < 0.25) { c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; const x = r() * W; c.beginPath(); c.moveTo(x, r() * H * 0.3); c.quadraticCurveTo(x + 8, H * 0.5, x + r() * 20 - 10, H * (0.6 + r() * 0.4)); c.stroke(); }
      }
      const s = seeded(Math.floor(t * 1.7) + 11), sx = s() * W; c.fillStyle = 'rgba(255,255,255,.10)'; c.fillRect(Math.round(sx + Math.sin(t * 3) * 6), 0, 1.2, H);
      if (s() < 0.5) { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(Math.round(s() * W), 0, 1, H); }
      // fenêtre de projection : coins noirs arrondis
      c.fillStyle = '#000'; c.beginPath(); c.rect(0, 0, W, H); c.roundRect(5, 5, W - 10, H - 10, 34); c.fill('evenodd');
      // iris : s'ouvre au début du niveau, se ferme à la victoire
      let ir = 1;
      if (g && g.intro && !g.intro.started) ir = Math.min(1, g.intro.t / 1.4);
      if (g && g.outro) ir = Math.min(ir, 1 - g.outro.k);
      if (ir < 1) { const R = Math.hypot(W, H) * 0.55 * easeOut(ir), cx = g.p.x, cy = Math.min(g.p.y, H * 0.62); c.beginPath(); c.rect(0, 0, W, H); c.arc(cx, cy, Math.max(0.5, R), 0, TAU); c.fill('evenodd'); }
    },
  },

  /* ===================== 12 · RELIEF, 1848 (fausse 3D) =====================
     Caméra inclinée au-dessus d'un plan-relief : horizon haut, sol en perspective qui défile, ennemis qui
     surgissent de l'horizon et grossissent en approchant (Game.depthK), ombres portées au sol. */
  {
    key: 'relief', year: '1848', accent: '#E2C089', bgc: '#4F5A3A', persp: true, light: true, dynRes: 1, era: 'columbiad',
    view: 'top', vehicle: null, move: 'free', boom: 'relief',
    get horizon() { return Math.round(H * 0.17); },
    get formY() { return Math.round(H * 0.3); },
    entries: ['horizon', 'horizon', 'horizon', 'side', 'spiral'],
    enemies: ['w12a', 'w12b', 'w12c', 'w12d', 'w12e', 'w12m'], scale: [1.75, 1.7, 1.85, 1.9, 1.75, 1.45],
    eb: 'b_shell', eb2: 'b_ball', esfx: 'e_flak',
    boss: { spr: 'w12boss', w: 330, ty: 0.3, move: 'drift', pats: ['aimed', 'bombs', 'radial', 'wall'],
      nodes: { mode: 'fixed', spr: 'w12n', w: 46, pts: [[0, -130], [124, -40], [76, 105], [-76, 105], [-124, -40]] } },
    bgStatic(c) {
      const hz = this.horizon;
      // ciel de galerie : lumière douce des grandes fenêtres, sol de base sous l'horizon
      BG.grad(c, [[0, '#8FA3A8'], [1, '#E4DCC4']], 0, hz);
      BG.grad(c, [[0, '#8E9A62'], [1, '#86925A']], hz, H);
    },
    _fields: ['#8E9A5E', '#A7A266', '#7A8A50', '#B5A672', '#6E7E4A', '#9AA46E', '#A8946A', '#86925A'],
    bgDyn(c, t) {
      const hz = this.horizon, gy = H - hz, cx = W / 2, sp = 0.9, T = t * sp, off = T % 1, base = Math.floor(T), r = seeded(1848);
      const yz = z => hz + gy * 1.2 / z;
      const XB = [-9, -5.5, -3.2, -1.7, -0.95, -0.5, -0.16, 0.16, 0.5, 0.95, 1.7, 3.2, 5.5, 9].map(v => v * W * 0.62), nc = XB.length - 1;
      // parcelles : rangées en perspective qui avancent vers le joueur ; regroupées par couleur (un seul remplissage par couleur :
      // le sol est repeint à chaque image, retours n° 3), les rangées proches recouvrent les lointaines dans l'ordre des couleurs
      const F = this._fields, paths = F.map(() => new Path2D()), roofs = new Path2D(), walls = new Path2D(), river = new Path2D();
      for (let n = 15; n >= 1; n--) {
        const z0 = Math.max(0.6, n - off), z1 = n + 1 - off, y0 = yz(z0), y1 = yz(z1); if (y1 > H) continue;
        const row = base + 20 - n;
        for (let j = 0; j < nc; j++) {
          const h = ((row * 73856093) ^ (j * 19349663)) >>> 0;
          const a0 = XB[j] / z0, a1 = XB[j + 1] / z0, b0 = XB[j] / z1, b1 = XB[j + 1] / z1;
          if (cx + a1 < 0 || cx + a0 > W) continue; // parcelle hors écran
          // une parcelle sur deux garde la couleur du sol de fond (moitié moins de surface à peindre)
          if ((h >> 3) % 2 && (n < 12 || j % 3 === 0)) { const P = paths[h % F.length]; P.moveTo(cx + b0, y1); P.lineTo(cx + b1, y1); P.lineTo(cx + a1, y0); P.lineTo(cx + a0, y0); P.closePath(); }
          // maisonnettes de la maquette (toits rouges) sur certaines parcelles
          if (h % 5 === 0 && n < 9) { const m = (XB[j] + XB[j + 1]) / 2 / ((z0 + z1) / 2), y = (y0 + y1) / 2, s = 26 / ((z0 + z1) / 2) + 1;
            walls.rect(cx + m - s, y - s * 0.4, s * 2, s * 0.8); roofs.rect(cx + m - s, y - s * 0.4, s * 2, s * 0.35); }
        }
        // rivière qui serpente (sa position suit la rangée)
        const rx0 = Math.sin((row) * 0.45) * W * 0.5, rx1 = Math.sin((row - 1) * 0.45) * W * 0.5, w = W * 0.09;
        river.moveTo(cx + (rx1 - w) / z1, y1); river.lineTo(cx + (rx1 + w) / z1, y1); river.lineTo(cx + (rx0 + w) / z0, y0); river.lineTo(cx + (rx0 - w) / z0, y0); river.closePath();
      }
      F.forEach((col, i) => { c.fillStyle = col; c.fill(paths[i]); });
      c.fillStyle = '#6F8C92'; c.fill(river); c.fillStyle = '#D8CCB0'; c.fill(walls); c.fillStyle = '#9A4E34'; c.fill(roofs);
      // haies : limites des parcelles (horizontales en simples bandes, moins coûteuses qu'un trait lissé ; le sol est repeint à chaque image)
      c.fillStyle = 'rgba(52,62,32,.55)';
      for (let n = 1; n <= 15; n++) { const y = yz(n + 1 - off); if (y < H) c.fillRect(0, y - 0.6, W, 1.2); }
      c.strokeStyle = 'rgba(52,62,32,.55)'; c.lineWidth = 1.2; c.beginPath();
      for (const xb of XB) { c.moveTo(cx + xb / 0.6, yz(0.6)); c.lineTo(cx + xb / 16, yz(16)); }
      c.stroke();
      // brume de l'horizon : dégradé peint une fois dans une bande, recopiée à chaque image
      if (!this._fog || this._fogW !== W) {
        this._fogW = W; const fc = document.createElement('canvas'); fc.width = Math.ceil(W); fc.height = 74; const g2 = fc.getContext('2d'), g = g2.createLinearGradient(0, 0, 0, 74);
        g.addColorStop(0, 'rgba(228,220,196,.95)'); g.addColorStop(1, 'rgba(228,220,196,0)'); g2.fillStyle = g; g2.fillRect(0, 0, fc.width, 74); this._fog = fc;
      }
      c.drawImage(this._fog, 0, hz - 4);
    },
  },

];

/* Ultimes : nom affiché + type d'effet */
const ULTS = {
  beam:    { },
  blades:  { },
  orbital: { },
  boom:    { },
  shell:   { },
  ram:     { },
  saturn:  { },
  reset:   { },
};

/* =========================================================
   DÉCORS EN COUCHES (parallaxe)
   Chaque univers a 2 ou 3 couches qui défilent à des vitesses différentes par-dessus son décor fixe (bgStatic)
   et sous son décor animé (bgDyn). Une couche = une tuile peinte une seule fois (mise en cache) qui boucle.
   { sp: vitesse en px/s, h: longueur de la tuile, dir: 'y' (vers le bas, vue de dessus) | 'x' (vers la gauche, profil),
     a: opacité, front: true = par-dessus le jeu (à garder très léger), draw(c, w, h, put, r) }
   put(x, y, f) dessine f à la position voulue et la recopie de l'autre côté du raccord (tuile sans couture).
   Seules les tuiles de l'univers en cours restent en mémoire.
   ========================================================= */
Object.assign(BG, {
  _tk: null, _tc: null,
  tiles(Wd, dpr) {
    const key = Wd.key + '|' + dpr + '|' + H;
    if (this._tk === key) return this._tc;
    this._tk = key;
    return (this._tc = (Wd.layers || []).map((L, i) => this.tile(Wd, L, i, dpr)));
  },
  tile(Wd, L, i, dpr) {
    const X = L.dir === 'x', tw = X ? L.h : W, th = X ? H : L.h;
    const cv = document.createElement('canvas'); cv.width = Math.ceil(tw * dpr); cv.height = Math.ceil(th * dpr);
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const put = (x, y, f) => { for (const k of [-1, 0, 1]) { c.save(); c.translate(X ? x + k * tw : x, X ? y : y + k * th); f(c); c.restore(); } };
    L.draw(c, tw, th, put, seeded(97 + i * 31 + Wd.key.length * 7));
    return { L, cv, tw, th };
  },
  drawLayers(c, Wd, t, front, dpr) {
    if (!Wd.layers || !Wd.layers.length) return;
    for (const T of this.tiles(Wd, dpr)) {
      const L = T.L; if (!!L.front !== !!front) continue;
      c.globalAlpha = L.a == null ? 1 : L.a;
      // décalage arrondi au pixel de l'écran : copie directe, sans filtrage (bien plus rapide)
      if (L.dir === 'x') { const off = Math.round((t * L.sp) % T.tw * dpr) / dpr; for (let x = -off; x < W; x += T.tw) c.drawImage(T.cv, x, 0, T.tw, T.th); }
      else { const off = Math.round((t * L.sp) % T.th * dpr) / dpr; for (let y = off - T.th; y < H; y += T.th) c.drawImage(T.cv, 0, y, T.tw, T.th); }
    }
    c.globalAlpha = 1;
  },
  // décor fixe complet (menus, vignettes) : fond + couches arrière à l'arrêt, sans toucher au cache du jeu
  still(c, Wd) {
    Wd.bgStatic(c);
    (Wd.layers || []).forEach((L, i) => { if (L.front) return; const T = this.tile(Wd, L, i, 1); c.globalAlpha = L.a == null ? 1 : L.a; if (L.dir === 'x') for (let x = 0; x < W; x += T.tw) c.drawImage(T.cv, x, 0, T.tw, T.th); else for (let y = 0; y < H; y += T.th) c.drawImage(T.cv, 0, y, T.tw, T.th); c.globalAlpha = 1; });
  },
  // Lune à cratères, éclairée par la gauche, en phase gibbeuse. Aucun visage : beaucoup de cratères de tailles
  // variées, jamais deux gros cratères à la même hauteur, pas de « mers » sombres symétriques.
  moon(c, x, y, r, seed, tone = ['#EDE6D4', '#B9B19C', '#6E6858'], shade = '8,10,20') {
    const rnd = seeded(seed), lx = -0.62, ly = -0.5, la = Math.atan2(ly, lx);
    const g = c.createRadialGradient(x + lx * r * 0.55, y + ly * r * 0.55, r * 0.08, x, y, r);
    g.addColorStop(0, tone[0]); g.addColorStop(0.7, tone[1]); g.addColorStop(1, tone[2]);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip();
    // terrain : marbrures allongées (pas de taches rondes)
    for (let i = 0; i < 7; i++) { const a = rnd() * TAU, d = rnd() * r * 0.8; c.fillStyle = 'rgba(70,64,52,.10)'; c.beginPath(); c.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d, r * (0.15 + rnd() * 0.3), r * (0.05 + rnd() * 0.1), rnd() * 3, 0, TAU); c.fill(); }
    const cr = [];
    for (let k = 0; k < 500 && cr.length < 40; k++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * r * 0.95, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, rr = r * (0.025 + Math.pow(rnd(), 3) * 0.17);
      if (cr.some(q => Math.hypot(q[0] - cx, q[1] - cy) < (q[2] + rr) * 0.9)) continue;
      if (rr > r * 0.07 && cr.some(q => q[2] > r * 0.07 && Math.abs(q[1] - cy) < r * 0.4)) continue; // pas de paire de gros cratères à la même hauteur
      cr.push([cx, cy, rr]);
    }
    for (const [cx, cy, rr] of cr) {
      const dx = (cx - x) / r, dy = (cy - y) / r, dd = Math.min(0.98, Math.hypot(dx, dy)), sq = Math.sqrt(1 - dd * dd) * 0.75 + 0.25, an = Math.atan2(dy, dx);
      c.save(); c.translate(cx, cy); c.rotate(an); c.scale(sq, 1);
      c.fillStyle = 'rgba(64,58,46,.26)'; c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(40,36,28,.34)'; c.lineWidth = Math.max(0.8, rr * 0.24); c.beginPath(); c.arc(0, 0, rr * 0.8, la - an - 1.1, la - an + 1.1); c.stroke();
      c.strokeStyle = 'rgba(255,252,240,.45)'; c.lineWidth = Math.max(0.7, rr * 0.16); c.beginPath(); c.arc(0, 0, rr, la - an + Math.PI - 1.2, la - an + Math.PI + 1.2); c.stroke();
      c.restore();
    }
    // terminateur : la droite du disque dans l'ombre (phase gibbeuse)
    const tg = c.createLinearGradient(x + r * 0.1, y - r * 0.25, x + r, y + r * 0.3); tg.addColorStop(0, 'rgba(' + shade + ',0)'); tg.addColorStop(0.55, 'rgba(' + shade + ',.55)'); tg.addColorStop(1, 'rgba(' + shade + ',.88)');
    c.fillStyle = tg; c.fillRect(x - r, y - r, r * 2, r * 2);
    c.restore();
    c.strokeStyle = 'rgba(255,250,236,.35)'; c.lineWidth = 1.4; c.beginPath(); c.arc(x, y, r - 0.7, Math.PI * 0.55, Math.PI * 1.55); c.stroke();
  },
});

const LAYERS = {
  // 01 · données qui tombent (loin), pistes de circuit (milieu)
  bureau: [
    { sp: 16, h: 520, a: 0.9, draw(c, w, h, put, r) { for (let i = 0; i < 70; i++) { const x = Math.round(r() * w / 6) * 6, y = r() * h, l = 3 + r() * 9, hi = r() < 0.2; put(x, y, c => { c.fillStyle = hi ? 'rgba(138,214,168,.22)' : 'rgba(200,230,215,.07)'; c.fillRect(0, 0, 2, l); }); } } },
    { sp: 48, h: 680, draw(c, w, h, put, r) {
      for (let i = 0; i < 16; i++) {
        const x = 20 + r() * (w - 40), y = r() * h, pts = [[0, 0]]; let px = 0, py = 0;
        for (let k = 0; k < 4; k++) { if (k % 2) px += (r() < 0.5 ? -1 : 1) * (20 + r() * 50); else py += 30 + r() * 70; pts.push([px, py]); }
        put(x, y, c => { c.strokeStyle = 'rgba(138,214,168,.13)'; c.lineWidth = 1.6; c.beginPath(); pts.forEach(([a, b], j) => j ? c.lineTo(a, b) : c.moveTo(a, b)); c.stroke();
          c.fillStyle = 'rgba(138,214,168,.22)'; const [ex, ey] = pts[pts.length - 1]; c.fillRect(ex - 3, ey - 3, 6, 6); c.fillRect(-2.5, -2.5, 5, 5); });
      }
    } },
  ],
  // 02 · étoiles lointaines, nuages de nuit gravés (hachures)
  columbiad: [
    { sp: 6, h: 600, draw(c, w, h, put, r) { for (let i = 0; i < 80; i++) { const x = r() * w, y = r() * h, a = 0.2 + r() * 0.5; put(x, y, c => { c.fillStyle = 'rgba(236,224,196,' + a + ')'; c.fillRect(0, 0, 1.4, 1.4); }); } } },
    { sp: 30, h: 760, draw(c, w, h, put, r) {
      for (let i = 0; i < 6; i++) { const x = r() * w, y = r() * h, rx = 70 + r() * 90, ry = 10 + r() * 12;
        put(x, y, c => { c.fillStyle = 'rgba(30,38,64,.55)'; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.ellipse(rx * 0.4, -ry * 0.6, rx * 0.5, ry * 0.8, 0, 0, TAU); c.fill();
          c.save(); c.clip(); c.strokeStyle = 'rgba(232,207,152,.10)'; c.lineWidth = 1; for (let k = -rx; k < rx * 1.5; k += 5) { c.beginPath(); c.moveTo(k, -ry * 2); c.lineTo(k - ry * 2, ry * 2); c.stroke(); } c.restore();
          c.strokeStyle = 'rgba(232,207,152,.16)'; c.beginPath(); c.ellipse(rx * 0.4, -ry * 0.6, rx * 0.5, ry * 0.8, 0, Math.PI * 1.05, Math.PI * 1.9); c.stroke(); }); }
    } },
  ],
  // 03 · crêtes lointaines, piliers de roche, roches proches (profil : défile vers la gauche)
  abysses: [
    { dir: 'x', sp: 8, h: 760, draw(c, w, h, put, r) { const pts = []; for (let x = 0; x <= w; x += 38) pts.push([x, h - 150 - r() * 170]); pts[pts.length - 1][1] = pts[0][1];
      put(0, 0, c => { c.fillStyle = 'rgba(12,44,56,.75)'; c.beginPath(); c.moveTo(0, h); pts.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(w, h); c.fill(); }); } },
    { dir: 'x', sp: 20, h: 640, draw(c, w, h, put, r) { for (let i = 0; i < 4; i++) { const x = (i + r() * 0.5) * w / 4, hh = 160 + r() * 220, bw = 30 + r() * 30;
      put(x, h, c => { c.fillStyle = 'rgba(9,30,38,.92)'; c.beginPath(); c.moveTo(-bw, 0); c.lineTo(-bw * 0.6, -hh * 0.6); c.lineTo(-bw * 0.3, -hh); c.lineTo(bw * 0.4, -hh * 0.92); c.lineTo(bw * 0.7, -hh * 0.5); c.lineTo(bw, 0); c.fill();
        c.strokeStyle = 'rgba(170,220,225,.08)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-bw * 0.3, -hh); c.lineTo(-bw * 0.6, -hh * 0.6); c.stroke(); }); } } },
    { dir: 'x', sp: 42, h: 600, draw(c, w, h, put, r) { const pts = []; for (let x = 0; x <= w; x += 20) pts.push([x, h - 40 - r() * 50 - (r() < 0.15 ? 30 : 0)]); pts[pts.length - 1][1] = pts[0][1];
      put(0, 0, c => { c.fillStyle = '#06121A'; c.beginPath(); c.moveTo(0, h); pts.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(w, h); c.fill(); }); } },
  ],
  // 04 · ruines à l'horizon (lointaines), sol du front : tranchée, piquets, barbelés, trous d'obus (proche)
  somme: [
    { dir: 'x', sp: 5, h: 820, a: 0.85, draw(c, w, h, put, r) { const hz = h - 170;
      for (let i = 0; i < 9; i++) { const x = r() * w, bw = 14 + r() * 40, bh = 16 + r() * 46;
        put(x, hz, c => { c.fillStyle = '#4A443A'; c.beginPath(); c.moveTo(0, 2); c.lineTo(0, -bh); c.lineTo(bw * 0.3, -bh + 6); c.lineTo(bw * 0.5, -bh * 0.6); c.lineTo(bw * 0.75, -bh * 0.8); c.lineTo(bw, -bh * 0.4); c.lineTo(bw, 2); c.fill(); }); }
      for (let i = 0; i < 6; i++) { const x = r() * w, th = 30 + r() * 40; put(x, hz, c => { c.strokeStyle = '#3E392F'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(1, -th); c.moveTo(1, -th * 0.6); c.lineTo(9, -th * 0.8); c.moveTo(0, -th * 0.35); c.lineTo(-7, -th * 0.5); c.stroke(); }); }
    } },
    { dir: 'x', sp: 34, h: 690, draw(c, w, h, put, r) {
      put(0, 0, c => { c.strokeStyle = '#141210'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, h - 96); for (let x = 0; x <= w; x += 23) c.lineTo(x, h - 96 + ((x / 23) % 2 ? 7 : -3)); c.lineTo(w, h - 96); c.stroke();
        c.strokeStyle = 'rgba(20,18,15,.8)'; c.lineWidth = 1; for (let x = 12; x < w; x += 46) { c.beginPath(); c.moveTo(x, h - 136); c.lineTo(x, h - 118); c.stroke(); }
        c.beginPath(); for (let x = 0; x <= w; x += 6) { const y = h - 132 + Math.sin(x / w * TAU * 30) * 3; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); });
      for (let i = 0; i < 9; i++) { const x = r() * w, y = h - 70 + r() * 50, rx = 16 + r() * 22, ry = 4 + r() * 4; put(x, y, c => { c.fillStyle = 'rgba(10,9,8,.3)'; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(120,108,88,.25)'; c.beginPath(); c.ellipse(0, -1, rx, ry, 0, Math.PI, TAU); c.stroke(); }); }
    } },
  ],
  // 05 · cirrus très hauts (lents), voiles de nuage qui passent par-dessus le jeu (légers)
  aero: [
    { sp: 9, h: 700, draw(c, w, h, put, r) { for (let i = 0; i < 9; i++) { const x = r() * w, y = r() * h, l = 80 + r() * 160, lw = 2 + r() * 3; put(x, y, c => { c.strokeStyle = 'rgba(255,240,230,.12)'; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.moveTo(-l / 2, 0); c.quadraticCurveTo(0, -8, l / 2, 4); c.stroke(); }); } } },
    { front: true, sp: 150, h: 1100, a: 0.5, draw(c, w, h, put, r) { for (let i = 0; i < 3; i++) { const x = r() * w, y = r() * h; put(x, y, c => { for (let k = 0; k < 4; k++) BG.blob(c, (k - 1.5) * 50, Math.sin(k * 2) * 14, 90, 34, '#FFF4EA', 0.16); }); } } },
  ],
  // 06 · bancs de brume (loin), écume (près)
  atlantique: [
    { sp: 12, h: 820, draw(c, w, h, put, r) { for (let i = 0; i < 5; i++) { const x = r() * w, y = r() * h; put(x, y, c => BG.blob(c, 0, 0, 220, 40, '#C8D4DC', 0.10)); } } },
    { sp: 92, h: 700, draw(c, w, h, put, r) { for (let i = 0; i < 26; i++) { const x = r() * w, y = r() * h, l = 10 + r() * 26; put(x, y, c => { c.strokeStyle = 'rgba(236,244,248,.22)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-l, 0); c.quadraticCurveTo(0, -5, l, 0); c.stroke(); c.strokeStyle = 'rgba(236,244,248,.1)'; c.beginPath(); c.moveTo(-l * 0.6, 4); c.quadraticCurveTo(0, 1, l * 0.6, 4); c.stroke(); }); } } },
  ],
  // 07 · étoiles fines (très loin), débris en orbite (milieu), poussière (près)
  orbite: [
    { sp: 4, h: 640, draw(c, w, h, put, r) { for (let i = 0; i < 90; i++) { const x = r() * w, y = r() * h * 0.9, a = 0.15 + r() * 0.45; put(x, y, c => { c.fillStyle = 'rgba(220,232,255,' + a + ')'; c.fillRect(0, 0, 1.1, 1.1); }); } } },
    { sp: 26, h: 900, draw(c, w, h, put, r) { for (let i = 0; i < 7; i++) { const x = r() * w, y = r() * h, s = 3 + r() * 5, a0 = r() * 3;
      put(x, y, c => { c.rotate(a0); c.fillStyle = '#2A2E36'; c.beginPath(); c.moveTo(-s, -s * 0.4); c.lineTo(s * 0.8, -s * 0.7); c.lineTo(s, s * 0.5); c.lineTo(-s * 0.5, s * 0.6); c.closePath(); c.fill(); c.strokeStyle = 'rgba(200,220,240,.35)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-s, -s * 0.4); c.lineTo(s * 0.8, -s * 0.7); c.stroke(); }); } } },
    { sp: 130, h: 800, a: 0.8, draw(c, w, h, put, r) { for (let i = 0; i < 18; i++) { const x = r() * w, y = r() * h, l = 6 + r() * 14; put(x, y, c => { c.fillStyle = 'rgba(200,220,240,.12)'; c.fillRect(0, 0, 1, l); }); } } },
  ],
  // 08 · voiles de nébuleuse (loin), croiseurs lointains feux en rang (milieu)
  escadre: [
    { sp: 7, h: 900, draw(c, w, h, put, r) { for (let i = 0; i < 5; i++) { const x = r() * w, y = r() * h, col = ['#6A4E8A', '#2E6A72', '#8A4A5C'][i % 3]; put(x, y, c => { BG.blob(c, 0, 0, 180, 50, col, 0.10); BG.blob(c, 60, 20, 120, 30, col, 0.08); }); } } },
    { sp: 22, h: 1000, draw(c, w, h, put, r) { for (let i = 0; i < 3; i++) { const x = 60 + r() * (w - 120), y = r() * h, s = 0.45 + r() * 0.4;
      put(x, y, c => { c.scale(s, s); c.fillStyle = '#120F18'; c.beginPath(); c.moveTo(0, -110); c.lineTo(14, -60); c.lineTo(16, 70); c.lineTo(34, 96); c.lineTo(-34, 96); c.lineTo(-16, 70); c.lineTo(-14, -60); c.closePath(); c.fill();
        c.fillStyle = 'rgba(232,161,90,.45)'; for (let k = 0; k < 7; k++) c.fillRect(-1, -50 + k * 18, 2, 3); c.strokeStyle = 'rgba(201,163,184,.18)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -110); c.lineTo(-14, -60); c.lineTo(-16, 70); c.stroke(); }); } } },
  ],
  // 09 · nappe de brume (loin), voies de circulation aérienne (milieu, défilent vers la gauche)
  neotokyo: [
    { dir: 'x', sp: 10, h: 900, draw(c, w, h, put, r) { for (let i = 0; i < 4; i++) { const x = r() * w, y = h - 330 + r() * 140; put(x, y, c => BG.blob(c, 0, 0, 200, 22, '#9CB0CC', 0.10)); } } },
    { dir: 'x', sp: 70, h: 640, draw(c, w, h, put, r) { for (const ly of [h - 380, h - 300, h - 236]) for (let i = 0; i < 9; i++) { const x = r() * w, warm = r() < 0.5, dy = r() * 6;
      put(x, ly + dy, c => { c.fillStyle = warm ? 'rgba(232,194,122,.55)' : 'rgba(156,200,232,.5)'; c.fillRect(0, 0, 7, 2); c.fillStyle = warm ? 'rgba(232,194,122,.12)' : 'rgba(156,200,232,.12)'; c.fillRect(7, 0, 22, 2); }); } } },
  ],
  // 10 · second treillis d'étoiles (loin), éclats d'or flottants (milieu)
  zero: [
    { sp: 10, h: 540, draw(c, w, h, put, r) { const s = 135; for (let y = 0; y < h; y += s) for (let x = 0; x < w + s; x += s) put(x + ((y / s) % 2 ? s / 2 : 0) + 45, y + 45, c => { c.strokeStyle = 'rgba(233,201,121,.06)'; c.lineWidth = 1; c.stroke(Art.path(Art.STAR(8, 52, 36))); }); } },
    { sp: 34, h: 720, draw(c, w, h, put, r) { for (let i = 0; i < 16; i++) { const x = r() * w, y = r() * h, s = 3 + r() * 5, a0 = r() * 3; put(x, y, c => { c.rotate(a0); c.fillStyle = 'rgba(233,201,121,.3)'; c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.6, 0); c.lineTo(0, s); c.lineTo(-s * 0.6, 0); c.closePath(); c.fill(); }); } } },
  ],
  // 11 · étoiles de carton peintes (loin), nuages de théâtre découpés (milieu)
  muet: [
    { sp: 12, h: 620, draw(c, w, h, put, r) { for (let i = 0; i < 30; i++) { const x = r() * w, y = r() * h, s = 1.6 + r() * 2.6, a = 0.1 + r() * 0.2, rot = r();
      put(x, y, c => { c.rotate(rot); c.fillStyle = `rgba(236,234,226,${a})`; c.fill(Art.path(Art.STAR(5, s, s * 0.45))); }); } } },
    { sp: 38, h: 900, draw(c, w, h, put, r) { for (let i = 0; i < 4; i++) { const x = r() * w, y = r() * h, s = 0.7 + r() * 0.6, flip = r() < 0.5 ? -1 : 1, b = [0.55 + r() * 0.3, 0.8 + r() * 0.4, 0.45 + r() * 0.3];
      put(x, y, c => { c.scale(s * flip, s);
        // nuage plat de carton : bosses de tailles différentes, bas droit, contour noir, liseré clair en haut
        c.beginPath(); c.moveTo(-90, 18); c.bezierCurveTo(-110, -6, -80, -34 * b[0], -50, -24); c.bezierCurveTo(-40, -60 * b[1], 10, -64 * b[1], 22, -30); c.bezierCurveTo(40, -48 * b[2], 92, -36, 88, 18); c.closePath();
        c.fillStyle = '#4A4947'; c.fill(); c.strokeStyle = '#0A0A0A'; c.lineWidth = 3; c.stroke();
        c.strokeStyle = 'rgba(240,238,230,.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-46, -26); c.bezierCurveTo(-34, -56 * b[1], 8, -58 * b[1], 18, -32); c.stroke();
        c.fillStyle = '#3A3937'; c.fillRect(-4, 18, 8, 26); }); } } },
  ],
  // 12 · collines du fond qui glissent à l'horizon, nuages plats du ciel de galerie
  relief: [
    { dir: 'x', sp: 4, h: 760, draw(c, w, h, put, r) { const hz = Math.round(H * 0.17); for (let i = 0; i < 5; i++) { const x = r() * w, a = 30 + r() * 40, l = 120 + r() * 160, col = r() < 0.5 ? '#7F8C72' : '#93A080';
      put(x, hz, c => { c.fillStyle = col; c.beginPath(); c.moveTo(-l, 2); c.bezierCurveTo(-l * 0.5, -a * 0.2, -l * 0.3, -a, 0, -a * 0.9); c.bezierCurveTo(l * 0.3, -a * 0.8, l * 0.6, -a * 0.1, l, 2); c.closePath(); c.fill(); }); } } },
    { dir: 'x', sp: 9, h: 900, a: 0.7, draw(c, w, h, put, r) { const hz = Math.round(H * 0.17); for (let i = 0; i < 5; i++) { const x = r() * w, y = 18 + r() * (hz - 60), rx = 90 + r() * 40;
      put(x, y, c => { BG.blob(c, 0, 0, rx, 9, '#F4EEDC', 0.8); }); } } },
  ],
};
WORLDS.forEach(Wd => { if (!Wd.layers) Wd.layers = LAYERS[Wd.key] || []; });
