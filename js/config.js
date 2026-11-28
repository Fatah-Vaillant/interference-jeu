'use strict';
/* =========================================================
   INTERFÉRENCE — configuration centrale
   Tous les chiffres d'équilibrage réglables sans toucher au moteur : difficulté, prix, récompenses,
   butins, interrupteurs. Chargé en premier. Après un changement : node tests/run.js et node tools/smoke.js
   (l'empreinte du smoke change si l'équilibrage change : c'est normal, la noter dans CHANGELOG.md).
   Les valeurs propres à un contenu (PV d'un archétype, stats d'un vaisseau, paliers de l'Infini) restent dans js/data.js.
   ========================================================= */
const CONFIG = {
  version: '0.19.1', // à augmenter à chaque version publiée (voir CHANGELOG.md, étiquette git vX.Y.Z)

  features: {
    devMenu: true, // menu développeur disponible (reste caché : 7 appuis sur le numéro de version dans Profil)
    // Idées originales du bloc 4 (js/ideas.js, docs/BACKLOG.md §6 ; choix argumentés dans docs/JOURNAL.md)
    echo: true,       // Écho : compétence rare (choix 1 parmi 3) — un double du vaisseau rejoue ta trajectoire 0,6 s plus tard et tire avec toi
    radioHome: true,  // Molette radio aussi sur l'accueil : choisir l'univers en tournant un cadran (parasites entre les stations)
    accord: true,     // Accord de fréquence : 3 ennemis du même type d'affilée → résonance (tirs perçants, dégâts +25 %, 4 s)
    noiseHud: true,   // Le Bruit attaque l'interface : un parasite brouille le HUD tant qu'on ne l'abat pas (bonus de crédits)
    radioDial: true,  // Molette radio : en Infini, choisir la fréquence suivante parmi 3 (avec un bonus chacune)
    convoy: true,     // Convoi à escorter : mission 3 des univers 02, 05, 08, 11 (retiré de l'Infini : les cargos y mouraient toujours)
    bossLearn: true,  // Boss qui apprend : il cible ton couloir préféré, reprend les attaques qui te touchent, s'en souvient
  },

  // Difficulté « d » : pilote PV, cadence et nombre de tirs ennemis, formations
  difficulty: {
    missionWorld: 6.5,  // mission : d = univers × 6,5 + courbe[mission] (univers et mission comptés à partir de 0, d ≥ 0)
    // courbe en dents de scie (ANALYSE §3.4) : chaque univers monte, puis sa mission 1 redescend sous le boss de l'univers précédent
    missionCurve: [-2, 0.6, 2.4, 4, 5.4],
    infWave: 1.8,       // infini : d = d du palier (TIERS) + 1,8 × (n − 1) + 0,025 × (n − 1)², n = numéro de vague
    infWave2: 0.025,
    enemyHp: 0.08,      // PV des ennemis × (1 + d × 0,08) en mission
    enemyHpInf: 0.09,   // … et × (1 + d × 0,09) en infini
    bossHp: 1.4,        // PV du boss × 1,4 × (1 + d × 0,075)
    bossHpD: 0.075,
    bossWeapon: 1,      // niveaux d'arme offerts au début d'une mission de boss
    enemyHpInf2: 0.0008, // infini : PV × (1 + d × 0,09 + d² × 0,0008), la résistance accélère avec les vagues
    // pression (retour du 22/11 : en Infini on gagnait sans bouger) : P = (d − pressD) / pressSpan, jusqu'à pressMax
    // P pilote les chasseurs (viennent se placer au-dessus du joueur et tirent), les rideaux de tirs et les tirs droits qui visent
    pressD: 26, pressSpan: 24, pressMax: 2.2, // Hardcore : 0,15 à la vague 1, ~0,75 à la vague 8, 1 à la vague 11, 2 vers la vague 19
    pressMission: 0.5,  // en mission, la pression est réduite (× 0,5), commence à d = 40 et monte sur 60
    pressMissionD: 40, pressMissionSpan: 60,
    kamiMax: 2,         // kamikazes au plus par formation (+1 tous les 40 de d)
  },

  // Compétences (retours n° 2, 25/11 : à la vague 10-20 de l'Infini on gagnait immobile, 6 orbes et une pluie de tirs)
  skills: {
    maxActive: 6,   // compétences différentes au plus ; une fois plein, le choix ne propose que de monter celles déjà prises
    decay: 0.72,    // gains décroissants : le niveau n apporte add × 0,72^(n−1) (niveau 1 : 100 %, niveau 5 : 27 %)
    orbsMax: 3,     // orbes en orbite au plus
  },
  // Expérience (retours n° 2 : un choix toutes les 2-3 s au début déroutait) : gagnée à la destruction, plus de points qui tombent.
  // Le choix de compétence n'arrive qu'entre deux vagues, un seul par pause ; seuil du niveau l : first + step × (l − 1) + grow × (l − 1)²
  xp: { first: 14, step: 10, grow: 1.2 },
  // Infini indexé sur la puissance réelle du joueur (dégâts par seconde mesurés en combat)
  // résistance : un ennemi de base doit encaisser au moins dps × ttk(n) avec ttk(n) = ttk0 + ttkN × n secondes de tir parfait
  // densité : quand cette résistance dépasse celle de la difficulté seule, rangs, salves, escadrilles et pression montent ;
  // les deux valeurs ne redescendent jamais (aucune vague plus facile que la précédente)
  infPower: { ttk0: 0.08, ttkN: 0.0025, bossT0: 14, bossTN: 0.5, densMax: 2 }, // réglé pour ne mordre que sur les constructions fortes (joueur moyen : ≈ la difficulté seule)
  // As (ennemi d'élite qui esquive comme un joueur) : rare, nom affiché, belle récompense
  elite: {
    infFrom: 4, infGap: 5,   // Infini : à partir de la vague 4, au plus une vague sur 5 (et au moins une sur 8)
    missionM: 3,             // campagne : 4e mission de chaque univers à partir du 02
    dur: 16,                 // secondes avant qu'il ne s'échappe (sans récompense)
    hpT: 4.5, hpMin: 26,     // PV : au moins dps × 4,5 s (et 26 × résistance de base)
    hitCap: 0.07,            // un coup ne retire jamais plus de 7 % de ses PV (il reste un duel, même face à une construction forte)
    stamina: 3, regen: 0.7,  // esquives d'affilée, rechargées à 0,7 par seconde
    cr: 40, crD: 1.5,        // crédits : (40 + d × 1,5) × bonus de crédits
  },

  // Cubes d'arme (retours n° 2 : personne ne comprenait) : jamais aimantés, ils descendent lentement ; on les prend en
  // passant dessus (touch, px) ou en les touchant du doigt (tapR, px) ; une bulle explique les premiers (tips)
  cube: { fall: 55, touch: 40, tapR: 46, tips: 2 },

  // Onde et Ultime : vitesse de charge (retour du 22/11 : trop rapides, surtout en Infini)
  // bouclier : une charge revient après ce temps sans être touché (s)
  shield: { regen: 10, regenInf: 22 },
  powers: {
    onde: 0.75, ult: 0.75,        // en mission : charge × 0,75
    ondeInf: 0.42, ultInf: 0.38,  // en infini : charge × 0,42 / × 0,38 …
    infSlow: 0.02,                // … puis encore divisée par (1 + 0,02 × (vague − 1))
    ondeLock: 5, ultLock: 12,     // après usage : secondes sans aucune recharge (× 2 en infini)
    lockInf: 2,
  },

  // Déplacement au doigt : le vaisseau rattrape le doigt (réactivité par seconde), vitesse plafonnée à speed × pointerMax
  // top : marge (unités jeu) entre le bas du HUD et le nez du vaisseau ; topMin : limite la plus haute, retours n° 2 : le vaisseau monte jusque sous le HUD (plus de mur invisible à mi-écran)
  move: { pointerK: 24, pointerMax: 4.5, sens: [1, 1.3, 1.6, 2], top: 10, topMin: 150, tilt: { dead: 2.5, full: 16, speed: 1.15 } }, // tilt : pilotage à l'inclinaison (degrés : zone morte, plein régime ; vitesse × celle du vaisseau) // sensibilité réglable (Profil, pause) : déplacement du doigt × sens

  // Prix fixes en crédits (aucun hasard payant). −1 = ne s'achète pas (débloqué en jeu)
  prices: {
    // étalés sur toute la campagne (~2 400 crédits après la fréquence 01, ~57 000 après la 08, ~118 000 à la fin)
    ships: { if50: 0, lame: 3000, columbiad: 6000, concorde: 10000, nautilus: 15000, bastion: 22000, apollo: 30000, omega: -1 },
    // retours n° 3 : coque, puissance, cadence, onde et ultime sont propres à chaque vaisseau ; aimant et prime restent globaux (compte)
    upgrades: {
      hull:   [400, 900, 1600, 2500, 4000],
      cannon: [500, 1100, 2000, 3200, 5000],
      rate:   [450, 1000, 1800, 2900, 4500],
      onde:   [300, 700, 1300, 2200, 3500],
      ult:    [400, 900, 1600, 2500, 4000],
      magnet: [250, 600, 1200],
      credit: [400, 900, 1600, 2500, 4000],
    },
  },

  // Sensations (retours n° 3, PLAISIR-DE-JEU §1) : arrêt sur image des grosses destructions, calme entre deux vagues,
  // alerte avant le boss, roulis du vaisseau, combo sonore, vibrations (au plus vibMax par seconde, désactivables dans les réglages)
  caps: { order: ['arm', 'shield', 'level'] },
  // défi juste (PLAISIR §4) : coup de pouce gratuit après 2 défaites de suite sur une mission ; boss allégé de 15 % par défaite (60 % au moins)
  help: { after: 2, bossStep: 0.15, bossMin: 0.6 },
  // équipement prévu au début de chaque univers (mission 1) : vaisseau et niveau de coque, puissance et cadence ;
  // le smoke vérifie que chaque mission 1 se gagne avec, en pilotage simple (tools/smoke.js, « retours 3 · E »)
  plan: [['if50', 0], ['if50', 1], ['if50', 2], ['lame', 1], ['lame', 2], ['columbiad', 2], ['concorde', 2], ['nautilus', 2], ['bastion', 3], ['apollo', 3], ['omega', 3], ['omega', 4]], // l'Ω est offert par le boss de la fréquence 10
  deathCam: 0.9,    // mort comprise : ralenti de 0,9 s sur le tir fatal, encadré d'une mire
  // rang de pilote (PLAISIR §15) : expérience de compte à chaque partie, gagnée ou perdue ; chaque rang = crédits
  rank: { kill: 0.5, win: 40, star: 10, loss: 15, wave: 4, need0: 120, needStep: 80, cr: 100 }, // capsule du mini-boss : contenu annoncé, dans cet ordre (décalé selon la mission)
  feel: { hitStop: 0.05, calm: 2, bossWarn: 1.8, roll: 0.42, comboStep: 5, vibGap: 110, numsMax: 28, numsBusy: 16 },

  // Mission 1 bienveillante (retours n° 3, ANALYSE §3.1) : salves et piqués plus espacés, tirs plus lents, bouclier qui revient vite
  gentle: { fire: 1.7, dive: 1.6, bullet: 0.82, regen: 0.4 },

  // Récompenses en crédits
  rewards: {
    firstFlight: 450,   // prime de premier vol (1re victoire de la mission 01-1) : de quoi acheter tout de suite une amélioration
    mission: 60,        // fin de mission gagnée : (60 + d × 9) × étoiles, × 1,5 la première fois
    missionD: 9,
    first: 1.5,
    perfect: 0.3,
    lossK: 0.6,         // défaite : récompense d'effort = (60 + d × 9) × part de la mission faite × 0,6       // bonus « parfait » (3 étoiles sans coup reçu) : +30 % de la récompense
    inf: 20,            // fin d'infini : vagues × (20 + palier × 6)
    infTier: 6,
    infPal: 200,        // Infini : palier franchi (boss des vagues 10, 20, 30…) : 200 × numéro du palier × multiplicateur de crédits
    squad: 12,          // escadrille entière abattue : 12 + d
    creditUpg: 0.15,    // amélioration « crédits » : +15 % par niveau
  },

  // Sécurité photosensible (retours n° 3) : jamais plus de maxPerSec flashs par seconde sur une grande surface (plein écran,
  // lueur de plus de bigR px de rayon), quel que soit le réglage ; boss et gros ennemis touchés = lueur continue (heat), pas de clignotement
  flash: { maxPerSec: 3, bigR: 60, heatHit: 0.22, heatDecay: 2.2, heatMax: 0.4 },

  // Budget de performance : 60 i/s sur un téléphone d'entrée de gamme (≈ 4 à 5 fois plus lent qu'un PC de bureau)
  // Mesure sur téléphone : menu développeur → « Images par seconde » (i/s, pire image, calcul, objets, résolution).
  perf: {
    fps: 60,
    cpuMs: 8,         // calcul + dessin d'une image sur téléphone : au plus 8 ms (la moitié des 16,7 ms d'une image)
    autoQuality: true, // qualité auto : si la partie tourne sous lowFps pendant 3 s, la résolution du canvas baisse d'un cran
    lowFps: 50,
    minDpr: 1,        // résolution minimale (1 pixel de canvas par pixel CSS)
    // garde-fou du smoke : scène la plus chargée (Infini Ω vague 30, toutes compétences, arme niveau 10) dessinée
    // sans GPU (rendu logiciel, bien plus lent qu'un téléphone). Mesuré le 21/11 : moyenne ~8 ms, 95 % ~22 ms.
    smokeAvgMs: 12,
    smokeP95Ms: 30,
    smokeBenchMs: 130, // étalon du smoke (dessin fixe), machine de référence sur secteur (26/11 : 335 ms sur batterie, où la v0.18.0 passait de 8,6 à 22 ms) ; plus lent = budget proportionnel
  },

  // Butins laissés par les ennemis (probabilités par ennemi détruit)
  drops: {
    weapon: 0.035,      // amélioration d'arme
    weaponHeavy: 0.07,  // … en plus pour les lourds
    shield: 0.006,      // cellule de bouclier (une par vague au plus)
    shieldInf: 0.3,     // … × 0,3 en infini (des centaines d'ennemis : c'était un soin caché)
  },
};
