import type { EventDef } from './types';

/**
 * Puzzles are events where exactly one choice is "right" and grants a reward,
 * the others cost something. Still declarative so a designer can add new ones
 * without touching code. Full branching puzzles (multi-step) will need a new
 * structure — not in scope for MVP.
 */
export const PUZZLES: Record<string, EventDef> = {
  coffee_order: {
    id: 'coffee_order',
    title: 'La commande du CEO',
    text:
      'Un post-it sur un mug : "double ristretto, lait d\u2019avoine, sans mousse, '
      + 'EXACTEMENT". Trois mugs fumants attendent. Lequel est le bon ?',
    choices: [
      {
        label: 'Le mug beige (le correct)',
        log: 'Tu bois. Clarté mentale totale. +3 PV, +2 MP.',
        effect: { hpDelta: 3, mpDelta: 2 },
      },
      {
        label: 'Le mug blanc (mousse visible)',
        log: 'Mauvais choix. Le cringe t\u2019assèche. -2 PV.',
        effect: { hpDelta: -2 },
      },
      {
        label: 'Le mug noir (taille XL)',
        log: 'C\u2019était un thé. -1 MP.',
        effect: { mpDelta: -1 },
      },
    ],
  },

  // ─── Frigo maudit — enrichi avec yaourt Michel 2019 + cuillere_gouvernance ─

  frigo_maudit: {
    id: 'frigo_maudit',
    title: 'Frigo maudit',
    text:
      'Frigo de bureau. Quatre options. Étiquettes : « Propre », « Urgent », '
      + '« Ne pas toucher » — et tout au fond, un yaourt au nom de Michel, daté 2019.',
    recommendedHero: 'Sage',
    choices: [
      {
        label: 'Le tupperware « Propre » (+3 PV, +1 MP)',
        log: 'Étonnamment sain. Petit snack. +3 PV, +1 MP.',
        effect: { hpDelta: 3, mpDelta: 1 },
      },
      {
        label: 'Le yaourt de Michel (2019)',
        log:
          'Contre toute attente, il est parfait. Michel avait une cuillère en argent dans le couvercle. '
          + 'La Cuillère de Gouvernance — elle tranche les décisions depuis 2019.',
        effect: { grantRewardItemId: 'cuillere_gouvernance' },
      },
      {
        label: 'Le tupperware « Urgent » (-3 PV)',
        log: 'Moisi depuis trois semaines. -3 PV.',
        effect: { hpDelta: -3 },
      },
      {
        label: 'Le tupperware « Ne pas toucher » (-2 MP)',
        log: 'Quelque chose a bougé dedans. Tu regrettes. -2 MP.',
        effect: { mpDelta: -2 },
      },
    ],
  },

  // ─── Badgeuse prophétique — enrichie, grosse pénalité sur la mauvaise lecture ─

  badgeuse_prophetique: {
    id: 'badgeuse_prophetique',
    title: 'Badgeuse prophétique',
    text:
      'La badgeuse affiche trois messages au lieu d\u2019un simple beep. '
      + 'Un seul est une vraie prophétie. Les deux autres sont des pièges organisationnels.',
    recommendedHero: 'Sage',
    choices: [
      {
        label: '« Bienvenue » — lecture juste (+2 PV, +2 MP)',
        log: 'Vraie prophétie. Tu avances, serein·e. La badgeuse bipe une seule fois, nette.',
        effect: { hpDelta: 2, mpDelta: 2 },
      },
      {
        label: '« Tu n\u2019es pas dans l\u2019annuaire » — lecture menaçante',
        log:
          'Mauvaise lecture. La badgeuse déclenche une alerte silencieuse. '
          + 'Deux vigiles apparaissent puis repartent déçus. -4 PV.',
        effect: { hpDelta: -4 },
      },
      {
        label: '« Réunion dans 2 min » — lecture urgente',
        log:
          'Fausse alerte. Tu cours dans le couloir, glisses sur la moquette, '
          + 'arrives dans une salle vide. -2 MP.',
        effect: { mpDelta: -2 },
      },
    ],
  },

  // ─── Café quantique — enrichi, effets surprises par boisson ─────────────────

  cafe_quantique: {
    id: 'cafe_quantique',
    title: 'Machine à café quantique',
    text:
      'Trois gobelets remplis simultanément. Le manuel affiché dit : « un seul existe vraiment ». '
      + 'Les deux autres sont dans un état de superposition douteuse.',
    recommendedHero: 'Sage',
    choices: [
      {
        label: 'Observer avant de boire — effondrer la fonction d\u2019onde (+2 PV, +3 MP)',
        log:
          'Tu observes, tu choisis. Le café est parfait, à la température exacte. '
          + 'La réalité te remercie.',
        effect: { hpDelta: 2, mpDelta: 3 },
      },
      {
        label: 'Boire le premier sans regarder (-3 PV, +1 MP)',
        log:
          'Il n\u2019existait peut-être pas vraiment. Goût amer de paradoxe — '
          + 'mais quelques caféines passent quand même.',
        effect: { hpDelta: -3, mpDelta: 1 },
      },
      {
        label: 'Les boire tous pour être sûr·e (-1 PV, -2 MP)',
        log:
          'Paradoxe digestif. Tu perds le fil du temps et l\u2019espace se referme. '
          + 'Petite overdose de réalité.',
        effect: { hpDelta: -1, mpDelta: -2 },
      },
    ],
  },

  // ─── Mur de post-its — nouveau, trouver le post-it bleu caché ───────────────

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
        label: 'Chercher méthodiquement de gauche à droite',
        log:
          'Colonne après colonne. Ligne après ligne. Au centre, légèrement tordu, '
          + 'le post-it bleu. Une action, un nom, une date. Il passe dans ta poche.',
        effect: { grantRewardItemId: 'postit_action' },
      },
      {
        label: 'Attraper le premier post-it qui attire l\u2019œil (-2 PV)',
        log:
          'Rose. « Améliorer la synergie ». Pas de responsable, pas de date. '
          + 'Le mur te regarde avec tristesse.',
        effect: { hpDelta: -2 },
      },
      {
        label: 'Ajouter ton propre post-it sur le mur (-1 MP)',
        log:
          'Tu écris « TODO » et le colles au milieu. Tu te sens utile. '
          + 'Le mur ne change pas. Tu passes.',
        effect: { mpDelta: -1 },
      },
    ],
  },
};
