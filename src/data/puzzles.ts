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
      'Un post-it sur un mug : "double ristretto, lait d’avoine, sans mousse, ' +
      'EXACTEMENT". Trois mugs fumants attendent. Lequel est le bon ?',
    choices: [
      {
        label: 'Le mug beige (le correct)',
        log: 'Tu bois. Clarté mentale totale. +3 PV, +2 MP.',
        effect: { hpDelta: 3, mpDelta: 2 },
      },
      {
        label: 'Le mug blanc (mousse visible)',
        log: 'Mauvais choix. Le cringe t’assèche. -2 PV.',
        effect: { hpDelta: -2 },
      },
      {
        label: 'Le mug noir (taille XL)',
        log: 'C’était un thé. -1 MP.',
        effect: { mpDelta: -1 },
      },
    ],
  },

  // ─── Nouvelles épreuves absurdes — favor Laurent (Sage / MAG / logique) ───

  frigo_maudit: {
    id: 'frigo_maudit',
    title: 'Frigo maudit',
    text: 'Frigo de bureau. Trois tupperwares. Étiquettes : « Propre », « Urgent », « Ne pas toucher ». L’odeur est… significative.',
    recommendedHero: 'Sage',
    choices: [
      {
        label: 'Le tupperware « Propre » (le correct)',
        log: 'Étonnamment sain. Petit snack. +3 PV, +1 MP.',
        effect: { hpDelta: 3, mpDelta: 1 },
      },
      {
        label: 'Le tupperware « Urgent » (piège)',
        log: 'Moisi depuis trois semaines. -3 PV.',
        effect: { hpDelta: -3 },
      },
      {
        label: 'Le tupperware « Ne pas toucher » (cursé)',
        log: 'Quelque chose a bougé dedans. Tu regrettes. -2 MP.',
        effect: { mpDelta: -2 },
      },
    ],
  },

  badgeuse_prophetique: {
    id: 'badgeuse_prophetique',
    title: 'Badgeuse prophétique',
    text: 'La badgeuse affiche trois messages au lieu d’un simple beep. Un seul est vrai.',
    recommendedHero: 'Sage',
    choices: [
      {
        label: '« Bienvenue » (classique, juste)',
        log: 'Vraie prophétie. Tu avances, serein·e. +2 PV, +2 MP.',
        effect: { hpDelta: 2, mpDelta: 2 },
      },
      {
        label: '« Tu n’es pas dans l’annuaire » (menaçant)',
        log: 'Mauvaise lecture. La badgeuse émet un bruit triste. -2 PV.',
        effect: { hpDelta: -2 },
      },
      {
        label: '« Réunion dans 2 min » (urgent)',
        log: 'Fausse alerte. Tu cours pour rien dans le couloir. -1 MP.',
        effect: { mpDelta: -1 },
      },
    ],
  },

  cafe_quantique: {
    id: 'cafe_quantique',
    title: 'Machine à café quantique',
    text: 'Trois gobelets remplis simultanément. Le manuel affiché dit : « un seul existe vraiment ».',
    recommendedHero: 'Sage',
    choices: [
      {
        label: 'Observer avant de boire (le correct)',
        log: 'Fonction d’onde effondrée. Le café est parfait. +2 PV, +3 MP.',
        effect: { hpDelta: 2, mpDelta: 3 },
      },
      {
        label: 'Boire le premier sans regarder',
        log: 'Il n’existait pas. Goût amer de paradoxe. -2 PV.',
        effect: { hpDelta: -2 },
      },
      {
        label: 'Les boire tous pour être sûr·e',
        log: 'Paradoxe digestif. Tu perds le fil du temps. -2 MP.',
        effect: { mpDelta: -2 },
      },
    ],
  },

  bureau_sens_cache: {
    id: 'bureau_sens_cache',
    title: 'Le bureau du sens caché',
    text: 'Un bureau vide. Une note : « Trouver le vrai sens de ce document ». Trois phrases sont soulignées.',
    recommendedHero: 'Sage',
    choices: [
      {
        label: '« Aligner les synergies transverses » (jargon creux — correct)',
        log: 'Tu repères le vide. Le vrai message est entre les lignes. +3 PV, +2 MP.',
        effect: { hpDelta: 3, mpDelta: 2 },
      },
      {
        label: '« Piloter la transformation » (piège)',
        log: 'Boucle infinie de réunions déclenchée. -2 PV.',
        effect: { hpDelta: -2 },
      },
      {
        label: '« Livrer des deliverables » (tautologie)',
        log: 'Ton cerveau redémarre. -1 MP.',
        effect: { mpDelta: -1 },
      },
    ],
  },
};
