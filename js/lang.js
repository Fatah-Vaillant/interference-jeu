'use strict';
/* =========================================================
   INTERFÉRENCE — traductions
   Tout texte affiché au joueur vit ici. Ailleurs : tx('clé', { variables }).
   Les noms et descriptions des données (armes, compétences, vaisseaux,
   univers…) sont injectés au démarrage par I18N.hydrate().
   Ajouter une langue : copier le bloc fr, traduire, puis I18N.set('en').
   ========================================================= */
const LANG = {
  fr: {
    _locale: 'fr-FR',
    'app.name': 'Interférence',

    /* ---------- navigation ---------- */
    'nav.missions': 'Missions', 'nav.hangar': 'Hangar', 'nav.inf': 'Infini', 'nav.profile': 'Profil', 'nav.aria': 'Navigation',
    'aria.missions': 'Missions', 'aria.hangar': 'Hangar', 'aria.inf': 'Mode infini', 'aria.profile': 'Profil', 'aria.game': 'Partie', 'aria.brief': 'Briefing',
    'aria.freqs': 'Fréquences', 'aria.pause': 'Pause', 'aria.ult': 'Ultime', 'aria.onde': 'Onde',

    /* ---------- accueil ---------- */
    'home.freq': 'Fréquence {n}', 'home.freqOpen': 'Fréquence {n} · {name}', 'home.freqLocked': 'Fréquence {n} · verrouillée',
    'home.lockedToast': 'Bats le boss de la fréquence {n} pour l’ouvrir',
    'home.starsCount': '{n} / 15 étoiles',
    'home.misAria': 'Mission {n}, {s} étoiles', 'home.misAriaLocked': 'Mission {n}, verrouillée', 'home.bossAria': 'Boss, {s} étoiles', 'home.bossAriaLocked': 'Boss, verrouillé',
    'home.launchMis': 'Lancer la mission {n}', 'home.launchBoss': 'Affronter le boss', 'home.play': 'Jouer', 'home.playMis': 'Mission {n}', 'home.playBoss': 'Boss', 'home.starsAria': '{n} étoiles sur 150', 'home.creditsAria': '{n} crédits',
    'veh.nautSide': 'en sous-marin', 'veh.tank': 'en char', 'veh.late': 'en avion postal', 'veh.destroyer': 'en destroyer',

    /* ---------- briefing ---------- */
    'brief.skip': 'Passer', 'brief.next': 'Continuer', 'brief.jump': 'Sauter vers {name}', 'brief.B': 'Le Bureau', 'brief.A': 'Agent IF-50',

    /* ---------- hangar ---------- */
    'hangar.title': 'Hangar', 'hangar.ships': 'Vaisseaux', 'hangar.upg': 'Améliorations',
    'hangar.equipped': 'Équipé', 'hangar.owned': 'Dans le hangar', 'hangar.endCampaign': 'Fin de campagne', 'hangar.price': '{n} crédits',
    'hangar.equip': 'Équiper', 'hangar.buy': 'Acheter · {n}', 'hangar.lockedOmega': 'Coupe la Source pour le débloquer', 'hangar.joined': '{name} rejoint ton hangar',
    'hangar.ult': 'Ultime : <b>{name}</b>', 'hangar.max': 'Max', 'hangar.prev': 'Vaisseau précédent', 'hangar.next': 'Vaisseau suivant', 'hangar.upgAria': '{name}, niveau {lv} sur {max}, {desc}',
    'stat.shield': 'Bouclier', 'stat.hp': 'Coque', 'stat.speed': 'Vitesse', 'stat.power': 'Puissance', 'stat.rate': 'Cadence',

    /* ---------- infini ---------- */
    'inf.title': 'Infini', 'inf.lede': 'Une vague après l’autre. L’univers change toutes les trois vagues, un boss toutes les dix.',
    'inf.shield': 'Bouclier', 'inf.score': 'Score', 'inf.record': 'Record', 'inf.noShield': 'Aucun',
    'common.launch': 'Lancer', 'common.back': 'Retour',

    /* ---------- profil ---------- */
    'profile.title': 'Profil', 'profile.archives': 'Archives', 'profile.settings': 'Réglages',
    'set.vol': 'Volume des bruitages', 'set.auto': 'Tir automatique', 'set.vib': 'Vibrations', 'set.shake': 'Secousses de l’écran', 'set.fx': 'Effets haute qualité', 'profile.version': 'Version {v}',
    'dev.on': 'Menu développeur activé', 'dev.off': 'Menu développeur désactivé', 'dev.title': 'Développeur', 'dev.mission': 'Mission', 'dev.boss': 'Boss', 'dev.go': 'Lancer',
    'dev.wave': 'Infini, vague', 'dev.skill': 'Compétence au départ', 'dev.none': 'Aucune', 'dev.hit': 'Zones de touche', 'dev.fps': 'Images par seconde', 'dev.fpsVal': '{f} i/s · pire {w} ms', 'dev.cpuVal': 'calcul {c} ms (max {m}) · {n} objets · résolution ×{d}', 'dev.over': '⚠ hors budget',
    'dev.credits': '+10 000 crédits', 'dev.unlock': 'Tout débloquer', 'dev.done': 'Fait', 'dev.give': 'Donner', 'dev.skip': 'Vague suivante', 'set.hudSk': 'Compétences visibles en jeu', 'set.ts': 'Taille du texte', 'set.ts1': 'Normale', 'set.ts2': 'Grande', 'set.ts3': 'Très grande', 'set.calm': 'Réduire les flashs et clignotements', 'home.perfAria': ', parfait',
    'set.autoS': 'Tir auto', 'set.vibS': 'Vibrer', 'set.shakeS': 'Secousses', 'set.fxS': 'Effets', 'set.hudSkS': 'Compétences', 'set.calmS': 'Moins de flashs', 'inf.recordShort': 'Record', 'inf.waveShort': 'Vague {n}', 'inf.shieldN': 'Bouclier {n}', 'inf.mul': 'Score ×{n}', 'inf.tierAria': '{name} : {desc} Record {rec}', 'set.reset': 'Remettre la progression à zéro', 'set.resetBtn': 'Effacer',
    'profile.foot': 'Aucune musique : uniquement des bruitages. Clavier : ← → ou Q D pour bouger, E pour l’onde, R pour l’ultime, Échap pour la pause.',
    'stats.missions': 'Missions', 'stats.stars': 'Étoiles', 'stats.starsVal': '{n} / {max}', 'stats.kills': 'Ennemis', 'stats.combo': 'Meilleur combo', 'stats.grazes': 'Frôlements', 'stats.time': 'Temps de jeu',
    'time.hm': '{h} h {m}', 'time.m': '{m} min',
    'arch.done': 'Stabilisée', 'arch.ongoing': 'En cours', 'arch.rebrief': 'Revoir le briefing',
    'reset.over': 'Réglages', 'reset.title': 'Tout effacer ?', 'reset.body': 'Missions, étoiles, crédits, vaisseaux et records seront supprimés.',
    'reset.cancel': 'Annuler', 'reset.confirm': 'Effacer la progression', 'reset.done': 'Progression effacée',
    'set.sens': 'Sensibilité du doigt', 'set.sensV': '{n}×', 'set.sensAria': 'Sensibilité {n} fois',
    'pwa.row': 'Jouer sans navigateur, même hors ligne', 'pwa.install': 'Installer le jeu', 'pwa.done': 'Jeu installé', 'profile.privacy': 'Confidentialité : aucune donnée collectée',
    'set.save': 'Sauvegarde', 'set.export': 'Exporter', 'set.import': 'Importer',
    'save.over': 'Sauvegarde', 'save.expTitle': 'Ton code de sauvegarde', 'save.expBody': 'Copie ce code et garde-le en lieu sûr. Sur un autre appareil : Profil, Sauvegarde, Importer.',
    'save.copy': 'Copier le code', 'save.copied': 'Code copié', 'save.copyFail': 'Copie impossible : sélectionne le code à la main', 'save.close': 'Fermer', 'save.codeAria': 'Code de sauvegarde',
    'save.impTitle': 'Importer une progression', 'save.impBody': 'Colle ici un code de sauvegarde.', 'save.read': 'Lire le code', 'save.cancel': 'Annuler',
    'save.errBad': 'Ce code n’est pas un code de sauvegarde.', 'save.errSum': 'Code incomplet ou modifié : recopie-le en entier.', 'save.errNewer': 'Ce code vient d’une version plus récente du jeu : mets le jeu à jour.',
    'save.okTitle': 'Remplacer ta progression ?', 'save.okBody': 'Le code contient : missions finies {m}, étoiles {s}, crédits {c}, vaisseaux {v}. Ta progression actuelle sera remplacée (une copie de secours reste sur cet appareil). Tes réglages ne changent pas.',
    'save.replace': 'Remplacer', 'save.done': 'Progression importée',

    /* ---------- en jeu ---------- */
    'hud.wave': 'Vague {n}', 'hud.waveOf': 'Vague {n} / {t}', 'hud.combo': 'Combo {n}', 'hud.lvl': 'Niv. {n}', 'hud.hp': '{n}/{t}', 'hud.hpAria': 'Coque : {n} points sur {t}', 'num.M': '{n} M', 'num.Md': '{n} Md', 'hud.ult': 'Ultime', 'hud.onde': 'Onde',
    'hint.moveTouch': 'Glisse le doigt pour bouger · tir automatique', 'hint.moveMouse': 'Souris ou flèches pour bouger · tir automatique',
    'hint.graze': 'Frôle les tirs ennemis pour charger l’onde',
    'hint.ondeTouch': 'Onde prête · touche ONDE', 'hint.ondeKey': 'Onde prête · touche E', 'hint.ultTouch': 'Ultime prêt · touche ULTIME', 'hint.ultKey': 'Ultime prêt · touche R',
    'game.escort': 'Escorte lourde', 'game.miniboss': 'Mini-boss', 'game.squad': 'Escadrille complète', 'game.squadCr': '+{n} crédits',
    'game.xp': '+{n} XP',
    'cube.tip': 'Touche ce cube pour changer d\'arme', 'cube.got': '{n} : {d}', 'game.lvlCr': 'Niveau max · +{n} crédits',
    // As : ennemi d'élite qui esquive (noms de vents)
    'elite.title': 'As · {n}', 'elite.sub': 'Il esquive tes tirs : abats-le avant sa fuite', 'elite.gone': '{n} s\'est échappé', 'elite.down': 'As abattu : {n}',
    'elite.n0': 'Mistral', 'elite.n1': 'Sirocco', 'elite.n2': 'Tramontane', 'elite.n3': 'Zéphyr', 'elite.n4': 'Noroît', 'elite.n5': 'Simoun', 'elite.n6': 'Bise', 'elite.n7': 'Autan',
    // paliers de l'Infini (retours n° 2) : un tous les 10 vagues, au boss ; noms tirés de la radio
    'pal.n1': 'Porteuse', 'pal.n2': 'Harmonique', 'pal.n3': 'Résonance', 'pal.n4': 'Modulation', 'pal.n5': 'Saturation', 'pal.n6': 'Larsen', 'pal.n7': 'Brouillage', 'pal.n8': 'Plein spectre', 'pal.nX': 'Au-delà {k}',
    'pal.title': 'Palier {k} : {n}', 'pal.cr': '+{n} crédits', 'pal.next': 'Prochain palier : {n}, vague {w} (+{c} crédits)', 'end.pal': 'Palier atteint', 'end.palNone': 'aucun',
    'game.revive': 'Dernier souffle', 'game.shieldUp': 'Bouclier +{n}', 'game.shieldDown': 'Bouclier tombé', 'game.hpLost': 'Coque −1', 'game.hpUp': 'Coque +{n}', 'game.hullLow': 'Coque critique', 'game.hullLowSub': 'Le prochain coup est fatal', 'game.boss': 'Boss', 'game.phase': 'Phase {n}', 'game.down': 'Neutralisé',
    'game.ultTag': 'ULTIME', 'game.where': 'Fréquence {f} · Mission {m}', 'game.whereBoss': 'Fréquence {f} · Boss', 'game.whereInf': 'Mode infini · {tier}', 'game.bossIs': 'Boss : {name}',

    /* ---------- feuilles ---------- */
    'lvl.over': 'Niveau {n}', 'lvl.title': 'Choisis une compétence', 'lvl.slots': 'Emplacements {n} / {t}', 'lvl.full': 'Emplacements pleins : améliore tes compétences',
    'pause.title': 'Pause', 'pause.whereInf': 'Infini · vague {n}', 'pause.resume': 'Reprendre', 'pause.restart': 'Recommencer', 'pause.quit': 'Quitter la partie',
    'pause.skills': 'Compétences acquises', 'pause.none': 'Aucune compétence pour l’instant.', 'pause.lv': 'Nv {n}', 'pause.lvMax': 'Nv {n} · max', 'lvl.new': 'Nouveau', 'lvl.lv': 'Nv {n}',
    'end.win': 'Mission accomplie', 'end.lose': 'Signal perdu', 'end.record': 'Nouveau record', 'end.infOver': 'Fin du balayage', 'end.infTier': 'Infini · {tier}',
    'end.perfect': 'Parfait', 'end.perfectWhy': '3 étoiles sans aucun coup, même sur le bouclier', 'end.perfectBonus': 'Bonus parfait',
    'end.capDone': 'Mission finie', 'end.capHalf': 'Plus de la moitié des PV', 'end.capNoLoss': 'Aucun PV perdu', 'end.capOk': 'Réussi', 'end.capKo': 'Raté',
    'star.1': 'Finir', 'star.2': 'PV > moitié', 'star.3': 'Aucun PV perdu',
    'end.score': 'Score', 'end.crPicked': 'Crédits ramassés', 'end.reward': 'Récompense', 'end.rewardFirst': 'Récompense (1re fois)', 'end.total': 'Total',
    'end.kills': 'Ennemis détruits', 'end.crKept': 'Crédits conservés', 'end.wave': 'Vague atteinte', 'end.comboMax': 'Combo max', 'end.credits': 'Crédits',
    'end.build': 'Compétences de la partie', 'end.max': 'max',
    'end.tip': 'Astuce : frôle les tirs pour charger l’onde, puis déclenche-la quand l’écran se remplit.',
    'end.unlock': 'Nouvelle fréquence : {n} · {name}', 'end.omega': 'Nouveau vaisseau dans le hangar : Ω',
    'end.next': 'Suivante', 'end.boss': 'Le boss', 'end.jump': 'Sauter vers {name}', 'end.inf': 'Mode infini', 'end.home': 'Accueil', 'end.retry': 'Réessayer', 'end.again': 'Rejouer',
    'quote': '« {t} »',

    /* ---------- raretés ---------- */
    'rar.1': 'Commun', 'rar.2': 'Rare', 'rar.3': 'Épique', 'rar.4': 'Légendaire',

    /* ---------- armes ---------- */
    'wpn.imp.name': 'Impulsion', 'wpn.imp.desc': 'Rafale rapide, s’élargit à chaque niveau.',
    'wpn.plasma.name': 'Plasma', 'wpn.plasma.desc': 'Orbes lents qui explosent en zone.',
    'wpn.arc.name': 'Arc', 'wpn.arc.desc': 'Éclairs automatiques qui sautent de cible en cible.',
    'wpn.rail.name': 'Rail', 'wpn.rail.desc': 'Trait instantané qui traverse toute la colonne.',
    'wpn.swarm.name': 'Essaim', 'wpn.swarm.desc': 'Micro-missiles à tête chercheuse.',

    /* ---------- compétences ---------- */
    'sk.rate.name': 'Cadence', 'sk.rate.desc': 'Tir 12 % plus rapide.',
    'sk.dmg.name': 'Puissance', 'sk.dmg.desc': 'Dégâts +15 %.',
    'sk.magnet.name': 'Aimant', 'sk.magnet.desc': 'Rayon de ramassage +60 %.',
    'sk.heal.name': 'Réparation', 'sk.heal.desc': 'Répare 1 point de coque.',
    'sk.onde.name': 'Onde rapide', 'sk.onde.desc': 'L’onde se charge 30 % plus vite.',
    'sk.pierce.name': 'Perforant', 'sk.pierce.desc': 'Chaque tir traverse un ennemi de plus.',
    'sk.bounce.name': 'Rebond', 'sk.bounce.desc': 'Les tirs rebondissent sur les bords.',
    'sk.crit.name': 'Critique', 'sk.crit.desc': '+10 % de chances de coup ×2,5.',
    'sk.drone.name': 'Drone allié', 'sk.drone.desc': 'Un drone tire à tes côtés.',
    'sk.orbit.name': 'Boucliers rotatifs', 'sk.orbit.desc': 'Un éclat de plus tourne autour de toi et bloque les tirs (3 au plus).',
    'sk.hull.name': 'Bouclier renforcé', 'sk.hull.desc': 'Le champ de force encaisse un coup de plus.',
    'sk.ult.name': 'Ultime rapide', 'sk.ult.desc': 'L’ultime se charge 30 % plus vite.',
    'sk.freeze.name': 'Givre', 'sk.freeze.desc': '8 % de chances de geler un ennemi.',
    'sk.shards.name': 'Éclats', 'sk.shards.desc': 'Les ennemis détruits projettent des éclats.',
    'sk.diag.name': 'Tirs obliques', 'sk.diag.desc': 'Deux tirs en diagonale en plus.',
    'sk.rico.name': 'Ricochet', 'sk.rico.desc': 'Chaque impact repart vers une autre cible.',
    'sk.wpn.name': 'Arme +1', 'sk.wpn.desc': 'Ton arme gagne un niveau.',
    'sk.storm.name': 'Foudre', 'sk.storm.desc': 'Tous les 10 impacts, un éclair frappe trois cibles.',
    'sk.graze.name': 'Frôleur', 'sk.graze.desc': 'Frôler un tir double la charge et donne +25 % de dégâts.',
    'sk.revive.name': 'Dernier souffle', 'sk.revive.desc': 'Une fois par mission, revient à la vie.',
    'sk.fever.name': 'Fièvre', 'sk.fever.desc': 'Au-delà de 25 de combo, dégâts +30 %.',
    'sk.echo.name': 'Écho', 'sk.echo.desc': 'Un double te suit à 0,6 s et tire avec toi.',

    /* ---------- vaisseaux ---------- */
    'ch.if50.name': 'Navette IF-50', 'ch.if50.origin': 'Bureau des fréquences', 'ch.if50.passive': 'Modeste. La première navette du Bureau.',
    'ch.lame.name': 'Lame', 'ch.lame.origin': 'Prototype du Bureau', 'ch.lame.passive': 'Très rapide. +10 % de critiques.',
    'ch.columbiad.name': 'Columbiad', 'ch.columbiad.origin': 'Jules Verne, 1865', 'ch.columbiad.passive': 'L’onde se charge 25 % plus vite.',
    'ch.concorde.name': 'Concorde', 'ch.concorde.origin': 'Premier vol en 1969', 'ch.concorde.passive': 'Le plus rapide. Cadence +12 %.',
    'ch.nautilus.name': 'Nautilus', 'ch.nautilus.origin': 'Jules Verne, 1870', 'ch.nautilus.passive': 'Tirs perforants dès le départ.',
    'ch.bastion.name': 'Bastion', 'ch.bastion.origin': 'Prototype du Bureau', 'ch.bastion.passive': 'Blindé, lent. Démarre avec un drone.',
    'ch.apollo.name': 'Apollo', 'ch.apollo.origin': 'Module de commande, 1969', 'ch.apollo.passive': 'L’ultime se charge 30 % plus vite.',
    'ch.omega.name': 'Ω', 'ch.omega.origin': 'Après la fréquence zéro', 'ch.omega.passive': 'Débloqué en coupant la Source. Bonus partout.',

    /* ---------- améliorations ---------- */
    'upg.hull.name': 'Bouclier', 'upg.hull.desc': 'Le champ de force encaisse un coup de plus',
    'upg.cannon.name': 'Canon', 'upg.cannon.desc': 'Arme +1 niveau au départ, +5 %',
    'upg.onde.name': 'Onde', 'upg.onde.desc': 'Charge +15 %, rayon +10 %',
    'upg.ult.name': 'Ultime', 'upg.ult.desc': 'Charge de l’ultime +15 %',
    'upg.magnet.name': 'Aimant', 'upg.magnet.desc': 'Rayon de ramassage +25 %',
    'upg.credit.name': 'Prime', 'upg.credit.desc': 'Crédits +15 %',

    /* ---------- paliers infinis ---------- */
    'tier.0.name': 'Hardcore', 'tier.0.desc': 'Tous les ennemis dès le départ, et ça accélère.',
    'tier.1.name': 'Cauchemar', 'tier.1.desc': 'Un coup de bouclier en moins. Tout va plus vite.',
    'tier.2.name': 'Ω', 'tier.2.desc': 'Sans bouclier. Aucune erreur.',

    /* ---------- ultimes ---------- */
    'ult.beam': 'Canon fréquence zéro', 'ult.blades': 'Mille lames', 'ult.orbital': 'Barrage orbital', 'ult.boom': 'Bang supersonique',
    'ult.shell': 'Salve du Columbiad', 'ult.ram': 'Éperon', 'ult.saturn': 'Saturn V', 'ult.reset': 'Réinitialisation',

    /* ---------- idées du bloc 4 ---------- */
    'idea.accord': 'Accord !', 'idea.noise': 'Le Bruit brouille l’interface : abats le parasite !', 'idea.cleanT': 'Interface nettoyée',
    'idea.convoyT': 'Convoi', 'idea.convoyS': 'Escorte les cargos jusqu’au bord', 'idea.convoyLost': 'Cargo perdu', 'idea.convoyEnd': 'Convoi : {k} sur {n} arrivés',
    'idea.remember': 'Il se souvient de toi…', 'idea.learnT': 'Il a appris', 'idea.learnS0': 'Tu restes à gauche', 'idea.learnS1': 'Tu restes au centre', 'idea.learnS2': 'Tu restes à droite',
    'radio.over': 'Molette radio', 'radio.title': 'Change de fréquence', 'radio.ok': 'Accorder',
    'radio.mod.rich': 'Crédits ramassés +50 % pendant 3 vagues', 'radio.mod.xp': 'Expérience +40 % pendant 3 vagues', 'radio.mod.shield': 'Bouclier +1 tout de suite',

    /* ---------- univers ---------- */
    'w.bureau.name': 'Le Bureau', 'w.bureau.label': 'Dans le réseau', 'w.bureau.boss': 'Le Noyau',
    'w.bureau.pre': [['B', 'Le Bruit s’est infiltré dans nos serveurs.'], ['B', 'Nettoie la ligne, IF-50.']],
    'w.bureau.post': 'Il a fui par une vieille fréquence : 1865.',
    'w.bureau.fact': 'Une interférence, ce sont deux ondes qui s’additionnent… ou s’annulent.',

    'w.columbiad.name': 'De la Terre à la Lune', 'w.columbiad.label': 'Vers la Lune', 'w.columbiad.boss': 'L’Albatros',
    'w.columbiad.pre': [['B', 'Floride, 1865. Un canon géant vise la Lune.'], ['A', 'Et le Bruit veut monter à bord ?'], ['B', 'Exactement.']],
    'w.columbiad.post': 'Il replonge. Direction les abysses, 1870.',
    'w.columbiad.fact': 'Le module de commande d’Apollo 11 s’appelait Columbia, comme un écho au Columbiad de Jules Verne.',

    'w.abysses.name': 'Vingt mille lieues', 'w.abysses.label': 'Sous la mer', 'w.abysses.boss': 'Le Léviathan de fer',
    'w.abysses.pre': [['B', 'Sous la mer, il parasite les machines.'], ['B', 'On te reconfigure en sous-marin.']],
    'w.abysses.post': 'Il remonte vers la surface… et vers la guerre.',
    'w.abysses.fact': 'Jules Verne a nommé son sous-marin d’après le Nautilus de Robert Fulton, un vrai sous-marin construit en 1800.',

    'w.somme.name': 'Somme', 'w.somme.label': 'Au sol', 'w.somme.boss': 'Le Dirigeable-mère',
    'w.somme.pre': [['B', 'Les dirigeables ne sont plus pilotés. Ils sont parasités.'], ['B', 'Au sol, tu deviens un char. Tiens la ligne.']],
    'w.somme.post': 'Il prend de l’altitude. Cap sur les Andes.',
    'w.somme.fact': 'Le char Renault FT fut le premier char de série doté d’une tourelle pivotant sur 360°.',

    'w.aero.name': 'Aéropostale', 'w.aero.label': 'Dans les airs', 'w.aero.boss': 'Le Géant Do X',
    'w.aero.pre': [['B', '1930. Le courrier doit passer.'], ['A', 'Même à travers la tempête ?'], ['B', 'Surtout à travers la tempête.']],
    'w.aero.post': 'Il file vers l’Atlantique.',
    'w.aero.fact': 'En mai 1930, Jean Mermoz relie le Sénégal au Brésil en hydravion : première traversée postale de l’Atlantique Sud.',

    'w.atlantique.name': 'Atlantique', 'w.atlantique.label': 'Sur la mer', 'w.atlantique.boss': 'Le Cuirassé',
    'w.atlantique.pre': [['B', 'Les bombardiers ne répondent plus.'], ['B', 'Protège le convoi.']],
    'w.atlantique.post': 'Il s’échappe en orbite.',
    'w.atlantique.fact': 'Un convoi avançait à la vitesse de son navire le plus lent.',

    'w.orbite.name': 'Orbite', 'w.orbite.label': 'En orbite', 'w.orbite.boss': 'Skylab',
    'w.orbite.pre': [['B', 'Il veut corrompre la plus belle mission de l’histoire.'], ['A', 'Pas sur mon signal.']],
    'w.orbite.post': 'Il quitte notre histoire… pour la fiction.',
    'w.orbite.fact': 'Skylab a perdu l’un de ses panneaux solaires dès son lancement, en 1973.',

    'w.escadre.name': 'Escadre', 'w.escadre.label': 'Space-opéra', 'w.escadre.boss': 'L’Anneau-forteresse',
    'w.escadre.pre': [['B', 'Une galaxie de fiction. Ses flottes obéissent maintenant au Bruit.']],
    'w.escadre.post': 'Il se cache dans une ville qui ne dort jamais.',
    'w.escadre.fact': 'Le mot « hyperespace » circule dans la science-fiction dès les années 1930.',

    'w.neotokyo.name': 'Néo-Tokyo', 'w.neotokyo.label': 'Méchas', 'w.neotokyo.boss': 'L’Arche volante',
    'w.neotokyo.pre': [['B', 'Pour le dernier tir, il faudra le courant de tout un pays.'], ['A', 'Alors branchez-moi.']],
    'w.neotokyo.post': 'Il ne reste qu’une fréquence. La sienne.',
    'w.neotokyo.fact': 'Le Japon utilise deux fréquences électriques : 50 Hz à l’est, 60 Hz à l’ouest.',

    'w.zero.name': 'Fréquence zéro', 'w.zero.label': 'Origine', 'w.zero.boss': 'La Source',
    'w.zero.pre': [['B', 'Ici, tout a commencé.'], ['A', 'Et ici, tout s’arrête.']],
    'w.zero.post': 'Silence. Le signal est propre… pour l’instant.',
    'w.zero.fact': 'Des motifs girih du XVe siècle anticipent les pavages quasi périodiques décrits par Penrose en 1974.',

    'w.muet.name': 'Le Voyage', 'w.muet.label': 'Cinéma muet', 'w.muet.boss': 'La Lune de théâtre',
    'w.muet.pre': [['B', 'La Source n’était pas seule. Un écho s’est glissé dans une bobine de 1902.'], ['A', 'Une bobine ? Sans le son ?'], ['B', 'Sans le son. Lis les cartons, et tire.']],
    'w.muet.post': 'Il saute hors de la pellicule… et se cache dans une maquette.',
    'w.muet.fact': 'En 1902, Georges Méliès tourne « Le Voyage dans la Lune », inspiré de Jules Verne : décors peints, fusées de carton et trucages.',

    'w.relief.name': 'Relief', 'w.relief.label': 'En maquette', 'w.relief.boss': 'La Citadelle',
    'w.relief.pre': [['B', 'Dernier refuge : un plan-relief, une ville fortifiée en miniature.'], ['A', 'Et ses machines volantes de bois et de papier ?'], ['B', 'Parasitées. Surveille l’horizon : elles en surgissent.']],
    'w.relief.post': 'Dernière fréquence nettoyée. Le signal est pur.',
    'w.relief.fact': 'Les plans-reliefs, maquettes de villes fortifiées commencées en 1668 sous Louvois, sont conservés aux Invalides, à Paris.',
  },
};

const I18N = {
  lang: 'fr',
  locale() { return (LANG[this.lang] || LANG.fr)._locale; },
  get(key) { const L = LANG[this.lang]; return L && L[key] != null ? L[key] : LANG.fr[key]; },
  t(key, v) {
    let s = this.get(key);
    if (s == null) return key;
    if (v && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (_, k) => (v[k] != null ? v[k] : ''));
    return s;
  },
  set(lang) { if (!LANG[lang]) return; this.lang = lang; document.documentElement.lang = lang; this.hydrate(); this.apply(); },
  // remplit les éléments marqués data-i18n / data-i18n-aria dans le HTML
  apply(root = document) {
    document.title = this.t('app.name');
    root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = this.t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', this.t(el.dataset.i18nAria)); });
  },
  // injecte noms et descriptions dans les tables de données
  hydrate() {
    const t = (k, v) => this.t(k, v);
    for (const [id, w] of Object.entries(WEAPONS)) { w.name = t(`wpn.${id}.name`); w.desc = t(`wpn.${id}.desc`); }
    for (const s of SKILLS) { s.name = t(`sk.${s.id}.name`); s.desc = t(`sk.${s.id}.desc`); }
    for (const [r, R] of Object.entries(RARITY)) R.name = t('rar.' + r);
    for (const [id, C] of Object.entries(CHASSIS)) { C.name = t(`ch.${id}.name`); C.origin = t(`ch.${id}.origin`); C.passive = t(`ch.${id}.passive`); }
    for (const U of UPGRADES) { U.name = t(`upg.${U.id}.name`); U.desc = t(`upg.${U.id}.desc`); }
    TIERS.forEach((T, i) => { T.name = t(`tier.${T.key != null ? T.key : i}.name`); T.desc = t(`tier.${T.key != null ? T.key : i}.desc`); });
    if (typeof ULTS !== 'undefined') for (const [id, U] of Object.entries(ULTS)) U.name = t('ult.' + id);
    if (typeof WORLDS !== 'undefined') for (const Wd of WORLDS) {
      const k = 'w.' + Wd.key;
      Wd.name = t(k + '.name'); Wd.label = t(k + '.label'); Wd.fact = t(k + '.fact'); Wd.boss.name = t(k + '.boss');
      Wd.story = { pre: t(k + '.pre'), post: t(k + '.post') };
    }
  },
};
const tx = (key, v) => I18N.t(key, v);
