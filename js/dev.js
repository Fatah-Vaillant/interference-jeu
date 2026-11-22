'use strict';
/* =========================================================
   INTERFÉRENCE — menu développeur (caché)
   Activation : 7 appuis rapides sur le numéro de version (Profil). Réglage mémorisé : Store.d.set.dev.
   Outils : aller à une mission ou à une vague d'Infini, crédits, tout débloquer, compétence forcée au départ,
   zones de touche, mesure des images par seconde. Rien ici ne doit être nécessaire pour jouer.
   ========================================================= */
const Dev = {
  taps: [],
  on() { return CONFIG.features.devMenu && !!Store.d.set.dev; },
  // appuis sur la ligne de version
  tap() {
    if (!CONFIG.features.devMenu) return;
    const now = Date.now(); this.taps = this.taps.filter(t => now - t < 3000); this.taps.push(now);
    if (this.taps.length < 7) return;
    this.taps = []; Store.d.set.dev = !Store.d.set.dev; Store.save();
    UI.toast(tx(Store.d.set.dev ? 'dev.on' : 'dev.off')); this.render();
  },
  // panneau dans Profil
  render() {
    const ver = $('#verLine'); if (ver) ver.textContent = tx('profile.version', { v: CONFIG.version });
    const box = $('#devBox'); if (!box) return;
    if (!this.on()) { box.innerHTML = ''; return; }
    const S = Store.d.set, opt = (v, l, sel) => `<option value="${v}"${sel ? ' selected' : ''}>${l}</option>`;
    const worlds = WORLDS.map((Wd, u) => opt(u, pad2(u + 1) + ' · ' + Wd.name, u === 0)).join('');
    const mis = [0, 1, 2, 3, 4].map(m => opt(m, m === 4 ? tx('dev.boss') : String(m + 1), m === 0)).join('');
    const skills = opt('', tx('dev.none'), !S.devSkill) + SKILLS.map(s => opt(s.id, s.name, S.devSkill === s.id)).join('');
    box.innerHTML = `<h3 class="section">${tx('dev.title')}</h3><div class="list dev">
      <div class="row"><span>${tx('dev.mission')}</span><select id="dvU">${worlds}</select><select id="dvM">${mis}</select><button class="pill small" id="dvGo">${tx('dev.go')}</button></div>
      <div class="row"><span>${tx('dev.wave')}</span><input type="number" id="dvW" min="1" max="200" value="10"><select id="dvT">${TIERS.map((T, i) => opt(i, T.name, i === 0)).join('')}</select><button class="pill small" id="dvInf">${tx('dev.go')}</button></div>
      <div class="row"><span>${tx('dev.skill')}</span><select id="dvSk">${skills}</select></div>
      <label class="row"><span>${tx('dev.hit')}</span><input type="checkbox" class="switch" id="dvHit"${S.devHit ? ' checked' : ''}></label>
      <label class="row"><span>${tx('dev.fps')}</span><input type="checkbox" class="switch" id="dvFps"${S.devFps ? ' checked' : ''}></label>
      <div class="row"><button class="pill small" id="dvCr">${tx('dev.credits')}</button><button class="pill small" id="dvAll">${tx('dev.unlock')}</button></div>
    </div>`;
    const save = () => { Store.save(); SFX.play('tap'); };
    $('#dvGo').onclick = () => { const u = +$('#dvU').value, m = +$('#dvM').value; UI.sel.u = u; UI.sel.m = m; Store.d.seen['b' + u] = true; save(); UI.play({ mode: 'mission', u, m }); };
    $('#dvInf').onclick = () => { this.startWave = Math.max(1, +$('#dvW').value || 1); save(); UI.play({ mode: 'inf', tier: +$('#dvT').value }); };
    $('#dvSk').onchange = e => { S.devSkill = e.target.value; save(); };
    $('#dvHit').onchange = e => { S.devHit = e.target.checked; save(); };
    $('#dvFps').onchange = e => { S.devFps = e.target.checked; save(); };
    $('#dvCr').onclick = () => { Store.d.credits += 10000; save(); UI.refresh(); UI.renderProfile(); UI.toast(tx('dev.done')); };
    $('#dvAll').onclick = () => {
      Store.d.done = Store.d.done.map(() => true); Store.d.stars = Store.d.stars.map(s => Math.max(s, 1));
      Store.d.owned = Object.keys(CHASSIS); save(); UI.refresh(); UI.renderProfile(); UI.toast(tx('dev.done'));
    };
  },
  // appelé au début de chaque partie
  onStart(g) {
    if (!this.on()) return;
    const S = Store.d.set;
    if (S.devSkill) { const s = SKILLS.find(x => x.id === S.devSkill); if (s) g.takeSkill(s); }
    if (g.mode === 'inf' && this.startWave > 1) { g.infWave = this.startWave - 1; this.startWave = 0; }
  },
  // passe directement à la vague suivante (pause)
  skipWave(g) {
    g.ens = []; g.eb = []; g.spawnQ = []; g.wave = null; g.F = null; g.delay = null; g.cine = null;
    if (g.boss) { g.boss = null; UI.bossBar(null); }
    g.nextStep();
  },
  // zones de touche (joueur, ennemis, tirs ennemis)
  drawHits(c, g) {
    if (!this.on() || !Store.d.set.devHit) return;
    c.save(); c.lineWidth = 1.5;
    c.strokeStyle = '#7CFF9A'; c.beginPath(); c.arc(g.p.x, g.p.y + g.hitOff, g.hitR, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(124,255,154,.35)'; c.beginPath(); c.arc(g.p.x, g.p.y + g.hitOff, g.hitR + 24, 0, TAU); c.stroke();
    c.strokeStyle = '#FF5C8A'; for (const e of g.ens) if (!e.dead) { c.beginPath(); c.ellipse(e.x, e.y, e.rx, e.ry, 0, 0, TAU); c.stroke(); }
    c.strokeStyle = '#FFD25C'; for (const b of g.eb) { c.beginPath(); c.arc(b.x, b.y, b.r || 4, 0, TAU); c.stroke(); }
    c.restore();
  },
  // images par seconde : moyenne et pire image sur une demi-seconde
  fps: { n: 0, acc: 0, worst: 0, cpu: 0, cpuMax: 0 },
  frame(rdt, cpu = 0, g = null) {
    if (!this.on() || !Store.d.set.devFps) { const el = document.getElementById('hFps'); if (el && el.textContent) el.textContent = ''; return; }
    const F = this.fps; F.n++; F.acc += rdt; F.worst = Math.max(F.worst, rdt); F.cpu += cpu; F.cpuMax = Math.max(F.cpuMax, cpu);
    if (F.acc < 0.5) return;
    const el = document.getElementById('hFps');
    const fps = Math.round(F.n / F.acc), c = F.cpu / F.n, over = fps < CONFIG.perf.fps - 3 || c > CONFIG.perf.cpuMs;
    const objs = g ? g.ens.length + g.eb.length + g.pb.length + g.fx.length + g.pk.length : 0;
    const lines = [tx('dev.fpsVal', { f: fps, w: (F.worst * 1000).toFixed(1) }), tx('dev.cpuVal', { c: c.toFixed(1), m: F.cpuMax.toFixed(1), n: objs, d: g ? +g.dpr.toFixed(2) : 1 })];
    if (over) lines.push(tx('dev.over'));
    if (el) el.textContent = lines.join('\n');
    F.n = 0; F.acc = 0; F.worst = 0; F.cpu = 0; F.cpuMax = 0;
  },
};
