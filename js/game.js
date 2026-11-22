'use strict';
/* =========================================================
   INTERFÉRENCE — moteur de jeu
   ========================================================= */
const FONT = '"Chakra Petch", sans-serif';
const angDiff = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const FLYPATHS = [
  [-0.12, 0.18, 0.5, 0.66, 0.6, 0.08, 1.12, 0.3],
  [0.15, -0.07, 1.05, 0.27, -0.05, 0.44, 0.85, -0.08],
  [-0.12, 0.33, 0.85, 0.06, 0.85, 0.56, -0.12, 0.3],
  [0.5, -0.07, 0.05, 0.5, 0.95, 0.5, 0.5, -0.08],
  [1.12, 0.14, 0.3, 0.58, 0.2, 0.1, -0.12, 0.4],
];
// dispositions de formation (voir makeFormation)
const FORM_LAYOUTS = ['grid', 'v', 'chevron', 'diamond', 'split', 'arc', 'columns', 'echelon', 'wedge', 'spiral'];
const VEH = { nautSide: { w: 150, hit: -4 }, tank: { w: 126, hit: -32 }, late: { w: 116, hit: -6 }, destroyer: { w: 42, hit: -56 } };

const Game = {
  running: false, state: 'off', t: 0, ts: 1, dpr: 1, k: 1, bgCache: {}, keys: {}, ptr: null, last: 0,

  /* ================= initialisation & entrées ================= */
  init() {
    this.cv = document.getElementById('cv'); this.c = this.cv.getContext('2d');
    addEventListener('resize', () => this.resize());
    addEventListener('keydown', e => this.onKey(e, true));
    addEventListener('keyup', e => this.onKey(e, false));
    this.cv.addEventListener('pointerdown', e => this.pDown(e));
    addEventListener('pointermove', e => this.pMove(e));
    addEventListener('pointerup', e => this.pUp(e));
    addEventListener('pointercancel', e => this.pUp(e));
    addEventListener('blur', () => { this.keys = {}; if (this.state === 'play') this.pause(true); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.state === 'play') this.pause(true); });
    this.last = performance.now();
    requestAnimationFrame(t => this.loop(t));
  },

  resize() {
    const st = document.getElementById('stage'); if (!st) return;
    const aw = st.clientWidth, ah = st.clientHeight; if (!aw || !ah) return;
    if (!this.running) { const nh = Math.round(clamp(W * ah / aw, 880, 1170)); if (nh !== H) { H = nh; this.bgCache = {}; } }
    let cw = aw, ch = cw * H / W; if (ch > ah) { ch = ah; cw = ch * W / H; }
    const dpr = Math.min(window.devicePixelRatio || 1, Store.d.set.fx ? 2 : 1.25, this.dprCap || 9);
    if (dpr !== this.dpr) this.bgCache = {};
    this.cv.style.width = cw + 'px'; this.cv.style.height = ch + 'px';
    this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr);
    this.dpr = dpr; this.k = cw / W; Art.setDPR(dpr);
    if (this.running && this.wi != null) this.bg = this.getBg(this.wi);
    UI.placeHud(cw, ch);
  },

  onKey(e, down) {
    const k = e.code; this.keys[k] = down;
    if (!this.running) return;
    if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(k)) e.preventDefault();
    if (!down) return;
    if (this.state === 'levelup' && /^(Digit|Numpad)[123]$/.test(k)) { UI.pickSkill(+k.slice(-1) - 1); return; }
    if (this.state === 'radio' && /^(Digit|Numpad)[123]$/.test(k)) { UI.radioPick(+k.slice(-1) - 1); return; }
    if (k === 'Escape' || k === 'KeyP') { if (this.state === 'play') this.pause(true); else if (this.state === 'paused') this.pause(false); return; }
    if (this.state !== 'play') return;
    if (k === 'KeyE' || k === 'ShiftLeft' || k === 'ShiftRight') this.fireOnde();
    if (k === 'KeyR' || k === 'Enter') this.fireUlt();
  },
  toLogical(e) { const r = this.cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; },
  pDown(e) {
    if (!this.running || !this.p) return;
    const [x, y] = this.toLogical(e);
    if (e.pointerType === 'mouse') { this.mouseDown = true; this.mouseFollow = true; this.p.tx = x; this.p.ty = y; return; }
    e.preventDefault();
    this.ptr = { id: e.pointerId, sx: x, sy: y, px: this.p.x, py: this.p.y };
    this.p.tx = this.p.x; this.p.ty = this.p.y;
  },
  pMove(e) {
    if (!this.running || !this.p || this.state !== 'play') return;
    const [x, y] = this.toLogical(e);
    if (e.pointerType === 'mouse') { if (x >= 0 && x <= W && y >= 0 && y <= H) { this.mouseFollow = true; this.p.tx = x; this.p.ty = y; } return; }
    if (!this.ptr || this.ptr.id !== e.pointerId) return;
    const P = this.ptr, k = this.sens(), [x0, x1, y0, y1] = this.moveBox();
    const tx = P.px + (x - P.sx) * k, ty = P.py + (y - P.sy) * k, cx = clamp(tx, x0, x1), cy = clamp(ty, y0, y1);
    // au bord, on recale le point d'ancrage : le vaisseau repart dès que le doigt revient (pas de « zone morte »)
    if (cx !== tx) { P.px = cx; P.sx = x; } if (cy !== ty) { P.py = cy; P.sy = y; }
    this.p.tx = cx; this.p.ty = cy;
  },
  // sensibilité du doigt (réglage Profil / pause, CONFIG.move.sens)
  sens() { return clamp(+Store.d.set.sens || 1.3, 0.5, 3); },
  moveBox() { return [22, W - 22, this.moveMode === 'float' ? H * 0.34 : H * 0.45, H - 64]; },
  pUp(e) { if (e.pointerType === 'mouse') this.mouseDown = false; if (this.ptr && this.ptr.id === e.pointerId) this.ptr = null; },

  /* ================= démarrage ================= */
  start(cfg) {
    SFX.init();
    this.mode = cfg.mode; this.u = cfg.u || 0; this.m = cfg.m || 0; this.tier = cfg.tier || 0;
    this.running = false; this.resize(); this.running = true;
    this.chId = Store.d.ship; this.ch = CHASSIS[this.chId] || CHASSIS.if50; this.S = computeStats(this.chId);
    const S = this.S;
    if (this.mode === 'inf') S.shield = TIERS[this.tier].hp <= -99 ? 0 : Math.max(0, S.shield + TIERS[this.tier].hp); // paliers : bouclier réduit ou supprimé
    this.skills = {}; this.modC = null;
    this.p = { x: W / 2, y: H - 170, tx: W / 2, ty: H - 170, vx: 0, vy: 0, hp: S.hp, hpMax: S.hp, sp: S.shield, spMax: S.shield, regT: 0, inv: 2, hitFx: null, shieldT: 0, wf: 'imp', wl: Math.min(10, S.wl), cd: 0, diagT: 0, droneT: 0, buffT: 0, revived: false, tilt: 0, flash: 0 };
    Object.assign(this, { score: 0, combo: 0, comboT: 0, maxCombo: 0, kills: 0, hits: 0, hpLost: 0, grazes: 0, cr: 0, xp: 0, lvl: 1, need: 8, pend: 0, onde: 0, ult: 0,
      t: 0, ts: 1, shake: 0, flashA: 0, hurtA: 0, stormN: 0, over: false, outro: null, delay: null, volT: 2, diveT: 3, mzI: 0, ondeLock: 0, ultLock: 0, huntT: 4, curT: 8 });
    this.ens = []; this.pb = []; this.eb = []; this.pk = []; this.fx = []; this.zaps = []; this.rails = []; this.beams = []; this.texts = []; this.nums = []; this.spawnQ = [];
    this.boss = null; this.cine = null; this.uf = null; this.wave = null; this.F = null; this.ondeFx = null; this.wfade = 0;
    this.mouseFollow = false; this.mouseDown = false; this.ptr = null; this.keys = {};
    Ideas.start(this);
    if (this.mode === 'mission') {
      this.d = this.u * CONFIG.difficulty.missionWorld + this.m * CONFIG.difficulty.missionStep; this.setWorld(this.u);
      this.steps = this.m === 4 ? ['form', 'boss'] : missionPlan(this.u, this.m).slice();
      if (this.m === 4) this.p.wl = Math.min(10, this.p.wl + CONFIG.difficulty.bossWeapon);
      this.stepI = -1; this.waveN = this.steps.filter(s => s !== 'boss').length;
    } else {
      this.d = TIERS[this.tier].d; this.infWave = 0; this.steps = null; this.setWorld(randi(0, WORLDS.length - 1));
    }
    Dev.onStart(this);
    this.intro = { t: 0, dur: 2.6, started: false };
    this.state = 'play';
    UI.gameStart();
  },

  setWorld(u) {
    this.wi = u; this.Wd = WORLDS[u];
    const veh = this.Wd.vehicle;
    this.pSpr = veh || this.ch.spr; this.pW = veh ? VEH[veh].w : this.ch.pw;
    this.moveMode = this.Wd.move;
    const D = Art.DEF[this.pSpr]; this.pSc = this.pW / D.w;
    this.noseY = (-D.h / 2 + (D.cy || 0)) * this.pSc + 6;
    this.muzzles = D.muzzle ? D.muzzle.map(([x, y]) => [x * this.pSc, y * this.pSc]) : [[0, this.noseY]];
    this.hitOff = veh ? VEH[veh].hit : -4;
    // bouclier champ de force (ellipse autour du vaisseau) et zone de touche
    this.shRx = clamp(this.pW * 0.6, 32, 92); this.shRy = clamp(this.pW * D.h / D.w * 0.58, 30, 80);
    this.hitR = clamp(this.pW * 0.14, 8, 13);
    this.lineY = veh === 'tank' ? H - 126 : veh === 'destroyer' ? H - 84 : null;
    if (this.p) {
      if (this.lineY) { this.p.y = this.p.ty = this.lineY; } else if (this.p.y > H - 110 || this.p.y < H * 0.45) { this.p.y = this.p.ty = H - 170; }
      this.p.vx = this.p.vy = 0;
    }
    this.addMode = this.Wd.light ? 'source-over' : 'lighter';
    this.trailOn = !!D.flame && (!veh || veh === 'late'); if (this.p) this.p.trail = null;
    this.persp = !!this.Wd.persp;
    if (!this.persp && this.ens) for (const e of this.ens) if (e.b0) { [e.w, e.h, e.rx, e.ry] = e.b0; e.b0 = null; e.dk = 0; }
    this.bg = this.getBg(u);
    UI.worldTheme(this.Wd);
  },
  getBg(u) {
    const key = u + '|' + H + '|' + this.dpr;
    if (this.bgCache[key]) return this.bgCache[key];
    const cv = document.createElement('canvas'); cv.width = Math.round(W * this.dpr); cv.height = Math.round(H * this.dpr);
    const c = cv.getContext('2d'); c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    WORLDS[u].bgStatic(c);
    return (this.bgCache[key] = cv);
  },
  switchWorld(u) { this.wfade = 1; this.setWorld(u); SFX.play('swipe'); },
  scoreMul() { return this.mode === 'inf' ? TIERS[this.tier].mul : 1; },
  // résistance des ennemis selon la difficulté courante
  hpK() { const D = CONFIG.difficulty; return this.mode === 'inf' ? 1 + this.d * D.enemyHpInf + this.d * this.d * D.enemyHpInf2 : 1 + this.d * D.enemyHp; },
  // pression (0 au début, jusqu'à 1,6) : chasseurs, rideaux de tirs, tirs droits qui visent ; réduite en mission
  press() {
    const D = CONFIG.difficulty;
    if (this.mode === 'inf') return clamp((this.d - D.pressD) / D.pressSpan, 0, D.pressMax);
    return clamp((this.d - D.pressMissionD) / D.pressMissionSpan, 0, D.pressMax) * D.pressMission;
  },
  tierAt() { let k = 0; TIERS.forEach((t, i) => { if (this.d >= t.d) k = i; }); return k; },

  /* ================= déroulé d'une mission ================= */
  nextStep() {
    if (this.mode === 'inf') return this.nextInf();
    this.stepI++;
    if (this.stepI >= this.steps.length) return this.finish(true);
    const s = this.steps[this.stepI];
    if (s === 'boss') { this.startBoss(); return; }
    const idx = this.steps.slice(0, this.stepI + 1).filter(x => x !== 'boss').length;
    if (this.stepI > 0) UI.banner(tx('hud.waveOf', { n: idx, t: this.waveN }));
    this.waveIdx = idx;
    this.startWave(s);
  },
  nextInf() {
    const n = ++this.infWave;
    // montée continue et sans plafond : linéaire + légère accélération
    this.d = TIERS[this.tier].d + (n - 1) * CONFIG.difficulty.infWave + (n - 1) * (n - 1) * CONFIG.difficulty.infWave2;
    const go = () => {
      if (n % 10 === 0) { this.startBoss(); return; }
      const tn = TIERS[this.tierAt()].name;
      if (n > 1) UI.banner(tx('hud.wave', { n }), (n - 1) % 3 === 0 ? this.Wd.name : tn);
      this.startWave(n % 5 === 0 ? 'formMini' : Ideas.on('convoy') && n % 8 === 4 && this.Wd.view === 'top' && this.Wd.move === 'free' ? 'convoy' : pick(['form', 'form', 'mix', 'fly']));
    };
    if (n > 1 && (n - 1) % 3 === 0) {
      // molette radio : le joueur choisit la fréquence suivante (sinon tirage)
      if (Ideas.on('radioDial')) { Ideas.radio(this, u => { this.switchWorld(u); go(); }); return; }
      let u; do { u = randi(0, WORLDS.length - 1); } while (u === this.wi); this.switchWorld(u);
    }
    go();
  },
  startWave(kind) {
    const d = this.d;
    this.wave = { kind, t: 0, total: 0, killsN: 0, giftAt: 6, giftDone: false, flyLeft: 0, flyT: 0, mini: kind === 'formMini', miniDone: false };
    if (kind !== 'fly' && kind !== 'convoy') this.makeFormation(kind === 'mix' ? -1 : 0);
    if (kind === 'fly') { this.wave.flyLeft = 4 + Math.floor(d / 12); this.wave.flyT = 0.3; this.F = null; }
    if (kind === 'convoy') { this.wave.flyLeft = 4 + Math.floor(d / 16); this.wave.flyT = 2.5; this.F = null; Ideas.startConvoy(this); }
    if (kind === 'mix') { this.wave.flyLeft = 2 + Math.floor(d / 16); this.wave.flyT = 4.5; }
    this.wave.giftAt = Math.max(5, Math.floor((this.wave.total || 24) * 0.45));
    this.volT = 2.2; this.diveT = 3.5;
    // forte pression : chaque vague s'ouvre sur un rideau de tirs et un chasseur, même si elle est vite nettoyée
    if (this.press() >= 0.3) { this.curT = Math.min(this.curT, 1.6); this.huntT = Math.min(this.huntT, 2.4); }
    Ideas.onWave(this, kind);
  },
  waveDone() {
    this.wave = null; this.F = null; SFX.play('clear');
    this.delay = { t: 1.1, fn: () => this.nextStep() };
  },

  // formation : disposition (layout), entrée animée par rang (entries) et composition des types (mix)
  makeFormation(adj) {
    const d = this.d, Wd = this.Wd;
    const rows = clamp(3 + (d >= 10 ? 1 : 0) + (d >= 26 ? 1 : 0) + adj, 2, 5); let cols = clamp(6 + (d >= 5 ? 1 : 0) + (d >= 18 ? 1 : 0) + (adj < 0 ? -1 : 0), 5, 8);
    const layout = pick(FORM_LAYOUTS);
    let mw = 0, mh = 0;
    for (const [id, dmin] of ARCH_UNLOCK) if (d >= dmin && id !== 'kamikaze') { const A = ARCH[id], D = Art.DEF[Wd.enemies[A.s]], box = A.w * (Wd.scale[A.s] || 1), w = D.h > D.w ? box * D.w / D.h : box; mw = Math.max(mw, w); mh = Math.max(mh, w * D.h / D.w); }
    const sx = Math.max(56, mw * 0.82), sy = Math.max(52, mh * 0.95);
    cols = Math.min(cols, Math.floor((W - 70) / sx) + 1);
    const F = this.F = { x: W / 2, y: Wd.formY || 150, sx, sy, t: 0, vx: 0, w: (cols - 1) * sx + 40, layout };
    const mid = (cols - 1) / 2, midr = (rows - 1) / 2, slots = [];
    if (layout === 'spiral') {
      // deux bras de spirale (jamais un ennemi seul au centre d'un cercle)
      const n = Math.min(rows * cols - 4, 16), R0 = 62, R1 = Math.min(W * 0.42, 210);
      for (const arm of [0, 1]) for (let th = 0, i = 0; th < 1.45 * Math.PI && i < n / 2; i++) { const r = R0 + (R1 - R0) * th / (1.45 * Math.PI), a = arm * Math.PI + th;
        slots.push({ r: Math.min(rows - 1, Math.floor(th / (1.45 * Math.PI) * rows)), c: i * 2 + arm, ox: Math.cos(a) * r, oy: midr * sy + Math.sin(a) * r * 0.62 }); th += sx * 1.05 / r; }
    } else for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      let ox = (c - mid) * sx, oy = r * sy;
      if (layout === 'v') oy += Math.abs(c - mid) * 14;
      if (layout === 'chevron') oy += (mid - Math.abs(c - mid)) * 14;
      if (layout === 'arc') oy += (1 - Math.cos((c - mid) / (mid + 0.5) * Math.PI / 2)) * 40;
      if (layout === 'diamond' && Math.abs(c - mid) / (mid + 0.6) + Math.abs(r - midr) / (midr + 0.6) > 1.15) continue;
      if (layout === 'split' && Math.abs(c - mid) < 0.6) continue;
      if (layout === 'split') ox += Math.sign(c - mid) * 16;
      if (layout === 'columns') { if (c % 2) continue; oy += (c / 2 % 2) * sy * 0.5; }
      if (layout === 'echelon') oy += (c - mid) * 11 * (r % 2 ? -1 : 1);
      if (layout === 'wedge') { if (c - mid > r + 0.6 || mid - c > r + 0.6) continue; oy -= r * sy * 0.15; }
      slots.push({ r, c, ox, oy });
    }
    // composition : types mélangés, par rangs, par colonnes alternées, ou escorte (lourds au centre)
    const pool = ARCH_UNLOCK.filter(a => d >= a[1]).map(a => ({ id: a[0], w: a[2] }));
    const top = pool.filter(a => ['heavy', 'shield', 'bomber', 'splitter'].includes(a.id));
    const light = pool.filter(a => !['heavy', 'shield', 'bomber', 'splitter'].includes(a.id));
    const mix = pool.length < 3 ? 'mixed' : pick(['mixed', 'mixed', 'rows', 'cols', 'escort']);
    const rowT = Array.from({ length: rows }, (_, r) => (r === 0 && top.length ? weighted(top) : weighted(light.length ? light : pool)).id);
    const colT = [weighted(light.length ? light : pool).id, weighted(pool).id];
    let kami = 0; const kamiMax = CONFIG.difficulty.kamiMax + Math.floor(d / 40), noKami = pool.filter(a => a.id !== 'kamikaze');
    const archOf = s => { let a = archOf0(s); if (a === 'kamikaze' && ++kami > kamiMax) a = weighted(noKami).id; return a; };
    const archOf0 = s => {
      if (mix === 'rows') return rowT[s.r];
      if (mix === 'cols') return colT[s.c % 2];
      if (mix === 'escort') return Math.abs(s.c - mid) < 1.1 && top.length && s.r < 2 ? weighted(top).id : weighted(light.length ? light : pool).id;
      return s.r === 0 && top.length && Math.random() < 0.6 ? weighted(top).id : weighted(pool).id;
    };
    const entries = Wd.entries || (layout === 'spiral' ? ['spiral'] : layout === 'columns' ? ['rain', 'train'] : ['loop', 'loop', 'side', 'top', 'cross', 'train', 'flank', 'spiral']);
    let delay = 0;
    for (let r = 0; r < rows; r++) {
      const g = slots.filter(s => s.r === r); if (!g.length) continue;
      const ent = pick(entries), fromL = Math.random() < 0.5;
      g.forEach((s, i) => {
        const arch = archOf(s), left = i < g.length / 2;
        let e = ent, ord = left ? i : g.length - 1 - i, gap = 0.11;
        if (ent === 'loop' || ent === 'side' || ent === 'flank') e = ent + (left ? 'L' : 'R');
        else if (ent === 'train') { e = fromL ? 'trainL' : 'trainR'; ord = fromL ? g.length - 1 - i : i; gap = 0.13; }
        else if (ent === 'spiral') { e = fromL ? 'spiralL' : 'spiralR'; ord = i; gap = 0.12; }
        else if (ent === 'rain') { ord = (s.c * 7) % g.length; gap = 0.09; }
        this.spawnQ.push({ t: delay + ord * gap, arch, slot: s, entry: e, wave: this.wave });
      });
      delay += ent === 'train' || ent === 'spiral' ? 0.6 + g.length * 0.12 : 0.85;
    }
    this.wave.total += slots.length;
  },
  slotPos(s) { const F = this.F, br = 1 + Math.sin(F.t * 1.3) * 0.04; return [F.x + s.ox * br, F.y + s.oy]; },
  entryStart(kind, T) {
    switch (kind) {
      case 'loopL': return [-60, 170, W * 0.85, 40, W * 0.3, H * 0.52];
      case 'loopR': return [W + 60, 170, W * 0.15, 40, W * 0.7, H * 0.52];
      case 'sideL': return [-60, H * 0.42, W * 0.35, H * 0.6, T[0] - 60, T[1] + 170];
      case 'sideR': return [W + 60, H * 0.42, W * 0.65, H * 0.6, T[0] + 60, T[1] + 170];
      case 'top': case 'rain': return [T[0], -60, T[0] + 50, 70, T[0] - 50, T[1] - 70];
      // arrivée par le côté, en file, presque à l'horizontale
      case 'trainL': return [-70, T[1] - 30, W * 0.55, T[1] - 170, T[0] - 90, T[1] + 110];
      case 'trainR': return [W + 70, T[1] - 30, W * 0.45, T[1] - 170, T[0] + 90, T[1] + 110];
      case 'flankL': return [-60, T[1] + 40, T[0] * 0.4, T[1] + 70, T[0] - 40, T[1] + 10];
      case 'flankR': return [W + 60, T[1] + 40, W - (W - T[0]) * 0.4, T[1] + 70, T[0] + 40, T[1] + 10];
      // jaillit de l'horizon (univers en relief) : part petit et lointain au centre
      case 'horizon': return [W / 2 + (T[0] - W / 2) * 0.15, this.Wd.horizon || 120, W / 2 + (T[0] - W / 2) * 0.5, T[1] + 160, T[0], T[1] + 90];
      default: return [W - T[0], -60, W / 2, H * 0.45, T[0], T[1] + 150];
    }
  },
  spawnForm(q) {
    if (!q.wave || q.wave !== this.wave || !this.F) return;
    const e = this.newEnemy(q.arch, 0, 0);
    e.slot = q.slot; e.state = 'enter'; e.wave = q.wave;
    const T = this.slotPos(q.slot);
    if (q.entry === 'spiralL' || q.entry === 'spiralR') {
      // spirale : tourne autour du centre de la formation en se resserrant, puis rejoint sa place
      const dir = q.entry === 'spiralL' ? 1 : -1, sp = { cx: W / 2, cy: this.F.y + this.F.sy, r0: W * 0.75, a0: -Math.PI / 2 - dir * 0.3, dir, turns: 1.1 };
      e.path = { sp, t: 0, dur: 2.4, ease: 0 }; e.x = sp.cx + Math.cos(sp.a0) * sp.r0; e.y = sp.cy + Math.sin(sp.a0) * sp.r0 * 0.75;
      return;
    }
    const S = this.entryStart(q.entry, T);
    e.x = S[0]; e.y = S[1];
    e.path = { p: S, t: 0, dur: q.entry === 'trainL' || q.entry === 'trainR' ? 2.1 : 1.8, ease: 1 };
  },
  spawnSquad() {
    const w = this.wave, d = this.d; w.flyLeft--; w.flyT = w.kind === 'fly' ? 2.5 : 6.5;
    const T = pick(FLYPATHS), mir = Math.random() < 0.5;
    const pts = T.map((v, i) => (i % 2 === 0 ? (mir ? (1 - v) * W : v * W) : v * H));
    const n = Math.min(10, 5 + Math.floor(d / 14));
    const arch = d < 3 ? 'grunt' : pick(['grunt', 'grunt', 'gunner', 'diver']), lead = d >= 3 && Math.random() < 0.3;
    const sq = { n, k: 0 };
    for (let i = 0; i < n; i++) {
      const e = this.newEnemy(lead && i === 0 ? 'heavy' : arch, pts[0], pts[1]);
      e.state = 'fly'; e.wave = w; e.squad = sq;
      e.path = { p: pts, t: -i * 0.16 / 4.4, dur: 4.4, ease: 0 };
    }
    w.total += n;
  },
  spawnMini() {
    const Wd = this.Wd, k = this.hpK();
    const e = this.newEnemy('heavy', W / 2, -80);
    e.w *= 2; e.h *= 2; e.rx *= 2; e.ry *= 2; e.hp = e.max = 90 * k; e.mini = true; e.wave = this.wave;
    e.state = 'mini'; e.ty = H * 0.24; e.fireT = 1.5; e.pat = 0;
    UI.banner(tx('game.escort'), tx('game.miniboss')); SFX.play('phase');
  },
  newEnemy(a, x, y) {
    const A = ARCH[a], Wd = this.Wd;
    const spr = Wd.enemies[A.s], D = Art.DEF[spr];
    const box = A.w * (Wd.scale[A.s] || 1), w = D.h > D.w ? box * D.w / D.h : box, h = w * D.h / D.w;
    const k = this.hpK();
    const e = { a, A, spr, w, h, rx: w * 0.4, ry: Math.max(h * 0.38, 10), x, y, hp: A.hp * k, max: A.hp * k, state: 'free', t: 0, flash: 0, rot: 0, flip: false,
      seed: Math.random(), frozen: 0, shield: 0, regen: 0, vx: 0, vy: 0, orient: D.orient || 'down', dead: false, gone: false, fired: 0, fireT: rand(0.5, 2.5) };
    this.ens.push(e); if (this.persp) this.depth(e); return e;
  },
  // univers en relief : taille selon la profondeur (petit à l'horizon, taille normale à hauteur du joueur), par paliers de 4 %
  depthK(y) { const hz = this.Wd.horizon, yb = H - 170; return Math.round(clamp(0.28 + 0.72 * Math.sqrt(Math.max(0, y - hz) / (yb - hz)), 0.28, 1.12) * 25) / 25; },
  depth(e) {
    if (!e.b0) e.b0 = [e.w, e.h, e.rx, e.ry];
    const k = this.depthK(e.y); if (k === e.dk) return;
    e.dk = k; e.w = e.b0[0] * k; e.h = e.b0[1] * k; e.rx = e.b0[2] * k; e.ry = Math.max(e.b0[3] * k, 8);
  },
  followPath(e, dt, toSlot) {
    const P = e.path; P.t += dt / P.dur;
    const tt = clamp(P.t, 0, 1), u = P.ease ? 1 - (1 - tt) * (1 - tt) : tt;
    let x3, y3;
    if (toSlot) [x3, y3] = this.slotPos(e.slot); else { x3 = P.p[6]; y3 = P.p[7]; }
    if (P.sp) { const S = P.sp, a = S.a0 + S.dir * u * S.turns * TAU, r = S.r0 * (1 - u) + 40 * u, m = clamp((u - 0.5) / 0.5, 0, 1), mm = m * m * (3 - 2 * m);
      e.x = lerp(S.cx + Math.cos(a) * r, x3, mm); e.y = lerp(S.cy + Math.sin(a) * r * 0.75, y3, mm); }
    else { e.x = bez(P.p[0], P.p[2], P.p[4], x3, u); e.y = bez(P.p[1], P.p[3], P.p[5], y3, u); }
    if (P.t < 1) return;
    if (toSlot) { e.state = 'form'; e.path = null; return; }
    if (e.state === 'dive') {
      if (!this.F || !e.slot) { this.reenter(e); return; }
      const [sx, sy] = this.slotPos(e.slot); e.state = 'return'; e.x = sx + rand(-40, 40); e.y = -60;
      e.path = { p: [e.x, e.y, e.x, sy - 140, sx, sy - 60], t: 0, dur: 1.4, ease: 1 };
    } else if (e.state === 'fly') this.reenter(e);
  },
  // un ennemi sorti de l'écran revient par le haut : on ne passe pas une vague en esquivant (retour du 22/11)
  reenter(e) {
    const T = pick(FLYPATHS), mir = Math.random() < 0.5;
    const pts = T.map((v, i) => (i % 2 === 0 ? (mir ? (1 - v) * W : v * W) : v * H));
    pts[0] = clamp(pts[2] + rand(-80, 80), 40, W - 40); pts[1] = -70;
    e.state = 'fly'; e.x = pts[0]; e.y = pts[1]; e.tr = null; e.fireT = rand(0.8, 2);
    e.path = { p: pts, t: 0, dur: 4.4, ease: 0 };
  },
  // chasseur : quitte la formation, vient se placer au-dessus du joueur, le suit et lui tire dessus, puis rentre
  startHunt(e, P) { e.state = 'hunt'; e.hunt = { t: 0, dur: rand(3.2, 4.4) + P, sp: 230 + 120 * P, fT: 0.7, gap: clamp(1.05 - 0.3 * P, 0.5, 1.05), fan: P > 0.8 }; },
  updHunt(e, dt) {
    const p = this.p, U = e.hunt; U.t += dt;
    if (U.t < U.dur) {
      // de biais, à côté de la ligne de tir du joueur : il faut bouger pour l'abattre
      if (U.side == null) U.side = e.x < p.x ? -1 : 1;
      let tx = p.x + U.side * (120 + Math.sin(e.t * 1.6 + e.seed * 6) * 36); if (tx < 30 || tx > W - 30) { U.side = -U.side; tx = p.x + U.side * 120; }
      tx = clamp(tx, 30, W - 30); const ty = clamp(p.y - 270 + Math.sin(e.t * 2.3) * 20, 110, H * 0.52), m = U.sp * dt;
      e.x += clamp((tx - e.x) * Math.min(1, dt * 3), -m, m); e.y += clamp((ty - e.y) * Math.min(1, dt * 3), -m, m);
      if (!this.outro && (U.fT -= dt) <= 0) { U.fT = U.gap; const a = Math.atan2(p.x - e.x, (p.y + this.hitOff) - e.y); this.aimShot(e, a); if (U.fan) { this.aimShot(e, a - 0.16); this.aimShot(e, a + 0.16); } SFX.play(this.Wd.esfx, 70); }
      return;
    }
    if (this.F && e.slot) { const [sx, sy] = this.slotPos(e.slot); e.state = 'return'; e.path = { p: [e.x, e.y, e.x, e.y - 240, sx, sy - 80], t: 0, dur: 1.3, ease: 1 }; }
    else this.reenter(e);
  },
  aimShot(e, a) { const sp = clamp(170 + this.d * 3.1, 170, 470) * (this.Wd.bspeed || 1); this.eb.push({ x: e.x, y: e.y + e.ry * 0.6, vx: Math.sin(a) * sp, vy: Math.cos(a) * sp, r: 5, spr: this.Wd.eb2, kind: 'n', t: 0 }); },
  // rideau : une rangée de tirs sur toute la largeur avec un seul passage (deux rangées décalées à forte pression)
  curtain(P) {
    const gap = clamp(150 - 40 * P, 96, 150), gx = rand(gap / 2 + 20, W - gap / 2 - 20), sp = clamp(170 + this.d * 3.1, 170, 470) * 0.55 * (this.Wd.bspeed || 1);
    for (let row = 0; row < (P > 1.8 ? 3 : P > 1 ? 2 : 1); row++) for (let x = 12 + (row % 2) * 15; x < W; x += 30) if (Math.abs(x - gx) > gap / 2) this.eb.push({ x, y: -14 - row * 42, vx: 0, vy: sp, r: 5, spr: this.Wd.eb, kind: 'n', t: 0 });
    SFX.play(this.Wd.esfx);
  },
  startDive(e) {
    if (!e) return; const p = this.p, side = e.x < W / 2 ? 1 : -1;
    e.state = 'dive'; e.fired = 0;
    if (e.A.kami) e.path = { p: [e.x, e.y, e.x + side * 60, e.y - 60, p.x, p.y - 220, p.x + rand(-30, 30), H + 90], t: 0, dur: clamp(1.9 - this.d * 0.01, 1.25, 1.9), ease: 0 };
    else e.path = { p: [e.x, e.y, e.x + side * 130, e.y - 90, p.x - side * 70, p.y - 150, p.x + side * 50, H + 80], t: 0, dur: clamp(2.7 - this.d * 0.012, 1.9, 2.7), ease: 0 };
  },

  /* ================= boucle ================= */
  loop(now) {
    requestAnimationFrame(t => this.loop(t));
    const raw = (now - this.last) / 1000 || 0.016, rdt = Math.min(0.05, raw); this.last = now;
    if (!this.running) return;
    const t0 = performance.now();
    if (this.state === 'play') this.update(rdt);
    else if (this.state === 'end') this.updFx(rdt);
    this.render();
    UI.hud(this);
    Dev.frame(raw, performance.now() - t0, this);
    this.autoQuality(raw);
  },
  // qualité auto (budget de performance, js/config.js → perf) : sous lowFps pendant ~3 s de jeu, résolution du canvas × 0,75
  autoQuality(raw) {
    const P = CONFIG.perf; if (!P.autoQuality || this.state !== 'play' || this.dpr <= P.minDpr || raw > 0.25) return;
    const A = this.aq || (this.aq = { n: 0, t: 0 }); A.n++; A.t += raw; if (A.n < 180) return;
    const fps = A.n / A.t; A.n = 0; A.t = 0;
    if (fps < P.lowFps) { this.dprCap = Math.max(P.minDpr, this.dpr * 0.75); this.resize(); }
  },

  update(rdt) {
    // ralenti, cinématique de l'ultime
    if (this.cine) {
      this.cine.t += rdt; this.ts = 0.1;
      if (this.cine.t >= this.cine.dur) { const type = this.cine.type; this.cine = null; this.startUlt(type); }
    } else this.ts += (1 - this.ts) * Math.min(1, rdt * 2.5);
    const camZ = this.cine ? 1.12 : 1; this.cam = this.cam || { z: 1 }; this.cam.z += (camZ - this.cam.z) * Math.min(1, rdt * 6);
    const dt = rdt * this.ts;
    this.t += dt; this.impN = 0;
    if (this.wfade > 0) this.wfade = Math.max(0, this.wfade - rdt * 1.2);
    if (this.ondeLock > 0) this.ondeLock -= dt; if (this.ultLock > 0 && !this.uf && !this.cine) this.ultLock -= dt;
    if (this.intro) { this.intro.t += rdt; if (!this.intro.started && this.intro.t > 1.1) { this.intro.started = true; this.nextStep(); } if (this.intro.t >= this.intro.dur) this.intro = null; }
    if (this.delay) { this.delay.t -= dt; if (this.delay.t <= 0) { const f = this.delay.fn; this.delay = null; f(); } }
    for (let i = this.spawnQ.length - 1; i >= 0; i--) { const q = this.spawnQ[i]; q.t -= dt; if (q.t <= 0) { this.spawnQ.splice(i, 1); this.spawnForm(q); } }
    const w = this.wave;
    if (w) { w.t += dt; if (w.flyLeft > 0) { w.flyT -= dt; if (w.flyT <= 0) this.spawnSquad(); } }
    this.updPlayer(dt);
    this.updEnemies(dt);
    Ideas.update(this, dt);
    this.updBoss(dt);
    this.updBeams(dt);
    this.updUlt(dt);
    this.updPB(dt);
    this.updEB(dt);
    this.updPk(dt);
    this.updFx(dt);
    if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = 0; }
    this.shake = Math.max(0, this.shake - rdt * 40); this.flashA = Math.max(0, this.flashA - rdt * 2.4); this.hurtA = Math.max(0, this.hurtA - rdt * 1.5);
    if (this.ondeFx) { this.ondeFx.t += rdt; if (this.ondeFx.t > 0.6) this.ondeFx = null; }
    // fin de vague
    if (w && !this.boss && !this.spawnQ.length && w.flyLeft <= 0 && !this.ens.some(e => e.wave === w) && !Ideas.busy(this)) {
      if (w.mini && !w.miniDone) { w.miniDone = true; this.spawnMini(); } else this.waveDone();
    }
    // montée de niveau
    // (seulement en jeu : une montée de niveau pendant la molette radio la remplaçait et bloquait la partie)
    if (this.pend > 0 && this.state === 'play' && !this.cine && !this.uf && !this.outro && !this.over) this.openLevelUp();
  },

  /* ================= joueur ================= */
  updPlayer(dt) {
    const p = this.p, S = this.S, k = this.keys;
    const kx = (k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0);
    const ky = (k.ArrowDown || k.KeyS ? 1 : 0) - (k.ArrowUp || k.KeyW ? 1 : 0);
    if (kx || ky) { this.mouseFollow = false; this.kb = true; p.tx = p.x + kx * 30; p.ty = p.y + ky * 30; }
    else if (this.kb) { this.kb = false; p.tx = p.x; p.ty = p.y; }
    const [bx0, bx1, minY, by1] = this.moveBox();
    p.tx = clamp(p.tx, bx0, bx1); p.ty = clamp(p.ty, minY, by1);
    const ox = p.x, spd = S.speed, ptr = this.mouseFollow || this.ptr, M = CONFIG.move;
    if (this.outro) this.updOutro(dt);
    else if (this.moveMode === 'float') {
      // univers « en apesanteur » : inertie gardée, mais plus vive au doigt
      const acc = ptr ? 10 : 7, top = spd * (ptr ? 1.6 : 1), ax = clamp((p.tx - p.x) * acc, -top, top), ay = clamp((p.ty - p.y) * acc, -top, top), r = Math.min(1, dt * (ptr ? 6 : 3.5));
      p.vx += (ax - p.vx) * r; p.vy += (ay - p.vy) * r;
      p.x += p.vx * dt; p.y += p.vy * dt;
    } else if (ptr) {
      // au doigt ou à la souris : rattrape la cible vite (réponse exponentielle), vitesse plafonnée (CONFIG.move)
      const md = spd * M.pointerMax * dt, k = Math.min(1, dt * M.pointerK);
      p.x += clamp((p.tx - p.x) * k, -md, md);
      if (!this.lineY) p.y += clamp((p.ty - p.y) * k, -md, md);
    } else {
      const md = spd * dt;
      p.x += clamp(p.tx - p.x, -md, md);
      if (!this.lineY) p.y += clamp(p.ty - p.y, -md, md);
    }
    if (!this.outro) { p.x = clamp(p.x, bx0, bx1); if (this.lineY) p.y = this.lineY; else p.y = clamp(p.y, minY, by1); }
    const vx = (p.x - ox) / Math.max(dt, 1e-4);
    p.tilt += (clamp(vx / 1100, -0.3, 0.3) - p.tilt) * Math.min(1, dt * 10);
    p.inv -= dt; p.cd -= dt; p.buffT -= dt; p.flash -= dt; p.shieldT -= dt;
    // le bouclier se recharge d'une charge après un moment sans coup
    if (p.sp < p.spMax) { p.regT += dt; if (p.regT >= this.regenT()) { p.regT = 0; this.shieldUp(1); SFX.play('ready'); } } else p.regT = 0;
    // traînée de réacteur : les points glissent vers le bas comme si le décor défilait
    if (this.trailOn) { const T = p.trail || (p.trail = []); for (const q of T) q[1] += 260 * dt; T.unshift([p.x, p.y]); if (T.length > 16) T.length = 16; }
    if (p.hitFx && (p.hitFx.t += dt) > p.hitFx.max) p.hitFx = null;
    if (this.outro || this.over) return;
    const firing = (Store.d.set.auto || k.Space || this.mouseDown || this.ptr) && !(this.intro && this.intro.t < 1.6);
    if (!firing) return;
    if (p.cd <= 0) this.fireWeapon();
    const nDiag = this.mod('diag');
    if (nDiag) { p.diagT -= dt; if (p.diagT <= 0) { p.diagT = 0.24 / this.fireMul(); for (const s of [-1, 1]) for (let i = 0; i < nDiag; i++) this.pShot('imp', p.x, p.y + this.noseY * 0.5, s * (0.42 + i * 0.16), 840, this.dmgBase() * 0.75); } }
    const nd = this.mod('drones') + S.drone;
    if (nd) { p.droneT -= dt; if (p.droneT <= 0) { p.droneT = 0.3 / this.fireMul(); for (let i = 0; i < nd; i++) { const [dx, dy] = this.dronePos(i, nd); this.pShot('imp', dx, dy - 10, 0, 860, this.dmgBase() * 0.65); } } }
  },
  dronePos(i, n) { const p = this.p, a = this.t * 2 + i / n * TAU; return [p.x + Math.cos(a) * 52, p.y - 12 + Math.sin(a) * 18]; },
  // effets cumulés des compétences (données SKILLS[].fx), recalculés à chaque compétence prise
  mod(stat) { return (this.modC || this.buildMods())[stat] || 0; },
  buildMods() { const c = {}; for (const s of SKILLS) { const n = this.skills[s.id] || 0; if (!n || !s.fx) continue; for (const f of s.fx) c[f.stat] = (c[f.stat] || 0) + (f.base || 0) + (f.add || 0) * n; } return (this.modC = c); },
  fireMul() { return this.S.fire * (1 + this.mod('fire')); },
  dmgBase() { let m = this.S.dmg * (1 + this.mod('dmg')); if (this.p.buffT > 0) m *= 1.25; const fv = this.mod('fever'); if (fv && this.combo >= 25) m *= 1 + fv; return m; },
  pShot(kind, x, y, ang, sp, dmg, o) {
    const b = { kind, x, y, vx: Math.sin(ang) * sp, vy: -Math.cos(ang) * sp, dmg, t: 0, r: kind === 'plasma' ? 8 : kind === 'blade' ? 16 : kind === 'missile' ? 5 : 4,
      pierce: kind === 'blade' ? 99 : this.S.pierce + this.mod('pierce') + Ideas.pierce(this), bounce: this.mod('bounce'), hit: null };
    if (o) Object.assign(b, o);
    this.pb.push(b); return b;
  },
  fireWeapon() {
    const p = this.p, L = p.wl, f = p.wf, Wp = WEAPONS[f], fm = this.fireMul(), dm = this.dmgBase();
    this.mzI = (this.mzI + 1) % this.muzzles.length; Ideas.onFire(this);
    const [mx, my] = this.muzzles[this.mzI], X = p.x + mx, Y = p.y + my;
    switch (Wp.fire) {
      case 'spread': { // gerbe de tirs droits, s'élargit avec le niveau
        const n = Wp.n[L - 1], spread = Math.min(Wp.spread * (n - 1), Wp.spreadMax ?? Infinity), dmg = lin(Wp.dmg, L) * dm, extra = Wp.splash ? { splash: lin(Wp.splash, L) } : undefined;
        for (let i = 0; i < n; i++) { const a = n === 1 ? 0 : -spread / 2 + spread * i / (n - 1); this.pShot(Wp.shot, X + (i - (n - 1) / 2) * Wp.gap, Y, a, Wp.speed, dmg, extra); }
        if (Wp.helixAt && L >= Wp.helixAt) for (const s of [-1, 1]) this.pShot(Wp.shot, X + s * 20, Y + 8, 0, Wp.speed, 1.4 * dm, { helix: s });
        p.cd = lin(Wp.cd, L) / fm * (Wp.cdFast && L >= Wp.cdFast[0] ? Wp.cdFast[1] : 1); break;
      }
      case 'chain': { // arc qui saute d'ennemi en ennemi
        const range = lin(Wp.range, L), chains = Math.floor(lin(Wp.chains, L)), dmg = lin(Wp.dmg, L) * dm;
        const tgt = this.nearest(X, Y, range, null, true);
        if (tgt) this.chainArc(X, Y, tgt, chains, dmg, L >= Wp.forkAt ? 2 : 1);
        else this.zaps.push({ pts: this.bolt(X, Y, X + rand(-60, 60), Y - rand(120, 220), 6), life: 0.07, max: 0.07, col: Wp.col });
        p.cd = lin(Wp.cd, L) / fm; break;
      }
      case 'rail': { // rayons instantanés
        const lines = Wp.lines[L - 1], dmg = lin(Wp.dmg, L) * dm, wdt = lin(Wp.width, L);
        for (const ox of Wp.offsets[lines]) this.rail(X + ox, Y, dmg, wdt);
        p.cd = lin(Wp.cd, L) / fm; break;
      }
      case 'swarm': { // missiles à tête chercheuse, en éventail alterné
        const n = Wp.n[L - 1];
        for (let i = 0; i < n; i++) { const s = i % 2 ? 1 : -1; this.pShot(Wp.shot, X + s * (8 + i * 3), Y + 6, s * (0.5 + i * 0.12), Wp.speed, lin(Wp.dmg, L) * dm, { homing: true }); }
        p.cd = lin(Wp.cd, L) / fm; break;
      }
    }
    SFX.play(Wp.sfx, Wp.sfxGap || 45);
  },
  targets() {
    const out = this.ens.filter(e => !e.dead && !e.gone && e.y > -20 && e.y < H && e.x > -20 && e.x < W + 20);
    const B = this.boss;
    if (B && !B.dying && !B.entering) { const ns = B.nodes.filter(n => !n.dead); if (ns.length) out.push(...ns.map(n => ({ node: n, x: n.x, y: n.y }))); else out.push({ core: true, x: B.x, y: B.y }); }
    return out;
  },
  nearest(x, y, range, not, above) {
    let best = null, bd = range * range;
    for (const e of this.targets()) { if (e === not || (not && e.node && e.node === not.node) || (above && e.y > y)) continue; const dd = d2(x, y, e.x, e.y); if (dd < bd) { bd = dd; best = e; } }
    return best;
  },
  hitTarget(t, dmg, src, x, y) {
    if (t.node) this.hurtNode(t.node, dmg); else if (t.core) this.hurtBoss(dmg, src); else this.hurt(t, dmg, src, x, y);
  },
  bolt(x0, y0, x1, y1, n) { const pts = [x0, y0]; for (let i = 1; i < n; i++) { const u = i / n; pts.push(lerp(x0, x1, u) + rand(-10, 10), lerp(y0, y1, u) + rand(-10, 10)); } pts.push(x1, y1); return pts; },
  chainArc(x, y, tgt, chains, dmg, forks) {
    let cx = x, cy = y, cur = tgt; const hit = [];
    for (let i = 0; i < chains && cur; i++) {
      this.zaps.push({ pts: this.bolt(cx, cy, cur.x, cur.y, 7), life: 0.09, max: 0.09, col: WEAPONS.arc.col });
      this.hitTarget(cur, dmg, 'arc', cur.x, cur.y); hit.push(cur);
      cx = cur.x; cy = cur.y;
      const cands = this.targets().filter(t => !hit.includes(t) && !(t.node && hit.some(h => h.node === t.node)));
      cands.sort((a, b) => d2(cx, cy, a.x, a.y) - d2(cx, cy, b.x, b.y));
      if (forks > 1 && cands[1] && d2(cx, cy, cands[1].x, cands[1].y) < 200 * 200) { this.zaps.push({ pts: this.bolt(cx, cy, cands[1].x, cands[1].y, 5), life: 0.09, max: 0.09, col: WEAPONS.arc.col }); this.hitTarget(cands[1], dmg * 0.6, 'arc'); }
      cur = cands[0] && d2(cx, cy, cands[0].x, cands[0].y) < 220 * 220 ? cands[0] : null;
    }
  },
  rail(x, y, dmg, wdt) {
    this.rails.push({ x, y0: y, life: 0.14, max: 0.14, w: wdt });
    for (const e of this.ens) if (!e.dead && !e.gone && e.y < y && Math.abs(e.x - x) < e.rx + wdt / 2) this.hurt(e, dmg, 'rail', x, e.y);
    const B = this.boss;
    if (B && !B.dying && !B.entering) {
      let blocked = false;
      for (const n of B.nodes) if (!n.dead && n.y < y && Math.abs(n.x - x) < B.Bd.nodes.w * 0.45 + wdt / 2) { this.hurtNode(n, dmg); blocked = true; }
      if (!blocked && B.y < y && Math.abs(B.x - x) < B.w * 0.36) { if (B.nodes.some(n => !n.dead)) this.spark(x, B.y + B.h * 0.3, '#BFE3F5', 2, 100); else this.hurtBoss(dmg, 'rail'); }
    }
  },

  /* ================= ennemis ================= */
  updEnemies(dt) {
    const F = this.F, p = this.p, hy = p.y + this.hitOff;
    if (F) {
      F.t += dt; const amp = Math.max(0, (W - 50 - F.w) / 2);
      const nx = W / 2 + Math.sin(F.t * 0.55) * amp; F.vx = (nx - F.x) / Math.max(dt, 1e-4); F.x = nx;
      if (this.wave && this.wave.t > 26 - 10 * Math.min(1, this.press())) F.y = Math.min(F.y + dt * 5, H * 0.34);
    }
    const gens = this.ens.filter(e => e.A.gen && !e.dead);
    for (const e of this.ens) {
      if (e.dead || e.gone) continue;
      e.t += dt; e.flash -= dt; this.trail(e, dt);
      // traînée des ennemis en mouvement (entrée, piqué, vol libre), elle se résorbe en formation
      if (e.state !== 'form' && e.state !== 'mini') { if ((e.trT = (e.trT || 0) - dt) <= 0) { e.trT = 0.03; (e.tr || (e.tr = [])).unshift(e.x, e.y); if (e.tr.length > 16) e.tr.length = 16; } }
      else if (e.tr && e.tr.length) { if ((e.trT = (e.trT || 0) - dt) <= 0) { e.trT = 0.03; e.tr.length -= 2; } }
      if (gens.length && !e.A.gen) { const sh = gens.some(g => d2(g.x, g.y, e.x, e.y) < 96 * 96); if (sh && e.shield <= 0) { e.regen -= dt; if (e.regen <= 0) e.shield = 1; } if (!sh) e.shield = 0; }
      if (e.frozen > 0) { e.frozen -= dt; continue; }
      const ox = e.x, oy = e.y;
      switch (e.state) {
        case 'enter': case 'return': this.followPath(e, dt, true); break;
        case 'form': { const [tx, ty] = this.slotPos(e.slot); e.x = tx; e.y = ty + Math.sin(e.t * 2 + e.seed * 6) * 3; break; }
        case 'dive': case 'fly': this.followPath(e, dt, false); break;
        case 'mini': this.updMini(e, dt); break;
        case 'hunt': this.updHunt(e, dt); break;
        default:
          if (e.home) e.vx += clamp(p.x - e.x, -1, 1) * 160 * dt;
          e.x += e.vx * dt; e.y += e.vy * dt;
          // sorti par le bas : revient par le haut ; jamais perdu sur les côtés
          if (e.y > H + 80) { e.y = -50; e.tr = null; } if (e.y < -220) e.y = -50;
          if (e.x < -40 || e.x > W + 40) { e.x = clamp(e.x, -40, W + 40); e.vx = -e.vx; }
      }
      const vx = (e.x - ox) / Math.max(dt, 1e-4), vy = (e.y - oy) / Math.max(dt, 1e-4);
      if (e.orient === 'down') {
        const tr = e.state === 'form' || e.state === 'mini' || e.state === 'hunt' ? 0 : (Math.abs(vx) + Math.abs(vy) > 30 ? Math.atan2(-vx, vy) : e.rot);
        e.rot += angDiff(tr, e.rot) * Math.min(1, dt * 7);
      } else if (e.orient === 'side') {
        const fx = e.state === 'form' ? (F ? F.vx : 0) : vx; if (Math.abs(fx) > 6) e.flip = fx < 0;
        e.rot = clamp(vy / 700, -0.45, 0.45) * (e.flip ? -1 : 1);
      } else if (e.orient === 'spin') e.rot += dt * (0.7 + e.seed);
      if (this.persp) this.depth(e);
      if (e.state !== 'enter' && !this.outro) this.enemyFire(e, dt);
      if (!this.outro && e.t > 0.4 && ((e.x - p.x) / (e.rx + 12)) ** 2 + ((e.y - hy) / (e.ry + 12)) ** 2 < 1) { this.hurtPlayer(e.x, e.y); if (!e.mini) this.kill(e, true); }
    }
    this.ens = this.ens.filter(e => !e.dead && !e.gone);
    // salves de la formation
    if (F && this.wave && !this.outro) {
      this.volT -= dt;
      if (this.volT <= 0) {
        this.volT = clamp(1.25 - this.d * 0.016, 0.3, 1.25) * rand(0.8, 1.2);
        const sh = this.ens.filter(e => e.state === 'form' && e.A.fire && e.frozen <= 0);
        const vol = 1 + Math.floor(this.d / 14);
        for (let i = 0; i < vol && sh.length; i++) { const e = sh.splice(randi(0, sh.length - 1), 1)[0]; this.shoot(e, e.A.fire); }
      }
      this.diveT -= dt;
      if (this.diveT <= 0) {
        this.diveT = clamp(3.4 - this.d * 0.04, 0.9, 3.4) * rand(0.7, 1.3);
        const c = this.ens.filter(e => e.state === 'form' && e.frozen <= 0 && (e.A.dive || e.A.kami || (this.d > 10 && Math.random() < 0.25)));
        const n = Math.min(c.length, 1 + Math.floor(this.d / 18) + (Math.random() < 0.3 ? 1 : 0));
        for (let i = 0; i < n; i++) this.startDive(c.splice(randi(0, c.length - 1), 1)[0]);
      }
    }
    // pression : chasseurs qui traquent le joueur, rideaux de tirs (retour du 22/11 : on gagnait sans bouger)
    const P = this.press();
    if (P > 0 && this.wave && !this.boss && !this.outro && !(this.intro && !this.intro.started)) {
      if ((this.huntT -= dt) <= 0) {
        this.huntT = clamp(5.5 - 2.6 * P, 1.4, 5.5) * rand(0.8, 1.2);
        const busy = this.ens.filter(e => e.state === 'hunt').length, c = this.ens.filter(e => e.state === 'form' && e.frozen <= 0 && !e.A.kami && !e.A.gen && !e.mini);
        if (c.length && busy < 1 + Math.floor(P * 2.5)) this.startHunt(c[randi(0, c.length - 1)], P);
      }
      if (P >= 0.3 && (this.curT -= dt) <= 0) { this.curT = clamp(10 - 4.5 * P, 3.6, 10) * rand(0.85, 1.15); this.curtain(P); }
    }
  },
  updMini(e, dt) {
    e.y += (e.ty - e.y) * Math.min(1, dt * 1.5);
    e.x = W / 2 + Math.sin(e.t * 0.6) * (W / 2 - e.w * 0.6);
    e.fireT -= dt;
    if (e.fireT <= 0 && e.t > 1.5) {
      e.pat = (e.pat + 1) % 3; e.fireT = clamp(1.3 - this.d * 0.012, 0.5, 1.3);
      const p = this.p, a = Math.atan2(p.x - e.x, (p.y + this.hitOff) - e.y), sp = clamp(175 + this.d * 3, 175, 460) * (this.Wd.bspeed || 1);
      const mk = (ang, spr, s = sp) => this.eb.push({ x: e.x, y: e.y + e.ry * 0.5, vx: Math.sin(ang) * s, vy: Math.cos(ang) * s, r: 5, spr, kind: 'n', t: 0 });
      if (e.pat === 0) for (let i = -3; i <= 3; i++) mk(i * 0.16, this.Wd.eb);
      else if (e.pat === 1) for (let i = -1; i <= 1; i++) mk(a + i * 0.09, this.Wd.eb2, sp * 1.15);
      else for (let i = 0; i < 14; i++) mk(i / 14 * TAU + e.t, this.Wd.eb, sp * 0.75);
      SFX.play(this.Wd.esfx);
    }
  },
  enemyFire(e, dt) {
    if (!e.A.fire || e.y < 10 || e.y > H * 0.72 || e.x < 0 || e.x > W) return;
    if (e.state === 'dive') {
      if (!e.A.dive) return;
      if (e.fired === 0 && e.path.t > 0.32) { e.fired = 1; this.shoot(e, 'aim'); }
      if (e.fired === 1 && e.path.t > 0.5 && this.d > 8) { e.fired = 2; this.shoot(e, 'aim'); }
      return;
    }
    if (e.state === 'fly') { e.fireT -= dt; if (e.fireT <= 0) { e.fireT = Math.max(0.7, rand(2.4, 4.6) - this.d * 0.025); if (Math.random() < 0.6) this.shoot(e, 'aim'); } }
  },
  shoot(e, mode, x = e.x, y = e.y + e.ry * 0.6) {
    const Wd = this.Wd, p = this.p, d = this.d;
    const sp = clamp(170 + d * 3.1, 170, 470) * (Wd.bspeed || 1);
    const T = Ideas.target(this, x, y), aim = T ? Math.atan2(T[0] - x, T[1] - y) : Math.atan2(p.x - x, (p.y + this.hitOff) - y);
    const mk = (ang, spr, kind = 'n', s = sp) => this.eb.push({ x, y, vx: Math.sin(ang) * s, vy: Math.cos(ang) * s, r: kind === 'mine' ? 9 : 5, spr, kind, t: 0, fuse: 1.8 });
    switch (mode) {
      case 'straight': if (Wd.key === 'somme') mk(rand(-0.06, 0.06), 'b_bomb', 'bomb', 60); else if (Math.random() < this.press() * 0.5) mk(aim, Wd.eb2); else mk(0, Wd.eb); break;
      case 'aim': mk(aim, Wd.eb2); break;
      case 'spread': { const n = d >= 25 ? 5 : 3; for (let i = 0; i < n; i++) mk((i - (n - 1) / 2) * 0.22, Wd.eb); break; }
      case 'mine': if (Wd.key === 'atlantique') mk(0, 'b_torp', 'n', sp * 1.35); else mk(rand(-0.15, 0.15), null, 'mine', sp * 0.38); break;
    }
    SFX.play(Wd.esfx, 70);
  },

  /* ================= dégâts ================= */
  hurt(e, dmg, src, x, y) {
    if (e.dead || e.gone) return false;
    if (e.shield > 0 && src !== 'onde' && src !== 'ult') { e.shield = 0; e.regen = 3; this.spark(x == null ? e.x : x, y == null ? e.y : y, '#BFE3F5', 4, 160); SFX.play('shield', 60); return false; }
    let crit = false;
    if ((src === 'shot' || src === 'arc' || src === 'rail') && Math.random() < this.S.crit + this.mod('crit')) { dmg *= this.S.critMul; crit = true; }
    e.hp -= dmg; e.flash = 0.08; this.dmgNum(e, x == null ? e.x : x, y == null ? e.y - e.h * 0.2 : y, dmg, crit);
    const fz = this.mod('freeze'); if (fz && src === 'shot' && Math.random() < fz) e.frozen = 1.5;
    const stc = this.mod('storm'); if (stc && src !== 'storm' && ++this.stormN >= 10) { this.stormN = 0; const t = this.nearest(e.x, e.y, 400); if (t) this.chainArc(e.x, e.y, t, stc, 3 * this.dmgBase(), 1); }
    if (crit) this.spark(x == null ? e.x : x, y == null ? e.y : y, '#FFFFFF', 5, 220);
    if (e.hp <= 0) { this.kill(e); return true; }
    SFX.play(crit ? 'crit' : 'hit', 45);
    return false;
  },
  kill(e, silent) {
    if (e.dead) return; e.dead = true;
    if (!silent) { this.kills++; this.combo++; this.comboT = 1.5; this.maxCombo = Math.max(this.maxCombo, this.combo); }
    const mult = 1 + Math.min(2, Math.floor(this.combo / 10) * 0.25);
    this.score += Math.round(e.A.pts * (e.mini ? 20 : 1) * mult * (1 + this.d * 0.03) * this.scoreMul());
    this.explode(e.x, e.y, Math.max(e.w, e.h) * (e.mini ? 1.5 : 1), this.Wd.boom);
    SFX.play(e.w > 60 ? 'boom' : 'pop', 30);
    if (!silent) this.drop(e);
    this.addOnde(0.006); this.addUlt(0.013 * (1 + this.combo / 60));
    if (e.A.split) for (const s of [-1, 1]) { const m = this.newEnemy('mini', e.x + s * 14, e.y); m.vx = s * 70; m.vy = 170; m.home = true; m.wave = e.wave; }
    const nsh = this.mod('shards'); if (nsh) { const n = nsh; for (let i = 0; i < n; i++) this.pShot('shard', e.x, e.y, i / n * TAU, 520, this.dmgBase() * 1.2, { rico: true }); }
    if (e.squad && !silent) { e.squad.k++; if (e.squad.k === e.squad.n) { const b = Math.round((CONFIG.rewards.squad + this.d) * this.S.cred); this.cr += b; this.score += 300; UI.banner(tx('game.squad'), tx('game.squadCr', { n: b })); SFX.play('star'); } }
    if (e.mini) { for (let i = 0; i < 3; i++) this.pk.push(this.newPk('cr', e.x, e.y, Math.ceil(2 + this.d * 0.3))); this.pk.push(this.newPk('up', e.x, e.y)); this.shake = 14; SFX.play('bigboom'); }
    Ideas.onKill(this, e, silent);
  },
  drop(e) {
    const A = e.A, w = this.wave;
    for (let i = 0; i < A.xp; i++) this.pk.push(this.newPk('xp', e.x, e.y));
    if (Math.random() < A.cr) this.pk.push(this.newPk('cr', e.x, e.y, Math.ceil((1 + this.d * 0.12) * rand(1, 2))));
    let gift = Math.random() < (A.gift || 0.025);
    if (w && !w.giftDone && ++w.killsN >= w.giftAt) { gift = true; w.giftDone = true; }
    if (gift) this.pk.push(this.newPk('gift', e.x, e.y, 1, Math.random() < 0.5 ? pick(FAMS.filter(f => f !== this.p.wf)) : pick(FAMS)));
    else if (Math.random() < CONFIG.drops.weapon + (A === ARCH.heavy ? CONFIG.drops.weaponHeavy : 0)) this.pk.push(this.newPk('up', e.x, e.y));
    else if (w && !w.cell && Math.random() < CONFIG.drops.shield * (this.mode === 'inf' ? CONFIG.drops.shieldInf : 1)) { w.cell = true; this.pk.push(this.newPk('hp', e.x, e.y)); }
  },
  newPk(k, x, y, v = 1, fam) { return { k, x, y, vx: rand(-90, 90), vy: rand(-180, -60), v, fam, t: 0 }; },

  regenT() { return this.mode === 'inf' ? CONFIG.shield.regenInf : CONFIG.shield.regen; },
  // un coup reçu : le bouclier encaisse ; s'il est tombé, la coque perd 1 PV ; à 0 PV, le vaisseau est détruit
  hurtPlayer(sx, sy) {
    const p = this.p;
    if (p.inv > 0 || this.state !== 'play' || this.outro || this.over || this.cine || this.uf) return;
    const hy = p.y + this.hitOff, ang = sx == null ? -Math.PI / 2 : Math.atan2(sy - hy, sx - p.x);
    this.hits++; p.inv = 1.6; this.combo = 0; this.addOnde(0.12); Ideas.onHurt(this);
    if (p.wl > 3) { p.wl--; this.floatText(p.x, p.y - 60, WEAPONS[p.wf].name + ' ' + p.wl, '#D9705F'); }
    this.eb = this.eb.filter(b => d2(b.x, b.y, p.x, p.y) > 160 * 160);
    p.regT = 0;
    if (p.sp > 0) {
      p.sp--; p.hitFx = { a: ang, t: 0, max: 0.6 }; p.shieldT = 0.5;
      const [ex, ey] = this.shieldEdge(ang);
      this.shake = 11; this.hurtA = 0.4; this.ts = 0.35; SFX.play('shield'); SFX.play('hurt'); SFX.vib([25, 30, 25]);
      this.spark(ex, ey, '#E6F7FF', 16, 280); this.floatText(ex, ey - 16, '−1', '#CFEFFF');
      if (p.sp === 0) this.shatter();
      return;
    }
    p.hp--; this.hpLost++; p.flash = 0.3; this.shake = 18; this.hurtA = 0.8; SFX.play('hurt'); SFX.vib([30, 40, 30]);
    if (p.hp > 0) {
      this.explode(p.x, hy, 34, this.Wd.boom); this.floatText(p.x, p.y - 60, tx('game.hpLost'), '#FF7A5C');
      if (p.hp === 1) UI.banner(tx('game.hullLow'), tx('game.hullLowSub'));
      return;
    }
    this.explode(p.x, hy, 60, this.Wd.boom);
    if (this.mod('revive') && !p.revived) { p.revived = true; p.hp = Math.max(1, Math.ceil(p.hpMax / 2)); p.sp = p.spMax; p.inv = 3; this.flashA = 0.6; UI.banner(tx('game.revive')); }
    else this.finish(false);
  },
  repair(n) { const p = this.p, was = p.hp; p.hp = Math.min(p.hpMax, p.hp + n); if (p.hp > was) this.floatText(p.x, p.y - 60, tx('game.hpUp', { n: p.hp - was }), '#7CF2B4'); },
  shieldUp(n) { const p = this.p, was = p.sp; p.sp = Math.min(p.spMax, p.sp + n); if (p.sp > was) { p.shieldT = 0.5; this.floatText(p.x, p.y - 60, tx('game.shieldUp', { n: p.sp - was }), '#BFE8FF'); } },
  shieldEdge(a) { const p = this.p; return [p.x + Math.cos(a) * this.shRx, p.y + this.hitOff + Math.sin(a) * this.shRy]; },
  // le bouclier vole en éclats
  shatter() {
    const p = this.p, hy = p.y + this.hitOff;
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, [x, y] = this.shieldEdge(a); this.spark(x, y, i % 2 ? '#BFE8FF' : '#FFFFFF', 3, 240); }
    this.fx.push({ type: 'flash', x: p.x, y: hy, life: 0.25, max: 0.25, size: this.shRy * 2.4, col: '#BFE8FF', add: true });
    this.shake = 16; this.hurtA = 0.75; this.flashA = 0.25; SFX.play('bigboom'); SFX.vib([60, 30, 60]);
    this.floatText(p.x, p.y - 84, tx('game.shieldDown'), '#BFE8FF');
  },
  graze(b) {
    this.grazes++; const k = 1 + this.mod('grazeGain');
    this.addOnde(0.035 * k); this.score += 5 * this.scoreMul();
    const gb = this.mod('grazeBuff'); if (gb) this.p.buffT = gb;
    this.spark(b.x, b.y, '#FFFFFF', 3, 120); SFX.play('graze', 50);
  },
  // vitesse de charge (CONFIG.powers) : réduite en mission, bien plus en Infini et de plus en plus avec les vagues ; rien pendant le verrou après usage
  powK(k) { const P = CONFIG.powers; return this.mode === 'inf' ? P[k + 'Inf'] / (1 + P.infSlow * Math.max(0, (this.infWave || 1) - 1)) : P[k]; },
  addOnde(v) { if (this.ondeLock > 0) return; const was = this.onde >= 1; this.onde = Math.min(1, this.onde + v * this.powK('onde') * this.S.onde * (1 + this.mod('ondeCharge'))); if (!was && this.onde >= 1) { SFX.play('ready'); UI.hint('onde'); } },
  addUlt(v) { if (this.ultLock > 0 || this.uf || this.cine) return; const was = this.ult >= 1; this.ult = Math.min(1, this.ult + v * this.powK('ult') * this.S.ultc * (1 + this.mod('ultCharge'))); if (!was && this.ult >= 1) { SFX.play('ready'); UI.hint('ult'); } },

  /* ================= projectiles ================= */
  updPB(dt) {
    for (const b of this.pb) {
      b.t += dt;
      if (b.homing) {
        if (!b.tg || b.tg.dead || b.tg.gone || (b.tg.node && b.tg.node.dead) || (b.tg.core && !this.boss)) b.tg = this.nearest(b.x, b.y, 1100);
        const sp = Math.min(660, Math.hypot(b.vx, b.vy) + 950 * dt); let a = Math.atan2(b.vx, -b.vy);
        if (b.tg) { const tx = b.tg.node ? b.tg.node.x : b.tg.core && this.boss ? this.boss.x : b.tg.x, ty = b.tg.node ? b.tg.node.y : b.tg.core && this.boss ? this.boss.y : b.tg.y; a += clamp(angDiff(Math.atan2(tx - b.x, -(ty - b.y)), a), -7 * dt, 7 * dt); }
        b.vx = Math.sin(a) * sp; b.vy = -Math.cos(a) * sp;
        if (vrnd() < 0.6) this.fx.push({ type: 'puff', x: b.x, y: b.y, vx: 0, vy: 0, life: 0.35, max: 0.35, size: 2.5, grow: 2.2, col: this.Wd.light ? '#5A544A' : '#9AA0A8', a: 0.35 });
      }
      if (b.kind === 'blade' && b.t < 0.3) { const t = this.nearest(b.x, b.y, 300); if (t) b.vx += clamp(t.x - b.x, -1, 1) * 600 * dt; }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.helix) b.x += Math.cos(b.t * 18) * b.helix * 140 * dt;
      if (b.bounce > 0 && (b.x < 6 || b.x > W - 6)) { b.vx = -b.vx; b.bounce--; b.x = clamp(b.x, 6, W - 6); }
      if (b.y < -40 || b.y > H + 40 || b.x < -40 || b.x > W + 40 || b.t > 3.2) { b.dead = true; continue; }
      if (b.kind === 'blade') for (const q of this.eb) if (d2(q.x, q.y, b.x, b.y) < 26 * 26) q.dead = true;
      for (const e of this.ens) {
        if (e.dead || e.gone || (b.hit && b.hit.has(e))) continue;
        const dx = (b.x - e.x) / (e.rx + b.r), dy = (b.y - e.y) / (e.ry + b.r);
        if (dx * dx + dy * dy < 1) { this.onHit(b, e); if (b.dead) break; }
      }
      if (!b.dead && this.boss) this.bossHit(b);
    }
    this.pb = this.pb.filter(b => !b.dead);
  },
  onHit(b, e) {
    this.hurt(e, b.dmg, b.kind === 'blade' ? 'ult' : 'shot', b.x, b.y);
    if (b.kind !== 'blade') this.impact(b.x, b.y, b.vx, b.vy, b.kind === 'plasma' ? WEAPONS.plasma.col : b.kind === 'missile' ? WEAPONS.swarm.col : WEAPONS[this.p.wf].col);
    if (b.kind === 'plasma') this.splash(b.x, b.y, b.splash, b.dmg * 0.5, e);
    const rk = this.mod('rico'); if (rk && !b.rico) { const t = this.nearest(b.x, b.y, 280, e); if (t) this.pShot('shard', b.x, b.y, Math.atan2(t.x - b.x, -(t.y - b.y)), 720, b.dmg * rk, { rico: true }); }
    if (b.pierce > 0) { b.pierce--; (b.hit || (b.hit = new Set())).add(e); } else b.dead = true;
  },
  splash(x, y, R, dmg, not) {
    this.fx.push({ type: 'ring', x, y, life: 0.25, max: 0.25, size: R * 0.3, grow: R * 3, col: WEAPONS.plasma.col, add: true });
    for (const e of this.ens) if (e !== not && !e.dead && d2(e.x, e.y, x, y) < R * R) this.hurt(e, dmg, 'splash');
  },
  updEB(dt) {
    const p = this.p, hx = p.x, hy = p.y + this.hitOff, Wd = this.Wd;
    const wind = Wd.wind ? Math.sin(this.t * 0.35) * 45 : 0;
    const orbs = this.mod('orbs') ? this.orbitPos() : null;
    for (const b of this.eb) {
      b.t += dt;
      if (b.kind === 'bomb') b.vy += 230 * dt;
      b.x += (b.vx + wind) * dt; b.y += b.vy * dt;
      if (b.kind === 'mine') { b.vx *= 1 - dt * 0.8; b.vy *= 1 - dt * 0.6; b.fuse -= dt; if (b.fuse <= 0) { b.dead = true; this.burst(b.x, b.y, 8, Wd.eb, 150); continue; } }
      if (b.kind === 'bomb' && b.y >= H - 108) { b.dead = true; this.groundBlast(b.x); continue; }
      if (b.y > H + 30 || b.y < -80 || b.x < -50 || b.x > W + 50) { b.dead = true; continue; }
      if (orbs) { let blocked = false; for (const [ox, oy] of orbs) if (d2(b.x, b.y, ox, oy) < 14 * 14) { blocked = true; break; } if (blocked) { b.dead = true; this.spark(b.x, b.y, '#BFE3F5', 3, 100); continue; } }
      if (this.outro) continue;
      if (this.convoy && Ideas.hitConvoy(this, b)) { b.dead = true; continue; }
      const dd = d2(b.x, b.y, hx, hy);
      if (dd < (b.r + this.hitR) ** 2) { b.dead = true; this.hurtPlayer(b.x, b.y); continue; }
      if (!b.grazed && dd < (b.r + this.hitR + 24) ** 2) { b.grazed = true; this.graze(b); }
    }
    this.eb = this.eb.filter(b => !b.dead);
    if (orbs) for (const e of this.ens) for (const [ox, oy] of orbs) if (!e.dead && d2(e.x, e.y, ox, oy) < (e.rx + 10) ** 2 && (e.orbT || 0) < this.t) { e.orbT = this.t + 0.25; this.hurt(e, 2 * this.dmgBase(), 'orbit'); }
  },
  orbitPos() { const n = this.mod('orbs'), p = this.p, out = []; for (let i = 0; i < n; i++) { const a = this.t * 3.2 + i / n * TAU; out.push([p.x + Math.cos(a) * 54, p.y + this.hitOff + Math.sin(a) * 54]); } return out; },
  burst(x, y, n, spr, sp) { for (let i = 0; i < n; i++) { const a = i / n * TAU; this.eb.push({ x, y, vx: Math.sin(a) * sp, vy: Math.cos(a) * sp, r: 5, spr, kind: 'n', t: 0 }); } this.spark(x, y, this.Wd.accent, 6, 160); SFX.play('pop', 60); },
  groundBlast(x) {
    const y = H - 108; SFX.play('dust', 80); this.shake = Math.max(this.shake, 4);
    for (let i = 0; i < 6; i++) this.fx.push({ type: 'puff', x: x + vrand(-14, 14), y: y - vrand(0, 10), vx: vrand(-30, 30), vy: vrand(-60, -20), life: vrand(0.6, 1), max: 1, size: vrand(8, 14), grow: 1.8, col: '#4A4236', a: 0.6 });
    this.fx.push({ type: 'flash', x, y, life: 0.14, max: 0.14, size: 50, col: '#F0C88A', add: false });
    if (Math.abs(this.p.x - x) < 36 && this.lineY) this.hurtPlayer();
  },

  /* ================= ramassage ================= */
  updPk(dt) {
    const p = this.p, hy = p.y + this.hitOff, R = this.S.magnet * (1 + this.mod('magnet'));
    for (const q of this.pk) {
      q.t += dt;
      const dx = p.x - q.x, dy = hy - q.y, dist = Math.hypot(dx, dy) || 1;
      if (this.outro || (q.t > 0.3 && dist < (q.k === 'xp' ? R * 1.4 : R))) { const sp = 320 + q.t * 520; q.vx = dx / dist * sp; q.vy = dy / dist * sp; }
      else { q.vy = Math.min(150, q.vy + 280 * dt); q.vx *= 1 - dt * 2; }
      q.x += q.vx * dt; q.y += q.vy * dt;
      if (dist < 26) { q.dead = true; this.collect(q); } else if (q.y > H + 30) q.dead = true;
    }
    this.pk = this.pk.filter(q => !q.dead);
  },
  collect(q) {
    const p = this.p;
    switch (q.k) {
      case 'xp': this.xp += q.v * Ideas.xpMul(this); SFX.play('xp', 35); while (this.xp >= this.need) { this.xp -= this.need; this.lvl++; this.need = 8 + (this.lvl - 1) * 5; this.pend++; } break;
      case 'cr': this.cr += Math.round(q.v * this.S.cred * Ideas.crMul(this)); SFX.play('cr', 35); break;
      case 'gift': if (q.fam === p.wf) this.wpnUp(); else { p.wf = q.fam; this.floatText(p.x, p.y - 50, WEAPONS[q.fam].name + ' ' + p.wl, WEAPONS[q.fam].col); SFX.play('gift'); } break;
      case 'up': this.wpnUp(); break;
      case 'hp': this.repair(1); SFX.play('gift'); break;
      case 'sh': this.shieldUp(1); SFX.play('gift'); break;
    }
  },
  wpnUp() { const p = this.p; if (p.wl < 10) { p.wl++; this.floatText(p.x, p.y - 50, WEAPONS[p.wf].name + ' ' + p.wl, WEAPONS[p.wf].col); SFX.play('up'); } else { this.score += 500; this.floatText(p.x, p.y - 50, '+500', '#E9C979'); } },
  // chiffres de dégâts : un chiffre par cible, cumulé tant que les coups s'enchaînent (moins de fouillis)
  dmgNum(o, x, y, dmg, crit) {
    const v = dmg * 10, q = o.dn;
    if (q && q.life > 0 && q.max - q.life < 0.28) { q.v += v; q.age = Math.min(q.age, 0.04); q.crit = q.crit || crit; q.life = q.max; return; }
    if (this.nums.length > 48) this.nums.shift();
    o.dn = { x: clamp(x + rand(-6, 6), 30, W - 30), y: Math.max(y, 130), v, crit, age: 0, life: crit ? 0.85 : 0.7, max: crit ? 0.85 : 0.7, vy: crit ? -95 : -75 };
    this.nums.push(o.dn);
  },
  // la barre rouge chute tout de suite, la traînée claire la rattrape
  trail(o, dt) { const h = Math.max(0, o.hp); if (o.hpT == null || o.hpT < h) o.hpT = h; else o.hpT = Math.max(h, o.hpT - Math.max(o.max * 0.35, (o.hpT - h) * 3) * dt); },
  hpBar(c, x, y, w, h, o, col) {
    const r = Math.max(0, o.hp / o.max), tr = Math.max(r, Math.min(1, (o.hpT == null ? o.hp : o.hpT) / o.max)), x0 = Math.round(x - w / 2), y0 = Math.round(y);
    c.fillStyle = '#07080A'; c.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
    c.fillStyle = '#2B1C1A'; c.fillRect(x0, y0, w, h);
    c.fillStyle = '#F3E6D6'; c.fillRect(x0, y0, w * tr, h);
    c.fillStyle = col || '#D9483B'; c.fillRect(x0, y0, w * r, h);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x0, y0, w * r, Math.max(1, Math.round(h * 0.35)));
    if (w >= 60) { c.fillStyle = '#07080A'; const n = Math.max(2, Math.round(o.max * 10 / 40)), st = w / Math.min(n, 10); for (let i = 1; i < Math.min(n, 10); i++) c.fillRect(Math.round(x0 + i * st), y0, 1, h); }
  },
  floatText(x, y, txt, col) { this.texts.push({ x, y, txt, col, life: 1.1, max: 1.1 }); },

  /* ================= montée de niveau ================= */
  openLevelUp() {
    this.pend--; this.state = 'levelup'; SFX.play('level'); this.keys = {}; this.ptr = null;
    const pool = SKILLS.filter(s => (this.skills[s.id] || 0) < s.max && (!s.need || NEEDS[s.need](this))).map(s => ({ s, w: RARITY[s.r].w }));
    const opts = []; while (opts.length < 3 && pool.length) { const it = weighted(pool); opts.push(it.s); pool.splice(pool.indexOf(it), 1); }
    UI.showLevelUp(opts, this.lvl);
  },
  takeSkill(s) {
    this.skills[s.id] = (this.skills[s.id] || 0) + 1; this.modC = null;
    const T = s.take || {};
    if (T.shieldMax) this.p.spMax += T.shieldMax;
    if (T.shield) this.shieldUp(T.shield);
    if (T.hp) this.repair(T.hp);
    if (T.weapon) this.p.wl = Math.min(10, this.p.wl + T.weapon);
    this.state = 'play'; this.ts = 0.2; this.p.inv = Math.max(this.p.inv, 0.6);
  },

  /* ================= onde & ultime ================= */
  fireOnde() {
    if (this.state !== 'play' || this.onde < 1 || this.over) { SFX.play('deny'); return; }
    this.onde = 0; this.ondeLock = CONFIG.powers.ondeLock * (this.mode === 'inf' ? CONFIG.powers.lockInf : 1); const p = this.p, R = this.S.ondeR, hy = p.y + this.hitOff;
    for (const b of this.eb) { this.fx.push({ type: 'dot', x: b.x, y: b.y, vx: (p.x - b.x) * 2.2, vy: (hy - b.y) * 2.2, life: 0.45, max: 0.45, size: 2.6, col: '#FFFFFF', add: true }); this.score += 2; }
    this.eb = [];
    const dmg = 9 * (1 + this.d * 0.07) * this.S.dmg;
    for (const e of this.ens) if (d2(e.x, e.y, p.x, hy) < (R + e.rx) ** 2) this.hurt(e, dmg, 'onde');
    if (this.boss) this.bossArea(p.x, hy, R, dmg * 1.5);
    this.shake = 10; this.flashA = Store.d.set.fx ? 0.3 : 0.12; SFX.play('onde'); SFX.vib(40);
    this.ondeFx = { x: p.x, y: hy, t: 0, R };
  },
  fireUlt() {
    if (this.state !== 'play' || this.ult < 1 || this.uf || this.cine || this.over || this.outro) { SFX.play('deny'); return; }
    this.ult = 0; this.ultLock = CONFIG.powers.ultLock * (this.mode === 'inf' ? CONFIG.powers.lockInf : 1); const type = this.ch.ult;
    this.cine = { t: 0, dur: 0.95, type, name: ULTS[type].name };
    this.p.inv = Math.max(this.p.inv, 4); SFX.play('ultcharge'); SFX.vib(30);
    Store.d.stats.ults = (Store.d.stats.ults || 0) + 1;
  },
  ultK() { return 1.2 * (1 + this.d * 0.07) * this.dmgBase(); },
  startUlt(type) {
    const p = this.p, K = this.ultK();
    this.uf = { type, t: 0, dur: { beam: 2.6, blades: 2.4, orbital: 2.6, boom: 1.7, shell: 2.0, ram: 1.8, saturn: 3.0, reset: 1.3 }[type], tick: 0, done: new Set(), K, x: p.x };
    this.p.inv = Math.max(this.p.inv, this.uf.dur + 0.5);
    SFX.play('ultfire'); this.shake = 16; SFX.vib(80);
    if (type === 'shell') { const tg = this.boss ? { x: this.boss.x, y: this.boss.y } : this.massCenter(); this.uf.tx = tg.x; this.uf.ty = tg.y; }
    if (type === 'orbital') { this.uf.cols = []; for (let i = 0; i < 9; i++) this.uf.cols.push({ x: 30 + i * (W - 60) / 8, at: 0.15 + (i % 2 ? 8 - i : i) * 0.0 + i * 0.13, hit: false }); }
  },
  massCenter() { const a = this.ens.filter(e => !e.dead && e.y > 0); if (!a.length) return { x: W / 2, y: H * 0.3 }; let x = 0, y = 0; for (const e of a) { x += e.x; y += e.y; } return { x: x / a.length, y: y / a.length }; },
  updUlt(dt) {
    const U = this.uf; if (!U) return; const p = this.p, K = U.K;
    U.t += dt; U.tick -= dt;
    const tickNow = U.tick <= 0; if (tickNow) U.tick = 0.1;
    const colHit = (x, hw, dmg, yMax = H) => {
      for (const e of this.ens) if (!e.dead && Math.abs(e.x - x) < hw + e.rx && e.y < yMax) this.hurt(e, dmg, 'ult');
      for (const b of this.eb) if (Math.abs(b.x - x) < hw && b.y < yMax) b.dead = true;
      if (this.boss) this.bossColumn(x, hw, dmg);
    };
    const once = (e, dmg) => { if (U.done.has(e)) return; U.done.add(e); this.hurt(e, dmg, 'ult'); };
    switch (U.type) {
      case 'beam': U.x += (p.x - U.x) * Math.min(1, dt * 6); if (tickNow) colHit(U.x, 64, 4.2 * K, p.y); this.shake = Math.max(this.shake, 5); break;
      case 'blades': U.sp = (U.sp || 0) - dt; if (U.sp <= 0 && U.t < U.dur - 0.5) { U.sp = 0.035; this.pShot('blade', rand(20, W - 20), -30, Math.PI + rand(-0.1, 0.1), 950, 9 * K / 1.2); } break;
      case 'orbital': for (const col of U.cols) { if (!col.hit && U.t >= col.at + 0.18) { col.hit = true; colHit(col.x, 36, 20 * K); this.explode(col.x, H * 0.3, 60, this.Wd.boom); this.shake = Math.max(this.shake, 8); SFX.play('boom', 40); } } break;
      case 'boom': { U.y = H - (U.t / U.dur) * (H + 160); for (const e of this.ens) if (!e.dead && Math.abs(e.y - U.y) < 60) once(e, 26 * K); for (const b of this.eb) if (Math.abs(b.y - U.y) < 60) b.dead = true; if (this.boss && !U.bossHit && Math.abs(this.boss.y - U.y) < 80) { U.bossHit = true; this.bossArea(this.boss.x, this.boss.y, 999, 40 * K); } break; }
      case 'shell': { const k = Math.min(1, U.t / 0.7); U.sx = lerp(p.x, U.tx, easeInOut(k)); U.sy = lerp(p.y, U.ty, easeInOut(k)); if (k >= 1 && !U.blown) { U.blown = true; const R = 300; for (const e of this.ens) if (!e.dead && d2(e.x, e.y, U.tx, U.ty) < R * R) this.hurt(e, 55 * K, 'ult'); this.eb = this.eb.filter(b => d2(b.x, b.y, U.tx, U.ty) > R * R); if (this.boss) this.bossArea(U.tx, U.ty, R, 60 * K); this.explode(U.tx, U.ty, 260, this.Wd.boom); this.flashA = 0.6; this.shake = 22; SFX.play('bigboom'); } break; }
      case 'ram': { U.y = H + 80 - (U.t / U.dur) * (H + 400); for (const e of this.ens) if (!e.dead && Math.abs(e.x - U.x) < 80 + e.rx && Math.abs(e.y - U.y) < 160) once(e, 40 * K); for (const b of this.eb) if (Math.abs(b.x - U.x) < 80 && Math.abs(b.y - U.y) < 170) b.dead = true; if (this.boss && !U.bossHit && Math.abs(this.boss.y - U.y) < 120) { U.bossHit = true; this.bossArea(U.x, this.boss.y, 999, 45 * K); } break; }
      case 'saturn': { const k = clamp((U.t - 0.2) / (U.dur - 0.6), 0, 1); U.y = H + 260 - k * k * (H + 700); if (tickNow && U.t > 0.3) colHit(U.x, 54, 3.4 * K, U.y + 300); this.shake = Math.max(this.shake, 6); break; }
      case 'reset': if (!U.fired && U.t > 0.3) { U.fired = true; this.flashA = 1; for (const e of this.ens) if (!e.dead) this.hurt(e, Math.max(e.max * 0.55, 30 * K), 'ult'); this.eb = []; if (this.boss) { const B = this.boss; B.nodes.forEach((n, i) => { if (!n.dead && i % 2 === 0) this.hurtNode(n, n.max); }); if (!B.nodes.some(n => !n.dead)) this.hurtBoss(B.max * 0.12, 'ult'); } } break;
    }
    if (U.t >= U.dur) this.uf = null;
  },

  /* ================= boss ================= */
  startBoss() {
    const Bd = this.Wd.boss, k = CONFIG.difficulty.bossHp * (1 + this.d * CONFIG.difficulty.bossHpD), D = Art.DEF[Bd.spr];
    const w = Bd.w, h = w * D.h / D.w;
    const B = this.boss = { Bd, spr: Bd.spr, w, h, x: W / 2, y: -h * 0.6 - 40, ty: H * Bd.ty, t: 0, hp: 300 * k, max: 300 * k, phase: 1, flash: 0, patI: -1, patT: 2.6, cur: null, pt: 0, st: 0, did: 0, nodes: [], rot: 0, entering: true, dying: false, deadT: 0 };
    const N = Bd.nodes, nk = 18 * k;
    if (N.mode === 'orbit') for (let i = 0; i < N.n; i++) B.nodes.push({ a: i / N.n * TAU, hp: nk, max: nk, dead: false, flash: 0, x: W / 2, y: -100, rot: 0 });
    else N.pts.forEach(pt => B.nodes.push({ px: pt[0], py: pt[1], hp: nk, max: nk, dead: false, flash: 0, x: W / 2, y: -100, rot: 0 }));
    UI.bossBar(Bd.name); UI.banner(Bd.name, tx('game.boss')); SFX.play('phase');
    this.wave = null; this.F = null; Ideas.bossStart(this);
  },
  updBoss(dt) {
    const B = this.boss; if (!B) return; const p = this.p, Bd = B.Bd, N = Bd.nodes;
    B.t += dt; B.flash -= dt; this.trail(B, dt);
    if (B.dying) {
      B.deadT += dt;
      if (Math.random() < 0.35) this.explode(B.x + rand(-B.w * 0.4, B.w * 0.4), B.y + rand(-B.h * 0.3, B.h * 0.3), 90, this.Wd.boom);
      if (B.deadT > 1.7) { this.boss = null; UI.bossBar(null); this.bossDefeated(); }
      return;
    }
    B.y += (B.ty - B.y) * Math.min(1, dt * 1.1); if (B.entering && Math.abs(B.ty - B.y) < 6) B.entering = false;
    const amp = Math.max(10, (W - B.w * 0.75) / 2);
    const tx = Bd.move === 'drift' ? W / 2 + Math.sin(B.t * 0.35) * Math.min(amp, 50) : Bd.move === 'slow' ? W / 2 + Math.sin(B.t * 0.25) * 60 : W / 2 + Math.sin(B.t * 0.5) * amp * (B.phase > 1 ? 1 : 0.8);
    B.x += (tx - B.x) * Math.min(1, dt * 2);
    if (Bd.spinSprite) B.rot += dt * Bd.spinSprite * (B.phase > 2 ? 1.8 : 1);
    const sp = (N.spin || 0) * (B.phase > 1 ? 1.6 : 1);
    for (const n of B.nodes) {
      n.flash -= dt; this.trail(n, dt);
      if (N.mode === 'orbit') { n.a += dt * sp; n.x = B.x + Math.cos(n.a) * N.r; n.y = B.y + (N.cy || 0) + Math.sin(n.a) * N.r * N.ry; n.rot = N.rotate ? n.a + Math.PI / 2 : 0; }
      else { n.x = B.x + n.px; n.y = B.y + n.py; if (N.aim) n.rot = Math.atan2(-(p.x - n.x), (p.y - n.y)); }
    }
    if (B.entering) return;
    const fr = B.hp / B.max;
    if (B.phase === 1 && fr < 0.6) this.bossPhase(2); else if (B.phase === 2 && fr < 0.25) this.bossPhase(3);
    B.patT -= dt;
    if (B.patT <= 0) { B.cur = Ideas.bossNext(this, B); B.patT = B.phase === 1 ? 3.4 : B.phase === 2 ? 2.8 : 2.3; B.pt = 0; B.st = 0; B.did = 0; }
    B.pt += dt; B.st -= dt;
    if (!this.outro) this.bossPattern(B);
    if (this.inBoss(p.x, p.y + this.hitOff, B, 6)) this.hurtPlayer();
  },
  inBoss(x, y, B, r) { const dx = (x - B.x) / (B.w * 0.37 + r), dy = (y - B.y) / (B.h * 0.35 + r); return dx * dx + dy * dy < 1; },
  bossPattern(B) {
    const p = this.p, d = this.d, Wd = this.Wd, ph = B.phase;
    const bs = Math.min(430, 160 + d * 2.8) * (Wd.bspeed || 1) * (ph === 3 ? 1.15 : 1);
    const ox = B.x, oy = B.y + B.h * 0.22;
    const shot = (a, s = bs, spr = Wd.eb, kind = 'n', x = ox, y = oy) => this.eb.push({ x, y, vx: Math.sin(a) * s, vy: Math.cos(a) * s, r: kind === 'mine' ? 9 : 5, spr, kind, t: 0, fuse: 1.6 });
    const aim = (x, y) => Math.atan2(p.x - x, (p.y + this.hitOff) - y);
    switch (B.cur) {
      case 'radial': if (B.st <= 0) { B.st = ph === 1 ? 1.15 : 0.8; const n = 12 + this.wi + ph * 2; for (let i = 0; i < n; i++) shot(i / n * TAU + B.pt, bs * 0.8); SFX.play(Wd.esfx); } break;
      case 'aimed': if (B.st <= 0) { B.st = 0.55; const a = aim(ox, oy); for (let i = -2; i <= 2; i++) shot(a + i * 0.11, bs * 1.1, Wd.eb2); SFX.play(Wd.esfx); } break;
      case 'spiral': if (B.st <= 0) { B.st = ph === 1 ? 0.09 : 0.065; const a = B.t * 2.9; shot(a, bs * 0.8); shot(a + Math.PI, bs * 0.8); if (ph === 3) shot(a + Math.PI / 2, bs * 0.8); } break;
      case 'rain': if (B.st <= 0) { B.st = ph === 1 ? 0.13 : 0.09; shot(rand(-0.08, 0.08), bs * 0.75, Wd.eb, 'n', Ideas.rainX(this), -10); } break;
      case 'wall': if (B.st <= 0) { B.st = 1.15; const gap = Ideas.gapX(this); for (let x = 16; x < W; x += 30) if (Math.abs(x - gap) > 52) shot(0, bs * 0.7, Wd.eb, 'n', x, oy - 10); } break;
      case 'mines': if (B.st <= 0) { B.st = 0.75; shot(rand(-0.7, 0.7), bs * 0.4, null, 'mine'); } break;
      case 'beam': if (B.did < (ph === 1 ? 2 : 3) && B.pt > B.did * 0.9) { B.did++; this.beams.push({ x: B.did === 1 ? p.x : clamp(p.x + rand(-130, 130), 30, W - 30), warn: 0.9, on: 0.55 }); SFX.play('beamwarn'); } break;
      case 'bombs': if (B.st <= 0) { B.st = ph === 1 ? 0.36 : 0.26; const ns = B.nodes.filter(n => !n.dead), s = ns.length ? pick(ns) : B; shot(0, 60, 'b_bomb', 'bomb', s.x + rand(-24, 24), s.y + 18); } break;
      case 'broadside': if (B.st <= 0) { B.st = ph === 1 ? 1 : 0.75; let any = false; for (const n of B.nodes) if (!n.dead && n.y < H * 0.6) { any = true; const a = aim(n.x, n.y); for (let i = -1; i <= 1; i++) shot(a + i * 0.12, bs, Wd.eb, 'n', n.x, n.y); } if (!any) { const a = aim(ox, oy); for (let i = -2; i <= 2; i++) shot(a + i * 0.1, bs, Wd.eb2); } SFX.play(Wd.esfx); } break;
    }
  },
  bossPhase(n) {
    const B = this.boss; B.phase = n; B.patT = 1.2;
    if (n === 2) B.nodes.forEach((nd, i) => { if (nd.dead && i % 2 === 0) { nd.dead = false; nd.hp = nd.max * 0.6; } });
    UI.banner(tx('game.phase', { n }), B.Bd.name); SFX.play('phase'); this.shake = 16; this.flashA = 0.3; Ideas.onPhase(this, n);
    this.pk.push(this.newPk('gift', B.x, B.y + B.h * 0.3, 1, pick(FAMS)), this.newPk('up', B.x - 30, B.y + B.h * 0.3));
    for (const b of this.eb) b.dead = true;
  },
  bossHit(b) {
    const B = this.boss; if (!B || B.dying || B.entering) return;
    const nr = B.Bd.nodes.w * 0.45;
    for (const n of B.nodes) if (!n.dead && d2(b.x, b.y, n.x, n.y) < (nr + b.r) ** 2) { this.hurtNode(n, b.dmg); if (b.kind !== 'blade') this.impact(b.x, b.y, b.vx, b.vy, WEAPONS[this.p.wf].col); if (b.kind === 'plasma') this.splash(b.x, b.y, b.splash, b.dmg * 0.5); if (b.kind !== 'blade') b.dead = true; return; }
    if (this.inBoss(b.x, b.y, B, b.r)) {
      if (B.nodes.some(n => !n.dead)) { if (!b.passed) { b.passed = true; this.spark(b.x, b.y, '#BFE3F5', 1, 90); SFX.play('shield', 120); } return; }
      this.hurtBoss(b.dmg, 'shot', b.x, b.y); if (b.kind !== 'blade') { b.dead = true; this.impact(b.x, b.y, b.vx, b.vy, WEAPONS[this.p.wf].col); }
    }
  },
  hurtNode(n, dmg) {
    if (n.dead) return; n.hp -= dmg; n.flash = 0.07; this.dmgNum(n, n.x, n.y - (this.boss ? this.boss.Bd.nodes.w * 0.3 : 10), dmg, false); SFX.play('hit', 50);
    if (n.hp <= 0) {
      n.dead = true; this.explode(n.x, n.y, 70, this.Wd.boom); SFX.play('boom'); this.score += 400 * this.scoreMul();
      for (let i = 0; i < 4; i++) this.pk.push(this.newPk('xp', n.x, n.y));
      this.pk.push(this.newPk('cr', n.x, n.y, Math.ceil(2 + this.d * 0.2)));
      if (Math.random() < 0.5) this.pk.push(this.newPk('up', n.x, n.y));
      this.addUlt(0.05);
    }
  },
  hurtBoss(dmg, src, x, y) {
    const B = this.boss; if (!B || B.dying) return;
    let crit = false;
    if ((src === 'shot' || src === 'arc' || src === 'rail') && Math.random() < this.S.crit + this.mod('crit')) { dmg *= this.S.critMul; crit = true; }
    this.dmgNum(B, x == null ? B.x + rand(-0.18, 0.18) * B.w : x, y == null ? B.y + rand(-0.1, 0.15) * B.h : y, dmg, crit);
    B.hp -= dmg; B.flash = 0.06; this.addUlt(dmg * 0.0006);
    if (src === 'shot') SFX.play('hit', 50);
    if (B.hp <= 0) this.bossDie();
  },
  bossArea(x, y, R, dmg) {
    const B = this.boss; if (!B || B.dying || B.entering) return;
    for (const n of B.nodes) if (!n.dead && d2(n.x, n.y, x, y) < R * R) this.hurtNode(n, dmg);
    if (d2(B.x, B.y, x, y) < (R + B.w * 0.3) ** 2) this.hurtBoss(B.nodes.some(n => !n.dead) ? dmg * 0.3 : dmg, 'ult');
  },
  bossColumn(x, hw, dmg) {
    const B = this.boss; if (!B || B.dying || B.entering) return;
    for (const n of B.nodes) if (!n.dead && Math.abs(n.x - x) < hw + B.Bd.nodes.w * 0.45) this.hurtNode(n, dmg);
    if (Math.abs(B.x - x) < hw + B.w * 0.36) this.hurtBoss(B.nodes.some(n => !n.dead) ? dmg * 0.3 : dmg, 'ult');
  },
  bossDie() {
    const B = this.boss; B.dying = true; B.deadT = 0; B.hp = 0;
    this.score += 5000 * (this.wi + 1) * this.scoreMul();
    this.ts = 0.25; this.shake = 24; this.flashA = 0.8; SFX.play('bigboom'); SFX.vib([60, 40, 120]);
    for (const b of this.eb) b.dead = true; this.beams = [];
    for (let i = 0; i < 10; i++) this.pk.push(this.newPk('cr', B.x + rand(-60, 60), B.y + rand(-30, 30), Math.ceil(3 + this.d * 0.3)));
    for (let i = 0; i < 12; i++) this.pk.push(this.newPk('xp', B.x + rand(-60, 60), B.y));
    UI.bossBar(null); UI.banner(B.Bd.name, tx('game.down'));
  },
  bossDefeated() {
    Ideas.bossEnd(this);
    if (this.mode === 'mission') this.delay = { t: 0.6, fn: () => this.nextStep() };
    else { this.repair(1); this.delay = { t: 1, fn: () => this.nextStep() }; }
  },
  updBeams(dt) {
    const p = this.p;
    for (const b of this.beams) {
      if (b.warn > 0) { b.warn -= dt; if (b.warn <= 0) { SFX.play('beam'); this.shake = Math.max(this.shake, 6); } }
      else { b.on -= dt; if (Math.abs(p.x - b.x) < 26) this.hurtPlayer(); if (b.on <= 0) b.dead = true; }
    }
    this.beams = this.beams.filter(b => !b.dead);
  },

  /* ================= fin de mission ================= */
  finish(win) {
    if (this.over) return; this.over = true; Ideas.end();
    if (this.boss || (this.steps && this.steps[this.stepI] === 'boss')) Ideas.bossEnd(this);
    if (win) { this.outro = { t: 0, vy: 0, k: 0, done: false }; SFX.play('clear'); }
    else { this.explode(this.p.x, this.p.y, 140, this.Wd.boom); SFX.play('bigboom'); this.shake = 20; this.state = 'end'; setTimeout(() => { if (this.running) this.endScreen(false); }, 1300); }
  },
  // sortie de victoire : le vaisseau se recentre un instant, puis remonte de plus en plus vite et sort par le haut
  updOutro(dt) {
    const O = this.outro, p = this.p; O.t += dt;
    if (O.t < 0.7) { p.x += (W / 2 - p.x) * Math.min(1, dt * 2.5); return; }
    if (!O.go) { O.go = true; SFX.play('swipe'); this.shake = Math.max(this.shake, 4); }
    O.vy = Math.min(2600, O.vy + 2400 * dt); p.y -= O.vy * dt; p.tilt *= 0.9;
    if (p.y < H * 0.35) O.k = clamp(O.k + dt * 1.6, 0, 1);
    if (p.y < -160 && !O.done) { O.done = true; this.delay = { t: 0.35, fn: () => this.endScreen(true) }; }
  },
  starsGot() { const p = this.p; return [true, p.hp * 2 > p.hpMax, this.hpLost === 0]; },
  endScreen(win) {
    this.state = 'end';
    const st = Store.d; const res = { win, mode: this.mode, score: this.score, cr: this.cr, hits: this.hits, combo: this.maxCombo, kills: this.kills, u: this.u, m: this.m, stars: 0, reward: 0 };
    st.stats.kills += this.kills; st.stats.grazes += this.grazes; st.stats.combo = Math.max(st.stats.combo, this.maxCombo); st.stats.time += Math.round(this.t);
    if (this.mode === 'mission') {
      const i = this.u * 5 + this.m; const R = CONFIG.rewards;
      if (win) {
        // étoiles : 1 pour finir, 2 avec plus de la moitié des PV, 3 sans perdre de PV (les coups sur le bouclier ne comptent pas)
        res.got = this.starsGot(); res.stars = res.got.filter(Boolean).length; res.hp = this.p.hp; res.hpMax = this.p.hpMax;
        res.first = !st.done[i]; st.done[i] = true; st.stars[i] = Math.max(st.stars[i], res.stars); st.stats.missions++;
        res.reward = Math.round((R.mission + this.d * R.missionD) * res.stars * this.S.cred * (res.first ? R.first : 1));
        res.perfect = res.stars === 3 && this.hits === 0; // parfait : 3 étoiles sans aucun coup reçu
        if (res.perfect) { res.bonus = Math.round(res.reward * R.perfect); st.perf[i] = true; }
        if (this.m === 4) { res.post = this.Wd.story.post; if (this.u === 9 && !st.owned.includes('omega')) { st.owned.push('omega'); res.omega = true; } if (this.u < WORLDS.length - 1 && res.first) res.unlock = this.u + 1; }
      }
    } else {
      const k = 't' + this.tier; res.wave = this.infWave; res.best = this.score > (st.best[k] || 0); if (res.best) st.best[k] = this.score; st.best['w' + this.tier] = Math.max(st.best['w' + this.tier] || 0, this.infWave);
      res.reward = Math.round(this.infWave * (CONFIG.rewards.inf + this.tier * CONFIG.rewards.infTier) * this.S.cred);
    }
    res.total = this.cr + res.reward + (res.bonus || 0); st.credits += res.total; Store.save();
    UI.showEnd(res);
  },
  pause(on) { if (on && this.state === 'play') { this.state = 'paused'; this.keys = {}; UI.showPause(); } else if (!on && this.state === 'paused') { this.state = 'play'; UI.hideSheet(); } },
  quit() { this.running = false; this.state = 'off'; this.keys = {}; this.ptr = null; },

  /* ================= effets ================= */
  // effets visuels : hasard séparé (vrand), donc sans effet sur le déroulé de la partie
  spark(x, y, col, n, sp) { if (this.fx.length > 900) return; for (let i = 0; i < n; i++) { const a = vrand(0, TAU), s = vrand(sp * 0.4, sp); this.fx.push({ type: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: vrand(0.15, 0.32), max: 0.32, size: vrand(1.2, 2.2), col, add: true }); } },
  // impact d'un tir du joueur : petit éclair et gerbe d'étincelles renvoyée vers l'arrière du tir (6 au plus par image)
  impact(x, y, vx, vy, col) {
    if (this.impN++ > 3 || this.fx.length > 500 || !Store.d.set.fx) return;
    const add = !this.Wd.light, a0 = Math.atan2(-vy, -vx);
    this.fx.push({ type: 'flash', x, y, life: 0.07, max: 0.07, size: 13, col, add });
    for (let i = 0; i < 2; i++) { const a = a0 + vrand(-0.95, 0.95), s = vrand(110, 260); this.fx.push({ type: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: vrand(0.09, 0.2), max: 0.2, size: vrand(0.9, 1.6), col: i ? '#FFFFFF' : col, add }); }
  },
  explode(x, y, size, style, sub) {
    // sous forte charge (beaucoup d'effets à l'écran), on garde l'essentiel : éclair, feu, étincelles, choc
    const busy = this.fx.length > 380, fxOn = Store.d.set.fx && !busy, n = Math.round(clamp(size / 4, 6, 24) * (fxOn ? 1 : 0.5)); if (this.fx.length > 1000) return;
    const P = o => this.fx.push(o), add = !this.Wd.light, R = vrand;
    const pal = { tech: ['#C9F2DA', '#8AD6A8'], brass: ['#F3DFAE', '#E8CF98'], bubble: ['#DDF3F6', '#9FD3D6'], smoke: ['#F6D9A6', '#E8A15A'], sky: ['#FFF4E4', '#F0C88A'], space: ['#FFFFFF', '#A9CFE0'], neo: ['#E8F4FF', '#9CC8E8'], gold: ['#FFF0BE', '#E9C979'], film: ['#FFFFFF', '#CFCFCF'], relief: ['#FFE9C2', '#F2A65A'] }[style] || ['#FFFFFF', '#E8A15A'];
    P({ type: 'flash', x, y, life: 0.16, max: 0.16, size: size * 1.3, col: pal[1], add });
    // boule de feu : cœur blanc qui vire à la couleur de l'univers puis s'éteint (boules décalées, jamais un rond seul au centre d'un anneau)
    const nf = size > 50 ? 3 : busy ? 1 : 2;
    for (let i = 0; i < nf; i++) { const a = R(0, TAU), r = R(0.05, 0.2) * size, s = R(0.3, 0.7) * size; P({ type: 'fire', x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: R(0.26, 0.4) * (1 + size / 260), max: 0.4 * (1 + size / 260), size: size * R(0.3, 0.46), col: pal[1], add }); }
    for (let i = 0; i < n; i++) { const a = R(0, TAU), s = R(80, 380) * (size / 60 + 0.5); P({ type: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: R(0.2, 0.5), max: 0.5, size: R(1.4, 2.6), col: pal[i % 2], add }); }
    // braises : lentes, elles flottent et s'éteignent après les étincelles
    if (fxOn) for (let i = 0; i < n / 5; i++) { const a = R(0, TAU), s = R(30, 120) * (size / 80 + 0.6); P({ type: 'ember', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: R(0.5, 1), max: 1, size: R(1.4, 2.4), col: pal[1], add }); }
    // onde de choc : anneau épais qui s'affine en s'élargissant
    P({ type: 'shock', x, y, life: 0.3, max: 0.3, size: size * 0.32, grow: size * 1.15, col: pal[0], add });
    if (style === 'bubble') { for (let i = 0; i < n; i++) P({ type: 'bubble', x: x + R(-size / 3, size / 3), y: y + R(-size / 4, size / 4), vx: R(-20, 20), vy: R(-140, -50), life: R(0.8, 1.6), max: 1.6, size: R(2, 5), col: '#DDF3F6' }); }
    else {
      // fumée : épaisse sur terre et dans le ciel, poussière fine dans l'espace
      const sm = { smoke: ['#2C2824', 0.55], sky: ['#E6DED4', 0.45], brass: ['#9A8C74', 0.45], tech: ['#26302C', 0.4], neo: ['#2A3442', 0.4], gold: ['#2E2818', 0.4], space: ['#4A505C', 0.22], film: ['#3A3A3A', 0.5], relief: ['#5A4A3A', 0.5] }[style] || ['#34363C', 0.4];
      for (let i = 0; i < n / 3; i++) P({ type: 'puff', x: x + R(-size / 4, size / 4), y: y + R(-size / 4, size / 4), vx: R(-30, 30), vy: R(-40, 10), life: R(0.6, 1.1), max: 1.1, size: size * R(0.12, 0.2), grow: 1.6, col: sm[0], a: sm[1] });
    }
    if (style === 'gold') for (let i = 0; i < 5; i++) P({ type: 'sq', x: x + R(-size / 2, size / 2), y: y + R(-size / 2, size / 2), vx: 0, vy: 0, life: R(0.1, 0.3), max: 0.3, size: R(4, 12), col: R(0, 1) < 0.5 ? '#000000' : '#FFFFFF' });
    // éclats : triangles de tôle qui tournoient, les plus gros laissent un filet de fumée
    const dc = style === 'brass' || style === 'gold' ? ['#B8904A', '#F3DFAE'] : style === 'neo' ? ['#8A96A4', '#E8F4FF'] : style === 'sky' ? ['#8A8478', '#F4ECE0'] : style === 'film' ? ['#555555', '#FFFFFF'] : style === 'relief' ? ['#7A5C3A', '#FFE2B0'] : ['#3A3D44', '#C9CED6'];
    for (let i = 0; i < Math.min(6, n / 3.5); i++) {
      const a = R(0, TAU), s = R(70, 260) * (size / 90 + 0.6), z = R(2.5, 5.5) * (size > 60 ? 1.3 : 1);
      P({ type: 'shard', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, vr: R(-14, 14), rot: R(0, TAU), life: R(0.5, 0.95), max: 0.95, size: z, col: dc[0], hi: dc[1], tr: fxOn && z > 4.5 ? 0.0001 : 0,
        k: [R(0.6, 1), R(0.5, 0.9), R(0.4, 0.8)] });
    }
    // grosse cible : deux ou trois explosions secondaires en chapelet
    if (!sub && fxOn && size >= 70) for (let i = 0; i < (size > 120 ? 3 : 2); i++) P({ type: 'sub', x: x + R(-0.35, 0.35) * size, y: y + R(-0.3, 0.3) * size, vx: 0, vy: 0, life: 0.07 + i * 0.09, max: 1, size: size * R(0.35, 0.5), style });
  },
  updFx(dt) {
    const later = [];
    for (const q of this.fx) {
      q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.type === 'spark' || q.type === 'dot') { q.vx *= 1 - dt * 3; q.vy *= 1 - dt * 3; }
      else if (q.type === 'ember') { q.vx *= 1 - dt * 1.6; q.vy *= 1 - dt * 1.6; q.vy -= 14 * dt; }
      else if (q.type === 'fire') { q.vx *= 1 - dt * 5; q.vy *= 1 - dt * 5; }
      else if (q.type === 'debris') { q.vy += 300 * dt; q.rot += q.vr * dt; }
      else if (q.type === 'shard') { q.vy += 260 * dt; q.vx *= 1 - dt * 0.6; q.rot += q.vr * dt; if (q.tr && (q.tr -= dt) <= 0 && q.life > 0.2) { q.tr = 0.045; later.push({ type: 'puff', x: q.x, y: q.y, vx: 0, vy: 0, life: 0.4, max: 0.4, size: 2.2, grow: 2.4, col: this.Wd.light ? '#4A443A' : '#5A5E66', a: 0.32 }); } }
      else if (q.type === 'bubble') q.x += Math.sin(q.life * 9) * 20 * dt;
      else if (q.type === 'puff') { q.vx *= 1 - dt; q.vy *= 1 - dt; }
      if (q.type === 'sub' && q.life <= 0) later.push(q);
    }
    this.fx = this.fx.filter(q => q.life > 0);
    for (const q of later) { if (q.type === 'sub') { this.explode(q.x, q.y, q.size, q.style, true); SFX.play('pop', 40); } else if (this.fx.length < 950) this.fx.push(q); }
    for (const z of this.zaps) z.life -= dt; this.zaps = this.zaps.filter(z => z.life > 0);
    for (const r of this.rails) r.life -= dt; this.rails = this.rails.filter(r => r.life > 0);
    for (const t of this.texts) { t.life -= dt; t.y -= 30 * dt; } this.texts = this.texts.filter(t => t.life > 0);
    for (const q of this.nums) { q.life -= dt; q.age += dt; q.y += q.vy * dt; q.vy *= Math.exp(-4 * dt); } this.nums = this.nums.filter(q => q.life > 0);
  },

  /* ================= rendu ================= */
  render() {
    const c = this.c, t = this.t, p = this.p, Wd = this.Wd;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.save();
    const z = this.cam ? this.cam.z : 1;
    if (z > 1.001) { const fx = p.x, fy = p.y + this.hitOff; c.translate(fx, fy); c.scale(z, z); c.translate(-fx, -fy); }
    if (this.shake > 0 && Store.d.set.shake) c.translate(vrand(-1, 1) * this.shake * 0.5, vrand(-1, 1) * this.shake * 0.5);
    if (Wd.dynEvery) {
      // décor animé coûteux (sol en perspective) : peint avec le fond dans une toile en cache, une image sur dynEvery
      const bw = this.bg.width, bh = this.bg.height;
      if (!this.dynCv || this.dynCv.width !== bw || this.dynCv.height !== bh || this.dynW !== Wd) { this.dynCv = document.createElement('canvas'); this.dynCv.width = bw; this.dynCv.height = bh; this.dynW = Wd; this.dynN = 0; }
      if (this.dynN++ % Wd.dynEvery === 0) { const g = this.dynCv.getContext('2d'); g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); g.drawImage(this.bg, 0, 0, W, H); Wd.bgDyn(g, t, this); }
      c.drawImage(this.dynCv, 0, 0, W, H);
      BG.drawLayers(c, Wd, t, false, this.dpr);
    } else {
      c.drawImage(this.bg, 0, 0, W, H);
      BG.drawLayers(c, Wd, t, false, this.dpr);
      Wd.bgDyn(c, t, this);
    }
    this.drawPickups(c);
    Ideas.draw(this, c);
    this.drawEnemies(c);
    this.drawBoss(c);
    this.drawPlayerShots(c);
    this.drawPlayer(c);
    this.drawUlt(c);
    this.drawEnemyShots(c);
    this.drawFx(c);
    BG.drawLayers(c, Wd, t, true, this.dpr);
    Dev.drawHits(c, this);
    c.restore();
    if (this.wfade > 0) { c.fillStyle = `rgba(0,0,0,${this.wfade})`; c.fillRect(0, 0, W, H); }
    if (this.hurtA > 0) { const g = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75); g.addColorStop(0, 'rgba(160,30,20,0)'); g.addColorStop(1, `rgba(160,30,20,${this.hurtA * (Store.d.set.calm ? 0.3 : 0.55)})`); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    if (this.flashA > 0) { c.fillStyle = `rgba(255,255,255,${this.flashA * (Store.d.set.fx ? 1 : 0.5) * (Store.d.set.calm ? 0.15 : 1)})`; c.fillRect(0, 0, W, H); }
    if (this.cine) this.drawCine(c);
    Ideas.drawTop(this, c);
    if (Wd.overlay) Wd.overlay(c, t, this);
    if (this.intro) this.drawIntro(c);
    this.drawTexts(c);
  },
  drawPickups(c) {
    c.save(); c.globalCompositeOperation = this.addMode;
    for (const q of this.pk) {
      if (q.k === 'xp') Art.glow(c, q.x, q.y, 8, '#3CE08A', 0.35 + 0.25 * Math.sin(q.t * 9 + q.x));
    }
    c.restore();
    // XP : petits losanges verts qui scintillent (jamais ronds ni chauds, pour ne pas ressembler aux tirs ennemis)
    for (const q of this.pk) {
      if (q.k !== 'xp') continue;
      const tw = Math.sin(q.t * 9 + q.x), s = 4.2 + tw * 0.6;
      c.fillStyle = '#0B2A1A'; c.beginPath(); c.moveTo(q.x, q.y - s - 1.4); c.lineTo(q.x + s * 0.7 + 1.2, q.y); c.lineTo(q.x, q.y + s + 1.4); c.lineTo(q.x - s * 0.7 - 1.2, q.y); c.closePath(); c.fill();
      c.fillStyle = tw > 0.6 ? '#D8FFE8' : '#5CF0A0'; c.beginPath(); c.moveTo(q.x, q.y - s); c.lineTo(q.x + s * 0.7, q.y); c.lineTo(q.x, q.y + s); c.lineTo(q.x - s * 0.7, q.y); c.closePath(); c.fill();
    }
    for (const q of this.pk) {
      const bob = Math.sin(q.t * 6) * 1.5;
      if (q.k === 'cr') Art.draw(c, 'pk_cr', q.x, q.y + bob, 18);
      else if (q.k === 'up') Art.draw(c, 'pk_up', q.x, q.y + bob, 30);
      else if (q.k === 'hp') Art.draw(c, 'pk_hp', q.x, q.y + bob, 30);
      else if (q.k === 'sh') Art.draw(c, 'pk_sh', q.x, q.y + bob, 30);
      else if (q.k === 'gift') {
        const col = WEAPONS[q.fam].col;
        c.save(); c.translate(q.x, q.y + bob); c.globalCompositeOperation = this.addMode; Art.glow(c, 0, 0, 30, col, 0.5); c.globalCompositeOperation = 'source-over';
        c.fillStyle = 'rgba(16,17,20,.92)'; c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.roundRect ? c.roundRect(-15, -15, 30, 30, 9) : c.rect(-15, -15, 30, 30); c.fill(); c.stroke();
        c.strokeStyle = col; c.lineWidth = 1.8; c.lineCap = 'round'; c.lineJoin = 'round'; c.translate(-9, -9); c.scale(0.75, 0.75); c.stroke(Art.path(ICONS[q.fam])); c.restore();
      }
    }
  },
  drawEnemies(c) {
    const t = this.t, lt = this.Wd.light;
    c.save(); c.globalCompositeOperation = this.addMode; c.lineCap = 'round'; c.strokeStyle = lt ? '#FFFFFF' : this.Wd.accent;
    // deux traits par ennemi (queue fine et pâle, tête plus large) : peu coûteux même avec 40 ennemis
    for (const e of this.ens) { const T = e.tr; if (!T || T.length < 6) continue; const n = T.length / 2, h = Math.ceil(n / 3), w = clamp(e.w * 0.07, 1.5, 4);
      c.globalAlpha = lt ? 0.22 : 0.16; c.lineWidth = w * 0.7; c.beginPath(); c.moveTo(T[0], T[1]); for (let i = 1; i < n; i++) c.lineTo(T[i * 2], T[i * 2 + 1]); c.stroke();
      c.globalAlpha = lt ? 0.3 : 0.24; c.lineWidth = w * 1.3; c.beginPath(); c.moveTo(T[0], T[1]); for (let i = 1; i < h; i++) c.lineTo(T[i * 2], T[i * 2 + 1]); c.stroke(); }
    c.restore();
    // relief : ombres portées au sol, sous tous les engins
    if (this.persp) for (const e of this.ens) Art.shadow(c, e.spr, e.x + e.w * 0.12, e.y + e.h * 0.55 + 6, e.w * 0.9, e.rot, e.flip, 0.24);
    for (const e of this.ens) {
      const D = Art.DEF[e.spr];
      if (D.rotor) { const sc = e.w / D.w; c.save(); c.translate(e.x, e.y); c.rotate(e.rot); c.fillStyle = 'rgba(40,36,32,.18)'; c.beginPath(); c.arc(D.rotor[0] * sc, D.rotor[1] * sc, D.rotor[2] * sc, 0, TAU); c.fill(); c.restore(); }
      if (D.flame) { const sc = e.w / D.w, ang = e.rot, fx = e.x + (Math.cos(ang) * D.flame[0] - Math.sin(ang) * D.flame[1]) * sc, fy = e.y + (Math.sin(ang) * D.flame[0] + Math.cos(ang) * D.flame[1]) * sc; c.save(); c.globalCompositeOperation = this.addMode; Art.glow(c, fx, fy, 12 + Math.sin(t * 40) * 2, '#F0B070', 0.8); c.restore(); }
      Art.draw(c, e.spr, e.x, e.y, e.w, e.rot, e.flip, 1, e.flash > 0 ? 0.85 : 0);
      if (D.light) { c.save(); c.globalCompositeOperation = 'lighter'; const sc = e.w / D.w; Art.glow(c, e.x + D.light[0] * sc, e.y + D.light[1] * sc, 22 + Math.sin(t * 4) * 4, D.light[2], 0.6); c.restore(); }
      // gel : voile bleuté et éclats de glace en pointes (pas de cercle autour d'un centre clair : ça ferait un œil)
      if (e.frozen > 0) {
        c.save(); c.globalCompositeOperation = 'lighter'; Art.glow(c, e.x, e.y, e.w * 0.6, '#BFE3F5', 0.3); c.restore();
        c.save(); c.translate(e.x, e.y); c.fillStyle = 'rgba(226,244,252,.85)'; c.strokeStyle = 'rgba(70,130,170,.8)'; c.lineWidth = 1;
        for (let i = 0; i < 5; i++) { const a = e.seed * 6 + i * 1.37, r0 = e.w * 0.3, r1 = e.w * (0.5 + (i % 2) * 0.1), ca = Math.cos(a), sa = Math.sin(a), w = 2.6;
          c.beginPath(); c.moveTo(ca * r0 - sa * w, sa * r0 + ca * w); c.lineTo(ca * r1, sa * r1); c.lineTo(ca * r0 + sa * w, sa * r0 - ca * w); c.closePath(); c.fill(); c.stroke(); }
        c.restore();
      }
      // bouclier : hexagone de champ de force en tirets (même famille que celui du joueur)
      if (e.shield > 0) { c.strokeStyle = 'rgba(191,227,245,.42)'; c.lineWidth = 1.2; c.setLineDash([7, 4]); c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6, x = e.x + Math.cos(a) * (e.rx + 8), y = e.y + Math.sin(a) * (e.ry + 8); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); c.stroke(); c.setLineDash([]); }
      if (e.A.gen) { c.save(); c.globalCompositeOperation = this.addMode; Art.glow(c, e.x, e.y, 60, '#BFE3F5', 0.18 + Math.sin(t * 3 + e.seed * 6) * 0.05); c.restore(); }
      if ((e.A.hp >= 3 || e.mini) && e.hp < e.max) { if (e.mini) this.hpBar(c, e.x, e.y - e.h * 0.5 - 16, 92, 7, e, '#E0673A'); else this.hpBar(c, e.x, e.y - e.h * 0.5 - 11, clamp(e.w * 0.62, 34, 60), 5, e); }
    }
  },
  drawBoss(c) {
    const B = this.boss; if (!B) return; const N = B.Bd.nodes, t = this.t;
    const a = B.dying ? Math.max(0, 1 - B.deadT / 1.7) : 1;
    const shielded = B.nodes.some(n => !n.dead);
    if (this.persp) Art.shadow(c, B.spr, B.x + 26, B.y + B.h * 0.3, B.w * 0.94, B.rot, false, 0.2 * a);
    Art.draw(c, B.spr, B.x, B.y, B.w, B.rot, false, a, B.flash > 0 ? 0.6 : 0);
    if (B.Bd.deco && !B.dying) B.Bd.deco(c, B, t);
    if (shielded && !B.dying) { c.strokeStyle = hexA(this.Wd.accent, 0.22 + Math.sin(t * 5) * 0.08); c.lineWidth = 2; c.beginPath(); c.ellipse(B.x, B.y, B.w * 0.4, B.h * 0.38, 0, 0, TAU); c.stroke(); }
    if (!B.dying) for (const n of B.nodes) if (!n.dead) { Art.draw(c, N.spr, n.x, n.y, N.w, n.rot, false, 1, n.flash > 0 ? 0.8 : 0); if (n.hp < n.max) this.hpBar(c, n.x, n.y + N.w * 0.5 + 5, 38, 5, n); }
    for (const b of this.beams) {
      if (b.warn > 0) { c.strokeStyle = hexA(this.Wd.accent, 0.4 + Math.sin(t * 40) * 0.25); c.setLineDash([10, 10]); c.lineWidth = 2; c.beginPath(); c.moveTo(b.x, 0); c.lineTo(b.x, H); c.stroke(); c.setLineDash([]); }
      else { c.save(); c.globalCompositeOperation = this.addMode; const g = c.createLinearGradient(b.x - 30, 0, b.x + 30, 0); g.addColorStop(0, hexA(this.Wd.accent, 0)); g.addColorStop(0.5, hexA(this.Wd.accent, 0.7)); g.addColorStop(1, hexA(this.Wd.accent, 0)); c.fillStyle = g; c.fillRect(b.x - 30, 0, 60, H); c.fillStyle = '#FFFFFF'; c.fillRect(b.x - 4, 0, 8, H); c.restore(); }
    }
  },
  drawPlayerShots(c) {
    c.save(); c.globalCompositeOperation = this.addMode;
    for (const b of this.pb) {
      if (b.kind === 'imp') Art.draw(c, 'p_imp', b.x, b.y, 12, Math.atan2(b.vx, -b.vy), false, b.passed ? 0.35 : 1);
      else if (b.kind === 'plasma') Art.draw(c, 'p_plasma', b.x, b.y, 30);
      else if (b.kind === 'missile') { Art.glow(c, b.x - b.vx * 0.012, b.y - b.vy * 0.012, 8, '#F0B070', 0.8); Art.draw(c, 'p_missile', b.x, b.y, 12, Math.atan2(b.vx, -b.vy)); }
      else if (b.kind === 'shard') Art.draw(c, 'p_shard', b.x, b.y, 10, Math.atan2(b.vx, -b.vy));
      else if (b.kind === 'blade') Art.draw(c, 'p_blade', b.x, b.y, 40, Math.atan2(b.vx, -b.vy) + Math.PI);
    }
    for (const z of this.zaps) { const a = z.life / z.max; c.strokeStyle = hexA(z.col, 0.35 * a); c.lineWidth = 6; this.poly(c, z.pts); c.strokeStyle = `rgba(255,255,255,${0.9 * a})`; c.lineWidth = 1.6; this.poly(c, z.pts); }
    for (const r of this.rails) { const a = r.life / r.max; c.fillStyle = `rgba(242,242,244,${0.25 * a})`; c.fillRect(r.x - r.w, 0, r.w * 2, r.y0); c.fillStyle = `rgba(255,255,255,${0.95 * a})`; c.fillRect(r.x - 1.5, 0, 3, r.y0); }
    c.restore();
  },
  poly(c, pts) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.stroke(); },
  drawPlayer(c) {
    const p = this.p; if (this.over && !this.outro) return;
    const t = this.t, D = Art.DEF[this.pSpr], sc = this.pSc, top = !this.Wd.vehicle || this.Wd.vehicle === 'late';
    // halo de l'onde (charge visible autour du vaisseau)
    const hy = p.y + this.hitOff, R = Math.max(30, this.pW * 0.55);
    c.save(); c.globalCompositeOperation = this.addMode;
    if (D.eng) for (const [ex, ey, s] of D.eng) { const fl = 0.85 + Math.sin(t * 43 + ex) * 0.15, rr = clamp(this.pW / 4, 10, 24) * s * fl; Art.glow(c, p.x + ex * sc, p.y + ey * sc + rr * 0.3, rr, '#F0B070', 0.85); Art.glow(c, p.x + ex * sc, p.y + ey * sc, rr * 0.35, '#FFF4E4', 0.9); }
    c.restore();
    if (this.trailOn && p.trail && p.trail.length > 2) {
      const T = p.trail, n = T.length; c.save(); c.globalCompositeOperation = this.addMode; c.lineCap = 'round';
      // ruban plein qui s'amincit (bandeau en dégradé, pas une suite de points)
      for (const [fx, fy, fw, fl] of D.flame) { const ox = fx * sc, oy = (fy + fl * 0.4) * sc, w0 = Math.max(1.5, fw * sc * 1.4), L = [], Rr = [];
        for (let i = 0; i < n; i++) { const a = T[Math.max(0, i - 1)], b = T[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = w0 * (1 - i / n), x = T[i][0] + ox, y = T[i][1] + oy; L.push([x - dy / l * w, y + dx / l * w]); Rr.push([x + dy / l * w, y - dx / l * w]); }
        const g = c.createLinearGradient(T[0][0] + ox, T[0][1] + oy, T[n - 1][0] + ox, T[n - 1][1] + oy); g.addColorStop(0, 'rgba(255,226,190,.55)'); g.addColorStop(0.3, 'rgba(240,176,112,.3)'); g.addColorStop(1, 'rgba(240,176,112,0)');
        c.fillStyle = g; c.beginPath(); L.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); for (let i = Rr.length - 1; i >= 0; i--) c.lineTo(Rr[i][0], Rr[i][1]); c.closePath(); c.fill(); }
      c.restore();
    }
    Art.flames(c, D, p.x, p.y, sc, t);
    const veh = this.Wd.vehicle;
    if (veh === 'destroyer') { c.strokeStyle = 'rgba(235,242,246,.5)'; c.lineWidth = 2; const by = p.y - 94 * sc * 0.97; c.beginPath(); c.moveTo(p.x - 2, by); c.quadraticCurveTo(p.x - 22, by + 30, p.x - 26 - Math.sin(t * 6) * 2, by + 80); c.moveTo(p.x + 2, by); c.quadraticCurveTo(p.x + 22, by + 30, p.x + 26 + Math.sin(t * 6) * 2, by + 80); c.stroke(); }
    if (veh === 'nautSide' && vrnd() < 0.4) this.fx.push({ type: 'bubble', x: p.x - 150 * sc * 0.5 - 6, y: p.y + vrand(-4, 4), vx: vrand(-40, -10), vy: vrand(-40, -10), life: 0.9, max: 0.9, size: vrand(1.5, 3.5), col: '#DDF3F6' });
    if (veh === 'tank' && Math.abs(p.tx - p.x) > 4 && vrnd() < 0.3) this.fx.push({ type: 'puff', x: p.x + vrand(-40, 40), y: p.y + 22, vx: vrand(-20, 20), vy: -10, life: 0.6, max: 0.6, size: 5, grow: 1.6, col: '#4A4236', a: 0.4 });
    const blink = p.inv > 0 && !this.cine && !this.uf && !this.outro && Math.floor(t * 18) % 2 === 0;
    if (!blink) {
      if (D.prop) { c.fillStyle = 'rgba(30,28,26,.2)'; c.beginPath(); c.ellipse(p.x, p.y + D.prop[1] * sc, D.prop[2] * sc, 2.5, 0, 0, TAU); c.fill(); }
      Art.draw(c, this.pSpr, p.x, p.y, this.pW, top ? p.tilt * 0.6 : 0, false, 1, p.flash > 0 ? 0.8 : 0);
    }
    const nd = this.mod('drones') + this.S.drone;
    for (let i = 0; i < nd; i++) { const [dx, dy] = this.dronePos(i, nd); Art.draw(c, 'p_drone', dx, dy, 20, p.tilt * 0.6); }
    if (this.mod('orbs')) { c.save(); c.globalCompositeOperation = this.addMode; for (const [ox, oy] of this.orbitPos()) { Art.glow(c, ox, oy, 14, '#BFE3F5', 0.6); c.fillStyle = '#F2FAFF'; c.beginPath(); c.moveTo(ox, oy - 6); c.lineTo(ox + 3.4, oy); c.lineTo(ox, oy + 6); c.lineTo(ox - 3.4, oy); c.closePath(); c.fill(); } c.restore(); }
    this.drawShield(c, t);
    if (this.ondeFx) { const f = this.ondeFx, k = easeOut(Math.min(1, f.t / 0.5)); c.strokeStyle = `rgba(255,255,255,${0.9 * (1 - k)})`; c.lineWidth = 4; c.beginPath(); c.arc(f.x, f.y, f.R * 1.3 * k, 0, TAU); c.stroke(); c.lineWidth = 1.5; c.beginPath(); c.arc(f.x, f.y, f.R * 1.05 * k, 0, TAU); c.stroke(); }
  },
  /* ---------- bouclier champ de force ---------- */
  // texture mise en cache par état : 0 plein, 1 abîmé, 2 critique
  shieldTex(st) {
    const rx = this.shRx, ry = this.shRy, key = st + '|' + rx + '|' + ry; this.shCache = this.shCache || {};
    if (this.shCache[key]) return this.shCache[key];
    const m = 14, k = 2, cv = document.createElement('canvas'); cv.width = (rx + m) * 2 * k; cv.height = (ry + m) * 2 * k;
    const c = cv.getContext('2d'); c.scale(k, k); const x = rx + m, y = ry + m, r = seeded(17 + st), a = [1, 0.8, 0.6][st];
    const ell = (ex = rx, ey = ry) => { c.beginPath(); c.ellipse(x, y, ex, ey, 0, 0, TAU); };
    const g = c.createRadialGradient(x, y, ry * 0.25, x, y, ry * 1.04); g.addColorStop(0, 'rgba(120,200,255,0)'); g.addColorStop(0.7, `rgba(120,200,255,${0.07 * a})`); g.addColorStop(1, `rgba(170,225,255,${0.38 * a})`);
    c.fillStyle = g; ell(); c.fill();
    c.save(); ell(); c.clip(); c.strokeStyle = `rgba(170,225,255,${0.15 * a})`; c.lineWidth = 0.7;
    const s = 7, hh = s * Math.sqrt(3);
    for (let i = -9; i <= 9; i++) for (let j = -7; j <= 7; j++) { const cx = x + j * s * 1.5, cy = y + i * hh + (j & 1 ? hh / 2 : 0); c.beginPath(); for (let q = 0; q < 6; q++) { const aa = q * Math.PI / 3; c.lineTo(cx + Math.cos(aa) * s * 0.92, cy + Math.sin(aa) * s * 0.92); } c.closePath(); c.stroke(); }
    c.restore();
    c.shadowColor = '#7FD0FF'; c.shadowBlur = 10; c.strokeStyle = `rgba(200,238,255,${0.95 * a})`; c.lineWidth = [2.6, 2, 1.5][st];
    if (st === 0) { ell(); c.stroke(); }
    else { const n = st === 1 ? 5 : 8; let t0 = r() * TAU; for (let i = 0; i < n; i++) { const seg = TAU / n * (st === 1 ? 0.84 : 0.55 + r() * 0.2); c.globalAlpha = st === 1 ? 1 : 0.5 + r() * 0.5; c.beginPath(); c.ellipse(x, y, rx, ry, 0, t0, t0 + seg); c.stroke(); t0 += TAU / n; } c.globalAlpha = 1; }
    c.shadowBlur = 0; c.lineCap = 'round'; c.strokeStyle = `rgba(255,255,255,${0.7 * a})`; c.lineWidth = 2.4; c.beginPath(); c.ellipse(x, y, rx - 4, ry - 4, 0, Math.PI * 1.13, Math.PI * 1.38); c.stroke();
    if (st > 0) {
      c.shadowColor = '#8FD8FF'; c.shadowBlur = 7; c.strokeStyle = '#F2FBFF'; c.lineJoin = 'miter';
      const n = st === 1 ? 3 : 6;
      for (let i = 0; i < n; i++) {
        const a0 = -1.2 + i * TAU / n + r() * 0.4; let px = x + Math.cos(a0) * rx, py = y + Math.sin(a0) * ry, d = a0 + Math.PI; const len = ry * (st === 1 ? 0.4 : 0.6), pts = [[px, py]];
        for (let q = 0; q < 5; q++) { d += (r() - 0.5) * 1.1; const l = len / 5 * (0.6 + r() * 0.8); px += Math.cos(d) * l; py += Math.sin(d) * l; pts.push([px, py]); }
        c.lineWidth = 1.4; c.beginPath(); pts.forEach(([X, Y], q) => q ? c.lineTo(X, Y) : c.moveTo(X, Y)); c.stroke();
        const b = pts[2], bd = d + (r() < 0.5 ? 1 : -1) * 0.9; c.lineWidth = 0.9; c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(b[0] + Math.cos(bd) * len * 0.3, b[1] + Math.sin(bd) * len * 0.3); c.stroke();
      }
    }
    return (this.shCache[key] = { cv, w: cv.width / k, h: cv.height / k });
  },
  drawShield(c, t) {
    const p = this.p, hy = p.y + this.hitOff, rx = this.shRx, ry = this.shRy, f = p.spMax ? p.sp / p.spMax : 0;
    c.save();
    if (p.sp > 0) {
      const st = f >= 0.999 ? 0 : f > 0.5 ? 1 : 2, fl = st === 2 && Math.sin(t * 31) > 0.35 ? 0.45 : 1;
      const T = this.shieldTex(st); c.globalAlpha = Math.min(1, (0.45 + 0.55 * f) * fl + Math.max(0, p.shieldT) * 1.2);
      c.drawImage(T.cv, p.x - T.w / 2, hy - T.h / 2, T.w, T.h);
      if (st === 2) { c.globalAlpha = 0.25 * fl; c.strokeStyle = '#BFE8FF'; c.lineWidth = 1; c.setLineDash([8, 6, 3, 8]); c.beginPath(); c.ellipse(p.x + 2.5, hy - 1, rx + 1.5, ry + 1.5, 0, 0, TAU); c.stroke(); c.setLineDash([]); }
    } else if (!this.outro && p.hp <= 1) {
      // bouclier tombé et coque à 1 PV : alerte rouge
      c.globalCompositeOperation = this.addMode; Art.glow(c, p.x, hy, rx * 1.1, '#FF5A46', 0.22 + 0.14 * Math.sin(t * 9)); c.globalCompositeOperation = 'source-over';
    }
    c.globalAlpha = 1;
    if (p.hitFx) {
      const H_ = p.hitFx, k = H_.t / H_.max, [ex, ey] = this.shieldEdge(H_.a);
      c.globalCompositeOperation = this.addMode; Art.glow(c, ex, ey, 34 * (1 - k * 0.4), '#FFFFFF', 0.9 * (1 - k)); Art.glow(c, ex, ey, 16, '#BFE8FF', 1 - k); c.globalCompositeOperation = 'source-over';
      c.strokeStyle = `rgba(210,240,255,${0.85 * (1 - k)})`; c.lineWidth = 2; c.beginPath(); c.ellipse(p.x, hy, rx * (1 + 0.35 * k), ry * (1 + 0.35 * k), 0, 0, TAU); c.stroke();
    }
    // jauge du bouclier (arc fin sous le vaisseau) ; la recharge en cours s'y lit en pâle
    c.lineCap = 'round';
    const arc = (a0, span, v, col, R0, rev) => {
      c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 6; c.beginPath(); c.arc(p.x, hy, R0, a0 - span, a0); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 3.5; c.beginPath(); c.arc(p.x, hy, R0, a0 - span, a0); c.stroke();
      if (v > 0) { c.strokeStyle = col; if (rev) { c.beginPath(); c.arc(p.x, hy, R0, a0 - span, a0 - span + span * Math.min(1, v)); } else { c.beginPath(); c.arc(p.x, hy, R0, a0 - span * Math.min(1, v), a0); } c.stroke(); }
    };
    const Rg = ry + 9;
    if (p.spMax > 0) {
      if (p.sp < p.spMax) { c.globalAlpha = 0.35; arc(Math.PI / 2 + 0.5, 1, (p.sp + p.regT / this.regenT()) / p.spMax, '#9FDCFF', Rg, false); c.globalAlpha = 1; }
      arc(Math.PI / 2 + 0.5, 1, Math.max(f, p.sp > 0 ? 0.04 : 0), '#9FDCFF', Rg, false);
    }
    c.restore();
  },
  drawEnemyShots(c) {
    const t = this.t;
    for (const b of this.eb) {
      // mine : losange sombre qui tourne, contour et pointes qui clignotent (aucun point au centre d'un disque : ça ferait un œil)
      if (b.kind === 'mine') {
        const bl = Math.sin(b.t * (8 + (1.8 - b.fuse) * 14)) > 0, A = this.Wd.bw ? this.Wd.accent : '#FF5A3C';
        c.save(); c.translate(b.x, b.y); c.rotate(b.t * 1.6); c.fillStyle = '#1C1D20'; c.beginPath(); c.moveTo(0, -9); c.lineTo(9, 0); c.lineTo(0, 9); c.lineTo(-9, 0); c.closePath(); c.fill();
        c.strokeStyle = bl ? A : hexA(A, 0.5); c.lineWidth = bl ? 2.2 : 1.4; c.stroke();
        if (bl) { c.beginPath(); c.moveTo(0, -10); c.lineTo(0, -14); c.moveTo(10, 0); c.lineTo(14, 0); c.moveTo(0, 10); c.lineTo(0, 14); c.moveTo(-10, 0); c.lineTo(-14, 0); c.stroke(); }
        c.restore(); continue;
      }
      if (!b.spr) continue;
      const D = Art.DEF[b.spr];
      const rot = b.kind === 'bomb' ? Math.atan2(-b.vx, b.vy) : (D.h > D.w * 1.4 ? Math.atan2(-b.vx, b.vy) : (b.spr === 'b_cog' ? t * 6 : 0));
      Art.draw(c, b.spr, b.x, b.y, D.w, rot);
    }
  },
  drawFx(c) {
    const calm = Store.d.set.calm;
    for (const q of this.fx) { if (q.add) continue; const a = clamp(q.life / q.max, 0, 1);
      if (q.type === 'puff') { c.globalAlpha = a * (q.a || 0.5); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, q.size * (1 + (1 - a) * (q.grow || 1)), 0, TAU); c.fill(); }
      else if (q.type === 'debris') { c.globalAlpha = a; c.save(); c.translate(q.x, q.y); c.rotate(q.rot); c.fillStyle = q.col; c.fillRect(-q.size / 2, -q.size / 3, q.size, q.size * 0.66); c.restore(); }
      else if (q.type === 'shard') this.drawShard(c, q, a);
      else if (q.type === 'bubble') { c.globalAlpha = a * 0.8; c.strokeStyle = q.col; c.lineWidth = 1; c.beginPath(); c.arc(q.x, q.y, q.size, 0, TAU); c.stroke(); }
      else if (q.type === 'sq') { c.globalAlpha = a; c.fillStyle = q.col; c.fillRect(q.x, q.y, q.size, q.size * 0.4); }
      else if (q.type === 'spark') { c.globalAlpha = a; c.strokeStyle = q.col; c.lineWidth = q.size; c.beginPath(); c.moveTo(q.x, q.y); c.lineTo(q.x - q.vx * 0.03, q.y - q.vy * 0.03); c.stroke(); }
      else if (q.type === 'ember') { c.globalAlpha = a; c.fillStyle = q.col; c.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size); }
      else if (q.type === 'ring') { c.globalAlpha = a; c.strokeStyle = q.col; c.lineWidth = 2; c.beginPath(); c.arc(q.x, q.y, q.size + (1 - a) * (q.grow || 40) * 0.3, 0, TAU); c.stroke(); }
      else if (q.type === 'shock') { c.globalAlpha = a * 0.8; this.drawShock(c, q, a, 5); }
      else if (q.type === 'fire') { const k = 1 - a, r = q.size * (0.55 + 0.6 * easeOut(k)); c.globalAlpha = 1; Art.glow(c, q.x, q.y, r * 1.3, k < 0.45 ? q.col : '#6A5E50', a * (calm ? 0.35 : 0.75)); Art.glow(c, q.x, q.y, r * 0.6, '#FFF6E8', a * a * (calm ? 0.3 : 0.7)); }
      else if (q.type === 'flash') { Art.glow(c, q.x, q.y, q.size * (0.6 + a * 0.4), q.col, a * (calm ? 0.3 : 0.8)); }
    }
    c.globalAlpha = 1; c.save(); c.globalCompositeOperation = 'lighter';
    for (const q of this.fx) { if (!q.add || q.type === 'shard') continue; const a = clamp(q.life / q.max, 0, 1);
      if (q.type === 'spark') { c.globalAlpha = a; c.strokeStyle = q.col; c.lineWidth = q.size; c.beginPath(); c.moveTo(q.x, q.y); c.lineTo(q.x - q.vx * 0.03, q.y - q.vy * 0.03); c.stroke(); }
      else if (q.type === 'dot') { c.globalAlpha = a; c.fillStyle = q.col; c.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size); }
      else if (q.type === 'ember') { const fl = 0.6 + 0.4 * Math.sin(q.life * 40 + q.x); c.globalAlpha = a * fl; c.fillStyle = q.col; c.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size); }
      else if (q.type === 'ring') { c.globalAlpha = a; c.strokeStyle = q.col; c.lineWidth = 2; c.beginPath(); c.arc(q.x, q.y, q.size + (1 - a) * (q.grow || 40) * 0.3, 0, TAU); c.stroke(); }
      else if (q.type === 'shock') { c.globalAlpha = a * 0.55; this.drawShock(c, q, a, 6); }
      else if (q.type === 'fire') { const k = 1 - a, r = q.size * (0.55 + 0.6 * easeOut(k)); c.globalAlpha = 1; Art.glow(c, q.x, q.y, r * 1.3, q.col, a * (calm ? 0.3 : 0.7)); Art.glow(c, q.x, q.y, r * 0.55, '#FFFFFF', a * a * (calm ? 0.3 : 0.85)); }
      else if (q.type === 'flash') { c.globalAlpha = 1; Art.glow(c, q.x, q.y, q.size * (0.6 + a * 0.4), q.col, a * (calm ? 0.35 : 0.9)); }
    }
    c.restore(); c.globalAlpha = 1;
    for (const q of this.fx) if (q.add && q.type === 'shard') this.drawShard(c, q, clamp(q.life / q.max, 0, 1));
    c.globalAlpha = 1;
  },
  // onde de choc en arcs brisés (jamais un anneau fermé autour d'un point clair)
  drawShock(c, q, a, lw) {
    const r = q.size + easeOut(1 - a) * q.grow, o = q.x * 0.37; c.strokeStyle = q.col; c.lineWidth = 0.8 + lw * a;
    for (let i = 0; i < 5; i++) { const a0 = o + i * TAU / 5; c.beginPath(); c.arc(q.x, q.y, r, a0, a0 + TAU / 5 * 0.72); c.stroke(); }
  },
  // éclat de tôle : triangle irrégulier, face éclairée quand il tourne vers la lumière
  drawShard(c, q, a) {
    const z = q.size, k = q.k, lit = Math.sin(q.rot * 2) > 0.55;
    c.globalAlpha = Math.min(1, a * 1.6); c.save(); c.translate(q.x, q.y); c.rotate(q.rot);
    c.fillStyle = lit ? q.hi : q.col; c.beginPath(); c.moveTo(0, -z * k[0]); c.lineTo(z * k[1], z * 0.6); c.lineTo(-z * k[2], z * 0.4); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(7,8,10,.6)'; c.lineWidth = 0.7; c.stroke(); c.restore();
  },
  drawUlt(c) {
    const U = this.uf; if (!U) return; const p = this.p, t = this.t, add = this.addMode;
    c.save(); c.globalCompositeOperation = add;
    switch (U.type) {
      case 'beam': { const a = Math.min(1, U.t / 0.2, (U.dur - U.t) / 0.3); const g = c.createLinearGradient(U.x - 80, 0, U.x + 80, 0); g.addColorStop(0, 'rgba(232,161,90,0)'); g.addColorStop(0.5, `rgba(232,161,90,${0.6 * a})`); g.addColorStop(1, 'rgba(232,161,90,0)'); c.fillStyle = g; c.fillRect(U.x - 80, 0, 160, p.y); c.fillStyle = `rgba(255,248,236,${0.95 * a})`; c.fillRect(U.x - 14 - Math.sin(t * 50) * 2, 0, 28 + Math.sin(t * 50) * 4, p.y - 10); Art.glow(c, U.x, p.y - 20, 70, '#FFF4E4', a); break; }
      case 'orbital': for (const col of U.cols) { const dt = U.t - col.at; if (dt < 0) continue; if (dt < 0.18) { c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(col.x, 0); c.lineTo(col.x, H); c.stroke(); } else if (dt < 0.5) { const a = 1 - (dt - 0.18) / 0.32; c.fillStyle = `rgba(232,161,90,${0.5 * a})`; c.fillRect(col.x - 40, 0, 80, H); c.fillStyle = `rgba(255,255,255,${0.9 * a})`; c.fillRect(col.x - 8, 0, 16, H); } } break;
      case 'boom': { c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(0, U.y - 60, W, 120); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, U.y + 30); c.quadraticCurveTo(W / 2, U.y - 50, W, U.y + 30); c.stroke(); c.restore(); c.save(); Art.draw(c, 'concorde', -100 + (U.t / U.dur) * (W + 200), U.y, 60, Math.PI / 2); break; }
      case 'shell': { if (!U.blown) { c.restore(); c.save(); Art.glow(c, U.sx, U.sy + 40, 50, '#F0B070', 0.9); Art.draw(c, 'columbiad', U.sx, U.sy, 64, Math.atan2(U.tx - p.x, -(U.ty - p.y))); } break; }
      case 'ram': { c.globalAlpha = 0.55; Art.draw(c, 'nautilus', U.x, U.y, 110); c.globalAlpha = 1; Art.glow(c, U.x, U.y - 120, 90, '#BFE6EA', 0.5); break; }
      case 'saturn': { const fl = U.y + 230; const g = c.createLinearGradient(0, fl, 0, fl + 500); g.addColorStop(0, 'rgba(255,240,210,.95)'); g.addColorStop(0.3, 'rgba(240,176,112,.6)'); g.addColorStop(1, 'rgba(240,176,112,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(U.x - 22, fl); c.lineTo(U.x + 22, fl); c.lineTo(U.x + 60 + Math.sin(t * 40) * 6, fl + 500); c.lineTo(U.x - 60 - Math.sin(t * 40) * 6, fl + 500); c.fill(); Art.glow(c, U.x, fl + 20, 80, '#FFF4E4', 0.9); c.restore(); c.save(); Art.draw(c, 'saturn', U.x, U.y, 46); break; }
      case 'reset': { const a = Math.max(0, 1 - U.t / U.dur); c.strokeStyle = `rgba(233,201,121,${a})`; c.lineWidth = 3; c.beginPath(); c.arc(p.x, p.y, (U.t / U.dur) * H * 1.2, 0, TAU); c.stroke(); break; }
    }
    c.restore();
  },
  drawCine(c) {
    const C = this.cine, k = easeOut(Math.min(1, C.t / 0.25)), a = Math.min(1, (C.dur - C.t) / 0.15, 1);
    const bh = 70 * k; c.fillStyle = '#000'; c.fillRect(0, 0, W, bh); c.fillRect(0, H - bh, W, bh);
    c.globalAlpha = a * k; const y0 = H * 0.42;
    const g = c.createLinearGradient(0, y0 - 80, 0, y0 + 60); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, y0 - 80, W, 140);
    const ts = this.tsK();
    c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,.75)'; c.font = `600 ${13 * ts}px ${FONT}`;
    c.fillText(tx('game.ultTag'), W / 2, H * 0.42 - 26 * ts);
    c.fillStyle = '#F5F5F7'; this.fitText(c, C.name, W / 2, H * 0.42 + 10, W - 60, 34 * ts, 700);
    c.globalAlpha = 1;
  },
  fitText(c, txt, x, y, maxW, size, weight = 700) { c.font = `${weight} ${size}px ${FONT}`; const w = c.measureText(txt).width; if (w > maxW) c.font = `${weight} ${size * maxW / w}px ${FONT}`; c.fillText(txt, x, y); },
  // taille du texte choisie dans Profil (1, 1,15 ou 1,3), appliquée aux textes dessinés dans le canvas
  tsK() { return (Store.d && +Store.d.set.ts) || 1; },
  lines(c, txt, maxW) { const out = []; let line = ''; for (const w of txt.split(' ')) { const test = line ? line + ' ' + w : w; if (c.measureText(test).width > maxW && line) { out.push(line); line = w; } else line = test; } if (line) out.push(line); return out; },
  drawIntro(c) {
    const I = this.intro, a = Math.min(1, I.t / 0.35, (I.dur - I.t) / 0.45); if (a <= 0) return;
    const Wd = this.Wd, y = H * 0.36, k = this.tsK();
    c.save(); c.globalAlpha = a;
    // texte d'accompagnement (anecdote ou nom du boss), mesuré d'abord pour que le carton l'englobe
    const fact = this.mode === 'mission' && (this.m === 0 || this.m === 4) ? (this.m === 4 ? tx('game.bossIs', { name: Wd.boss.name }) : Wd.fact) : '';
    c.font = `400 ${15 * k}px ${FONT}`; const fl = fact ? this.lines(c, fact, Math.min(W - 90, 370)) : [];
    if (Wd.silent) {
      // carton d'intertitre : fond noir, double filet clair
      const cw = Math.min(W - 40, 420), y0 = y - 120 * k, ch = Math.max(230 * k, y + 46 * k + Math.max(0, fl.length - 1) * 21 * k + 30 - y0), x0 = (W - cw) / 2;
      c.fillStyle = '#0A0A0A'; c.fillRect(x0, y0, cw, ch); c.strokeStyle = '#E8E6E0'; c.lineWidth = 2.5; c.strokeRect(x0 + 8, y0 + 8, cw - 16, ch - 16); c.lineWidth = 1; c.strokeRect(x0 + 14, y0 + 14, cw - 28, ch - 28);
    } else {
      const g = c.createLinearGradient(0, y - 150 * k, 0, y + 150 * k); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, y - 150 * k, W, 300 * k);
    }
    c.textAlign = 'center';
    const sub = this.mode === 'mission' ? UI.where(this.u, this.m) : tx('game.whereInf', { tier: TIERS[this.tier].name });
    c.fillStyle = 'rgba(255,255,255,.7)'; c.font = `500 ${15 * k}px ${FONT}`; c.fillText(sub, W / 2, y - 40 * k);
    if (this.mode === 'mission') {
      const got = Store.d.stars[this.u * 5 + this.m] || 0, col = Wd.bw ? '#F2F2F2' : '#BFD9F5', cw = Math.min(160, (W - 40) / 3), sy = y - 92 * k;
      c.font = `700 ${14 * k}px ${FONT}`; c.textBaseline = 'middle';
      for (let j = 0; j < 3; j++) {
        const cx = W / 2 + (j - 1) * cw; c.beginPath();
        for (let v = 0; v < 10; v++) { const a = -Math.PI / 2 + v * Math.PI / 5, r = (v % 2 ? 6.4 : 15) * k; c.lineTo(cx + Math.cos(a) * r, sy - 16 * k + Math.sin(a) * r); }
        c.closePath(); c.lineJoin = 'round'; c.lineWidth = 2; c.strokeStyle = '#000'; c.stroke(); c.fillStyle = j < got ? col : 'rgba(255,255,255,.12)'; c.fill(); if (j >= got) { c.strokeStyle = col; c.lineWidth = 1.2; c.stroke(); }
        c.fillStyle = j < got ? col : 'rgba(255,255,255,.7)'; c.fillText(tx('star.' + (j + 1)), cx, sy + 14 * k);
      }
      c.textBaseline = 'alphabetic';
    }
    c.fillStyle = '#F5F5F7'; this.fitText(c, Wd.name + (Wd.year ? ', ' + Wd.year : ''), W / 2, y + 6 * k, W - 60, 38 * k, 700);
    if (fl.length) { c.fillStyle = 'rgba(255,255,255,.72)'; c.font = `400 ${15 * k}px ${FONT}`; fl.forEach((l, i) => c.fillText(l, W / 2, y + 46 * k + i * 21 * k)); }
    c.restore();
  },
  drawTexts(c) {
    const k = this.tsK();
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    for (const q of this.nums) {
      const pop = 1 + (q.crit ? 0.7 : 0.45) * Math.max(0, 1 - q.age / 0.12), big = q.v >= 1000 ? 1.25 : q.v >= 100 ? 1.1 : 1;
      c.globalAlpha = Math.min(1, q.life / 0.25);
      c.font = `700 ${Math.round((q.crit ? 27 : 20) * big * pop * k)}px ${FONT}`;
      const s = fmt(Math.max(1, Math.round(q.v))) + (q.crit ? '!' : '');
      c.lineWidth = (q.crit ? 5 : 4) * k; c.strokeStyle = '#07080A'; c.strokeText(s, q.x, q.y);
      c.fillStyle = q.crit ? '#FFC24B' : '#F6F6F8'; c.fillText(s, q.x, q.y);
    }
    c.globalAlpha = 1; c.textBaseline = 'alphabetic';
    c.font = `600 ${Math.round(14 * k)}px ${FONT}`;
    for (const t of this.texts) { const a = Math.min(1, t.life / t.max * 2); c.globalAlpha = a; c.fillStyle = 'rgba(0,0,0,.55)'; c.fillText(t.txt, t.x + 1, t.y + 1); c.fillStyle = t.col; c.fillText(t.txt, t.x, t.y); }
    c.globalAlpha = 1;
  },
};
