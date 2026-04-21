import type { Attack } from './types';

/**
 * Attack catalogue.
 *
 * Each hero owns exactly three attacks (T1/T2/T3). Power is a multiplier
 * applied to the user's ATK (physical) or MAG (magic); cost is deducted from
 * MP (derived as `stats.mag × 2`).
 *
 * Design contract — enforced by `balance.test.ts`:
 *  - A hero's T1 is always `cost: 0` (a free filler if MP runs dry).
 *  - Each hero's attack `kind` matches its primary stat (Marine = physical,
 *    Alphonse = magic, Laurent = magic). No "trap tier" like the old broken
 *    `reframe` (magic T3 on Marine → dealt less damage than her free T1).
 *  - Damage grows monotonically with tier on the intended stat.
 *
 * Tuning knob: `power` is a small float (1.0 → 2.5). Raising by 0.2 is a
 * noticeable buff; 0.5 is usually too much. `cost` gates how often a tier-3
 * can spam without punishing the player for carrying MP.
 */
export const ATTACKS: Record<string, Attack> = {
  // --- Marine / Choc (all physical, scales ATK 8 → high) --------------------
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
  pression: {
    id: 'pression',
    name: 'Coup de pression',
    kind: 'physical',
    tier: 3,
    power: 2.0,
    cost: 3,
    description:
      'Tu imposes un deadline irréaliste. La cible craque sous le délai.',
  },

  // --- Alphonse / Roublard (all magic, scales MAG 5, balanced MP pool) -----
  charme: {
    id: 'charme',
    name: 'Charme',
    kind: 'magic',
    tier: 1,
    power: 1.0,
    cost: 0,
    description: 'Un sourire sincère. Désamorce les conflits simples.',
  },
  baratin: {
    id: 'baratin',
    name: 'Baratin',
    kind: 'magic',
    tier: 2,
    power: 1.5,
    cost: 2,
    description:
      'Tu enchaînes trois vérités et un mensonge. Personne ne sait plus où il en est.',
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

  // --- Laurent / Sage (all magic, scales MAG 8, deep MP pool) --------------
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
    // Power nerfed from 2.5 → 2.2: a Sage with full MP used to nuke the main
    // boss in 3 casts (22 dmg × 3 = 66 > 55 HP). Now 3 casts deal ~60, which
    // still wins but no longer trivialises the final fight.
    power: 2.2,
    cost: 5,
    description: 'Tu retires la cible du backlog. Définitivement.',
  },
};

export type AttackId = keyof typeof ATTACKS;
