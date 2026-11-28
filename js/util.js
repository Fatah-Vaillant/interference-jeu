'use strict';
/* =========================================================
   INTERFÉRENCE — utilitaires communs
   ========================================================= */
const TAU = Math.PI * 2;
let W = 540, H = 960;            // résolution logique (H s'adapte à l'écran)

const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const pick = a => a[Math.floor(Math.random() * a.length)];
// hasard des effets purement visuels (étincelles, éclats, fumée) : générateur séparé, pour que les effets
// ne changent jamais le déroulé d'une partie (même empreinte du smoke quoi qu'on dessine)
let _vs = 0x9E3779B9;
const vrnd = () => { _vs = (_vs + 0x6D2B79F5) | 0; let t = Math.imul(_vs ^ (_vs >>> 15), 1 | _vs); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const vrand = (a, b) => a + vrnd() * (b - a);
const d2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const bez = (a, b, c, d, t) => { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; };
const fmt = n => Math.round(n).toLocaleString(typeof I18N !== 'undefined' ? I18N.locale() : 'fr-FR');
// grands nombres abrégés à partir d'un million : 1,2 M · 45,3 M · 999 M · 1,2 Md (unités dans lang.js)
const fmtBig = n => {
  n = Math.floor(n); if (n < 1e6) return fmt(n);
  const [v, k] = n < 1e9 ? [n / 1e6, 'num.M'] : [n / 1e9, 'num.Md'], d = v < 100 ? 1 : 0, r = Math.floor(v * 10 ** d) / 10 ** d;
  return tx(k, { n: r.toLocaleString(typeof I18N !== 'undefined' ? I18N.locale() : 'fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: d }) });
};
const pad2 = n => String(n).padStart(2, '0');

function weighted(list, key = 'w') {
  let tot = 0; for (const it of list) tot += it[key];
  let r = Math.random() * tot;
  for (const it of list) { r -= it[key]; if (r <= 0) return it; }
  return list[list.length - 1];
}

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ---------- sauvegarde ----------
   Sauvegarde versionnée : SAVE_VERSION augmente à chaque changement de format, et MIGRATIONS[v] transforme
   une sauvegarde v en v + 1. Une copie de secours (clé _bak_vN) est gardée avant toute migration.
   Règles : ne jamais supprimer une migration, ne jamais réutiliser une clé pour un autre sens, toujours ajouter un test (tests/run.js). */
// nombre de missions de la campagne : 12 univers × 5 missions (doit suivre WORLDS.length × 5, vérifié par tests/run.js)
const NMIS = 60;
const SAVE_VERSION = 6;
const MIGRATIONS = {
  // v2 → v3 : l'infini passe de 6 à 3 paliers (anciens records 3, 4, 5 → 0, 1, 2), étoiles « parfait », compétences visibles en jeu
  2(d) {
    if (d.bestV !== 2) { const o = d.best || {}; d.best = { t0: o.t3 || 0, t1: o.t4 || 0, t2: o.t5 || 0 }; }
    delete d.bestV;
    if (!Array.isArray(d.perf) || d.perf.length !== 50) d.perf = Array(50).fill(false); // format v3 : 50 missions (ne pas changer)
    d.set = Object.assign({ hudSk: true }, d.set || {});
  },
  // v3 → v4 : deux univers de plus (« 1902 » et « Relief ») : 50 → 60 missions, progression gardée
  3(d) {
    const grow = (a, v) => (Array.isArray(a) ? a.concat(Array(Math.max(0, NMIS - a.length)).fill(v)) : Array(NMIS).fill(v));
    d.stars = grow(d.stars, 0); d.done = grow(d.done, false); d.perf = grow(d.perf, false);
  },
  // v4 → v5 (retours n° 3) : coque, canon, onde, ultime deviennent propres à chaque vaisseau. Sans perte : chaque vaisseau
  // possédé reçoit les niveaux déjà achetés ; aimant et prime restent au compte (d.upg)
  4(d) {
    const o = d.upg || {}, ship = {}; for (const k of ['hull', 'cannon', 'onde', 'ult']) if (o[k]) ship[k] = o[k];
    d.supg = {}; for (const id of (Array.isArray(d.owned) ? d.owned : ['if50'])) d.supg[id] = Object.assign({}, ship);
    d.upg = {}; for (const k of ['magnet', 'credit']) if (o[k]) d.upg[k] = o[k];
  },
  // v5 → v6 (retours n° 3) : un palier « Normal » s'insère devant l'Infini ; les records des paliers 0, 1, 2 passent en 1, 2, 3
  5(d) {
    const o = d.best || {}, n = {};
    for (const k in o) { const m = /^([twp])(\d+)$/.exec(k); n[m ? m[1] + (+m[2] + 1) : k] = o[k]; }
    d.best = n;
  },
};
// améliorations propres à chaque vaisseau (les autres sont au compte) — doit suivre SHIP_UPG (js/data.js)
const SHIP_KEYS = ['hull', 'cannon', 'rate', 'onde', 'ult'];
const Store = {
  KEY: 'interference_v2',
  d: null,
  def() {
    return {
      v: SAVE_VERSION, credits: 0, owned: ['if50'], ship: 'if50', upg: {}, supg: {},
      stars: Array(NMIS).fill(0), done: Array(NMIS).fill(false), perf: Array(NMIS).fill(false), best: {}, seen: {}, learn: {}, fus: {}, fails: {}, reach: {}, pxp: 0, rank: 1,
      stats: { kills: 0, missions: 0, combo: 0, time: 0, grazes: 0, ults: 0 },
      set: { lang: 'fr', vol: 0.7, vib: true, auto: true, shake: true, fx: true, hudSk: true, ts: 1, sens: 1.3, calm: typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches, dev: false, devHit: false, devFps: false, devSkill: '' },
    };
  },
  load() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(this.KEY)); } catch (e) { s = null; }
    if (!s || typeof s !== 'object' || Array.isArray(s)) s = null;
    const migrated = s ? this.migrate(s) : false;
    this.d = this.fill(s);
    if (migrated) this.save();
  },
  // complète une sauvegarde lue (champs manquants, tableaux de la bonne longueur)
  fill(s) {
    const d = Object.assign(this.def(), s || {});
    d.set = Object.assign(this.def().set, (s && s.set) || {});
    d.stats = Object.assign(this.def().stats, (s && s.stats) || {});
    if (!Array.isArray(d.stars) || d.stars.length !== NMIS) d.stars = Array(NMIS).fill(0);
    if (!Array.isArray(d.done) || d.done.length !== NMIS) d.done = Array(NMIS).fill(false);
    if (!Array.isArray(d.perf) || d.perf.length !== NMIS) d.perf = Array(NMIS).fill(false);
    if (!d.supg || typeof d.supg !== 'object' || Array.isArray(d.supg)) d.supg = {};
    return d;
  },
  // applique les migrations dans l'ordre ; une sauvegarde d'une version plus récente n'est pas touchée
  migrate(s, bak = true) {
    let v = Number.isInteger(s.v) ? s.v : 2;
    if (v >= SAVE_VERSION) return false;
    if (bak) try { localStorage.setItem(this.KEY + '_bak_v' + v, JSON.stringify(s)); } catch (e) { /* stockage plein : on migre quand même */ }
    while (v < SAVE_VERSION) { MIGRATIONS[v](s); v++; s.v = v; }
    return true;
  },

  /* code de transfert (Profil → Sauvegarde) : « IF1.<base64 du JSON>.<somme> ».
     Seule la progression voyage ; les réglages restent ceux de l'appareil. La somme détecte un code tronqué ou retouché. */
  CODE: 'IF1',
  sum(t) { let h = 0x811c9dc5; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36); },
  // les tableaux de missions voyagent en chaînes de chiffres (« 3302… », « 1100… ») pour un code 3 fois plus court
  exportCode() {
    const p = Object.assign({}, this.d); delete p.set;
    p.stars = p.stars.join(''); p.done = p.done.map(Number).join(''); p.perf = p.perf.map(Number).join('');
    const b = btoa(unescape(encodeURIComponent(JSON.stringify(p))));
    return this.CODE + '.' + b + '.' + this.sum(b);
  },
  // lit un code sans rien modifier : { d } (sauvegarde complète, migrée) ou { err: 'bad' | 'sum' | 'newer' }
  readCode(code) {
    const parts = String(code || '').replace(/\s+/g, '').split('.');
    if (parts.length !== 3 || parts[0] !== this.CODE || !parts[1]) return { err: 'bad' };
    if (this.sum(parts[1]) !== parts[2]) return { err: 'sum' };
    let s;
    try { s = JSON.parse(decodeURIComponent(escape(atob(parts[1])))); } catch (e) { return { err: 'bad' }; }
    if (!s || typeof s !== 'object' || Array.isArray(s) || !Number.isFinite(s.credits) || !Array.isArray(s.owned)) return { err: 'bad' };
    if (Number.isInteger(s.v) && s.v > SAVE_VERSION) return { err: 'newer' };
    if (typeof s.stars === 'string') s.stars = [...s.stars].map(c => Math.min(3, +c || 0));
    for (const k of ['done', 'perf']) if (typeof s[k] === 'string') s[k] = [...s[k]].map(c => c === '1');
    this.migrate(s, false);
    delete s.set;
    const d = this.fill(s);
    d.credits = Math.max(0, Math.floor(d.credits));
    const known = typeof CHASSIS !== 'undefined' ? Object.keys(CHASSIS) : null;
    d.owned = [...new Set(['if50'].concat(d.owned.filter(id => typeof id === 'string' && (!known || known.includes(id)))))];
    if (!d.owned.includes(d.ship)) d.ship = 'if50';
    return { d };
  },
  // remplace la progression par celle du code (copie de secours de l'ancienne gardée) ; renvoie '' ou le code d'erreur
  importCode(code) {
    const r = this.readCode(code);
    if (r.err) return r.err;
    try { localStorage.setItem(this.KEY + '_bak_import', JSON.stringify(this.d)); } catch (e) { /* stockage plein */ }
    r.d.set = this.d.set; this.d = r.d; this.save();
    return '';
  },
  save() { try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); } catch (e) { /* stockage indisponible */ } },
  reset() { const set = this.d.set; this.d = this.def(); this.d.set = set; this.save(); },
  worldOpen(u) { return u === 0 || this.d.done[(u - 1) * 5 + 4]; },
  // mode Infini : ouvert après la fréquence 02 (retours n° 3) ; reste ouvert pour qui y a déjà joué
  infOpen() { return !!this.d.done[1 * 5 + 4] || Object.keys(this.d.best || {}).some(k => /^w\d+$/.test(k) && this.d.best[k] > 0); },
  // palier i de l'Infini : le premier toujours ; les suivants en atteignant la vague TIER_OPEN du précédent (ou déjà joués)
  tierOpen(i) { const b = this.d.best || {}; return i === 0 || (b['w' + (i - 1)] || 0) >= TIER_OPEN || (b['w' + i] || 0) > 0; },
  missionOpen(u, m) { return this.worldOpen(u) && (m === 0 || this.d.done[u * 5 + m - 1]); },
  // niveau d'une amélioration : propre au vaisseau (ship, par défaut celui équipé) ou du compte
  upg(id, ship) { if (!SHIP_KEYS.includes(id)) return this.d.upg[id] || 0; const S = this.d.supg[ship || this.d.ship]; return (S && S[id]) || 0; },
  setUpg(id, v, ship) { if (!SHIP_KEYS.includes(id)) { this.d.upg[id] = v; return; } const k = ship || this.d.ship; (this.d.supg[k] || (this.d.supg[k] = {}))[id] = v; },
};
