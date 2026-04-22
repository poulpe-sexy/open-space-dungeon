import type { EventDef } from './types';

/**
 * Puzzles are events with at least one "intended" path. Unlike old-style puzzles
 * where the correct answer was free and wrong answers were pure penalties, each
 * choice here carries BOTH a cost and a benefit — the player faces real trade-offs
 * rather than obvious pick-the-right-one.
 *
 * The "correct" route still gives the best long-term outcome (a reward item or
 * the best HP/MP combo), but it is no longer cost-free.
 */
export const PUZZLES: Record<string, EventDef> = {
  coffee_order: {
    id: 'coffee_order',
    title: 'La commande du CEO',
    text:
      'Un post-it sur un mug : "double ristretto, lait d\u2019avoine, sans mousse, '
      + 'EXACTEMENT". Trois mugs fumants attendent.',
    choices: [
      {
        label: 'Le mug beige (odeur forte, fond légèrement huileux)',
        log: 'Double ristretto, lait d\u2019avoine, zéro mousse. Exactement. Clarté mentale totale. +2 PV, +2 MP.',
        effect: { hpDelta: 2, mpDelta: 2 },
      },
      {
        label: 'Le mug blanc (mousse visible en surface)',
        log: 'La mousse te trahit. Mauvais café, mauvais cringe — mais les caféines passent quand même. -2 PV, +1 MP.',
        effect: { hpDelta: -2, mpDelta: 1 },
      },
      {
        label: 'Le mug noir (étiquette : thé oolong)',
        log: 'C\u2019était un thé. Pas de café. Étonnamment reposant. -1 MP, +2 PV.',
        effect: { mpDelta: -1, hpDelta: 2 },
      },
    ],
  },

  // ─── Frigo maudit — chaque option a maintenant un avantage ──────────────────

  frigo_maudit: {
    id: 'frigo_maudit',
    title: 'Frigo maudit',
    text:
      'Frigo de bureau. Quatre options. Étiquettes : « Propre », « Urgent », '
      + '« Ne pas toucher » — et tout au fond, un yaourt au nom de Michel, daté 2019.',
    recommendedHero: 'Sage',
    choices: [
      {
        label: 'Le tupperware « Propre » (+3 PV)',
        log: 'Étonnamment sain. Un peu fade, mais ça tient.',
        effect: { hpDelta: 3 },
      },
      {
        label: 'Le yaourt de Michel (2019) (-1 PV)',
        log:
          'Tu hésites une seconde. Tu l\u2019ouvres quand même. Contre toute attente, parfait. '
          + 'Michel avait une cuillère en argent dans le couvercle. '
          + 'La Cuillère de Gouvernance — elle tranche les décisions depuis 2019.',
        effect: { hpDelta: -1, grantRewardItemId: 'cuillere_gouvernance' },
      },
      {
        label: 'Le tupperware « Urgent » (-2 PV, +2 MP)',
        log: 'Moisi depuis trois semaines. Ton système immunitaire entre en mode urgence. Curieusement stimulant.',
        effect: { hpDelta: -2, mpDelta: 2 },
      },
      {
        label: 'Le tupperware « Ne pas toucher » (-1 PV, +1 MP)',
        log: 'Tu l\u2019entrouvres juste assez. Quelque chose a bougé — mais l\u2019adrénaline aide.',
        effect: { hpDelta: -1, mpDelta: 1 },
      },
    ],
  },

  // ─── Badgeuse prophétique — les mauvaises lectures ont un avantage ───────────

  badgeuse_prophetique: {
    id: 'badgeuse_prophetique',
    title: 'Badgeuse prophétique',
    text:
      'La badgeuse affiche trois messages au lieu d\u2019un simple beep. '
      + 'Un seul est une vraie prophétie. Les deux autres sont des pièges organisationnels.',
    recommendedHero: 'Sage',
    choices: [
      {
        label: '« Bienvenue » — lecture juste (+2 PV, +1 MP)',
        log: 'Vraie prophétie. Tu avances, serein·e. La badgeuse bipe une seule fois, nette.',
        effect: { hpDelta: 2, mpDelta: 1 },
      },
      {
        label: '« Tu n\u2019es pas dans l\u2019annuaire » — lecture menaçante (-3 PV, +2 MP)',
        log:
          'Mauvaise lecture. La badgeuse déclenche une alerte silencieuse. '
          + 'Deux vigiles apparaissent puis repartent déçus — l\u2019adrénaline reste.',
        effect: { hpDelta: -3, mpDelta: 2 },
      },
      {
        label: '« Réunion dans 2 min » — lecture urgente (-1 MP, +2 PV)',
        log:
          'Fausse alerte. Tu cours dans le couloir, arrives dans une salle vide. '
          + 'La course te fait du bien.',
        effect: { mpDelta: -1, hpDelta: 2 },
      },
    ],
  },

  // ─── Café quantique — trois archétypes distincts, pas de dominant ────────────

  cafe_quantique: {
    id: 'cafe_quantique',
    title: 'Machine à café quantique',
    text:
      'Trois gobelets remplis simultanément. Le manuel affiché dit : « un seul existe vraiment ». '
      + 'Les deux autres sont dans un état de superposition douteuse.',
    recommendedHero: 'Sage',
    choices: [
      {
        label: 'Observer avant de boire — effondrer la fonction d\u2019onde (+1 PV, +3 MP)',
        log:
          'Tu observes, tu choisis. Le café est parfait, à la température exacte. '
          + 'La réalité te remercie. Choix du Sage.',
        effect: { hpDelta: 1, mpDelta: 3 },
      },
      {
        label: 'Boire le premier sans regarder (-2 PV, +3 MP)',
        log:
          'Il n\u2019existait peut-être pas vraiment. Goût amer de paradoxe — '
          + 'mais les caféines quantiques sont bien réelles.',
        effect: { hpDelta: -2, mpDelta: 3 },
      },
      {
        label: 'Les boire tous pour être sûr·e (+3 PV, -2 MP)',
        log:
          'Overdose de réalité. Tu perds le fil du temps — mais le corps absorbe. '
          + 'Choix du tank imprudent.',
        effect: { hpDelta: 3, mpDelta: -2 },
      },
    ],
  },

  // ─── Mur de post-its — chercher méthodiquement coûte du MP ──────────────────

  mur_postit: {
    id: 'mur_postit',
    title: 'Mur de post-its',
    text:
      'Un mur entier recouvert de post-its jaunes, roses et verts. '
      + 'La légende dit qu\u2019un seul post-it bleu se cache parmi eux — '
      + 'et qu\u2019il contient une action concrète avec un responsable et une date.',
    recommendedHero: 'Sage',
    choices: [
      {
        label: 'Chercher méthodiquement de gauche à droite (-1 MP)',
        log:
          'Colonne après colonne. Ça prend de la concentration. Au centre, légèrement tordu, '
          + 'le post-it bleu. Une action, un nom, une date. Il passe dans ta poche.',
        effect: { mpDelta: -1, grantRewardItemId: 'postit_action' },
      },
      {
        label: 'Attraper le premier post-it qui attire l\u2019œil (-2 PV, +1 MP)',
        log:
          'Rose. « Améliorer la synergie ». Pas de responsable, pas de date. '
          + 'La frustration est tonique, au moins.',
        effect: { hpDelta: -2, mpDelta: 1 },
      },
      {
        label: 'Ajouter ton propre post-it sur le mur (-1 MP, +1 PV)',
        log:
          'Tu écris « TODO » et le colles au milieu. Tu te sens utile. '
          + 'Le mur ne change pas. Mais toi, légèrement.',
        effect: { mpDelta: -1, hpDelta: 1 },
      },
    ],
  },
};
