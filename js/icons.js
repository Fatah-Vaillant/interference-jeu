'use strict';
/* =========================================================
   INTERFÉRENCE — icônes de compétences au trait (retour du 22/11 : fini le pinceau)
   Même style que la barre du bas et les boutons Onde / Ultime : grille 24 × 24, traits ronds,
   aplats de couleur cernés de noir, fond noir. Le dessin seul doit expliquer le pouvoir.
   Aucun visage, aucun œil (ni deux ronds côte à côte, ni point au centre d'un disque), aucun être vivant.
   Chaque entrée : { c: couleur, L: [calques] } ; calque = { s: chemin à tracer } ou { f: chemin à remplir }
   avec col (couleur, sinon c), w (épaisseur), a (opacité), dash.
   Icons.canvas(id, px) → <canvas> ; Icons.paint(cv, id, px) ; Icons.frame(cv, couleur, graine, épaisseur)
   ========================================================= */
const Icons = (() => {
  const INK = '#F2EEE6', RED = '#E8574A', GREY = '#7D8490', XP = '#5CF0A0';
  // petit vaisseau du joueur (flèche à ailes), centré en x, y, taille s
  const SHIP = (x, y, s = 1) => `M${x} ${y - 5 * s}L${x + 3.4 * s} ${y + 4 * s}L${x} ${y + 2.4 * s}L${x - 3.4 * s} ${y + 4 * s}Z`;
  const ship = (x, y, s, col = INK, a) => ({ f: SHIP(x, y, s), col, a });

  const ART = {
    // cadence : trois rafales serrées au-dessus du vaisseau
    rate: { c: '#F2B36E', L: [{ s: 'M7 3V6M7 9V12M12 2V5M12 8V11M17 3V6M17 9V12', w: 2.4 }, ship(12, 18.5, 0.9)] },
    // puissance : un tir qui éclate en étoile
    dmg: { c: '#E8774A', L: [{ s: 'M12 20V12', col: INK, w: 2.6 }, { f: 'M12 1.5L13.7 6.2L18.3 4.6L15.6 8.7L19.5 11.3L14.6 11.2L12 15.2L9.4 11.2L4.5 11.3L8.4 8.7L5.7 4.6L10.3 6.2Z' }, ship(12, 19.5, 0.75)] },
    // aimant : fer à cheval, pointes rouges, XP (losanges verts) attirée
    magnet: { c: '#E36A5C', L: [{ s: 'M6.5 3V10A5.5 5.5 0 0 0 17.5 10V3', col: INK, w: 3.2 }, { f: 'M4.9 2H8.1V6H4.9ZM15.9 2H19.1V6H15.9Z' },
      { f: 'M12 17L13.2 18.8L12 20.6L10.8 18.8ZM4 16L5 17.5L4 19L3 17.5ZM20 16L21 17.5L20 19L19 17.5Z', col: XP }, { s: 'M5.5 14.8L7 13.6M18.5 14.8L17 13.6', col: XP, w: 1.4 }] },
    // réparation : la coque reçoit un point (+ vert)
    heal: { c: '#5CF0A0', L: [ship(10, 13.5, 1.75), { s: 'M18.5 2.5V9.5M15 6H22', w: 2.8 }] },
    // onde : ondes autour du vaisseau, tirs ennemis dissous
    onde: { c: '#E8A15A', L: [{ s: 'M2.5 15.5A9.5 4.2 0 1 0 21.5 15.5A9.5 4.2 0 1 0 2.5 15.5', w: 2.2, dash: [8, 1.6] }, { s: 'M6.4 15.5A5.6 2.3 0 1 0 17.6 15.5A5.6 2.3 0 1 0 6.4 15.5', w: 1.6, a: 0.75 },
      ship(12, 10, 1.15), { s: 'M2 9L3.8 11M22 9L20.2 11M5 21.8L6.4 20M19 21.8L17.6 20', col: RED, w: 2 }] },
    // perforant : un trait qui traverse deux ennemis
    pierce: { c: '#C9A3E8', L: [{ f: 'M3.5 6H20.5V10H3.5ZM3.5 13.5H20.5V17.5H3.5Z', col: GREY }, { s: 'M12 22V2.5M8.5 6L12 2.5L15.5 6', w: 2.2 }] },
    // rebond : le tir repart sur le bord
    bounce: { c: '#B7D97A', L: [{ s: 'M21 2V22', col: GREY, w: 2.6 }, { s: 'M4 21L19 12L5 3.5M5 3.5L9.5 3.8M5 3.5L7 7.5', w: 2.3 }] },
    // critique : mire (sans point central) et éclat
    crit: { c: '#E36A5C', L: [{ s: 'M12 5A7 7 0 1 1 11.99 5', w: 2, col: INK }, { s: 'M12 1.5V8M12 16V22.5M1.5 12H8M16 12H22.5', w: 2.4 }, { f: 'M18.5 1.5L19.3 3.7L21.5 4.5L19.3 5.3L18.5 7.5L17.7 5.3L15.5 4.5L17.7 3.7Z', col: '#FFC24B' }] },
    // drones : deux petits vaisseaux escortent le vaisseau
    drone: { c: '#8AD6A8', L: [ship(12, 13, 1.45), ship(4.5, 18.5, 0.7, '#8AD6A8'), ship(19.5, 18.5, 0.7, '#8AD6A8'), { s: 'M4.5 13V9M19.5 13V9', w: 1.6 }] },
    // lames en orbite autour du vaisseau
    orbit: { c: '#BFE3F5', L: [{ s: 'M2.5 12A9.5 6.5 0 1 0 21.5 12A9.5 6.5 0 1 0 2.5 12', col: GREY, w: 1.4, dash: [2.4, 2] }, ship(12, 12.5, 1.05), { f: 'M21.5 9L23 12L21.5 15L20 12ZM2.5 9L4 12L2.5 15L1 12Z' }] },
    // bouclier renforcé : champ de force autour du vaisseau
    hull: { c: '#8FD8FF', L: [{ f: 'M12 1.8L20.5 5.2V11C20.5 16 16.8 19.8 12 22C7.2 19.8 3.5 16 3.5 11V5.2Z', a: 0.22 }, { s: 'M12 1.8L20.5 5.2V11C20.5 16 16.8 19.8 12 22C7.2 19.8 3.5 16 3.5 11V5.2Z', w: 2.2 }, ship(12, 12.5, 1.1)] },
    // ultime : l'éclair du bouton
    ult: { c: '#BFD9F5', L: [{ f: 'M13.5 2L5 13.6H11L9.8 22L19 9.6H13Z' }] },
    // gel : cristal à six branches
    freeze: { c: '#9FE0FF', L: [{ s: 'M12 2V22M3.3 7L20.7 17M20.7 7L3.3 17', w: 2.2 }, { s: 'M9.5 3.5L12 6L14.5 3.5M9.5 20.5L12 18L14.5 20.5M3 10.2L6.4 9L5.6 5.6M21 13.8L17.6 15L18.4 18.4M21 10.2L17.6 9L18.4 5.6M3 13.8L6.4 15L5.6 18.4', col: INK, w: 1.5 }] },
    // éclats : un ennemi détruit projette des éclats
    shards: { c: '#F2B36E', L: [{ s: 'M9.5 9.5L4 4M14.5 9.5L20 4M9.5 14.5L4 20M14.5 14.5L20 20', w: 2.3 }, { f: 'M12 7.5L16.5 12L12 16.5L7.5 12Z', col: GREY }, { f: 'M3 2.5L5.5 3.5L4 5.5ZM21 2.5L20 5.5L18.5 3.5ZM3 21.5L4 18.5L5.5 20.5ZM21 21.5L18.5 20.5L20 18.5Z', col: INK }] },
    // tirs en diagonale
    diag: { c: '#E8C27A', L: [{ s: 'M12 13V2.5M9.5 13.5L4 4M14.5 13.5L20 4', w: 2.3 }, ship(12, 18.5, 0.95)] },
    // ricochet : le tir rebondit d'ennemi en ennemi
    rico: { c: '#9AD0F5', L: [{ s: 'M3 21L11 9L21 15.5', w: 2.3 }, { f: 'M8.5 6.5H13.5V10H8.5ZM18.5 16H23V19.5H18.5Z', col: GREY }, { f: 'M11 4.5L11.8 7.2L14.5 8L11.8 8.8L11 11.5L10.2 8.8L7.5 8L10.2 7.2Z', col: INK }] },
    // arme améliorée : chevrons montants
    wpn: { c: '#F2B84B', L: [{ s: 'M5 13.5L12 6.5L19 13.5M5 20.5L12 13.5L19 20.5', w: 2.8 }, { s: 'M6 3H18', col: INK, w: 2.4 }] },
    // tempête : éclairs qui tombent
    storm: { c: '#B9A8F0', L: [{ f: 'M10.5 1.5L4.5 12.5H9L7.5 22.5L15.5 9.5H11L13.5 1.5Z' }, { f: 'M19 5.5L15.8 11.5H18L17 16.5L21.2 9.8H19L20.5 5.5Z', col: INK }] },
    // frôlement : un tir ennemi passe tout près, ça rapporte
    graze: { c: '#E8A15A', L: [ship(9, 14, 1.3), { s: 'M15.5 3C19.5 7 19.5 14 15.5 19', w: 1.8, dash: [2.2, 1.8] }, { f: 'M20 6.5Q22.4 10 20 12Q17.6 10 20 6.5Z', col: RED }, { f: 'M15 1.5L15.6 3.1L17.2 3.7L15.6 4.3L15 5.9L14.4 4.3L12.8 3.7L14.4 3.1Z', col: '#FFC24B' }] },
    // dernier souffle : flèche qui revient, le vaisseau repart
    revive: { c: '#F2B84B', L: [{ s: 'M5.2 9.5A7.5 7.5 0 1 0 8.5 5.2', w: 2.4 }, { s: 'M3.5 3.5L5.2 9.5L10.8 7.6', w: 2.4 }, ship(12.5, 13.5, 0.95)] },
    // frénésie : flamme
    fever: { c: '#E8774A', L: [{ f: 'M12 1.5C15.5 6.5 19.5 9 19.5 14.5A7.5 7.5 0 0 1 4.5 14.5C4.5 11 6.5 8.8 8.5 6.8C9.3 9.8 10.6 11 12 11.2C12 8 11 5.2 12 1.5Z' }, { f: 'M12.2 12.5C13.8 14.5 15.2 15.6 15.2 17.6A3.2 3.2 0 0 1 8.8 17.6C8.8 16 9.8 15 10.8 14.2C11.3 15.2 11.8 15.5 12.3 15.5C12.2 14.5 11.9 13.5 12.2 12.5Z', col: '#FFD9A0' }] },
    // écho : un double translucide suit le vaisseau
    echo: { c: '#9FD3E6', L: [ship(8, 15.5, 1.25, '#9FD3E6', 0.5), { s: 'M3.5 21L5 19.5M6.5 22.5L8 21', w: 1.4, a: 0.6 }, ship(15, 10, 1.4)] },
  };
  // fusions : les deux icônes d'origine en diagonale, reliées par un « + » doré
  const FU = { fRico: ['bounce', 'pierce'], fSquad: ['drone', 'rate'], fStorm: ['storm', 'crit'], fCrown: ['orbit', 'shards'], fFrost: ['freeze', 'diag'], fBlaze: ['fever', 'dmg'], fWall: ['hull', 'onde'], fPull: ['magnet', 'graze'] };
  Object.assign(ART, {
    fRico: { c: '#F2B84B', fuse: FU.fRico, L: [] }, fSquad: { c: '#F2B84B', fuse: FU.fSquad, L: [] }, fStorm: { c: '#F2B84B', fuse: FU.fStorm, L: [] }, fCrown: { c: '#F2B84B', fuse: FU.fCrown, L: [] },
    fFrost: { c: '#F2B84B', fuse: FU.fFrost, L: [] }, fBlaze: { c: '#F2B84B', fuse: FU.fBlaze, L: [] }, fWall: { c: '#F2B84B', fuse: FU.fWall, L: [] }, fPull: { c: '#F2B84B', fuse: FU.fPull, L: [] },
  });
  for (const A of Object.values(ART)) A.p = A.L.map(l => new Path2D(l.s || l.f));
  const PLUS = new Path2D('M5.5 15V22M2 18.5H9');
  function layers(c, A) {
    A.L.forEach((l, i) => {
      const P = A.p[i], col = l.col || A.c; c.globalAlpha = l.a ?? 1; c.setLineDash(l.dash || []);
      if (l.f) { c.fillStyle = col; c.fill(P); c.setLineDash([]); c.strokeStyle = '#07080A'; c.lineWidth = 1.1; c.stroke(P); }
      else { c.strokeStyle = '#07080A'; c.lineWidth = (l.w || 2) + 1.6; c.stroke(P); c.strokeStyle = col; c.lineWidth = l.w || 2; c.stroke(P); }
    });
    c.globalAlpha = 1; c.setLineDash([]);
  }

  function paint(cv, id, px) {
    cv.width = cv.height = Math.round(px * 2); const c = cv.getContext('2d'), A = ART[id] || ART.dmg, k = px * 2 / 24;
    c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
    c.setTransform(k * 0.84, 0, 0, k * 0.84, px * 2 * 0.08, px * 2 * 0.08); c.lineCap = 'round'; c.lineJoin = 'round';
    if (A.fuse) {
      const sub = (S, dx, dy) => { c.save(); c.translate(dx, dy); c.scale(0.6, 0.6); layers(c, S); c.restore(); };
      sub(ART[A.fuse[0]], 0, 0); sub(ART[A.fuse[1]], 9.6, 9.6);
      c.lineCap = 'round'; c.strokeStyle = '#07080A'; c.lineWidth = 4.4; c.stroke(PLUS); c.strokeStyle = A.c; c.lineWidth = 2.8; c.stroke(PLUS);
    } else layers(c, A);
    return cv;
  }
  const canvas = (id, px) => paint(document.createElement('canvas'), id, px);
  // cadre net autour d'une carte (canvas superposé), à la couleur de rareté
  function frame(cv, col, seed = 1, wd = 3.2) {
    const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    cv.width = w * 2; cv.height = h * 2; const c = cv.getContext('2d'); c.scale(2, 2);
    const m = 2 + wd / 2; c.strokeStyle = col; c.lineWidth = wd; c.lineJoin = 'round';
    c.beginPath(); c.roundRect ? c.roundRect(m, m, w - 2 * m, h - 2 * m, 8) : c.rect(m, m, w - 2 * m, h - 2 * m); c.stroke();
  }
  return { ART, paint, canvas, frame };
})();
