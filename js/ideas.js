'use strict';
/* =========================================================
   INTERFÉRENCE — idées originales du bloc 4 (docs/BACKLOG.md §6)
   Six mécaniques, chacune derrière son interrupteur dans CONFIG.features :
     echo       Écho : compétence rare (data.js) — un double du vaisseau rejoue ta trajectoire 0,6 s plus tard et tire avec toi
     accord     Accord de fréquence : 3 ennemis du même type abattus d'affilée → résonance (tirs perçants, dégâts +25 %)
     noiseHud   Le Bruit attaque l'interface : un parasite s'accroche au HUD et le brouille tant qu'on ne l'abat pas
     radioDial  Molette radio : en Infini, au changement d'univers, on tourne une molette pour choisir la fréquence suivante
     convoy     Convoi à escorter : des cargos traversent l'écran, les ennemis leur tirent dessus
     bossLearn  Boss qui apprend : il repère ton couloir préféré et les attaques qui te touchent, et s'en souvient
   Le moteur (js/game.js) appelle ces crochets ; une idée coupée ne coûte rien et ne change pas la partie.
   ========================================================= */
const Ideas = {
  on(k) { return !!(CONFIG.features && CONFIG.features[k]); },

  start(g) {
    g.echo = null; // créé à la prise de la compétence Écho
    g.acc = { a: null, n: 0 }; g.accT = 0;
    g.para = null; g.paraT = 0;
    g.convoy = null; g.radioMod = null; g.radioCb = null;
    g.learn = { zone: [0, 0, 0], hits: {}, told: false };
    document.body.classList.remove('noisy');
  },
  end() { document.body.classList.remove('noisy'); },

  /* ---------------- mise à jour ---------------- */
  update(g, dt) {
    if (g.accT > 0) g.accT -= dt;
    // Écho : historique des positions (une entrée par image), le double rejoue la plus ancienne
    if (!g.echo && g.mod('echo') > 0) g.echo = { h: [], fired: false, n: 0 };
    const E = g.echo;
    if (E) {
      E.h.push(g.p.x, g.p.y, E.fired ? 1 : 0); E.fired = false;
      if (E.h.length > 36 * 3) E.h.splice(0, 3);
      if (E.h.length >= 36 * 3 && E.h[2] && g.state === 'play' && !g.outro) {
        E.n++; g.pShot('imp', E.h[0], E.h[1] + g.noseY, 0, 860, g.dmgBase() * g.mod('echo'));
      }
    }
    // parasite d'interface
    if (g.paraT > 0 && (g.paraT -= dt) <= 0) this.spawnPara(g);
    const P = g.para;
    if (P) {
      if (P.dead || P.gone) { g.para = null; document.body.classList.remove('noisy'); }
      else {
        const tx = W - 64 + Math.sin(g.t * 7) * 6, ty = 132 + Math.sin(g.t * 11) * 3;
        P.x += (tx - P.x) * Math.min(1, dt * 1.6); P.y += (ty - P.y) * Math.min(1, dt * 1.6);
        if (!P.att && Math.abs(P.x - tx) < 14 && Math.abs(P.y - ty) < 14) { P.att = true; document.body.classList.add('noisy'); SFX.play('e_glitch'); UI.hintText(tx_('idea.noise'), 2600); }
      }
    }
    // Boss qui apprend : temps passé dans chaque tiers de l'écran
    const B = g.boss;
    if (B && !B.entering && !B.dying && this.on('bossLearn')) g.learn.zone[clamp(Math.floor(g.p.x / W * 3), 0, 2)] += dt;
    // convoi
    const C = g.convoy;
    if (C && !C.done) {
      for (const v of C.v) if (!v.dead && !v.out) { v.x += C.sp * dt; v.fl -= dt; if (v.x > W + 70) { v.out = true; C.saved++; } }
      if (C.v.every(v => v.dead || v.out)) this.endConvoy(g);
    }
  },

  /* ---------------- Écho ---------------- */
  onFire(g) { if (g.echo) g.echo.fired = true; },

  /* ---------------- Accord de fréquence ---------------- */
  onKill(g, e, silent) {
    if (e.parasite) { this.cleanPara(g, e); return; }
    if (silent || e.mini || !this.on('accord')) return;
    const A = g.acc;
    if (e.a === A.a) A.n++; else { A.a = e.a; A.n = 1; }
    if (A.n >= 3) {
      A.n = 0; A.a = null; g.accT = 4; g.p.buffT = Math.max(g.p.buffT, 4);
      g.floatText(g.p.x, g.p.y - 74, tx_('idea.accord'), '#F2D58A'); SFX.play('up');
      g.spark(g.p.x, g.p.y, '#F2D58A', 10, 220);
    }
  },
  pierce(g) { return g.accT > 0 ? 1 : 0; },

  /* ---------------- Le Bruit attaque l'interface ---------------- */
  onWave(g, kind) {
    if (!this.on('noiseHud') || g.para || g.paraT > 0 || kind === 'convoy') return;
    const due = g.mode === 'mission' ? g.m >= 1 && g.waveIdx === 2 : g.infWave % 6 === 3;
    if (due) g.paraT = 3;
  },
  spawnPara(g) {
    const e = g.newEnemy('gunner', W * 0.3, -40);
    e.parasite = true; e.spr = 'parasite'; e.orient = 'none'; e.state = 'para'; e.wave = null;
    e.A = Object.assign({}, e.A, { fire: null, pts: 250, xp: 4, cr: 1 });
    e.w = 62; e.h = 45; e.rx = 27; e.ry = 20; e.hp = e.max = 7 * g.hpK(); e.b0 = null;
    g.para = e; SFX.play('e_glitch');
  },
  cleanPara(g, e) {
    document.body.classList.remove('noisy'); g.para = null;
    const n = Math.round((20 + g.d) * g.S.cred); g.cr += n;
    UI.banner(tx_('idea.cleanT'), tx_('game.squadCr', { n })); SFX.play('star');
  },

  /* ---------------- Convoi à escorter ---------------- */
  startConvoy(g) {
    const y = H * 0.44, n = 3;
    g.convoy = { sp: 36, saved: 0, n, done: false, v: Array.from({ length: n }, (_, i) => ({ x: -70 - i * 130, y: y + (i % 2 ? 26 : 0), hp: 8, max: 8, dead: false, out: false, fl: 0 })) };
    UI.banner(tx_('idea.convoyT'), tx_('idea.convoyS')); SFX.play('phase');
  },
  busy(g) { return !!(g.convoy && !g.convoy.done); },
  // cible d'un tir ennemi : la moitié des tirs visent un cargo pendant l'escorte
  target(g, x, y) {
    const C = g.convoy; if (!C || C.done) return null;
    const vs = C.v.filter(v => !v.dead && !v.out && v.x > 0 && v.x < W && v.y > y); if (!vs.length || Math.random() < 0.5) return null;
    let best = vs[0]; for (const v of vs) if (d2(v.x, v.y, x, y) < d2(best.x, best.y, x, y)) best = v;
    return [best.x, best.y];
  },
  hitConvoy(g, b) {
    const C = g.convoy; if (!C || C.done) return false;
    for (const v of C.v) if (!v.dead && !v.out && Math.abs(b.x - v.x) < 52 && Math.abs(b.y - v.y) < 14 + b.r) {
      v.hp -= b.kind === 'bomb' || b.kind === 'mine' ? 2 : 1; v.fl = 0.12; g.spark(b.x, b.y, '#F2D58A', 4, 120);
      if (v.hp <= 0) { v.dead = true; g.explode(v.x, v.y, 90, g.Wd.boom); SFX.play('boom'); g.floatText(v.x, v.y - 30, tx_('idea.convoyLost'), '#D9705F'); }
      return true;
    }
    return false;
  },
  endConvoy(g) {
    const C = g.convoy; C.done = true;
    const n = Math.round(C.saved * (15 + g.d) * g.S.cred); g.cr += n;
    UI.banner(tx_('idea.convoyEnd', { k: C.saved, n: C.n }), C.saved ? tx_('game.squadCr', { n }) : ''); SFX.play(C.saved ? 'star' : 'deny');
  },

  /* ---------------- Molette radio ---------------- */
  radio(g, done) {
    const pool = WORLDS.map((_, u) => u).filter(u => u !== g.wi), mods = ['rich', 'xp', 'shield'], opts = [];
    for (let i = 0; i < 3 && pool.length; i++) opts.push({ u: pool.splice(randi(0, pool.length - 1), 1)[0], mod: mods.splice(randi(0, mods.length - 1), 1)[0] });
    g.state = 'radio'; g.keys = {}; g.ptr = null;
    g.radioCb = i => {
      const o = opts[i] || opts[0]; g.radioCb = null; g.state = 'play'; g.radioMod = o.mod;
      if (o.mod === 'shield') g.shieldUp(1);
      done(o.u);
    };
    UI.showRadio(opts);
  },
  crMul(g) { return g.radioMod === 'rich' ? 1.5 : 1; },
  xpMul(g) { return g.radioMod === 'xp' ? 1.4 : 1; },

  /* ---------------- Boss qui apprend ---------------- */
  lane(g) {
    if (!this.on('bossLearn')) return -1;
    const z = g.learn.zone, tot = z[0] + z[1] + z[2]; if (tot < 4) return -1;
    let k = 0; for (let i = 1; i < 3; i++) if (z[i] > z[k]) k = i;
    return z[k] / tot > 0.42 ? k : -1;
  },
  bossStart(g) {
    if (!this.on('bossLearn')) return;
    const m = (Store.d.learn || {})[g.Wd.key];
    if (m != null && m >= 0) { g.learn.zone[m] = 6; g.learn.zone[(m + 1) % 3] = 1; g.learn.zone[(m + 2) % 3] = 1; setTimeout(() => g.running && UI.hintText(tx_('idea.remember'), 2600), 1800); }
  },
  bossNext(g, B) {
    const P = B.Bd.pats;
    if (!this.on('bossLearn') || B.phase < 2) { B.patI = (B.patI + 1) % P.length; return P[B.patI]; }
    // phases 2 et 3 : il reprend plus souvent les attaques qui t'ont touché, jamais deux fois de suite la même
    const L = P.filter(p => p !== B.cur).map(p => ({ p, w: 1 + 1.5 * (g.learn.hits[p] || 0) }));
    return weighted(L).p;
  },
  onHurt(g) { const B = g.boss; if (B && B.cur && this.on('bossLearn')) g.learn.hits[B.cur] = (g.learn.hits[B.cur] || 0) + 1; },
  onPhase(g, n) {
    if (n !== 2 || g.learn.told) return; const k = this.lane(g); if (k < 0) return;
    g.learn.told = true; setTimeout(() => g.running && UI.banner(tx_('idea.learnT'), tx_('idea.learnS' + k)), 1300);
  },
  // trou du mur : loin de ton couloir préféré ; pluie : une goutte sur deux au-dessus de lui
  gapX(g) { const k = this.lane(g); if (k < 0) return rand(90, W - 90); const far = k === 1 ? (Math.random() < 0.5 ? 0 : 2) : 2 - k; return clamp(W * (far + 0.5) / 3 + rand(-30, 30), 90, W - 90); },
  rainX(g) { const k = this.lane(g); return k >= 0 && Math.random() < 0.5 ? W * (k + rand(0.05, 0.95)) / 3 : rand(20, W - 20); },
  bossEnd(g) {
    if (!this.on('bossLearn') || !g.Wd) return;
    const k = this.lane(g); (Store.d.learn || (Store.d.learn = {}))[g.Wd.key] = k; Store.save();
  },

  /* ---------------- dessin ---------------- */
  draw(g, c) {
    const t = g.t, p = g.p;
    // convoi : cargos qui traversent, barre de coque verte
    const C = g.convoy;
    if (C && !C.done) for (const v of C.v) if (!v.dead && !v.out) {
      Art.draw(c, 'convoy', v.x, v.y, 44, Math.PI / 2, false, 1, v.fl > 0 ? 0.8 : 0);
      g.hpBar(c, v.x, v.y - 34, 52, 5, v, '#8AD6A8');
    }
    // Écho : silhouette translucide du vaisseau, en retard
    const E = g.echo;
    if (E && E.h.length >= 3 && g.state !== 'end') { c.save(); c.globalAlpha = 0.28; Art.draw(c, g.pSpr, E.h[0], E.h[1], g.pW, 0); c.restore(); }
    // Accord : barres de signal (1 à 3) à droite du vaisseau, onde dorée pendant la résonance
    if (this.on('accord') && g.acc.n > 0 && g.state === 'play') { c.fillStyle = 'rgba(242,213,138,.8)'; for (let i = 0; i < g.acc.n; i++) c.fillRect(p.x + 34 + i * 5, p.y + 8 - i * 4, 3, 6 + i * 4); }
  },
  // par-dessus tout : brouillage du haut de l'écran pendant que le parasite est accroché
  drawTop(g, c) {
    // Accord : onde dorée sous le vaisseau pendant la résonance (par-dessus le bouclier)
    if (g.accT > 0 && g.p) {
      const p = g.p, t = g.t; c.save(); c.strokeStyle = '#F2D58A'; c.globalAlpha = Math.min(1, g.accT) * 0.85; c.lineWidth = 2.5; c.beginPath();
      for (let i = 0; i <= 30; i++) { const x = p.x - 45 + i * 3, y = p.y + g.shRy + 16 + Math.sin(i * 0.7 - t * 14) * 5 * Math.sin(i / 30 * Math.PI); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.restore();
    }
    const P = g.para; if (!P || !P.att) return;
    const r = seeded(Math.floor(g.t * 14) + 5);
    for (let i = 0; i < 5; i++) { const y = r() * 120, h = 1 + r() * 7; c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.35)'; c.fillRect(0, y, W, h); }
    c.fillStyle = 'rgba(120,255,240,.18)'; c.fillRect(r() * W, r() * 110, 40 + r() * 80, 3);
  },
};
// alias local de tx (lang.js) : lisible dans ce fichier où « tx » sert aussi de coordonnée
const tx_ = (k, v) => tx(k, v);
