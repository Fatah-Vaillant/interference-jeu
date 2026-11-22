'use strict';
/* =========================================================
   INTERFÉRENCE — configuration centrale
   Tous les chiffres d'équilibrage réglables sans toucher au moteur : difficulté, prix, récompenses,
   butins, interrupteurs. Chargé en premier. Après un changement : node tests/run.js et node tools/smoke.js
   (l'empreinte du smoke change si l'équilibrage change : c'est normal, la noter dans CHANGELOG.md).
   Les valeurs propres à un contenu (PV d'un archétype, stats d'un vaisseau, paliers de l'Infini) restent dans js/data.js.
   ========================================================= */
const CONFIG = {
  version: '0.17.0', // à augmenter à chaque version publiée (voir CHANGELOG.md, étiquette git vX.Y.Z)

  features: {
    devMenu: true, // menu développeur disponible (reste caché : 7 appuis sur le numéro de version dans Profil)
    // Idées originales du bloc 4 (js/ideas.js, docs/BACKLOG.md §6 ; choix argumentés dans docs/JOURNAL.md)
    echo: true,       // Écho : compétence rare (choix 1 parmi 3) — un double du vaisseau rejoue ta trajectoire 0,6 s plus tard et tire avec toi
    radioHome: true,  // Molette radio aussi sur l'accueil : choisir l'univers en tournant un cadran (parasites entre les stations)
    accord: true,     // Accord de fréquence : 3 ennemis du même type d'affilée → résonance (tirs perçants, dégâts +25 %, 4 s)
    noiseHud: true,   // Le Bruit attaque l'interface : un parasite brouille le HUD tant qu'on ne l'abat pas (bonus de crédits)
    radioDial: true,  // Molette radio : en Infini, choisir la fréquence suivante parmi 3 (avec un bonus chacune)
    convoy: true,     // Convoi à escorter : mission 3 des univers 02, 05, 08, 11 et une vague sur 8 en Infini
    bossLearn: true,  // Boss qui apprend : il cible ton couloir préféré, reprend les attaques qui te touchent, s'en souvient
  },

  // Difficulté « d » : pilote PV, cadence et nombre de tirs ennemis, formations
  difficulty: {
    missionWorld: 6.5,  // mission : d = univers × 6,5 + mission × 1,3 (univers et mission comptés à partir de 0)
    missionStep: 1.3,
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
  move: { pointerK: 24, pointerMax: 4.5, sens: [1, 1.3, 1.6, 2] }, // sensibilité réglable (Profil, pause) : déplacement du doigt × sens

  // Prix fixes en crédits (aucun hasard payant). −1 = ne s'achète pas (débloqué en jeu)
  prices: {
    // étalés sur toute la campagne (~2 400 crédits après la fréquence 01, ~57 000 après la 08, ~118 000 à la fin)
    ships: { if50: 0, lame: 3000, columbiad: 6000, concorde: 10000, nautilus: 15000, bastion: 22000, apollo: 30000, omega: -1 },
    upgrades: {
      hull:   [400, 900, 1600, 2500, 4000],
      cannon: [500, 1100, 2000, 3200, 5000],
      onde:   [300, 700, 1300, 2200, 3500],
      ult:    [400, 900, 1600, 2500, 4000],
      magnet: [250, 600, 1200],
      credit: [400, 900, 1600, 2500, 4000],
    },
  },

  // Récompenses en crédits
  rewards: {
    mission: 60,        // fin de mission gagnée : (60 + d × 9) × étoiles, × 1,5 la première fois
    missionD: 9,
    first: 1.5,
    perfect: 0.3,       // bonus « parfait » (3 étoiles sans coup reçu) : +30 % de la récompense
    inf: 20,            // fin d'infini : vagues × (20 + palier × 6)
    infTier: 6,
    squad: 12,          // escadrille entière abattue : 12 + d
    creditUpg: 0.15,    // amélioration « crédits » : +15 % par niveau
  },

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
  },

  // Butins laissés par les ennemis (probabilités par ennemi détruit)
  drops: {
    weapon: 0.035,      // amélioration d'arme
    weaponHeavy: 0.07,  // … en plus pour les lourds
    shield: 0.006,      // cellule de bouclier (une par vague au plus)
    shieldInf: 0.3,     // … × 0,3 en infini (des centaines d'ennemis : c'était un soin caché)
  },
};
