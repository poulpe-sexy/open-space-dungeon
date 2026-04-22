import type { Attack } from './types';
import { T3_COOLDOWN, T1_MP_GAIN } from '../game/balance';

/**
 * Attack catalogue.
 *
 * Each hero owns exactly three attacks (T1/T2/T3). Power is a multiplier
 * applied to the user's ATK (physical) or MAG (magic); cost is deducted from
 * MP (derived as `stats.mag × 2`).
 *
 * Design contract — enforced by `balance.test.ts`:
 *  - A hero's T1 is always `cost: 0` (free filler if MP runs dry) and always
 *    grants `mpGain: T1_MP_GAIN` so it doubles as a slow MP-recovery tool
 *    during T3 cooldown windows.
 *  - Each hero's attack `kind` matches its primary stat (Marine = physical,
 *    Alphonse = magic, Laurent = magic). No "trap tier".
 *  - Damage grows monotonically with tier on the intended stat.
 *  - T3 attacks carry `cooldown: T3_COOLDOWN` — after use they are locked for
 *    T3_COOLDOWN enemy turns (= at least 1 forced T1/T2 player action between
 *    two T3 uses). This breaks pure-T3 spam without adding complex mechanics.
 *
 * ── Anti-spam pass (why these numbers) ─────────────────────────────────────
 *
 *  BEFORE (spam was trivially optimal):
 *   pression           power 2.0  cost 3   no cooldown
 *   techno_boom_boom   power 2.0  cost 4   no cooldown
 *   decommissionnement power 2.2  cost 5   no cooldown
 *
 *  AFTER:
 *   pression           power 2.0  cost 4   cooldown 2   (Marine's full 4-MP pool = 1 cast, then T1×2 to rebuild)
 *   techno_boom_boom   power 2.0  cost 6   cooldown 2   (3 casts max from full MP; each CD window costs MP too)
 *   decommissionnement power 2.0  cost 7   cooldown 2   (power −0.2 from 2.2; still the hardest hitter)
 *
 *  T2 attacks (baratin, figuier) get power 1.5 → 1.6 so they feel like a
 *  genuine tactical choice during the CD window (not just "T3-minus").
 *
 *  T1 attacks get mpGain: 1 — pressing T1 during a CD window is now actively
 *  useful (slow MP refill), not just a filler.
 *
 * Tuning knob: `power` is a small float (1.0 → 2.5). Raising by 0.2 is a
 * noticeable buff; 0.5 is usually too much. `cost` gates how often a tier-3
 * can be used without punishing the player for mismanaging MP.
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
    mpGain: T1_MP_GAIN,
    description: "Coup direct. 100 % de l'ATK, gratuit — et récupère 1 MP.",
  },
  choc: {
    id: 'choc',
    name: 'Choc',
    kind: 'physical',
    tier: 2,
    power: 1.5,
    cost: 2,
    description: "Charge d'épaule qui recadre en une réunion.",
  },
  pression: {
    id: 'pression',
    name: 'Coup de pression',
    kind: 'physical',
    tier: 3,
    power: 2.0,
    cost: 4,
    cooldown: T3_COOLDOWN,
    description:
      'Tu imposes un deadline irréaliste. Dévastateur — mais demande à souffler avant de recommencer.',
  },

  // --- Alphonse / Roublard (T1 physical, T2/T3 magic — kit hybride) ----------
  charme: {
    id: 'charme',
    name: 'Charme',
    kind: 'physical',
    tier: 1,
    power: 1.0,
    cost: 0,
    mpGain: T1_MP_GAIN,
    description: "Une poignée de main ferme au bon moment. Physique, direct — et récupère 1 MP.",
  },
  baratin: {
    id: 'baratin',
    name: 'Baratin',
    kind: 'magic',
    tier: 2,
    power: 1.6,
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
    cost: 6,
    cooldown: T3_COOLDOWN,
    description: "Slide 42. Animation. La salle s'effondre en applaudissements. Recharge nécessaire.",
  },

  // --- Laurent / Sage (all magic, scales MAG 9, deep MP pool) --------------
  apnee: {
    id: 'apnee',
    name: 'Apnée',
    kind: 'magic',
    tier: 1,
    power: 1.0,
    cost: 0,
    mpGain: T1_MP_GAIN,
    description: "Silence concentré. Dérange profondément l'adversaire — et récupère 1 MP.",
  },
  figuier_etrangleur: {
    id: 'figuier_etrangleur',
    name: 'Figuier étrangleur',
    kind: 'magic',
    tier: 2,
    power: 1.6,
    cost: 2,
    description: 'Une arborescence rhétorique qui enserre la cible. Fiable et économe.',
  },
  decommissionnement: {
    id: 'decommissionnement',
    name: 'Décommissionnement',
    kind: 'magic',
    tier: 3,
    power: 2.0,
    cost: 7,
    cooldown: T3_COOLDOWN,
    description: 'Tu retires la cible du backlog. Définitivement. Temps de recharge incompressible.',
  },
};

export type AttackId = keyof typeof ATTACKS;
