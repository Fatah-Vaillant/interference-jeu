'use strict';
/* =========================================================
   INTERFÉRENCE — interface
   ========================================================= */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const STAR_P = 'M12 2L14.9 8.6L22 9.3L16.6 14L18.2 21L12 17.3L5.8 21L7.4 14L2 9.3L9.1 8.6Z';
const LOCK_P = 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z';
const BOSS_P = 'M12 3L20 12L12 21L4 12Z';
const svgIcon = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
/* étoiles de fin platine bleutée (planche v5) : facettes, reflet, éclat ; « parfait » : plus blanches, rayons, halo, étincelles */
const Plat = (() => {
  const path = (c, x, y, R, ri = 0.5) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * ri : R; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); };
  const mix = (A, B, t) => `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
  const spark = (c, x, y, r) => { c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); };
  const twinkle = (c, x, y, r, a = 1) => { if (r <= 0 || a <= 0) return; c.save(); c.globalAlpha = a; c.shadowColor = '#CFEAFF'; c.shadowBlur = r * 1.4; spark(c, x, y, r); spark(c, x, y, r * 0.45); c.restore(); };
  function rays(c, x, y, L, n, a, rot) {
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) { const t = i / n * TAU + rot, w = TAU / n * 0.32, g = c.createRadialGradient(x, y, 0, x, y, L); g.addColorStop(0, `rgba(200,230,255,${(i % 2 ? 0.16 : 0.26) * a})`); g.addColorStop(1, 'rgba(200,230,255,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(t - w) * L, y + Math.sin(t - w) * L); c.lineTo(x + Math.cos(t + w) * L, y + Math.sin(t + w) * L); c.closePath(); c.fill(); }
    c.restore();
  }
  function glow(c, x, y, r, a) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(156,200,255,${a})`); g.addColorStop(1, 'rgba(156,200,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  function star(c, x, y, R, mode) {
    c.save(); c.lineJoin = 'round';
    if (mode === 'empty') {
      path(c, x, y, R); c.lineWidth = R * 0.32; c.strokeStyle = '#04070C'; c.stroke(); c.lineWidth = R * 0.16; c.strokeStyle = '#1D2636'; c.stroke(); c.fillStyle = '#121925'; c.fill();
      path(c, x, y + R * 0.07, R * 0.7); c.fillStyle = '#0B1018'; c.fill(); c.restore(); return;
    }
    const P = mode === 'perfect';
    const hg = c.createRadialGradient(x, y, R * 0.2, x, y, R * (P ? 2.2 : 1.6)); hg.addColorStop(0, P ? 'rgba(210,238,255,.55)' : 'rgba(140,190,240,.3)'); hg.addColorStop(1, 'rgba(140,190,240,0)'); c.fillStyle = hg; c.fillRect(x - R * 2.5, y - R * 2.5, R * 5, R * 5);
    path(c, x, y, R); c.lineWidth = R * 0.34; c.strokeStyle = '#08111F'; c.stroke();
    const rim = c.createLinearGradient(x - R, y - R, x + R, y + R); rim.addColorStop(0, P ? '#FFFFFF' : '#E4EEFA'); rim.addColorStop(0.5, P ? '#BFE0FF' : '#9AB6D8'); rim.addColorStop(1, P ? '#8CB8EC' : '#5D7FA8');
    c.lineWidth = R * 0.17; c.strokeStyle = rim; c.stroke();
    const lo = P ? [150, 196, 244] : [74, 104, 146], hi = P ? [255, 255, 255] : [234, 243, 255], L = -2.3, pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * 0.5 : R; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
    for (let i = 0; i < 10; i++) { const am = -Math.PI / 2 + (i + 0.5) * Math.PI / 5; let t = (Math.cos(am - L) + 1) / 2; t = Math.min(1, Math.max(0, t * 0.85 + (i % 2 ? 0.15 : -0.02))); c.fillStyle = mix(lo, hi, t); c.beginPath(); c.moveTo(x, y); c.lineTo(...pts[i]); c.lineTo(...pts[(i + 1) % 10]); c.closePath(); c.fill(); }
    c.strokeStyle = P ? 'rgba(60,110,170,.25)' : 'rgba(10,22,40,.28)'; c.lineWidth = Math.max(0.6, R * 0.02); for (const p of pts) { c.beginPath(); c.moveTo(x, y); c.lineTo(...p); c.stroke(); }
    c.save(); path(c, x, y, R); c.clip(); c.globalAlpha = P ? 0.5 : 0.35; c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(x - R * 0.28, y - R * 0.42, R * 0.55, R * 0.2, -0.55, 0, TAU); c.fill(); c.restore();
    twinkle(c, x - R * 0.5, y - R * 0.78, R * (P ? 0.42 : 0.3));
    if (P) { twinkle(c, x + R * 1.05, y - R * 0.55, R * 0.2, 0.9); twinkle(c, x + R * 0.7, y + R * 0.95, R * 0.14, 0.8); }
    c.restore();
  }
  const back = x => { const s = 1.70158; x -= 1; return 1 + (s + 1) * x * x * x + s * x * x; };
  // anime l'apparition des étoiles une à une (cadencée avec le bruitage « star »), puis fait vivre l'état parfait
  function draw(cv, n, perfect) {
    if (!cv) return;
    const w = cv.clientWidth || 340, h = cv.clientHeight || 170, dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); const c = cv.getContext('2d');
    const sc = Math.min(w / 390, h / 190), cx = w / 2, cy = h * 0.55;
    const S = [[-102, 18, 40], [0, -6, 54], [102, 18, 40]].map(([dx, dy, r]) => [cx + dx * sc, cy + dy * sc, r * sc]);
    const t0 = performance.now(), sp = [0.25, 0.55, 0.85], tp = 1.1; // étoiles qui claquent une à une (le son suit : UI.showEnd)
    const frame = now => {
      if (!cv.isConnected) return;
      const t = (now - t0) / 1000;
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
      if (perfect && t > tp) { const a = Math.min(1, (t - tp) / 0.5); rays(c, cx, cy - 6 * sc, 190 * sc, 18, a, 0.1 + t * 0.12); glow(c, cx, cy, 150 * sc, 0.25 * a);
        // fondu elliptique : les rayons s'éteignent avant le bord du canvas
        c.save(); c.globalCompositeOperation = 'destination-in'; c.translate(cx, cy); c.scale(w / 2, h / 2); const m = c.createRadialGradient(0, 0, 0, 0, 0, 1); m.addColorStop(0.5, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = m; c.fillRect(-1, -1, 2, 2); c.restore(); }
      S.forEach(([x, y, r], i) => {
        star(c, x, y, r, 'empty');
        if (i >= n) return; const k = t < sp[i] ? 0 : t > sp[i] + 0.45 ? 1 : back((t - sp[i]) / 0.45); if (k <= 0) return;
        c.save(); c.translate(x, y); c.scale(k, k); c.translate(-x, -y); star(c, x, y, r, perfect && t > tp ? 'perfect' : 'full'); c.restore();
      });
      if (perfect && t > tp) for (let i = 0; i < 14; i++) { const sx = Math.sin(i * 12.9898) * 43758.5453, sy = Math.sin(i * 78.233) * 12345.678; twinkle(c, cx + ((sx - Math.floor(sx)) - 0.5) * 340 * sc, cy + ((sy - Math.floor(sy)) - 0.5) * 170 * sc, (2 + (i % 5)) * sc * (0.6 + 0.4 * Math.sin(t * 3 + i)), Math.min(1, (t - tp) * 2) * (0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.7))); }
      if (perfect || t < 1.6) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  return { draw };
})();
const chevrons = (n, col) => `<svg viewBox="0 0 48 48" aria-hidden="true">${Array.from({ length: n }, (_, i) => { const y = 32 + (n - 1) * 5 - i * 10; return `<path d="M8 ${y}L24 ${y - 10}L40 ${y}" fill="none" stroke="#040506" stroke-width="10"/><path d="M8 ${y}L24 ${y - 10}L40 ${y}" fill="none" stroke="${col}" stroke-width="5"/>`; }).join('')}</svg>`;
const roman = n =>['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'][n] || String(n);

const UI = {
  sel: { u: 0, m: 0, ship: 'if50', tier: 0, hv: 'ships' },
  cur: 's-home',

  // sélectionne la mission ouverte la plus avancée (démarrage, import de sauvegarde)
  selLatest() {
    let u = 0; for (let i = 0; i < WORLDS.length; i++) if (Store.worldOpen(i)) u = i;
    let m = 0; for (let i = 0; i < 5; i++) if (Store.missionOpen(u, i)) m = i;
    Object.assign(this.sel, { u, m, ship: Store.d.ship });
    document.documentElement.style.setProperty('--world', WORLDS[u].bgc);
  },
  init() {
    Store.load(); SFX.setVol(Store.d.set.vol); this.applyA11y();
    I18N.lang = LANG[Store.d.set.lang] ? Store.d.set.lang : 'fr'; I18N.hydrate(); I18N.apply();
    Art.setDPR(Math.min(window.devicePixelRatio || 1, 2));
    this.selLatest();

    $$('#tabbar button').forEach(b => b.addEventListener('click', () => {
      SFX.init();
      if (b.dataset.go === 's-inf' && !Store.infOpen()) { SFX.play('deny'); this.toast(tx('inf.locked')); return; }
      SFX.play('tap'); this.go(b.dataset.go);
    }));
    $('#launch').addEventListener('click', () => this.launch());
    $('#craftBtn').addEventListener('click', () => { SFX.init(); this.craftNext(); });
    $('#infGo').addEventListener('click', () => this.launchInf());
    $('#shipAct').addEventListener('click', () => this.shipAction());
    $('#shipPrev').addEventListener('click', () => this.shipStep(-1)); $('#shipNext').addEventListener('click', () => this.shipStep(1));
    $('#pauseBtn').addEventListener('click', () => { SFX.play('tap'); Game.pause(true); });
    for (const [id, fn] of [['#ondeBtn', () => Game.fireOnde()], ['#ultBtn', () => Game.fireUlt()]]) $(id).addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
    $('#scrim').addEventListener('click', () => { if (Game.state === 'paused') Game.pause(false); });
    $('#briefNext').addEventListener('click', () => this.briefStep());
    $('#briefSkip').addEventListener('click', () => this.briefEnd());
    this.bindSettings(); this.dialInit(); this.tapRescue();
    addEventListener('resize', () => { this.sizeHeroes(); this.segThumb('#hangSeg'); this.segThumb('#tierSeg'); });
    addEventListener('keydown', e => this.onKey(e));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { this.segThumb('#hangSeg'); this.segThumb('#tierSeg'); });
    Game.init();
    this.renderInfTiers(); this.renderHome(); this.refresh();
    requestAnimationFrame(() => this.sizeHeroes());
    requestAnimationFrame(t => this.heroLoop(t));
    if (!Store.d.seen.flashAsk) this.flashAsk(() => this.firstRun());
  },
  // sécurité photosensible (retours n° 3) : au premier lancement, avant tout éclair, on propose de réduire les flashs
  // tout premier lancement (retours n° 3) : ni accueil ni briefing, l'IF-50 décolle tout de suite sur la mission 01-1
  firstRun() {
    if (Store.d.done[0] || Store.d.seen.first) return;
    Store.d.seen.first = true; Store.d.seen.b0 = true; Store.save(); this.play({ mode: 'mission', u: 0, m: 0 });
  },
  flashAsk(then) {
    this.sheet(`<div class="sh-head c"><small>${tx('flashAsk.over')}</small><h2>${tx('flashAsk.title')}</h2></div><p class="quote">${tx('flashAsk.body')}</p><div class="btns"><button class="pill primary" id="faNo">${tx('flashAsk.normal')}</button><button class="pill" id="faYes">${tx('flashAsk.calm')}</button></div>`);
    const done = calm => { SFX.init(); SFX.play('tap'); Store.d.set.calm = calm || Store.d.set.calm; Store.d.seen.flashAsk = true; Store.save(); const el = $('#setCalm'); if (el) el.checked = !!Store.d.set.calm; this.applyA11y(); this.hideSheet(); if (then) then(); };
    $('#faNo').onclick = () => done(false); $('#faYes').onclick = () => done(true);
  },

  // toucher rattrapé (retours n° 2 : « il faut appuyer plusieurs fois ») : un bouton enfoncé s'abaisse de quelques pixels
  // (:active) et un doigt posé sur son bord se retrouvait dehors au relâchement : le navigateur perdait le clic.
  // Doigt relevé près de son point d'appui (≤ 14 px, ≤ 0,8 s) mais hors du bouton, sans clic natif : on le donne.
  tapRescue() {
    const SEL = 'button, [role=button], .mis, .ut, .tile, .sc, .ak, label.sw';
    let d = null;
    addEventListener('click', e => { this.lastClk = { el: e.target, t: performance.now() }; }, true);
    addEventListener('pointerdown', e => { const b = e.target.closest && e.target.closest(SEL); d = b && !b.disabled && b.id !== 'ondeBtn' && b.id !== 'ultBtn' ? { b, x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId } : null; }, true);
    addEventListener('pointercancel', () => { d = null; }, true);
    addEventListener('pointerup', e => {
      const o = d; d = null;
      if (!o || e.pointerId !== o.id || Math.hypot(e.clientX - o.x, e.clientY - o.y) > 14 || performance.now() - o.t > 800) return;
      const h = document.elementFromPoint(e.clientX, e.clientY);
      if (h && (h === o.b || o.b.contains(h))) return;
      this.rescueP = o; setTimeout(() => this.rescueRun(o), 60);
    }, true);
  },
  // clic rattrapé, sauf si le navigateur l'a livré entre-temps (jamais deux fois) ; le smoke l'appelle sans attendre
  rescueRun(o) {
    if (!o || o !== this.rescueP) return; this.rescueP = null; const L = this.lastClk;
    if (!o.b.isConnected || o.b.disabled || (L && L.t >= o.t && (L.el === o.b || o.b.contains(L.el)))) return;
    this.rescued = (this.rescued || 0) + 1; o.b.click();
  },
  /* ---------- navigation ---------- */
  go(id) {
    this.cur = id;
    $$('.screen').forEach(s => s.classList.toggle('on', s.id === id));
    $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.go === id));
    if (id === 's-home') this.renderHome();
    if (id === 's-hangar') this.renderHangar();
    if (id === 's-inf') this.renderInf();
    if (id === 's-profile') { this.renderProfile(); Dev.render(); }
    this.refresh();
    requestAnimationFrame(() => { this.sizeHeroes(); this.segThumb('#hangSeg'); this.segThumb('#tierSeg'); });
  },
  refresh() {
    const c = fmt(Store.d.credits), n = Store.d.stars.reduce((a, b) => a + b, 0);
    const io = Store.infOpen(), ib = $('#tabbar button[data-go="s-inf"]'); ib.classList.toggle('lock', !io); ib.setAttribute('aria-disabled', String(!io));
    if (io && !Store.d.seen.infAnn && this.cur === 's-home' && !document.body.classList.contains('playing')) this.infAnnounce();
    for (const s of ['#homeCr', '#hangCr', '#infCr', '#profCr']) { $(s).textContent = c; $(s).setAttribute('aria-label', tx('home.creditsAria', { n: c })); }
    for (const s of ['#homeSt', '#hangSt', '#infSt', '#profSt']) { $(s).innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR_P}"/></svg>${n}`; $(s).setAttribute('aria-label', tx('home.starsAria', { n })); }
  },
  onKey(e) {
    if (this.br) { if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); this.briefStep(); } if (e.code === 'Escape') this.briefEnd(); return; }
    if (Game.running) return;
    if (this.cur === 's-home') {
      const open = WORLDS.map((_, i) => Store.worldOpen(i));
      if (e.code === 'ArrowRight') { for (let i = this.sel.u + 1; i < WORLDS.length; i++) if (open[i]) { this.selectWorld(i); break; } }
      if (e.code === 'ArrowLeft') { for (let i = this.sel.u - 1; i >= 0; i--) if (open[i]) { this.selectWorld(i); break; } }
      if (e.code === 'Enter') this.launch();
    }
  },

  /* ---------- missions ---------- */
  renderHome() {
    const u = this.sel.u, ch = $('#chips'); ch.innerHTML = '';
    WORLDS.forEach((w, i) => {
      const open = Store.worldOpen(i), b = document.createElement('button');
      b.className = 'chip' + (i === u ? ' on' : '') + (open ? '' : ' lock');
      const ws = Store.d.stars.slice(i * 5, i * 5 + 5).reduce((a, c) => a + c, 0); if (Store.d.done[i * 5 + 4]) b.classList.add('clear');
      b.innerHTML = `<canvas aria-hidden="true"></canvas><b>${pad2(i + 1)}</b>` + (open ? `<i class="pc" style="width:${Math.round(ws / 15 * 100)}%"></i>` : svgIcon(LOCK_P));
      b.setAttribute('aria-label', tx(open ? 'home.freqOpen' : 'home.freqLocked', { n: pad2(i + 1), name: w.name }));
      b.addEventListener('click', () => { SFX.init(); if (!open) { SFX.play('deny'); this.toast(tx('home.lockedToast', { n: pad2(i) })); return; } SFX.play('tap'); this.selectWorld(i); });
      ch.appendChild(b); this.worldThumb(b.querySelector('canvas'), i);
    });
    this.renderWorldInfo(); this.renderMissions(); this.renderGoal();
  },
  // vignette d'univers : le décor du jeu réduit (dessiné une fois, à la taille de la vignette)
  worldThumb(cv, u) {
    const tw = 72, th = 56, dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = tw * dpr; cv.height = th * dpr;
    const c = cv.getContext('2d'), s = tw / W; c.setTransform(dpr * s, 0, 0, dpr * s, 0, -dpr * (H * s - th) * 0.45);
    const Wd = WORLDS[u];
    try { BG.still(c, Wd); Wd.bgDyn(c, 1.5, null); } catch (e) { /* décor animé facultatif */ }
    // l'engin emblématique de l'univers (le plus gros ennemi) + liseré couleur de l'univers
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 0, tw, th);
    const spr = Wd.enemies[2] || Wd.enemies[0], D = Art.DEF[spr];
    if (D) { const box = 40, w = D.h > D.w ? box * D.w / D.h : box; Art.draw(c, spr, tw * 0.58, th * 0.46, w, D.orient === 'side' ? 0 : 0.35); }
    c.fillStyle = Wd.accent || '#BFD9F5'; c.fillRect(0, th - 4, tw, 4);
  },
  renderWorldInfo() {
    const u = this.sel.u, Wd = WORLDS[u], stars = Store.d.stars.slice(u * 5, u * 5 + 5).reduce((a, b) => a + b, 0);
    $('#wOver').textContent = tx('home.freq', { n: pad2(u + 1) }) + ' · ' + Wd.label;
    $('#wName').textContent = Wd.name + (Wd.year ? ', ' + Wd.year : '');
    $('#wMeta').textContent = tx('home.starsCount', { n: stars }) + ' · ' + tx('home.complete', { n: Math.round(Store.d.stars.reduce((a, b) => a + b, 0) / (NMIS * 3) * 100) });
    this.renderCraft();
  },
  // engin de la mission choisie : imposé (mission 1, véhicule d'époque) ou vaisseau du hangar, qu'un appui fait changer
  renderCraft() {
    const b = $('#craftBtn'); if (!b) return;
    const cf = craftFor('mission', this.sel.u, this.sel.m, Store.d.ship), free = !cf.imposed, own = Store.d.owned.filter(id => CHASSIS[id]);
    const name = cf.imposed === 'first' ? CHASSIS.if50.name : cf.veh ? tx('vehN.' + cf.veh) : cf.era ? CHASSIS[cf.era].name : CHASSIS[cf.ship].name;
    b.innerHTML = `<small>${tx(cf.imposed === 'first' ? 'craft.first' : cf.imposed ? 'craft.era' : 'craft.yours')}</small><b>${name}</b>` + (free && own.length > 1 ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9H18L14 5M20 15H6L10 19"/></svg>' : '');
    b.disabled = !free || own.length < 2; b.classList.toggle('era', !free);
    b.setAttribute('aria-label', tx(free ? 'craft.aria' : 'craft.ariaEra', { name }));
  },
  craftNext() {
    const own = CHASSIS_ORDER.filter(id => Store.d.owned.includes(id)); if (own.length < 2) return;
    Store.d.ship = own[(own.indexOf(Store.d.ship) + 1) % own.length]; this.sel.ship = Store.d.ship; Store.save(); SFX.play('tap'); this.renderCraft();
  },
  renderMissions() {
    const u = this.sel.u, box = $('#missions'); box.innerHTML = '';
    for (let m = 0; m < 5; m++) {
      const open = Store.missionOpen(u, m), s = Store.d.stars[u * 5 + m], b = document.createElement('button');
      b.className = 'mis' + (m === this.sel.m ? ' on' : '') + (open ? '' : ' lock');
      b.innerHTML = (m === 4 ? `<svg class="boss" viewBox="0 0 24 24"><path d="${BOSS_P}"/></svg>` : `<b>${m + 1}</b>`) + this.starsHtml(s, Store.d.perf[u * 5 + m]) + (open ? '' : `<svg class="lk" viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 5.5V4a2.5 2.5 0 0 1 5 0v1.5"/><rect x="2" y="5.5" width="8" height="5.5" rx="1"/></svg>`);
      b.setAttribute('aria-label', tx((m === 4 ? 'home.bossAria' : 'home.misAria') + (open ? '' : 'Locked'), { n: m + 1, s }) + (Store.d.perf[u * 5 + m] ? tx('home.perfAria') : ''));
      b.addEventListener('click', () => { SFX.init(); if (!open) { SFX.play('deny'); return; } SFX.play('tap'); this.sel.m = m; this.renderMissions(); });
      box.appendChild(b);
    }
    const ok = Store.missionOpen(u, this.sel.m), L = $('#launch');
    L.disabled = !ok; L.innerHTML = tx('home.play') + '<small>' + (this.sel.m === 4 ? tx('home.playBoss') : tx('home.playMis', { n: this.sel.m + 1 })) + '</small>';
    L.setAttribute('aria-label', this.sel.m === 4 ? tx('home.launchBoss') : tx('home.launchMis', { n: this.sel.m + 1 }));
    this.renderCraft();
  },
  starsHtml(n, perf) { let h = `<span class="stars${perf ? ' perf' : ''}">`; for (let i = 0; i < 3; i++) h += `<svg viewBox="0 0 24 24"><path class="${i < n ? 'f' : 'e'}" d="${STAR_P}"/></svg>`; if (perf) h += '<svg class="pf" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 0L7.3 4.7L12 6L7.3 7.3L6 12L4.7 7.3L0 6L4.7 4.7Z"/></svg>'; return h + '</span>'; },
  selectWorld(i) {
    if (i === this.sel.u) return;
    this.heroFade = { from: this.sel.u, t: 0 }; this.sel.u = i;
    let m = 0; for (let k = 0; k < 5; k++) if (Store.missionOpen(i, k)) m = k; this.sel.m = m;
    $$('#chips .chip').forEach((c, k) => c.classList.toggle('on', k === i));
    const h = $('#wName'); h.style.opacity = 0; setTimeout(() => { this.renderWorldInfo(); h.style.opacity = 1; }, 170);
    this.renderMissions(); if (this.dial) this.dial.to = i;
    document.documentElement.style.setProperty('--world', WORLDS[i].bgc);
    const chip = $$('#chips .chip')[i]; if (chip && chip.scrollIntoView) chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  },
  launch() {
    SFX.init(); const { u, m } = this.sel; if (!Store.missionOpen(u, m)) return;
    SFX.play('confirm');
    if (m === 0 && !Store.d.seen['b' + u]) { this.brief(u, () => this.play({ mode: 'mission', u, m })); return; }
    this.play({ mode: 'mission', u, m });
  },
  play(cfg) {
    const mi = cfg.mode === 'mission' ? cfg.u * 5 + cfg.m : -1;
    if (mi >= 0 && !cfg.help && (Store.d.fails[mi] || 0) >= CONFIG.help.after) { this.helpAsk(cfg, mi); return; }
    this.hideSheet();
    document.body.classList.add('playing');
    $('#s-game').classList.add('on');
    this.lastCfg = cfg;
    requestAnimationFrame(() => Game.start(cfg));
  },
  // après 2 défaites de suite : un avantage gratuit pour la prochaine tentative (bouclier +1 ou arme +1), au choix, sans achat
  helpAsk(cfg, mi) {
    const ic = p => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${p}"/></svg>`;
    this.sheet(`<div class="sh-head c"><small>${tx('help.over', { n: Store.d.fails[mi] })}</small><h2 class="rib">${tx('help.title')}</h2><p class="sub">${tx('help.sub')}</p></div>`
      + `<div class="help-opts"><button class="pill primary" data-h="shield">${ic(ICONS.hull)}${tx('help.shield')}</button><button class="pill primary" data-h="arm">${ic(ICONS.wpn)}${tx('help.arm')}</button></div>`
      + `<div class="btns"><button class="pill ghost" data-h="none">${tx('help.none')}</button></div>`);
    $$('#sheetBody [data-h]').forEach(b => b.addEventListener('click', () => { SFX.init(); SFX.play(b.dataset.h === 'none' ? 'tap' : 'confirm'); this.play(Object.assign({}, cfg, { help: b.dataset.h })); }));
  },
  exitGame() {
    Game.quit(); document.body.classList.remove('playing'); $('#s-game').classList.remove('on'); this.hideSheet();
    this.go(this.cur || 's-home');
  },

  /* ---------- molette radio de l'accueil (idée du bloc 4) : glisser pour accorder, toucher une station ---------- */
  dialInit() {
    const cv = $('#homeDial'); if (!cv) return;
    if (!CONFIG.features.radioHome) { cv.remove(); return; }
    const N = WORLDS.length, D = this.dial = { pos: this.sel.u, to: this.sel.u, drag: null, last: this.sel.u };
    const at = x => { const r = cv.getBoundingClientRect(); return clamp((x - r.left) / r.width * N - 0.5, 0, N - 1); };
    cv.addEventListener('pointerdown', e => { SFX.init(); cv.setPointerCapture(e.pointerId); D.drag = { x: e.clientX, p0: D.pos, moved: false }; });
    cv.addEventListener('pointermove', e => {
      const G = D.drag; if (!G) return; if (Math.abs(e.clientX - G.x) > 5) G.moved = true; if (!G.moved) return;
      const r = cv.getBoundingClientRect(); D.pos = D.to = clamp(G.p0 + (e.clientX - G.x) / r.width * N, 0, N - 1);
      const k = Math.round(D.pos);
      if (Math.abs(D.pos - k) > 0.18) { if (performance.now() - (D.nT || 0) > 110) { D.nT = performance.now(); SFX.play('e_glitch'); } }
      else if (k !== D.last) { D.last = k; SFX.play('tap'); }
    });
    const up = e => { const G = D.drag; if (!G) return; D.drag = null; this.dialSnap(G.moved ? D.pos : at(e.clientX)); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  },
  // se cale sur la station ouverte la plus proche (une station fermée : refus, l'aiguille revient)
  dialSnap(pos) {
    const D = this.dial, k = Math.round(pos);
    if (!Store.worldOpen(k)) { SFX.play('deny'); this.toast(tx('home.lockedToast', { n: pad2(k) })); D.to = this.sel.u; return; }
    D.to = k; D.last = k; if (k !== this.sel.u) { SFX.play('tap'); this.selectWorld(k); }
  },
  dialDraw() {
    const D = this.dial, cv = $('#homeDial'); if (!D || !cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    if (!D.drag) D.pos += (D.to - D.pos) * 0.22;
    const c = cv.getContext('2d'), N = WORLDS.length, sx = k => (k + 0.5) / N * w, off = Math.abs(D.pos - Math.round(D.pos));
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    // cadran : plaque, graduations, numéros des stations (fermées en sombre)
    c.fillStyle = '#14171C'; c.fillRect(0, 0, w, h - 4); c.strokeStyle = '#000'; c.lineWidth = 3; c.strokeRect(1.5, 1.5, w - 3, h - 7);
    c.fillStyle = '#000'; c.fillRect(0, h - 4, w, 4);
    c.strokeStyle = 'rgba(232,236,242,.28)'; c.lineWidth = 1; c.beginPath();
    for (let x = 6; x < w - 4; x += 6) { const big = Math.round((x - 6) / 6) % 5 === 0; c.moveTo(x, h - 12); c.lineTo(x, big ? h - 21 : h - 16); } c.stroke();
    c.font = `700 ${Math.round(Math.min(14, w / N * 0.42) * Game.tsK())}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    const on = Math.round(D.pos);
    for (let k = 0; k < N; k++) { const open = Store.worldOpen(k); c.fillStyle = k === on && off < 0.2 ? '#F2D58A' : open ? 'rgba(232,236,242,.7)' : 'rgba(232,236,242,.22)'; c.fillText(pad2(k + 1), sx(k), 16); }
    // parasites entre deux stations
    if (off > 0.12) { const r = seeded(Math.floor(performance.now() / 60)); c.fillStyle = `rgba(232,236,242,${off * 0.7})`; for (let i = 0; i < 46; i++) c.fillRect(r() * w, 4 + r() * (h - 12), 2, 1); }
    // aiguille rouge
    const nx = sx(D.pos); c.fillStyle = '#000'; c.fillRect(nx - 3, 3, 6, h - 9); c.fillStyle = '#E8574A'; c.fillRect(nx - 1.5, 4, 3, h - 11);
    c.textBaseline = 'alphabetic';
  },

  /* ---------- briefing ---------- */
  brief(u, done) {
    const Wd = WORLDS[u]; this.br = { lines: Wd.story.pre, i: -1, done, u, speak: 0, who: 'B' };
    document.body.classList.add('playing'); $('#s-brief').classList.add('on'); $('#s-brief').classList.toggle('silent', !!Wd.silent);
    $('#briefDots').innerHTML = Wd.story.pre.map(() => '<i></i>').join('');
    this.briefStep(); this.briefAnim();
  },
  briefStep() {
    const b = this.br; if (!b) return; SFX.init(); SFX.play('soft'); b.i++;
    if (b.i >= b.lines.length) return this.briefEnd();
    const [who, txt] = b.lines[b.i], p = $('#briefLine');
    p.style.opacity = 0;
    setTimeout(() => { $('#briefWho').textContent = tx('brief.' + who); p.textContent = txt; p.style.opacity = 1; }, 150);
    $$('#briefDots i').forEach((d, k) => d.classList.toggle('on', k === b.i));
    b.speak = 1.3; b.who = who;
    $('#briefNext').textContent = b.i === b.lines.length - 1 ? tx('brief.jump', { name: WORLDS[b.u].name }) : tx('brief.next');
  },
  briefEnd() {
    const b = this.br; if (!b) return; this.br = null;
    Store.d.seen['b' + b.u] = true; Store.save();
    $('#s-brief').classList.remove('on');
    b.done();
  },
  briefAnim() {
    const cv = $('#briefWave');
    const draw = t => {
      if (!this.br) return; requestAnimationFrame(draw);
      const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight; if (!w) return;
      if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
      const b = this.br; b.speak = Math.max(0, b.speak - 0.012);
      const amp = 4 + b.speak * 30;
      c.strokeStyle = b.who === 'B' ? '#E8A15A' : '#F2F2F4'; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath();
      for (let x = 0; x <= w; x += 3) { const u = x / w, env = Math.sin(u * Math.PI); const y = h / 2 + Math.sin(u * 34 + t / 80) * amp * env * (0.55 + 0.45 * Math.sin(u * 9 + t / 260)); x ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
    };
    requestAnimationFrame(draw);
  },

  /* ---------- hangar ---------- */
  renderHangar() { this.hangView(this.sel.hv, true); },
  // vaisseaux et améliorations sur une même page (façon Archero) ; v garde la compatibilité (smoke, menu dev)
  hangView(v, silent) {
    this.sel.hv = 'ships'; if (!silent) SFX.play('tap');
    this.renderShips(); this.renderUpgrades(); requestAnimationFrame(() => this.sizeHeroes());
  },
  shipStep(d) {
    const i = CHASSIS_ORDER.indexOf(this.sel.ship), n = CHASSIS_ORDER.length;
    this.sel.ship = CHASSIS_ORDER[(i + d + n) % n]; SFX.play('tap'); this.shipSwap = { t: 0, d }; this.renderShips();
    const th = $$('#shipList .thumb')[CHASSIS_ORDER.indexOf(this.sel.ship)]; if (th && th.scrollIntoView) th.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  },
  segThumb(sel) { const s = $(sel); if (!s) return; const on = s.querySelector('button.on'), th = s.querySelector('i'); if (!on || !th || !on.offsetWidth) return; th.style.left = on.offsetLeft + 'px'; th.style.width = on.offsetWidth + 'px'; },
  renderShips() {
    const st = Store.d, list = $('#shipList'); list.innerHTML = '';
    for (const id of CHASSIS_ORDER) {
      const C = CHASSIS[id], owned = st.owned.includes(id), b = document.createElement('button');
      b.className = 'thumb' + (id === this.sel.ship ? ' on' : '');
      const status = st.ship === id ? tx('hangar.equipped') : owned ? tx('hangar.owned') : C.price < 0 ? tx('hangar.endCampaign') : tx('hangar.price', { n: fmt(C.price) });
      b.innerHTML = `<canvas width="196" height="132" aria-hidden="true"></canvas><b>${C.name}</b><span>${status}</span>`;
      b.addEventListener('click', () => { SFX.play('tap'); this.shipSwap = { t: 0, d: 0 }; this.sel.ship = id; this.renderShips(); });
      list.appendChild(b);
      const c = b.querySelector('canvas').getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0);
      const D = Art.DEF[C.spr], px = Math.min(88, 56 * D.w / D.h);
      Art.draw(c, C.spr, 49, 34, px, 0, false, !owned && C.price < 0 ? 0.25 : 1);
    }
    const id = this.sel.ship, C = CHASSIS[id], owned = st.owned.includes(id);
    $('#shipName').textContent = C.name; $('#shipOrigin').textContent = C.origin;
    // barres à 10 crans (shipBars, js/data.js) : le chiffre affiché = le nombre de crans pleins
    $('#shipStats').innerHTML = shipBars(C).map(({ k, label, n }) => `<div class="stat ${k}"><span>${tx(label)}</span><div>${Array.from({ length: 10 }, (_, i) => `<i class="${i < n ? 'f' : ''}"></i>`).join('')}</div><b>${n}</b></div>`).join('');
    $('#shipPassive').innerHTML = `<b>${tx('hangar.passive')}</b> ${C.passive}`;
    $('#shipUlt').innerHTML = tx('hangar.ult', { name: ULTS[C.ult].name });
    const a = $('#shipAct');
    if (st.ship === id) { a.textContent = tx('hangar.equipped'); a.disabled = true; }
    else if (owned) { a.textContent = tx('hangar.equip'); a.disabled = false; }
    else if (C.price < 0) { a.textContent = tx('hangar.lockedOmega'); a.disabled = true; }
    else { a.textContent = tx('hangar.buy', { n: fmt(C.price) }); a.disabled = st.credits < C.price; }
    this.renderUpgrades();
  },
  shipAction() {
    const st = Store.d, id = this.sel.ship, C = CHASSIS[id];
    if (st.owned.includes(id)) { st.ship = id; SFX.play('confirm'); }
    else if (C.price >= 0 && st.credits >= C.price) { st.credits -= C.price; st.owned.push(id); st.ship = id; SFX.play('buy'); this.toast(tx('hangar.joined', { name: C.name })); }
    else { SFX.play('deny'); return; }
    Store.save(); this.refresh(); this.renderShips();
  },
  // améliorations en tuiles : dessin au pinceau, nom, crans de niveau, étiquette de prix ; toucher la tuile = acheter
  // retours n° 3 : coque, canon, cadence, onde et ultime propres au vaisseau sélectionné ; aimant et prime au compte
  // hangar ouvert sur une amélioration à acheter tout de suite (après la 1re victoire) : Puissance si possible, sinon la moins chère
  hangarFocus() {
    this.sel.ship = Store.d.ship; this.go('s-hangar');
    const list = UPGRADES.filter(U => U.ship), can = U => Store.upg(U.id) < U.prices.length && Store.d.credits >= U.prices[Store.upg(U.id)];
    const U0 = list.find(U => U.id === 'cannon' && can(U)) || list.filter(can).sort((a, b) => a.prices[Store.upg(a.id)] - b.prices[Store.upg(b.id)])[0];
    this.focusUpg = U0 ? U0.id : null; this.renderUpgrades();
    const el = this.focusUpg && $(`#hangUpg .ut[data-u="${this.focusUpg}"]`);
    if (el) requestAnimationFrame(() => requestAnimationFrame(() => $('#upgTip').scrollIntoView({ block: 'start' })));
  },
  renderUpgrades() {
    const id = this.sel.ship, C = CHASSIS[id], owned = Store.d.owned.includes(id);
    $('#hangUpgH').textContent = tx('hangar.upgShip', { name: C.name });
    this.upgTiles($('#hangUpg'), UPGRADES.filter(U => U.ship), id, owned);
    const F = this.focusUpg && UPGRADES.find(U => U.id === this.focusUpg), tip = $('#upgTip');
    tip.classList.toggle('hidden', !F); tip.textContent = F ? tx('hangar.firstUpg', { name: F.name }) : '';
    this.upgTiles($('#hangAcc'), UPGRADES.filter(U => !U.ship), null, true);
  },
  upgTiles(box, list, ship, can) {
    const st = Store.d; box.innerHTML = '';
    list.forEach((U, k) => {
      const lv = Store.upg(U.id, ship || undefined), max = U.prices.length, price = U.prices[lv], full = lv >= max, b = document.createElement('button');
      b.className = 'ut' + (!can ? ' lock' : full ? ' max' : st.credits < price ? ' poor' : '');
      b.dataset.u = U.id; if (ship && this.focusUpg === U.id && can && !full) b.classList.add('focus');
      b.setAttribute('aria-label', tx('hangar.upgAria', { name: U.name, lv, max, desc: U.desc }) + (can ? '' : ' · ' + tx('hangar.needShip')));
      b.innerHTML = (Icons.ART[U.icon] ? `<canvas class="ic" data-ic="${U.icon}"></canvas>` : '<span class="ic cr"></span>') + `<b>${U.name}</b><small>${U.desc}</small><span class="pp">${Array.from({ length: max }, (_, i) => `<i class="${i < lv ? 'f' : ''}"></i>`).join('')}</span><span class="pr">${!can ? tx('hangar.lockShort') : full ? tx('hangar.max') : fmt(price)}</span>`;
      b.addEventListener('click', () => {
        if (full) return;
        if (!can) { SFX.play('deny'); this.toast(tx('hangar.needShip')); return; }
        if (Store.d.credits < price) { SFX.play('deny'); b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); return; }
        if (this.focusUpg === U.id) this.focusUpg = null;
        Store.d.credits -= price; Store.setUpg(U.id, lv + 1, ship || undefined); Store.save(); SFX.play('buy'); this.refresh(); this.renderUpgrades();
        const nb = box.children[k]; if (nb) nb.classList.add('got');
      });
      box.appendChild(b);
    });
    box.querySelectorAll('canvas[data-ic]').forEach(cv => Icons.paint(cv, cv.dataset.ic, 40));
  },

  /* ---------- infini ---------- */
  // paliers en grosses cartes : emblème à chevrons (1 à 3), nom, règle, bouclier et multiplicateur, record et meilleure vague
  renderInfTiers() { this.renderInf(); },
  renderInf() {
    const box = $('#tierList'), S0 = computeStats(Store.d.ship), sh = S0.shield;
    if (!Store.tierOpen(this.sel.tier)) this.sel.tier = 0;
    box.innerHTML = TIERS.map((T, i) => {
      const best = Store.d.best['t' + i] || 0, wv = Store.d.best['w' + i] || 0, sv = T.hp <= -99 ? 0 : Math.max(0, sh + T.hp);
      if (!Store.tierOpen(i)) return `<button class="tc lock" data-i="${i}" style="--tc:${T.col}" aria-disabled="true" aria-label="${T.name} · ${tx('inf.tierLock', { n: TIER_OPEN, name: TIERS[i - 1].name })}"><span class="em">${chevrons(i + 1, T.col)}</span><span class="tx"><b class="nm">${T.name}</b><span class="ds">${tx('inf.tierLock', { n: TIER_OPEN, name: TIERS[i - 1].name })}</span></span><span class="rec lk"></span></button>`;
      return `<button class="tc${i === this.sel.tier ? ' on' : ''}" role="radio" aria-checked="${i === this.sel.tier}" data-i="${i}" style="--tc:${T.col}" aria-label="${tx('inf.tierAria', { name: T.name, desc: T.desc, rec: fmt(best) })}"><span class="em">${chevrons(i + 1, T.col)}</span><span class="tx"><b class="nm">${T.name}</b><span class="ds">${T.desc}</span><span class="mods"><i>${sv ? tx('inf.shieldN', { n: sv }) : tx('inf.noShield')}</i><i>${tx('inf.mul', { n: String(T.mul).replace('.', ',') })}</i></span></span><span class="rec"><small>${tx('inf.recordShort')}</small><b>${best ? fmt(best) : '—'}</b>${wv ? `<small>${tx('inf.waveShort', { n: wv })}</small>` : ''}</span></button>`;
    }).join('');
    box.querySelectorAll('.tc').forEach(b => b.addEventListener('click', () => {
      if (b.classList.contains('lock')) { SFX.play('deny'); this.toast(tx('inf.tierLock', { n: TIER_OPEN, name: TIERS[+b.dataset.i - 1].name })); return; }
      SFX.play('tap'); this.sel.tier = +b.dataset.i; this.renderInf();
    }));
    $('#infGo').innerHTML = tx('common.launch') + `<small>${TIERS[this.sel.tier].name}</small>`;
    const pk = (Store.d.best['p' + this.sel.tier] || 0) + 1; $('#infPal').textContent = tx('pal.next', { n: palName(pk), w: pk * PAL_EVERY, c: fmt(palCr(pk, S0.cred)) });
  },
  // annonce du mode Infini (une fois, quand la fréquence 02 est finie)
  infAnnounce() {
    Store.d.seen.infAnn = true; Store.save();
    setTimeout(() => {
      this.sheet(`<div class="sh-head c"><small>${tx('infAnn.over')}</small><h2>${tx('infAnn.title')}</h2></div><p class="quote">${tx('infAnn.body')}</p><div class="btns"><button class="pill ghost" id="iaLater">${tx('infAnn.later')}</button><button class="pill primary" id="iaGo">${tx('infAnn.go')}</button></div>`);
      $('#iaLater').onclick = () => { SFX.play('tap'); this.hideSheet(); };
      $('#iaGo').onclick = () => { SFX.play('confirm'); this.hideSheet(); this.go('s-inf'); };
    }, 400);
  },
  launchInf() { SFX.init(); SFX.play('confirm'); this.play({ mode: 'inf', tier: this.sel.tier }); },

  /* ---------- profil ---------- */
  renderProfile() {
    const s = Store.d.stats, stars = Store.d.stars.reduce((a, b) => a + b, 0), h = Math.floor(s.time / 3600), mn = Math.floor((s.time % 3600) / 60);
    // tuiles de chiffres : icône, gros nombre, intitulé
    const P = ['M4 20L12 4L20 20Z', STAR_P, 'M5 12H19M12 5V19M7 7L17 17M17 7L7 17', 'M4 18L10 6L16 18L20 10', ICONS.graze, 'M12 7V12L15 14M12 3A9 9 0 1 0 12.01 3'];
    const cards = [[tx('stats.missions'), s.missions], [tx('stats.stars'), tx('stats.starsVal', { n: stars, max: NMIS * 3 })], [tx('stats.kills'), fmt(s.kills)], [tx('stats.combo'), s.combo], [tx('stats.grazes'), fmt(s.grazes)], [tx('stats.time'), h ? tx('time.hm', { h, m: pad2(mn) }) : tx('time.m', { m: mn })]];
    $('#statGrid').innerHTML = cards.map(([k, v], i) => `<div class="card pt">${svgIcon(P[i])}<b>${v}</b><small>${k}</small></div>`).join('');
    const R = Store.d.rank, need = rankNeed(R);
    $('#rankCard').innerHTML = `<b>${tx('rank.name', { n: R })}</b><span class="rbar"><i style="width:${Math.round(Store.d.pxp / need * 100)}%"></i></span><small>${tx('rank.next', { x: Store.d.pxp, t: need })}</small>`;
    const tr = $('#trophies'); tr.innerHTML = '';
    WORLDS.forEach((Wd, u) => {
      const won = Store.d.done[u * 5 + 4], el = document.createElement('div'); el.className = 'tro' + (won ? ' won' : '');
      el.innerHTML = `<canvas aria-hidden="true"></canvas><small>${won ? Wd.boss.name : tx('trophy.unknown')}</small>`; tr.appendChild(el);
      const cv = el.querySelector('canvas'), dpr = Math.min(window.devicePixelRatio || 1, 2), tw = 96, th = 60; cv.width = tw * dpr; cv.height = th * dpr;
      const c = cv.getContext('2d'); c.scale(dpr, dpr); const D = Art.DEF[Wd.boss.spr]; if (!D) return; const px = Math.min(tw * 0.92, th * 0.88 * D.w / D.h);
      if (won) Art.draw(c, Wd.boss.spr, tw / 2, th / 2, px); else Art.shadow(c, Wd.boss.spr, tw / 2, th / 2, px, 0, false, 1);
    });
    const ar = $('#archives'); ar.innerHTML = '';
    WORLDS.forEach((Wd, i) => {
      if (!Store.worldOpen(i)) return;
      const done = Store.d.done[i * 5 + 4], d = document.createElement('details'); d.className = 'arch';
      d.innerHTML = `<summary><b>${pad2(i + 1)}</b>${Wd.name}${Wd.year ? ', ' + Wd.year : ''}<small>${tx(done ? 'arch.done' : 'arch.ongoing')}</small></summary><p>${Wd.fact}</p>${done ? `<p class="q">${tx('quote', { t: Wd.story.post })}</p>` : ''}<p><button class="pill small ghost">${tx('arch.rebrief')}</button></p>`;
      d.querySelector('button').addEventListener('click', () => this.brief(i, () => document.body.classList.remove('playing')));
      ar.appendChild(d);
    });
  },
  bindSettings() {
    const S = Store.d.set, vol = $('#setVol');
    vol.value = S.vol; vol.addEventListener('input', () => { S.vol = +vol.value; SFX.init(); SFX.setVol(S.vol); SFX.play('tap'); Store.save(); });
    for (const [id, key] of [['#setAuto', 'auto'], ['#setVib', 'vib'], ['#setShake', 'shake'], ['#setFx', 'fx'], ['#setHudSk', 'hudSk'], ['#setCalm', 'calm']]) {
      const el = $(id); el.checked = !!S[key];
      el.addEventListener('change', () => { S[key] = el.checked; Store.save(); SFX.init(); SFX.play('tap'); if (this.hudCache) { this.hudCache.sk = null; if (Game.p) this.hud(Game); } this.applyA11y(); });
    }
    $$('#setTs button').forEach(b => b.addEventListener('click', () => { S.ts = +b.dataset.v; Store.save(); SFX.init(); SFX.play('tap'); this.applyA11y(); }));
    // sensibilité du doigt (CONFIG.move.sens) : déplacement du doigt × n
    $('#setSens').innerHTML = CONFIG.move.sens.map(v => `<button data-v="${v}" aria-label="${tx('set.sensAria', { n: String(v).replace('.', ',') })}">${tx('set.sensV', { n: String(v).replace('.', ',') })}</button>`).join('');
    $$('#setSens button').forEach(b => b.addEventListener('click', () => { S.sens = +b.dataset.v; Store.save(); SFX.init(); SFX.play('tap'); this.applyA11y(); }));
    this.applyA11y();
    $('#resetBtn').addEventListener('click', () => this.confirmReset());
    $('#expBtn').addEventListener('click', () => { SFX.init(); SFX.play('tap'); this.exportSave(); });
    $('#impBtn').addEventListener('click', () => { SFX.init(); SFX.play('tap'); this.importSave(); });
    $('#verLine').addEventListener('click', () => Dev.tap());
  },
  // accessibilité : taille du texte (--ts) et flashs réduits (classe calm)
  applyA11y() {
    const S = Store.d.set; document.documentElement.style.setProperty('--ts', S.ts || 1); document.body.classList.toggle('calm', !!S.calm);
    $$('#setTs button').forEach(b => b.classList.toggle('on', +b.dataset.v === (S.ts || 1)));
    $$('#setSens button').forEach(b => b.classList.toggle('on', +b.dataset.v === (S.sens || 1.3)));
  },
  confirmReset() {
    this.sheet(`<div class="sh-head"><small>${tx('reset.over')}</small><h2>${tx('reset.title')}</h2></div><p class="quote">${tx('reset.body')}</p><div class="btns"><button class="pill primary" id="rsNo">${tx('reset.cancel')}</button><button class="pill danger" style="width:100%" id="rsYes">${tx('reset.confirm')}</button></div>`);
    $('#rsNo').onclick = () => this.hideSheet();
    $('#rsYes').onclick = () => { Store.reset(); Object.assign(this.sel, { u: 0, m: 0, ship: 'if50' }); this.hideSheet(); this.refresh(); this.renderProfile(); this.toast(tx('reset.done')); };
  },

  // sauvegarde : code à copier (exporter) ou à coller (importer), voir Store.exportCode / Store.readCode
  exportSave() {
    const code = Store.exportCode();
    this.sheet(`<div class="sh-head"><small>${tx('save.over')}</small><h2>${tx('save.expTitle')}</h2></div><p class="quote">${tx('save.expBody')}</p><textarea class="code-box" id="svCode" readonly spellcheck="false" aria-label="${tx('save.codeAria')}"></textarea><div class="btns"><button class="pill primary" id="svCopy">${tx('save.copy')}</button><button class="pill" id="svClose">${tx('save.close')}</button></div>`);
    const ta = $('#svCode'); ta.value = code;
    ta.onfocus = () => ta.select();
    $('#svClose').onclick = () => this.hideSheet();
    $('#svCopy').onclick = () => {
      const fallback = () => { ta.focus(); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; } this.toast(tx(ok ? 'save.copied' : 'save.copyFail')); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(() => { SFX.play('confirm'); this.toast(tx('save.copied')); }, fallback);
      else fallback();
    };
  },
  importSave() {
    this.sheet(`<div class="sh-head"><small>${tx('save.over')}</small><h2>${tx('save.impTitle')}</h2></div><p class="quote">${tx('save.impBody')}</p><textarea class="code-box" id="svCode" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="${tx('save.codeAria')}"></textarea><p class="code-err" id="svErr" role="alert"></p><div class="btns"><button class="pill primary" id="svRead">${tx('save.read')}</button><button class="pill" id="svNo">${tx('save.cancel')}</button></div>`);
    $('#svNo').onclick = () => this.hideSheet();
    $('#svRead').onclick = () => {
      const code = $('#svCode').value, r = Store.readCode(code);
      if (r.err) { SFX.play('deny'); $('#svErr').textContent = tx({ bad: 'save.errBad', sum: 'save.errSum', newer: 'save.errNewer' }[r.err]); return; }
      const d = r.d, m = d.done.filter(Boolean).length, s = d.stars.reduce((a, b) => a + b, 0);
      this.sheet(`<div class="sh-head"><small>${tx('save.over')}</small><h2>${tx('save.okTitle')}</h2></div><p class="quote">${tx('save.okBody', { m, s, c: fmt(d.credits), v: d.owned.length })}</p><div class="btns"><button class="pill primary" id="svNo">${tx('save.cancel')}</button><button class="pill danger" style="width:100%" id="svYes">${tx('save.replace')}</button></div>`);
      $('#svNo').onclick = () => this.hideSheet();
      $('#svYes').onclick = () => {
        if (Store.importCode(code)) return;
        this.selLatest();
        SFX.play('buy'); this.hideSheet(); this.refresh(); this.renderProfile(); this.toast(tx('save.done'));
      };
    };
  },

  where(u, m) { return tx(m === 4 ? 'game.whereBoss' : 'game.where', { f: pad2(u + 1), m: m + 1 }); },

  /* ---------- feuilles & messages ---------- */
  sheet(html) { this.homeSettings(); $('#sheetBody').innerHTML = html; $('#sheet').classList.add('on'); $('#scrim').classList.add('on'); },
  hideSheet() { this.homeSettings(); $('#sheet').classList.remove('on'); $('#scrim').classList.remove('on'); },
  // les réglages prêtés à la pause reviennent dans le Profil (mêmes éléments, mêmes écouteurs : rien n'est dupliqué)
  homeSettings() { const core = $('#setCore'), home = $('#setHome'); if (core && home && core.parentNode !== home) home.appendChild(core); },
  // pause → réglages : tous ceux du Profil (tir auto, vibrations, secousses, effets, compétences, flashs, volume, sensibilité, taille du texte)
  pauseSettings() {
    this.sheet(`<div class="sh-head c"><small>${tx('pause.title')}</small><h2 class="rib">${tx('profile.settings')}</h2></div><div id="pSetBox"></div><div class="btns"><button class="pill primary" id="pSetBack">${tx('common.back')}</button></div>`);
    $('#pSetBox').appendChild($('#setCore'));
    $('#pSetBack').onclick = () => { SFX.play('tap'); this.showPause(); };
  },
  toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(this.tT); this.tT = setTimeout(() => t.classList.remove('on'), 2300); },

  // reprise après la pause : les boutons de jeu s'estompent pendant l'attente et le compte à rebours
  resumeWait(on) { $('#hud').classList.toggle('resume', !!on || Game.state === 'resume'); if (on) $('#hud').setAttribute('aria-label', tx('resume.tap')); else $('#hud').removeAttribute('aria-label'); },

  /* ---------- jeu : HUD ---------- */
  gameStart() {
    this.hudCache = {}; this.bannerQ = []; this.bannerBusy = false; this.hintsShown = {}; $('#hud').classList.remove('resume');
    $('#hBoss').classList.add('hidden'); $('#banner').classList.remove('on'); $('#hint').classList.remove('on');
    // (tutoriel : dessiné en jeu par Game.drawTuto, une notion à la fois)
  },
  // petits rebonds du HUD (relancés sans attendre la fin du précédent)
  bump(sel, cls) { const el = $(sel); if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); },
  comboBump() { this.bump('#hCombo', 'pop'); },
  ondeBump() { const now = performance.now(); if (now - (this.obT || 0) < 160) return; this.obT = now; this.bump('#ondeBtn', 'gz'); },
  // bouton de pouvoir mis en avant par le tutoriel ('onde', 'ult' ou null)
  tutoBtn(k) { for (const [id, n] of [['#ondeBtn', 'onde'], ['#ultBtn', 'ult']]) $(id).classList.toggle('tuto', k === n); },
  // boîte d'un bouton du HUD en coordonnées du jeu (centre x, haut)
  btnBox(sel) {
    const b = $(sel), cv = Game.c && Game.c.canvas; if (!b || !cv) return null;
    const r = b.getBoundingClientRect(), rc = cv.getBoundingClientRect(); if (!r.width || !rc.width) return null;
    const k = W / rc.width; return { cx: (r.left + r.width / 2 - rc.left) * k, top: (r.top - rc.top) * k };
  },
  placeHud(cw, ch) { const st = $('#stage'), h = $('#hud'); h.style.width = cw + 'px'; h.style.height = ch + 'px'; h.style.left = (st.clientWidth - cw) / 2 + 'px'; h.style.top = (st.clientHeight - ch) / 2 + 'px'; },
  // bas du HUD (px écran, depuis le haut du HUD) : limite haute du vaisseau (Game.hudTop)
  hudBottom() {
    const h = $('#hud'), r0 = h.getBoundingClientRect(); if (!r0.height) return 0;
    let b = 0; for (const s of ['.hud-top', '.hud-xp', '#hWeapon', '#hSkills']) { const r = $(s).getBoundingClientRect(); if (r.width > 0 && r.height > 0) b = Math.max(b, r.bottom - r0.top); }
    return b;
  },
  // le score rétrécit (en douceur) pour ne jamais toucher le numéro de vague centré
  fitScore() {
    const b = $('#hScore'), p = $('#hPill'), sc = b.parentElement, r0 = sc.getBoundingClientRect(); if (!r0.height) return;
    const old = b.style.getPropertyValue('--fit') || '1';
    b.style.transition = 'none'; b.style.setProperty('--fit', '1'); const w = b.getBoundingClientRect().width;
    const edge = p.style.visibility === 'hidden' ? $('#pauseBtn').getBoundingClientRect().left : p.getBoundingClientRect().left;
    const k = clamp((edge - r0.left - 10) / Math.max(1, w), 0.4, 1).toFixed(3);
    b.style.setProperty('--fit', old); void b.offsetWidth; b.style.transition = ''; b.style.setProperty('--fit', k);
  },
  worldTheme(Wd) { document.documentElement.style.setProperty('--world', Wd.bgc); document.body.classList.toggle('bw', !!Wd.bw); },
  hud(g) {
    if (!g.p) return;
    const C = this.hudCache || (this.hudCache = {});
    const set = (k, v, fn) => { if (C[k] !== v) { C[k] = v; fn(v); } };
    set('score', fmtBig(g.score), v => { $('#hScore').textContent = v; });
    set('combo', g.combo >= 5 ? g.combo : 0, v => { $('#hCombo').textContent = v ? tx('hud.combo', { n: v }) : ''; });
    const pill = g.boss ? g.boss.Bd.name : g.mode === 'inf' ? tx('hud.waveOf', { n: g.infWave || 1, t: Math.ceil((g.infWave || 1) / PAL_EVERY) * PAL_EVERY }) : g.waveIdx ? tx('hud.waveOf', { n: g.waveIdx, t: g.waveN }) : '';
    set('pill', pill, v => { const el = $('#hPill'); el.textContent = v; el.style.visibility = v ? 'visible' : 'hidden'; });
    // points de coque (PV) : segments verts, orange à la moitié, rouge au dernier ; le bouclier, lui, ne se voit que sous le vaisseau
    set('hp', g.p.hp + '/' + g.p.hpMax, () => {
      const { hp, hpMax } = g.p, el = $('#hHp'), was = this.hpWas; this.hpWas = hp;
      el.className = 'hud-hp' + (hp <= 1 ? ' crit' : hp * 2 <= hpMax ? ' low' : '');
      $('#hHpSeg').innerHTML = Array.from({ length: hpMax }, (_, i) => `<i class="${i < hp ? 'on' : ''}"></i>`).join('');
      $('#hHpN').textContent = tx('hud.hp', { n: hp, t: hpMax }); el.setAttribute('aria-label', tx('hud.hpAria', { n: hp, t: hpMax }));
      if (was != null && hp < was) { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
    });
    set('fit', $('#hScore').textContent.length + '|' + pill + '|' + innerWidth + 'x' + innerHeight + '|' + Store.d.set.ts, () => this.fitScore());
    set('sk', Store.d.set.hudSk ? Object.entries(g.skills).map(e => e.join(':')).join(',') : '-', () => this.hudSkills(g));
    set('xp', Math.round(g.xp / g.need * 100), v => { $('#hXp').style.width = v + '%'; });
    set('lvl', g.lvl, v => { $('#hLvl').textContent = tx('hud.lvl', { n: v }); });
    set('wpn', g.p.wf + g.p.wl, () => {
      const Wf = WEAPONS[g.p.wf], el = $('#hWeapon'); let lv = '';
      for (let i = 0; i < 10; i++) lv += `<i style="${i < g.p.wl ? 'background:' + Wf.col : ''}"></i>`;
      el.innerHTML = `<svg viewBox="0 0 24 24" style="stroke:${Wf.col}"><path d="${ICONS[g.p.wf]}"/></svg>${g.wpnName()}<span class="lv">${lv}</span>`; el.classList.toggle('ult', g.p.wl >= 10);
      el.classList.add('bump'); setTimeout(() => el.classList.remove('bump'), 220);
    });
    set('onde', Math.round(g.onde * 100), v => { $('#ondeRing').style.strokeDashoffset = 207.3 * (1 - v / 100); $('#ondeBtn').classList.toggle('ready', v >= 100); });
    set('ult', Math.round(g.ult * 100), v => { $('#ultRing').style.strokeDashoffset = 207.3 * (1 - v / 100); $('#ultBtn').classList.toggle('ready', v >= 100); });
    if (g.boss && !g.boss.dying && !(g.boss.warn > 0)) { const B = g.boss, sh = B.nodes.some(n => !n.dead), fk = B.fillK == null ? 1 : B.fillK; set('bossf', Math.round(B.hp / B.max * fk * 500) + (sh ? 's' : ''), () => { const w = Math.max(0, B.hp / B.max * fk * 100) + '%'; $('#hBossFill').style.width = w; $('#hBossLag').style.width = w; $('#hBoss').classList.toggle('shielded', sh); }); }
    // limite haute du vaisseau remesurée quand le HUD change de hauteur (rangée de compétences, étiquette d'arme, taille de l'écran)
    set('top', C.sk + '|' + C.wpn + '|' + innerWidth + 'x' + innerHeight + '|' + Store.d.set.ts, () => g.hudTop());
  },
  // rangée discrète des compétences acquises (réglage du joueur) : 6 au plus, triées par rareté puis niveau
  hudSkills(g) {
    const el = $('#hSkills'), on = Store.d.set.hudSk, sk = on ? Object.entries(g.skills).map(([id, n]) => ({ s: SKILLS.find(x => x.id === id), n })).filter(o => o.s && o.n).sort((a, b) => b.s.r - a.s.r || b.n - a.n) : [];
    $('#hud').classList.toggle('with-sk', sk.length > 0);
    el.innerHTML = sk.slice(0, 6).map(({ s, n }) => `<span class="sk" style="--rc:${RARITY[s.r].col}"><canvas data-ic="${s.id}"></canvas><b>${n}</b></span>`).join('') + (sk.length > 6 ? `<span class="sk more">+${sk.length - 6}</span>` : '');
    el.querySelectorAll('canvas').forEach(cv => Icons.paint(cv, cv.dataset.ic, 24));
  },
  banner(title, sub = '') { (this.bannerQ = this.bannerQ || []).push([title, sub]); if (!this.bannerBusy) this.nextBanner(); },
  nextBanner() {
    const q = this.bannerQ.shift(); if (!q) { this.bannerBusy = false; return; }
    this.bannerBusy = true; const el = $('#banner');
    el.querySelector('b').textContent = q[0]; el.querySelector('span').textContent = q[1]; el.classList.add('on');
    setTimeout(() => { el.classList.remove('on'); setTimeout(() => this.nextBanner(), 380); }, this.bannerQ.length ? 1100 : 1500);
  },
  bossBar(name) { const el = $('#hBoss'); if (!name) { el.classList.add('hidden'); if (this.hudCache) this.hudCache.bossf = null; return; } $('#hBossName').textContent = name; $('#hBossFill').style.width = $('#hBossLag').style.width = '0%'; if (this.hudCache) this.hudCache.bossf = null; el.classList.remove('hidden'); },
  hint(kind) {
    this.hintsShown = this.hintsShown || {}; if (this.hintsShown[kind]) return; this.hintsShown[kind] = true;
    const n = Store.d.seen['h_' + kind] || 0; if (n >= 2) return; Store.d.seen['h_' + kind] = n + 1;
    const touch = matchMedia('(pointer: coarse)').matches;
    this.hintText(tx('hint.' + kind + (touch ? 'Touch' : 'Key')), 2800);
  },
  hintText(txt, ms) { const el = $('#hint'); el.textContent = txt; el.classList.add('on'); clearTimeout(this.hT); this.hT = setTimeout(() => el.classList.remove('on'), ms); },

  showLevelUp(opts, lvl) {
    this.lvOpts = opts; const touch = matchMedia('(pointer: coarse)').matches;
    const glint = '<svg viewBox="0 0 24 24"><path d="M12 0Q12 12 24 12Q12 12 12 24Q12 12 0 12Q12 12 12 0Z" fill="#FFF"/></svg>';
    const used = Game.slotsUsed(), max = CONFIG.skills.maxActive, slots = `<p class="lv-slots${used >= max ? ' full' : ''}">${tx(used >= max ? 'lvl.full' : 'lvl.slots', { n: used, t: max })}</p>`;
    this.sheet(`<div class="sh-head c"><small>${tx('lvl.over', { n: lvl })}</small><h2>${tx('lvl.title')}</h2>${slots}</div>` + opts.map((s, i) => {
      const R = RARITY[s.r], n = Game.skills[s.id] || 0, cls = ['', 'com', 'rare', 'epi', 'leg'][s.r] + (s.fuse ? ' fuse' : ''), dl = Game.skillDelta(s);
      const nm = id => SKILLS.find(o => o.id === id).name, fw = SKILLS.find(o => o.fuse && o.fuse.includes(s.id) && !Game.skills[o.id]);
      const fu = s.fuse ? `<span class="fu">${tx('lvl.fuseOf', { a: nm(s.fuse[0]), b: nm(s.fuse[1]) })}</span>` : fw ? `<span class="fu">${tx('lvl.fuseWith', { n: nm(fw.fuse.find(id => id !== s.id)), f: fw.name })}</span>` : '';
      return `<button class="sc ${cls}" data-i="${i}" style="--rc:${R.col}"><canvas class="ic" data-ic="${s.id}"></canvas><span class="tx"><b class="nm">${s.name}</b><span class="rr">${R.name}</span><span class="ds">${s.desc}</span>${dl ? `<span class="ba">${dl}</span>` : ''}${fu}</span>` +
        `<span class="lv${n && !s.fuse ? '' : ' new'}">${s.fuse ? tx('lvl.fusion') : n ? tx('lvl.lv', { n: n + 1 }) : tx('lvl.new')}</span>${touch ? '' : `<kbd>${i + 1}</kbd>`}${s.r >= 3 ? `<i class="gl">${glint}</i>` : ''}<canvas class="fr"></canvas></button>`;
    }).join(''));
    this.paintCards('#sheetBody');
    $$('#sheetBody .sc').forEach(b => b.addEventListener('click', () => this.pickSkill(+b.dataset.i)));
  },
  // icônes au pinceau + cadre irrégulier couleur de rareté (après mise en page)
  paintCards(root) {
    $$(root + ' canvas[data-ic]').forEach(cv => Icons.paint(cv, cv.dataset.ic, cv.clientWidth || 64));
    requestAnimationFrame(() => $$(root + ' .sc, ' + root + ' .ak').forEach((b, i) => { const cv = b.querySelector('canvas.fr'); if (cv) Icons.frame(cv, getComputedStyle(b).getPropertyValue('--rc').trim() || '#EEF0F2', 7 + i * 13, b.classList.contains('ak') ? 2 : 3.2); }));
  },
  /* ---------- molette radio (Infini, idée du bloc 4) : glisser pour accorder, toucher une station, ou 1 · 2 · 3 ---------- */
  showRadio(opts) {
    this.rd = { opts, i: -1, pos: 1, drag: null };
    this.sheet(`<div class="sh-head c"><small>${tx('radio.over')}</small><h2>${tx('radio.title')}</h2></div><canvas class="radio" id="rdCv" aria-hidden="true"></canvas><div class="rd-card" id="rdCard" aria-live="polite"></div><div class="btns"><button class="pill primary" id="rdOk">${tx('radio.ok')}</button></div>`);
    const cv = $('#rdCv'), rect = () => cv.getBoundingClientRect();
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); this.rd.drag = { x: e.clientX, p0: this.rd.pos }; });
    cv.addEventListener('pointermove', e => { const D = this.rd && this.rd.drag; if (D) this.radioSet(clamp(D.p0 + (e.clientX - D.x) / rect().width * 3, 0, 2)); });
    const up = e => { const D = this.rd && this.rd.drag; if (!D) return; this.rd.drag = null; const r = rect(); if (Math.abs(e.clientX - D.x) < 6) this.radioSet(clamp((e.clientX - r.left) / r.width * 3 - 0.5, 0, 2)); this.radioSet(Math.round(this.rd.pos)); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    $('#rdOk').addEventListener('click', () => this.rd && this.radioPick(this.rd.i));
    this.radioSet(1, true);
  },
  radioSet(pos, quiet) {
    const R = this.rd; if (!R) return; R.pos = pos; const i = Math.round(pos);
    if (!quiet && Math.abs(pos - i) > 0.18 && performance.now() - (R.nT || 0) > 110) { R.nT = performance.now(); SFX.play('e_glitch'); }
    if (i !== R.i) {
      if (R.i >= 0 && !quiet) SFX.play('tap'); R.i = i;
      const o = R.opts[i], Wd = WORLDS[o.u];
      $('#rdCard').innerHTML = `<small>${tx('home.freq', { n: pad2(o.u + 1) })}</small><b>${Wd.name}${Wd.year ? ', ' + Wd.year : ''}</b><span>${tx('radio.mod.' + o.mod)}</span>`;
    }
    this.radioDraw();
  },
  radioDraw() {
    const R = this.rd, cv = $('#rdCv'); if (!R || !cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth || 320, h = cv.clientHeight || 150;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    const sx = k => (k + 0.5) / 3 * w, nx = sx(R.pos), off = Math.abs(R.pos - Math.round(R.pos));
    // cadran : plaque, graduations, trois stations numérotées
    c.fillStyle = '#14171C'; c.fillRect(0, 0, w, 96); c.strokeStyle = '#3A414B'; c.lineWidth = 2; c.strokeRect(1, 1, w - 2, 94);
    c.strokeStyle = 'rgba(232,236,242,.35)'; c.lineWidth = 1; c.beginPath();
    for (let x = 10; x < w - 8; x += 7) { const big = Math.round((x - 10) / 7) % 5 === 0; c.moveTo(x, 62); c.lineTo(x, big ? 48 : 55); } c.stroke();
    c.font = `700 ${Math.round(18 * Game.tsK())}px ${FONT}`; c.textAlign = 'center';
    R.opts.forEach((o, k) => { const on = k === Math.round(R.pos); c.fillStyle = on ? '#F2D58A' : 'rgba(232,236,242,.55)'; c.fillText(pad2(o.u + 1), sx(k), 34); c.fillRect(sx(k) - 9, 70, 18, 4); });
    // parasites entre deux stations
    if (off > 0.12) { const r = seeded(Math.floor(performance.now() / 60)); c.fillStyle = `rgba(232,236,242,${off * 0.5})`; for (let i = 0; i < 40; i++) c.fillRect(r() * w, 6 + r() * 84, 2, 1); }
    // aiguille rouge
    c.fillStyle = '#E8574A'; c.fillRect(nx - 1.5, 8, 3, 80);
    // molette vue de profil : stries qui défilent quand on tourne
    c.fillStyle = '#2A3038'; c.fillRect(16, 108, w - 32, 34); c.strokeStyle = '#07080A'; c.lineWidth = 3; c.strokeRect(16, 108, w - 32, 34);
    c.fillStyle = 'rgba(255,255,255,.16)'; for (let x = 16 + ((R.pos * 40) % 12 + 12) % 12; x < w - 18; x += 12) c.fillRect(x, 111, 3, 28);
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(16, 108, w - 32, 6); c.fillRect(16, 136, w - 32, 6);
  },
  radioPick(i) { if (!this.rd) return; this.rd = null; SFX.play('confirm'); this.hideSheet(); if (Game.radioCb) Game.radioCb(i); },
  pickSkill(i) { const s = this.lvOpts && this.lvOpts[i]; if (!s) return; this.lvOpts = null; SFX.play('confirm'); this.hideSheet(); Game.takeSkill(s); },
  showPause() {
    const g = Game, sk = Object.entries(g.skills).map(([id, n]) => ({ s: SKILLS.find(x => x.id === id), n })).filter(o => o.s).sort((a, b) => b.s.r - a.s.r || b.n - a.n).map(({ s, n }) => {
      const R = RARITY[s.r];
      return `<div class="ak" style="--rc:${R.col}"><canvas class="ic" data-ic="${s.id}"></canvas><span class="tx"><b class="nm">${s.name}</b><span class="ds">${s.r > 1 ? `<i class="rr">${R.name}</i> · ` : ''}${s.desc}</span></span><span class="pips">${Array.from({ length: s.max }, (_, i) => `<i class="${i < n ? 'f' : ''}"></i>`).join('')}<small>${tx(n >= s.max ? 'pause.lvMax' : 'pause.lv', { n })}</small></span><canvas class="fr"></canvas></div>`;
    }).join('');
    const where = g.mode === 'mission' ? UI.where(g.u, g.m) : tx('pause.whereInf', { n: g.infWave });
    this.sheet(`<div class="sh-head c"><small>${where}</small><h2 class="rib">${tx('pause.title')}</h2></div><div class="ak-head">${tx('pause.skills')}</div><div class="ak-list">${sk || `<p class="ak-none">${tx('pause.none')}</p>`}</div>${Dev.on() ? `<div class="optl dev"><select id="pDvSk">${SKILLS.map(s => `<option value="${s.id}"${s.id === Dev.lastSk ? ' selected' : ''}>${s.name}</option>`).join('')}</select><button class="pill small" id="pDvGive">${tx('dev.give')}</button><button class="pill small" id="pDvSkip">${tx('dev.skip')}</button></div>` : ''}<div class="btns pz"><button class="pill primary" id="pRes">${tx('pause.resume')}</button><button class="pill ghost" id="pSet">${tx('profile.settings')}</button><button class="pill ghost" id="pRe">${tx('pause.restart')}</button><button class="pill ghost wide" id="pQuit">${tx('pause.quit')}</button></div>`);
    this.paintCards('#sheetBody');
    $('#pSet').onclick = () => { SFX.play('tap'); this.pauseSettings(); };
    if (Dev.on()) { $('#pDvGive').onclick = () => { const s = SKILLS.find(x => x.id === (Dev.lastSk = $('#pDvSk').value)); Game.takeSkill(s); Game.state = 'paused'; this.showPause(); }; $('#pDvSkip').onclick = () => { Game.pause(false, true); Dev.skipWave(Game); }; }
    $('#pRes').onclick = () => Game.pause(false);
    $('#pRe').onclick = () => { SFX.play('tap'); Game.quit(); this.play(this.lastCfg); };
    $('#pQuit').onclick = () => { SFX.play('tap'); this.exitGame(); };
  },
  // récap des compétences de la partie : icônes au cadre de rareté + niveau
  buildRow() {
    const sk = Object.entries(Game.skills).map(([id, n]) => ({ s: SKILLS.find(x => x.id === id), n })).filter(o => o.s && o.n).sort((a, b) => b.s.r - a.s.r || b.n - a.n);
    if (!sk.length) return '';
    return `<div class="end-build"><div class="eb-h">${tx('end.build')}</div><div class="eb-row">${sk.map(({ s, n }, i) => `<span class="eb" style="--rc:${RARITY[s.r].col};--d:${i * 45}ms" title="${s.name}"><canvas class="ic" data-ic="${s.id}"></canvas><b>${n >= s.max ? tx('end.max') : n}</b></span>`).join('')}</div></div>`;
  },
  showEnd(r) {
    const rows = (list) => `<div class="res-rows">${list.map(([k, v], i) => `<div${i === list.length - 1 ? ' class="tot"' : ''}><span>${k}</span><b>${v}</b></div>`).join('')}</div>`;
    const homeB = `<button class="pill ghost ico" id="eHome" aria-label="${tx('end.home')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11L12 4L20 11V20H14V14H10V20H4Z"/></svg></button>`;
    let head, body = '', btns = '', next = null;
    const pct = v => Math.round(v * 100) + '\u00a0%', RK = r.rank, rk = RK && RK.cr ? [[tx('end.rankCr'), '+' + fmt(RK.cr)]] : [];
    const rankRow = RK ? `<div class="rank-row${RK.to > RK.from ? ' up' : ''}"><b>${tx('rank.name', { n: RK.to })}</b><span class="rbar"><i style="width:${Math.round(RK.cur / RK.need * 100)}%"></i></span><small>${tx('rank.xp', { n: RK.xp })}</small></div>` + (RK.to > RK.from ? `<div class="unlock">${tx('rank.up', { n: RK.to, c: fmt(RK.cr) })}</div>` : '') : '';
    const crBox = `<div class="end-cr" id="eCr"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS.credit}"/></svg><b>${fmt(Store.d.credits - r.total)}</b></div>`;
    if (r.mode === 'mission' && r.win) {
      // les 3 étoiles, chacune avec ce qui a été réussi ou raté
      const caps = [tx('end.capDone'), tx('end.capHalf'), tx('end.capNoLoss')];
      const st = `<canvas class="res-cv" aria-hidden="true"></canvas><div class="res-caps">${caps.map((cap, i) => `<span class="${r.got[i] ? 'f' : 'x'}"><em>${tx(r.got[i] ? 'end.capOk' : 'end.capKo')}</em>${cap}</span>`).join('')}</div>`
        + (r.perfect ? `<div class="ribbon">${tx('end.perfect')}</div><div class="why">${tx('end.perfectWhy')}</div>` : '');
      head = `<div class="sh-head c"><small>${this.where(r.u, r.m)}</small><h2 class="rib">${tx('end.win')}</h2></div><div class="res-stars${r.perfect ? ' perf' : ''}">${st}</div>`;
      body = rows([[tx('end.score'), fmt(r.score)], [tx('end.crPicked'), '+' + fmt(r.cr)], [tx(r.first ? 'end.rewardFirst' : 'end.reward'), '+' + fmt(r.reward)], ...(r.perfect ? [[tx('end.perfectBonus'), '+' + fmt(r.bonus)]] : []), ...(r.ff ? [[tx('end.firstFlight'), '+' + fmt(r.ff)]] : []), ...rk, [tx('end.total'), '+' + fmt(r.total)]]);
      if (r.post) body += `<p class="quote">${tx('quote', { t: r.post })}</p>`;
      if (r.unlock != null) body += `<div class="unlock">${tx('end.unlock', { n: pad2(r.unlock + 1), name: WORLDS[r.unlock].name })}</div>`;
      if (r.omega) body += `<div class="unlock">${tx('end.omega')}</div>`;
      if (r.unlock === 2) body += `<div class="unlock">${tx('end.infOpen')}</div>`;
      if (r.m < 4) next = { mode: 'mission', u: r.u, m: r.m + 1 }; else if (r.u < WORLDS.length - 1) next = { mode: 'mission', u: r.u + 1, m: 0 };
      if (r.ff) btns = homeB + `<button class="pill ghost" id="eNext">${tx('end.next')}</button><button class="pill primary" id="eUpg">${tx('end.upgFirst')}</button>`;
      else btns = homeB + `<button class="pill ghost" id="eAgain">${tx('end.again')}</button>` + (next ? `<button class="pill primary" id="eNext">${next.m === 4 ? tx('end.boss') : next.u !== r.u ? tx('end.jump', { name: WORLDS[next.u].name }) : tx('end.next')}</button>` : `<button class="pill primary" id="eInf">${tx('end.inf')}</button>`);
    } else if (r.mode === 'mission') {
      head = `<div class="sh-head c"><small>${this.where(r.u, r.m)}</small><h2 class="rib lose">${tx('end.lose')}</h2></div>`;
      body = rows([[tx('end.score'), fmt(r.score)], [tx('end.kills'), fmt(r.kills)], ...(r.reward ? [[tx('end.effort'), '+' + fmt(r.reward)]] : []), ...rk, [tx('end.crKept'), '+' + fmt(r.total)]]);
      if (r.farther) body += `<div class="unlock">${tx('end.farther', { a: pct(r.prev), b: pct(r.prog) })}</div>`;
      else if (r.prog > 0) body += `<p class="prog-line">${tx('end.prog', { n: pct(r.prog) })}</p>`;
      body += `<p class="quote">${r.fails >= CONFIG.help.after ? tx('end.helpNext') + (r.m === 4 ? ' ' + tx('end.bossEase') : '') : tx('end.tip')}</p>`;
      btns = homeB + `<button class="pill primary wide huge" id="eAgain">${tx('end.retry')}</button>`;
    } else {
      head = `<div class="sh-head c"><small>${tx('end.infTier', { tier: TIERS[Game.tier].name })}</small><h2 class="rib">${tx(r.best ? 'end.record' : 'end.infOver')}</h2></div>`;
      body = rows([[tx('end.wave'), r.wave], [tx('end.pal'), r.pal ? palName(r.pal) : tx('end.palNone')], [tx('end.score'), fmt(r.score)], [tx('end.comboMax'), r.combo], ...rk, [tx('end.credits'), '+' + fmt(r.total)]]);
      btns = homeB + `<button class="pill primary wide huge" id="eAgain">${tx('end.again')}</button>`;
    }
    this.sheet(crBox + head + body + rankRow + this.buildRow() + `<div class="btns end">${btns}</div>`);
    this.paintCards('#sheetBody');
    // étoiles qui claquent : une à une, chacune avec son éclat, son claquement et sa légende
    if (r.win && r.mode === 'mission') {
      const cv = $('#sheetBody .res-cv'), caps = $$('#sheetBody .res-caps span'); Plat.draw(cv, r.stars, r.perfect);
      for (let i = 0; i < r.stars; i++) setTimeout(() => { if (!cv.isConnected) return; if (caps[i]) this.pop(caps[i]); SFX.play('star'); SFX.vib(10, 1); }, 370 + i * 300);
      if (r.perfect) setTimeout(() => { if (cv.isConnected) { SFX.play('perfect'); SFX.vib([20, 40, 20]); } }, 1150);
    }
    this.coinsFly(r.total, r.win && r.mode === 'mission' ? 400 + r.stars * 300 : 350);
    const bind = (id, fn) => { const el = $(id); if (el) el.onclick = () => { SFX.play('tap'); fn(); }; };
    bind('#eHome', () => { if (next) { this.sel.u = next.u; this.sel.m = next.m; } this.exitGame(); });
    bind('#eAgain', () => { Game.quit(); const c = Object.assign({}, this.lastCfg); delete c.help; this.play(c); });
    bind('#eInf', () => { this.exitGame(); this.go('s-inf'); });
    bind('#eUpg', () => { if (next) { this.sel.u = next.u; this.sel.m = next.m; } this.exitGame(); this.hangarFocus(); });
    bind('#eNext', () => {
      Game.quit(); this.sel.u = next.u; this.sel.m = next.m; this.refresh();
      if (next.m === 0 && !Store.d.seen['b' + next.u]) { this.hideSheet(); $('#s-game').classList.remove('on'); this.brief(next.u, () => this.play(next)); }
      else this.play(next);
    });
  },

  pop(el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); },
  // pièces aspirées vers le compteur : elles partent de la ligne du total et le compteur monte à chaque arrivée
  coinsFly(total, delay) {
    const box = $('#eCr'), from = $('#sheetBody .res-rows .tot b'); if (!box) return; const b = box.querySelector('b'), end = Store.d.credits, start = end - total;
    if (!total || !from || matchMedia('(prefers-reduced-motion: reduce)').matches) { b.textContent = fmt(end); return; }
    const n = clamp(Math.round(total / 60), 4, 12); let got = 0;
    setTimeout(() => {
      if (!box.isConnected) return; const A = from.getBoundingClientRect(), B = box.getBoundingClientRect();
      for (let i = 0; i < n; i++) {
        const el = document.createElement('i'); el.className = 'fly-cr'; el.innerHTML = `<svg viewBox="0 0 24 24"><path d="${ICONS.credit}"/></svg>`; document.body.appendChild(el);
        const x0 = A.left + A.width / 2 + (Math.random() - 0.5) * 60, y0 = A.top + A.height / 2, x1 = B.left + 18, y1 = B.top + B.height / 2;
        const an = el.animate([{ transform: `translate(${x0}px,${y0}px) scale(.6)`, opacity: 0 }, { transform: `translate(${x0 + (Math.random() - 0.5) * 80}px,${y0 - 50}px) scale(1.1)`, opacity: 1, offset: 0.3 }, { transform: `translate(${x1}px,${y1}px) scale(.7)`, opacity: 1 }], { duration: 620, delay: i * 70, easing: 'cubic-bezier(.5,0,.75,.2)', fill: 'both' });
        an.onfinish = () => { el.remove(); got++; if (!box.isConnected) return; b.textContent = fmt(got >= n ? end : Math.round(start + total * got / n)); this.pop(box); SFX.play('cr', 30); if (got === n) SFX.vib(8, 1); };
      }
    }, delay);
  },
  // prochain objectif affiché sur l'accueil (PLAISIR §19) : la suite de la progression, puis le hangar ou les fusions
  nextGoals() {
    const d = Store.d, out = []; const gi = d.done.findIndex(x => !x);
    if (gi >= 0) { const u = Math.floor(gi / 5), m = gi % 5; out.push(m === 4 && u < WORLDS.length - 1 ? tx('goal.boss', { b: WORLDS[u].boss.name, n: pad2(u + 2) }) : tx('goal.mission', { n: pad2(u + 1) + '-' + (m + 1) })); }
    const nx = CHASSIS_ORDER.find(id => !d.owned.includes(id) && CHASSIS[id].price > 0);
    if (nx) out.push(d.credits >= CHASSIS[nx].price ? tx('goal.shipReady', { n: CHASSIS[nx].name }) : tx('goal.ship', { n: CHASSIS[nx].name, c: fmt(CHASSIS[nx].price - d.credits) }));
    else { const fu = SKILLS.filter(s => s.fuse); out.push(tx('goal.fus', { n: fu.filter(s => d.fus[s.id]).length, t: fu.length })); }
    return out;
  },
  renderGoal() {
    const el = $('#homeGoal'); if (!el) return;
    el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3V8M12 16V21M3 12H8M16 12H21M12 6A6 6 0 1 0 12.01 6"/></svg><span><small>${tx('goal.title')}</small>${this.nextGoals().map(g => `<b>${g}</b>`).join('')}</span>`;
  },
  /* ---------- héros animés (accueil & hangar) ---------- */
  sizeHeroes() {
    for (const id of ['#heroHome', '#heroHangar']) {
      const cv = $(id), w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) continue;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    }
  },
  heroBg(u) {
    const key = u + '|' + H; this.hbg = this.hbg || {}; if (this.hbg[key]) return this.hbg[key];
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; BG.still(cv.getContext('2d'), WORLDS[u]);
    return (this.hbg[key] = cv);
  },
  heroLoop(t) {
    requestAnimationFrame(tt => this.heroLoop(tt));
    if (document.body.classList.contains('playing')) return;
    const ts = t / 1000;
    if (this.cur === 's-home') { this.drawHero($('#heroHome'), this.sel.u, ts, 'home'); this.dialDraw(); }
    else if (this.cur === 's-hangar' && this.sel.hv === 'ships') this.drawHero($('#heroHangar'), null, ts, 'hangar');
  },
  drawHero(cv, u, t, mode) {
    const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h || !cv.width) return;
    const dpr = cv.width / w, c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    const drawBg = (uu, a) => {
      const bg = this.heroBg(uu), s = Math.max(w / W, h / H) * 1.02, ox = (w - W * s) / 2, oy = (h - H * s) * 0.42;
      c.globalAlpha = a; c.drawImage(bg, ox, oy, W * s, H * s);
      c.save(); c.translate(ox, oy); c.scale(s, s); try { WORLDS[uu].bgDyn(c, t, null); } catch (e) { /* décor animé facultatif */ } c.restore();
      c.globalAlpha = 1;
    };
    if (mode === 'home') {
      const f = this.heroFade; if (f) { f.t += 1 / 60; if (f.t >= 0.45) this.heroFade = null; }
      if (this.heroFade) { drawBg(f.from, 1); c.globalAlpha = 1; drawBg(u, Math.min(1, f.t / 0.45)); } else drawBg(u, 1);
      c.fillStyle = 'rgba(10,10,11,.2)'; c.fillRect(0, 0, w, h);
    }
    const g = c.createRadialGradient(w / 2, h * 0.48, Math.min(w, h) * 0.28, w / 2, h * 0.5, Math.max(w, h) * 0.72);
    g.addColorStop(0, 'rgba(10,10,11,0)'); g.addColorStop(1, 'rgba(10,10,11,1)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    const edge = (x0, y0, x1, y1, rx, ry, rw, rh) => { const e = c.createLinearGradient(x0, y0, x1, y1); e.addColorStop(0, 'rgba(10,10,11,1)'); e.addColorStop(1, 'rgba(10,10,11,0)'); c.fillStyle = e; c.fillRect(rx, ry, rw, rh); };
    edge(0, h, 0, h * 0.7, 0, h * 0.7, w, h * 0.3 + 1); edge(0, 0, 0, h * 0.22, 0, 0, w, h * 0.22);
    edge(0, 0, w * 0.18, 0, 0, 0, w * 0.18, h); edge(w, 0, w * 0.82, 0, w * 0.82, 0, w * 0.18 + 1, h);
    Art.glow(c, w / 2, h * 0.5, Math.min(w, h) * 0.5, '#FFFFFF', 0.05);
    c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1.4; c.beginPath();
    for (let x = 0; x <= w; x += 4) { const y = h * 0.54 + Math.sin(x * 0.02 + t * 1.3) * h * 0.06 * Math.sin(t * 0.5 + x * 0.004); x ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
    const spr = mode === 'home' ? craftFor('mission', u, this.sel.m, Store.d.ship).spr : CHASSIS[this.sel.ship].spr;
    const D = Art.DEF[spr], box = Math.min(w * 0.6, h * (mode === 'home' ? 0.56 : 0.6));
    let px = box * D.w / Math.max(D.w, D.h); if (D.h < D.w * 0.6) px = Math.min(w * 0.82, box * 1.6);
    const x = w / 2, y = h * (mode === 'home' ? 0.56 : 0.5) + Math.sin(t * 1.4) * h * 0.012, sc = px / D.w;
    if (mode === 'hangar') {
      this.pedestal(c, w / 2, h * 0.84, Math.min(w * 0.36, h * 0.5), t);
      const sw = this.shipSwap; if (sw) { sw.t += 1 / 60; if (sw.t >= 0.35) this.shipSwap = null; }
      if (this.shipSwap) { const k = 1 - Math.pow(1 - this.shipSwap.t / 0.35, 3); c.save(); c.globalAlpha = k; c.translate(this.shipSwap.d * (1 - k) * w * 0.35, (1 - k) * (this.shipSwap.d ? 0 : 14)); }
    } else {
      const sg = c.createRadialGradient(0, 0, 0, 0, 0, px * 0.55); sg.addColorStop(0, 'rgba(0,0,0,.55)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
      c.save(); c.translate(x, h * 0.86); c.scale(1, 0.16); c.fillStyle = sg; c.beginPath(); c.arc(0, 0, px * 0.55, 0, TAU); c.fill(); c.restore();
    }
    if (D.eng) { c.save(); c.globalCompositeOperation = 'lighter'; for (const [ex, ey, s] of D.eng) { const fl = 0.88 + Math.sin(t * 30 + ex) * 0.1, rr = clamp(px / 4.5, 10, 46) * s * fl; Art.glow(c, x + ex * sc, y + ey * sc + rr * 0.3, rr, '#F0B070', 0.7); Art.glow(c, x + ex * sc, y + ey * sc, rr * 0.35, '#FFF4E4', 0.8); } c.restore(); }
    Art.flames(c, D, x, y, sc, t);
    const locked = mode === 'hangar' && !Store.d.owned.includes(this.sel.ship) && CHASSIS[this.sel.ship].price < 0;
    Art.draw(c, spr, x, y, px, Math.sin(t * 0.7) * 0.025, false, locked ? 0.22 : 1);
    if (mode === 'hangar' && !locked) { const id = this.sel.ship; Art.parts(c, spr, x, y, px, Math.sin(t * 0.7) * 0.025, { cannon: Store.upg('cannon', id), hull: Store.upg('hull', id), rate: Store.upg('rate', id) }); }
    if (mode === 'hangar' && this.shipSwap) c.restore();
  },
  // socle hexagonal en perspective (plateau métal, tranche, arête éclairée froide, faisceau montant)
  pedestal(c, cx, cy, R, t) {
    const k = 0.3, th = R * 0.17, P = Array.from({ length: 6 }, (_, i) => { const a = i / 6 * TAU; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R * k]; });
    const poly = pts => { c.beginPath(); pts.forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py)); c.closePath(); };
    const b = c.createLinearGradient(0, cy - R * 1.6, 0, cy); b.addColorStop(0, 'rgba(159,220,255,0)'); b.addColorStop(1, 'rgba(159,220,255,.09)'); c.fillStyle = b; c.fillRect(cx - R * 0.8, cy - R * 1.6, R * 1.6, R * 1.6);
    c.fillStyle = '#14171C'; poly([P[0], P[1], P[2], P[3], [P[3][0], P[3][1] + th], [P[2][0], P[2][1] + th], [P[1][0], P[1][1] + th], [P[0][0], P[0][1] + th]]); c.fill();
    c.strokeStyle = '#040506'; c.lineWidth = 3; c.lineJoin = 'round'; c.stroke();
    const tg = c.createLinearGradient(0, cy - R * k, 0, cy + R * k); tg.addColorStop(0, '#2C313A'); tg.addColorStop(1, '#1B1F26'); c.fillStyle = tg; poly(P); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(cx - R + i * R / 2, cy - R * k * 0.85); c.lineTo(cx - R + i * R / 2 - R * 0.12, cy + R * k * 0.85); c.stroke(); }
    c.strokeStyle = `rgba(159,220,255,${0.45 + Math.sin(t * 2) * 0.12})`; c.lineWidth = 2; c.beginPath(); c.moveTo(P[2][0], P[2][1]); c.lineTo(P[1][0], P[1][1]); c.lineTo(P[0][0], P[0][1]); c.lineTo(P[5][0], P[5][1]); c.stroke();
    const sg = c.createRadialGradient(0, 0, 0, 0, 0, R * 0.6); sg.addColorStop(0, 'rgba(0,0,0,.5)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); c.save(); c.translate(cx, cy); c.scale(1, k); c.fillStyle = sg; c.beginPath(); c.arc(0, 0, R * 0.6, 0, TAU); c.fill(); c.restore();
  },
};

/* ---------- application installable (PWA) ----------
   Service worker seulement en http(s) (GitHub Pages), jamais en file:// (ouverture locale, smoke).
   ?v= : chaque version a son worker et son cache (sw.js). Bouton « Installer le jeu » dans Profil quand le navigateur le propose. */
const PWA = {
  ev: null,
  init() {
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js?v=' + encodeURIComponent(CONFIG.version)).catch(() => {});
    addEventListener('beforeinstallprompt', e => { e.preventDefault(); this.ev = e; this.show(); });
    addEventListener('appinstalled', () => { this.ev = null; this.show(); if (window.UI && UI.toast) UI.toast(tx('pwa.done')); });
  },
  show() { const r = document.getElementById('instRow'); if (r) r.hidden = !this.ev; },
  async install() {
    if (!this.ev) return; SFX.init(); SFX.play('tap');
    const e = this.ev; this.ev = null; this.show();
    try { await e.prompt(); await e.userChoice; } catch (_) {}
  },
};
PWA.init();
addEventListener('DOMContentLoaded', () => { UI.init(); PWA.show(); $('#instBtn').addEventListener('click', () => PWA.install()); });
