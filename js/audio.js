'use strict';
/* =========================================================
   Bruitages synthétisés (Web Audio).
   Aucune musique, aucune mélodie, aucun instrument :
   souffle filtré, clics et glissements courts uniquement.
   ========================================================= */
const SFX = (() => {
  let ctx = null, master = null, comp = null, nbuf = null, vol = 0.7, ebus = null, dest = null;
  const last = {};

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.12;
      master = ctx.createGain(); master.gain.value = vol;
      master.connect(comp).connect(ctx.destination);
      // tirs ennemis sur un bus atténué : en Infini ils sont des dizaines et couvraient les armes du joueur (retours n° 2 : l'arc semblait muet)
      ebus = ctx.createGain(); ebus.gain.value = 0.5; ebus.connect(master); dest = master;
      nbuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
      const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; }
  }

  function env(g, a, dur, att = 0.004) {
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(a, 0.0002), t + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  // bruit filtré, éventuellement balayé
  function N(dur, f, q, a, type = 'bandpass', fTo, att) {
    const s = ctx.createBufferSource(); s.buffer = nbuf;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    if (fTo) fl.frequency.exponentialRampToValueAtTime(fTo, ctx.currentTime + dur);
    const g = ctx.createGain(); env(g, a, dur, att);
    s.connect(fl).connect(g).connect(dest || master);
    s.start(0, Math.random() * 0.5); s.stop(ctx.currentTime + dur + 0.05);
  }
  // glissement court (jamais une suite de notes)
  function S(f0, f1, dur, a, type = 'sine', att) {
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), ctx.currentTime + dur);
    const g = ctx.createGain(); env(g, a, dur, att);
    o.connect(g).connect(dest || master); o.start(); o.stop(ctx.currentTime + dur + 0.05);
  }

  const lib = {
    // interface
    tap:      () => N(0.03, 3200, 2, 0.10, 'bandpass'),
    soft:     () => N(0.05, 1800, 1.2, 0.07, 'bandpass'),
    swipe:    () => N(0.18, 900, 0.8, 0.06, 'bandpass', 3200),
    confirm:  () => { N(0.05, 2600, 3, 0.09); setTimeout(() => ctx && N(0.05, 3400, 3, 0.08), 70); },
    deny:     () => S(240, 200, 0.09, 0.05, 'triangle'),
    buy:      () => { N(0.25, 600, 0.7, 0.10, 'bandpass', 5000); S(400, 1600, 0.2, 0.04, 'sine'); },
    // armes du joueur
    imp:      () => S(1600, 520, 0.045, 0.028, 'square'),
    plasma:   () => { N(0.10, 420, 1.2, 0.09, 'lowpass', 160); S(260, 120, 0.09, 0.05, 'sine'); },
    // arc : le grésillement aigu apprécié, plus présent (corps en bande moyenne) pour rester audible sous les tirs ennemis
    arc:      () => { N(0.06, 5200, 1.5, 0.10, 'highpass', 2600); N(0.05, 2300, 2.2, 0.07, 'bandpass', 1400); },
    rail:     () => { N(0.16, 2800, 0.7, 0.12, 'bandpass', 400); S(110, 50, 0.16, 0.10, 'sine'); },
    swarm:    () => N(0.14, 1200, 0.9, 0.05, 'bandpass', 3200, 0.03),
    // tirs ennemis (selon l'univers)
    e_zap:    () => N(0.05, 2400, 3, 0.04),
    e_tick:   () => N(0.03, 4200, 6, 0.05),
    e_bloop:  () => { N(0.10, 700, 4, 0.06, 'bandpass', 260); },
    e_mg:     () => N(0.04, 1500, 0.8, 0.05, 'bandpass'),
    e_wind:   () => N(0.12, 2600, 0.6, 0.03, 'bandpass', 1200),
    e_flak:   () => N(0.08, 500, 0.8, 0.07, 'lowpass', 200),
    e_soft:   () => S(900, 600, 0.06, 0.025, 'sine'),
    e_pew:    () => S(1400, 380, 0.08, 0.03, 'sawtooth'),
    e_servo:  () => N(0.07, 3600, 2, 0.04, 'bandpass', 1800),
    e_glitch: () => { N(0.03, 6000, 8, 0.05); setTimeout(() => ctx && N(0.02, 900, 8, 0.05), 30); },
    // impacts
    // frappe : jamais deux fois la même (hauteur et timbre tirés à chaque coup)
    hit:      () => N(0.03 + Math.random() * 0.015, 3000 + Math.random() * 1400, 4 + Math.random() * 3, 0.055),
    // combo : petit claquement de bruit filtré, un demi-ton plus haut à chaque palier (k), jamais une suite de notes
    combo:    (k = 0) => N(0.07, 1800 * Math.pow(2, Math.min(k, 18) / 12), 9, 0.07),
    comboBreak: () => N(0.18, 900, 1.2, 0.07, 'lowpass', 200),
    alarm:    () => { N(0.32, 700, 6, 0.10, 'bandpass', 1100); },
    crit:     () => N(0.06, 5200, 3, 0.09, 'highpass'),
    shield:   () => N(0.07, 6200, 10, 0.07),
    pop:      () => N(0.14, 1300, 0.9, 0.12, 'bandpass', 260),
    boom:     () => N(0.55, 520, 0.7, 0.32, 'lowpass', 50),
    bigboom:  () => { N(1.3, 400, 0.6, 0.5, 'lowpass', 35); S(90, 30, 1, 0.18, 'sine'); },
    hurt:     () => { N(0.4, 260, 0.6, 0.35, 'lowpass', 45); S(320, 70, 0.3, 0.07, 'sawtooth'); },
    graze:    () => N(0.025, 7000, 4, 0.035, 'highpass'),
    splash:   () => N(0.35, 1400, 0.6, 0.1, 'lowpass', 300),
    dust:     () => N(0.35, 300, 0.5, 0.14, 'lowpass', 80),
    // ramassage
    cr:       () => N(0.03, 6500, 9, 0.04),
    xp:       () => N(0.02, 8000, 10, 0.02),
    gift:     () => { S(300, 1800, 0.16, 0.05, 'triangle'); N(0.16, 2000, 1, 0.05, 'bandpass', 6000); },
    up:       () => { S(500, 2600, 0.22, 0.05, 'triangle'); },
    // fusion / forme ultime : souffle qui monte et scintillement
    fuse:     () => { N(0.9, 500, 0.8, 0.16, 'bandpass', 6000, 0.35); S(220, 1800, 0.7, 0.05, 'triangle', 0.3); },
    // petite fanfare de la capsule : deux glissés montants puis un éclat (bruitage, aucune mélodie)
    fanfare:  () => { S(420, 1300, 0.16, 0.05, 'triangle'); setTimeout(() => ctx && S(640, 2000, 0.2, 0.05, 'triangle'), 110); setTimeout(() => ctx && N(0.5, 5200, 2, 0.08, 'bandpass', 9000, 0.05), 230); },
    level:    () => { N(0.6, 300, 0.7, 0.12, 'bandpass', 4000, 0.2); S(200, 900, 0.5, 0.05, 'sine', 0.2); },
    // onde & ultime
    ready:    () => { N(0.05, 3000, 6, 0.08); setTimeout(() => ctx && N(0.05, 3000, 6, 0.08), 110); },
    onde:     () => { N(0.7, 180, 0.6, 0.45, 'lowpass', 6000); S(60, 900, 0.35, 0.12, 'sine'); },
    ultcharge:() => { N(0.8, 200, 1, 0.2, 'bandpass', 6000, 0.6); S(80, 1200, 0.8, 0.07, 'sawtooth', 0.6); },
    ultfire:  () => { N(1.8, 260, 0.5, 0.55, 'lowpass', 40); N(0.6, 4000, 0.8, 0.2, 'highpass', 900); },
    beamwarn: () => N(0.3, 2600, 14, 0.05),
    beam:     () => N(0.6, 160, 0.6, 0.3, 'lowpass', 1200),
    clear:    () => N(0.4, 700, 0.8, 0.10, 'bandpass', 5200),
    star:     () => N(0.06, 4200, 5, 0.09),
    perfect:  () => { N(0.9, 1500, 1.2, 0.12, 'bandpass', 9000, 0.15); S(700, 2800, 0.6, 0.04, 'triangle', 0.1); },
    phase:    () => { N(1.1, 90, 0.5, 0.4, 'lowpass', 2400); },
    beep:     () => S(1050, 1046, 0.09, 0.025, 'sine'),
  };

  return {
    init,
    play(n, gap = 26, arg) {
      if (!ctx || vol <= 0 || !lib[n]) return;
      const now = performance.now(); if (last[n] && now - last[n] < gap) return; last[n] = now;
      dest = n.startsWith('e_') ? ebus : master;
      try { lib[n](arg); } catch (e) { /* audio indisponible */ }
      dest = master;
    },
    setVol(v) { vol = v; if (master) master.gain.value = v; },
    // vibrations dosées (retours n° 3) : désactivables (réglage « Vibrer »), jamais plus d'une toutes les CONFIG.feel.vibGap ms ;
    // force : 1 = discrète (destructions, combo), 2 = coup reçu, 3 = événement (boss, ultime) — les discrètes cèdent la place aux autres
    vib(ms, force = 2) {
      try {
        if (!Store.d || !Store.d.set.vib || !navigator.vibrate) return;
        const now = performance.now(), gap = (CONFIG.feel && CONFIG.feel.vibGap) || 110;
        if (now - (this.vT || -1e9) < gap * (force >= 3 ? 0.3 : 1) && force <= (this.vF || 0)) return;
        this.vT = now; this.vF = force; navigator.vibrate(ms);
      } catch (e) { /* non supporté */ }
    },
  };
})();
