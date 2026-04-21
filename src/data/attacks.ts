import type { Attack } from './types';

/**
 * Attack catalogue.
 * Power is a multiplier applied to the user's ATK (physical) or MAG (magic)
 * stat. Cost is deducted from MP (derived = stats.mag × 2).
 * Ordered roughly by tier to make the table easy to skim.
 */
export const ATTACKS: Record<string, Attack> = {
  // --- Marine / Choc ---
  impact: {
    id: 'impact',
    name: 'Impact',
    kind: 'physical',
    tier: 1,
    power: 1.0,
    cost: 0,
    description: 'Coup direct. 100 % de l’ATK, gratuit.',
  },
  choc: {
    id: 'choc',
    name: 'Choc',
    kind: 'physical',
    tier: 2,
    power: 1.5,
    cost: 2,
    description: 'Charge d’épaule qui recadre en une réunion.',
  },
  reframe: {
    id: 'reframe',
    name: 'Reframe',
    kind: 'magic',
    tier: 3,
    power: 2.0,
    cost: 3,
    description:
      'Tu reformules la situation. La cible comprend qu’elle avait tort depuis le début.',
  },

  // --- Alphonse / Classe (reframe shared with Marine) ---
  charme: {
    id: 'charme',
    name: 'Charme',
    kind: 'magic',
    tier: 1,
    power: 1.0,
    cost: 0,
    description: 'Un sourire sincère. Désamorce les conflits simples.',
  },
  techno_boom_boom: {
    id: 'techno_boom_boom',
    name: 'Techno boom boom',
    kind: 'magic',
    tier: 3,
    power: 2.0,
    cost: 4,
    description: 'Slide 42. Animation. La salle s’effondre en applaudissements.',
  },

  // --- Laurent / Sage ---
  apnee: {
    id: 'apnee',
    name: 'Apnée',
    kind: 'magic',
    tier: 1,
    power: 1.0,
    cost: 0,
    description: 'Silence concentré. Dérange profondément l’adversaire.',
  },
  figuier_etrangleur: {
    id: 'figuier_etrangleur',
    name: 'Figuier étrangleur',
    kind: 'magic',
    tier: 2,
    power: 1.5,
    cost: 2,
    description: 'Une arborescence rhétorique qui enserre la cible.',
  },
  decommissionnement: {
    id: 'decommissionnement',
    name: 'Décommissionnement',
    kind: 'magic',
    tier: 3,
    power: 2.5,
    cost: 5,
    description: 'Tu retires la cible du backlog. Définitivement.',
  },
};

export type AttackId = keyof typeof ATTACKS;
