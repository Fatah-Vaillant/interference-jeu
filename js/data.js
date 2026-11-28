'use strict';
/* =========================================================
   INTERFÉRENCE — données de jeu
   ========================================================= */

// Archétypes d'ennemis. s = emplacement du sprite dans l'univers (0..5)
const ARCH = {
  grunt:    { s: 0, w: 46, hp: 1.6, pts: 10, xp: 1, cr: 0.30, fire: 'straight' },
  gunner:   { s: 1, w: 42, hp: 1.8, pts: 20, xp: 2, cr: 0.40, fire: 'aim' },
  heavy:    { s: 2, w: 68, hp: 7.5, pts: 60, xp: 5, cr: 0.85, fire: 'spread', gift: 0.07 },
  diver:    { s: 3, w: 38, hp: 1.5, pts: 25, xp: 2, cr: 0.35, fire: 'aim', dive: true },
  kamikaze: { s: 3, w: 36, hp: 1.2, pts: 25, xp: 2, cr: 0.30, fire: null, kami: true },
  splitter: { s: 2, w: 54, hp: 3.6, pts: 35, xp: 3, cr: 0.50, fire: 'straight', split: true },
  shield:   { s: 4, w: 54, hp: 5.5, pts: 70, xp: 5, cr: 0.90, fire: null, gen: true, gift: 0.1 },
  bomber:   { s: 4, w: 54, hp: 4.8, pts: 50, xp: 4, cr: 0.70, fire: 'mine' },
  mini:     { s: 5, w: 28, hp: 0.8, pts: 5, xp: 1, cr: 0.10, fire: null },
};
// [archétype, difficulté minimale, poids] ; kamikazes rares (retour du 22/11 : « en petite dose »), lourds dès le début
const ARCH_UNLOCK = [['grunt', 0, 5], ['gunner', 0, 2.4], ['heavy', 0, 1.6], ['diver', 3, 1.5], ['kamikaze', 6, 0.35], ['bomber', 8, 0.8], ['splitter', 12, 1], ['shield', 16, 0.55]];

// Couleurs des armes : toujours FROIDES (cyan, azur, lavande, blanc, menthe) ; les tirs ennemis sont chauds (retours n° 2 : on les confondait).
// Familles d'armes (niveaux 1 à 10). Une valeur « [a, b] » vaut a + b × niveau ; un tableau de 10 valeurs se lit au niveau.
// fire = motif de tir lu par le moteur : 'spread' (gerbe), 'chain' (arc qui rebondit), 'rail' (rayon), 'swarm' (missiles à tête chercheuse).
const WEAPONS = {
  imp:    { col: '#6FDCF0', sfx: 'imp', sfxGap: 60, fire: 'spread', shot: 'imp', n: [1, 2, 3, 3, 4, 5, 5, 6, 7, 7], spread: 0.065, spreadMax: 0.42, gap: 5, speed: 900, dmg: [1, 0.09], cd: [0.12, 0], cdFast: [7, 0.85], helixAt: 10 },
  plasma: { col: '#5FA2FF', sfx: 'plasma', fire: 'spread', shot: 'plasma', n: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5], spread: 0.12, gap: 0, speed: 560, dmg: [2.2, 0.25], cd: [0.3, -0.01], splash: [26, 3.5] },
  arc:    { col: '#B9A8F0', sfx: 'arc', fire: 'chain', range: [720, 20], chains: [1, 0.5], dmg: [0.95, 0.13], forkAt: 10, cd: [0.15, -0.004] },
  rail:   { col: '#EAF1FA', sfx: 'rail', fire: 'rail', lines: [1, 1, 1, 1, 1, 2, 2, 2, 3, 3], offsets: { 1: [0], 2: [-12, 12], 3: [-18, 0, 18] }, dmg: [4.2, 0.65], width: [7, 1], cd: [0.55, -0.024] },
  // missiles nettement affaiblis (retours n° 2 : ils tuaient tout instantanément) : moins nombreux, moins forts, ne traversent pas, virent moins sec
  swarm:  { col: '#7FE3AE', sfx: 'swarm', fire: 'swarm', shot: 'missile', n: [1, 2, 2, 2, 3, 3, 3, 4, 4, 4], speed: 260, dmg: [1.25, 0.11], cd: [0.42, -0.012], turn: 4.2, maxSp: 560 },
};
const lin = (v, L) => v[0] + L * v[1]; // valeur « [a, b] » au niveau L
const FAMS = Object.keys(WEAPONS);

// Icônes au trait (24×24)
const ICONS = {
  rate: 'M5 18L9 6M11 18L15 6M17 18L21 6',
  dmg: 'M12 3L14.5 9.5L21 12L14.5 14.5L12 21L9.5 14.5L3 12L9.5 9.5Z',
  diag: 'M12 20V6M12 6L8 10M12 6L16 10M5 19L9 9M19 19L15 9',
  bounce: 'M4 18L10 6L16 18L20 10',
  pierce: 'M3 12H21M17 8L21 12L17 16M8 7V17M12 7V17',
  crit: 'M12 3V7M12 17V21M3 12H7M17 12H21M12 9A3 3 0 1 0 12.01 9',
  rico: 'M4 20L12 8L20 14M12 8L10 3',
  drone: 'M12 4L16 12L12 20L8 12Z M3 12H7M17 12H21',
  orbit: 'M12 5A7 7 0 1 1 11.99 5M12 2V5M19 12H22',
  magnet: 'M6 4V12A6 6 0 0 0 18 12V4M6 8H10M14 8H18',
  hull: 'M12 3L20 7V12C20 16 16.5 19.5 12 21C7.5 19.5 4 16 4 12V7Z',
  heal: 'M12 4L19 8V16L12 20L5 16V8Z M12 12V20M12 12L19 8M12 12L5 8',
  onde: 'M2 12C5 6 7 6 9 12C11 18 13 18 15 12C17 6 19 6 22 12',
  ult: 'M13 2L5 14H11L10 22L19 9H13Z',
  graze: 'M4 16C8 16 10 8 14 8M14 8L12 5M14 8L17 6M18 14A2 2 0 1 0 18.01 14',
  wpn: 'M12 4V20M4 12H20M7 7L17 17M17 7L7 17',
  shards: 'M12 12L5 5M12 12L19 5M12 12L5 19M12 12L19 19M10 12A2 2 0 1 0 14 12A2 2 0 1 0 10 12',
  freeze: 'M12 3V21M4 7.5L20 16.5M20 7.5L4 16.5',
  storm: 'M12 2L7 13H12L10 22L18 9H13L15 2Z',
  revive: 'M4 12A8 8 0 1 0 7 6M4 4V8H8',
  fever: 'M12 3C15 7 18 9 18 14A6 6 0 0 1 6 14C6 11 8 9 9 7C10 10 11 11 12 11C12 8 11 6 12 3Z',
  // armes
  imp: 'M12 3V21M8 6V18M16 6V18',
  plasma: 'M12 3L17 10L12 17L7 10Z M9 19L8 22M15 19L16 22M12 19V22',
  arc: 'M13 2L6 13H12L10 22L18 10H12Z',
  rail: 'M7 3V21M17 3V21M12 6L14 12L12 18L10 12Z',
  swarm: 'M6 14L9 8L12 14M12 12L15 6L18 12M9 20L12 14L15 20',
  // améliorations permanentes
  credit: 'M12 3L20 12L12 21L4 12Z',
};

// Compétences gagnées en mission (montée de niveau, 1 parmi 3). Ajouter une compétence = une entrée ici + un dessin (icons.js) + son texte (lang.js).
// r = rareté (1 commun … 4 légendaire), max = niveau maximum.
// fx : effets déclaratifs cumulés par le moteur (Game.mod) : { stat, add, base } → base (si niveau ≥ 1) + add × niveau.
//      Statistiques reconnues : voir STATS ci-dessous et docs/AJOUTER.md.
// take : effets immédiats à la prise ({ shield, shieldMax, weapon }) ; need : condition d'apparition (clé de NEEDS).
// free : effet immédiat qui n'occupe pas d'emplacement (CONFIG.skills.maxActive compétences différentes au plus).
// Gains décroissants (CONFIG.skills.decay) sur toutes les statistiques, sauf les entières (INT_STATS).
const SKILLS = [
  { id: 'rate', r: 1, max: 5, fx: [{ stat: 'fire', add: 0.12 }] },
  { id: 'dmg', r: 1, max: 5, fx: [{ stat: 'dmg', add: 0.15 }] },
  { id: 'magnet', r: 1, max: 2, fx: [{ stat: 'magnet', add: 0.6 }] },
  { id: 'heal', r: 1, max: 3, need: 'hpNotFull', take: { hp: 1 }, free: true },
  { id: 'onde', r: 1, max: 3, fx: [{ stat: 'ondeCharge', add: 0.3 }] },
  { id: 'pierce', r: 2, max: 3, fx: [{ stat: 'pierce', add: 1 }] },
  { id: 'bounce', r: 2, max: 2, fx: [{ stat: 'bounce', add: 1 }] },
  { id: 'crit', r: 2, max: 4, fx: [{ stat: 'crit', add: 0.1 }] },
  { id: 'drone', r: 2, max: 3, fx: [{ stat: 'drones', add: 1 }] },
  { id: 'orbit', r: 2, max: 3, fx: [{ stat: 'orbs', add: 1 }] }, // 3 orbes au plus (CONFIG.skills.orbsMax)
  { id: 'hull', r: 2, max: 3, take: { shieldMax: 1, shield: 1 } },
  { id: 'ult', r: 2, max: 3, fx: [{ stat: 'ultCharge', add: 0.3 }] },
  { id: 'freeze', r: 3, max: 2, fx: [{ stat: 'freeze', add: 0.08 }] },
  { id: 'shards', r: 3, max: 2, fx: [{ stat: 'shards', base: 2, add: 2 }] },
  { id: 'diag', r: 3, max: 2, fx: [{ stat: 'diag', add: 1 }] },
  { id: 'rico', r: 3, max: 2, fx: [{ stat: 'rico', add: 0.5 }] },
  { id: 'wpn', r: 4, max: 3, need: 'weaponNotMax', take: { weapon: 1 }, free: true },
  { id: 'storm', r: 3, max: 2, fx: [{ stat: 'storm', base: 2, add: 1 }] },
  { id: 'graze', r: 4, max: 1, fx: [{ stat: 'grazeGain', add: 1 }, { stat: 'grazeBuff', add: 2 }] },
  { id: 'revive', r: 4, max: 1, fx: [{ stat: 'revive', add: 1 }] },
  { id: 'fever', r: 4, max: 1, fx: [{ stat: 'fever', add: 0.3 }] },
  { id: 'echo', r: 2, max: 2, need: 'echoOn', fx: [{ stat: 'echo', base: 0.1, add: 0.25 }] }, // idée du bloc 4 devenue compétence (bilan, point 1)
  // fusions (PLAISIR §11) : deux compétences montées au maximum fusionnent en une nouvelle (une fois par partie).
  // fuse = les deux compétences d'origine ; la carte de fusion est toujours proposée dès qu'elle est possible ; n'occupe pas d'emplacement.
  { id: 'fRico', r: 4, max: 1, fuse: ['bounce', 'pierce'], fx: [{ stat: 'pierce', add: 2 }, { stat: 'rico', add: 0.6 }] },
  { id: 'fSquad', r: 4, max: 1, fuse: ['drone', 'rate'], fx: [{ stat: 'drones', add: 2 }, { stat: 'droneRate', add: 1 }] },
  { id: 'fStorm', r: 4, max: 1, fuse: ['storm', 'crit'], fx: [{ stat: 'storm', add: 2 }, { stat: 'crit', add: 0.15 }] },
  { id: 'fCrown', r: 4, max: 1, fuse: ['orbit', 'shards'], fx: [{ stat: 'orbs', add: 2 }, { stat: 'shards', add: 4 }] },
  { id: 'fFrost', r: 4, max: 1, fuse: ['freeze', 'diag'], fx: [{ stat: 'freeze', add: 0.12 }, { stat: 'diag', add: 2 }] },
  { id: 'fBlaze', r: 4, max: 1, fuse: ['fever', 'dmg'], fx: [{ stat: 'fever', add: 0.4 }, { stat: 'dmg', add: 0.25 }] },
  { id: 'fWall', r: 4, max: 1, fuse: ['hull', 'onde'], fx: [{ stat: 'ondeCharge', add: 0.4 }], take: { shieldMax: 1, shield: 2 } },
  { id: 'fPull', r: 4, max: 1, fuse: ['magnet', 'graze'], fx: [{ stat: 'magnet', add: 1 }, { stat: 'grazeGain', add: 1 }, { stat: 'grazeBuff', add: 2 }] },
];
// statistiques que le moteur sait lire (une compétence peut en combiner plusieurs)
const STATS = {
  fire: 'cadence +x (part)', dmg: 'dégâts +x (part)', magnet: 'rayon de ramassage +x (part)', ondeCharge: 'charge de l\'onde +x (part)', ultCharge: 'charge de l\'ultime +x (part)',
  pierce: 'tirs traversant x ennemis de plus', bounce: 'rebonds des tirs', crit: 'chance de critique +x', drones: 'drones d\'appui', orbs: 'orbes en orbite',
  freeze: 'chance de geler (par tir)', shards: 'éclats à la destruction', diag: 'paires de tirs obliques', rico: 'ricochet vers l\'ennemi voisin (part des dégâts)',
  storm: 'éclair tous les 10 impacts (cibles touchées)', grazeGain: 'gain des frôlements +x', grazeBuff: 'secondes de bonus de dégâts après un frôlement',
  revive: 'revient une fois par mission', droneRate: 'cadence des drones +x (part)', fever: 'dégâts +x au-delà de 25 de combo', echo: 'double du vaisseau qui rejoue ta trajectoire et tire (part des dégâts)',
};
// statistiques entières (un nombre de tirs, d'orbes, de drones…) : pas de gains décroissants
const INT_STATS = new Set(['pierce', 'bounce', 'drones', 'orbs', 'shards', 'diag', 'storm', 'revive']);
const NEEDS = { hpNotFull: g => g.p.hp < g.p.hpMax, weaponNotMax: g => g.p.wl < 10, echoOn: () => !!CONFIG.features.echo };
const RARITY = { 1: { col: '#EEF0F2', w: 10 }, 2: { col: '#4FA3FF', w: 5 }, 3: { col: '#A879FF', w: 3 }, 4: { col: '#F2B84B', w: 2 } }; // noms : lang.js (rar.N)

// Châssis du hangar (prix fixes, en crédits gagnés en jeu)
// hp = points de coque (PV), sh = charges de bouclier. Ordre du hangar = ordre de puissance : la navette de départ est
// nettement faible, chaque vaisseau suivant est clairement plus fort (contrôlé par tests/run.js).
// pas = capacité passive unique (retours n° 3, ANALYSE §3.2), texte lang.js ch.<id>.passive, effet lu par le moteur :
//   regen : le bouclier se recharge plus vite · crit : critiques · onde : charge de l'onde · graze : frôlements élargis et payés double
//   phase : traverse les tirs après l'Onde · drone : drone d'escorte · ultc : charge de l'ultime · omega : l'Onde charge aussi l'Ultime
const CHASSIS = {
  if50:     { spr: 'if50', pw: 78, hp: 3, sh: 1, speed: 340, dmg: 0.85, fire: 0.9, ult: 'beam', pas: 'regen', regenK: 0.7 },
  lame:     { spr: 'lame', pw: 74, hp: 3, sh: 1, speed: 430, dmg: 1, fire: 1, crit: 0.1, ult: 'blades', pas: 'crit' },
  columbiad:{ spr: 'columbiad', pw: 32, hp: 4, sh: 1, speed: 360, dmg: 1.05, fire: 1, onde: 0.25, ult: 'shell', pas: 'onde' },
  concorde: { spr: 'concorde', pw: 52, hp: 4, sh: 1, speed: 470, dmg: 1.1, fire: 1.12, ult: 'boom', pas: 'graze' },
  nautilus: { spr: 'nautilus', pw: 28, hp: 5, sh: 2, speed: 380, dmg: 1.15, fire: 1.1, pierce: 1, ult: 'ram', pas: 'phase' },
  bastion:  { spr: 'bastion', pw: 70, hp: 7, sh: 1, speed: 330, dmg: 1.15, fire: 1.05, drone: 1, ult: 'orbital', pas: 'drone' },
  apollo:   { spr: 'apollo', pw: 32, hp: 6, sh: 2, speed: 420, dmg: 1.3, fire: 1.25, ultc: 0.3, ult: 'saturn', pas: 'ultc' },
  omega:    { spr: 'omega', pw: 64, hp: 7, sh: 3, speed: 460, dmg: 1.4, fire: 1.3, onde: 0.15, ultc: 0.15, ult: 'reset', pas: 'omega' },
};
// univers « espace » : le joueur y choisit librement son vaisseau ; les univers historiques imposent leur véhicule d'époque
// (Wd.vehicle : char, sous-marin, Laté 28, destroyer ; Wd.era : un vaisseau du hangar prêté pour l'occasion, ex. le Columbiad)
const SPACE_WORLDS = [0, 6, 7, 8, 9];
// engin utilisé pour une mission : { spr, veh, era, imposed } ; en Infini, toujours le vaisseau choisi au hangar
function craftFor(mode, u, m, ship) {
  const Wd = typeof WORLDS !== 'undefined' ? WORLDS[u] : null, C = CHASSIS[ship] || CHASSIS.if50;
  if (mode === 'mission' && u === 0 && m === 0) return { ship: 'if50', spr: 'if50', imposed: 'first' };
  if (mode !== 'mission' || !Wd) return { ship, spr: C.spr };
  if (Wd.vehicle) return { ship, spr: Wd.vehicle, veh: Wd.vehicle, imposed: 'era' };
  if (Wd.era) return { ship, spr: CHASSIS[Wd.era].spr, era: Wd.era, imposed: 'era' };
  return { ship, spr: C.spr };
}
// rang de pilote : expérience pour passer du rang r au suivant
const rankNeed = r => CONFIG.rank.need0 + CONFIG.rank.needStep * (r - 1);
// puissance d'ensemble d'un vaisseau (pour vérifier que l'ordre du hangar monte bien)
const shipPower = C => (C.hp + C.sh) * C.dmg * C.fire * (1 + (C.crit || 0) + 0.15 * (C.pierce || 0) + 0.2 * (C.drone || 0));
// barres du hangar : 10 crans, et le chiffre affiché est TOUJOURS le nombre de crans pleins (bogue du 22/11 : ils différaient)
// coque et bouclier = valeurs réelles ; vitesse, puissance, cadence = note sur 10
const SHIP_BARS = [
  { k: 'hp', label: 'stat.hp', n: C => C.hp },
  { k: 'sh', label: 'stat.shield', n: C => C.sh },
  { k: 'sp', label: 'stat.speed', n: C => (C.speed - 200) / 28 },
  { k: 'pw', label: 'stat.power', n: C => (C.dmg - 0.6) / 0.08 },
  { k: 'rt', label: 'stat.rate', n: C => (C.fire - 0.7) / 0.06 },
];
const shipBars = C => SHIP_BARS.map(B => ({ k: B.k, label: B.label, n: Math.max(1, Math.min(10, Math.round(B.n(C)))) }));
for (const [id, C] of Object.entries(CHASSIS)) C.price = id in CONFIG.prices.ships ? CONFIG.prices.ships[id] : -1; // prix : js/config.js
const CHASSIS_ORDER = ['if50', 'lame', 'columbiad', 'concorde', 'nautilus', 'bastion', 'apollo', 'omega'];

// Améliorations permanentes (prix : js/config.js)
// ship: true = propre à chaque vaisseau (Store.d.supg[vaisseau]) ; sinon amélioration du compte (Store.d.upg)
const UPGRADES = [
  { id: 'hull', icon: 'hull', ship: true },
  { id: 'cannon', icon: 'dmg', ship: true },
  { id: 'rate', icon: 'rate', ship: true },
  { id: 'onde', icon: 'onde', ship: true },
  { id: 'ult', icon: 'ult', ship: true },
  { id: 'magnet', icon: 'magnet' },
  { id: 'credit', icon: 'credit' },
];
for (const U of UPGRADES) U.prices = CONFIG.prices.upgrades[U.id];
const SHIP_UPG = UPGRADES.filter(U => U.ship).map(U => U.id);

// Paliers du mode infini
const TIERS = [   // noms : lang.js (tier.N). Records : Store.d.best.tN ; palier i ouvert quand on atteint la vague TIER_OPEN du palier i − 1
  { d: 14, mul: 2, hp: 0, col: '#8CC8EE' },   // Normal (retours n° 3) : pour apprendre, la pression n'arrive que vers la vague 8
  { d: 30, mul: 3, hp: 0, col: '#E8A15A' },
  { d: 44, mul: 4.5, hp: -1, col: '#D9705F' },
  { d: 60, mul: 7, hp: -99, col: '#F2F2F4' },
];

const TIER_OPEN = 10;
// Paliers de l'Infini (retours n° 2) : franchis au boss des vagues 10, 20, 30… ; nom (lang.js pal.nK) et crédits
const PAL_EVERY = 10;
function palName(k) { return tx(k <= 8 ? 'pal.n' + k : 'pal.nX', { k }); }
function palCr(k, cred) { return Math.round(CONFIG.rewards.infPal * k * (cred || 1)); }

// Statistiques du joueur : châssis + améliorations permanentes
function computeStats(chId) {
  const ch = CHASSIS[chId] || CHASSIS.if50, U = id => Store.upg(id, chId);
  return {
    hp: ch.hp,                     // points de coque (PV) : à 0, le vaisseau est détruit
    shield: ch.sh + U('hull'),     // charges du bouclier : encaissent avant la coque, se rechargent après un moment sans coup
    speed: ch.speed, dmg: ch.dmg * (1 + 0.05 * U('cannon')), fire: ch.fire * (1 + 0.06 * U('rate')), pas: ch.pas, regenK: ch.regenK || 1,
    crit: 0.05 + (ch.crit || 0), critMul: 2.5, pierce: ch.pierce || 0,
    onde: (1 + (ch.onde || 0)) * (1 + 0.15 * U('onde')), ondeR: 250 * (1 + 0.1 * U('onde')),
    ultc: (1 + (ch.ultc || 0)) * (1 + 0.15 * U('ult')), magnet: 110 * (1 + 0.25 * U('magnet')),
    cred: 1 + CONFIG.rewards.creditUpg * U('credit'), wl: 1 + U('cannon'), drone: ch.drone || 0,
  };
}

// Plan d'une mission de campagne
// chaque mission finit sur un gros vaisseau (mini-boss), comme toutes les 5 vagues en Infini (retour du 22/11)
function missionPlan(u, m) {
  if (m === 4) return ['boss'];
  // convoi à escorter (idée du bloc 4) : mission 3 d'un univers sur trois, vue de dessus et vol libre seulement
  if (m === 2 && CONFIG.features.convoy && typeof WORLDS !== 'undefined' && u % 3 === 1 && WORLDS[u] && WORLDS[u].view === 'top' && WORLDS[u].move === 'free') return ['form', 'convoy', 'formMini'];
  return [['form', 'fly', 'formMini'], ['form', 'mix', 'formMini'], ['fly', 'form', 'formMini'], ['form', 'fly', 'mix', 'formMini']][m];
}
