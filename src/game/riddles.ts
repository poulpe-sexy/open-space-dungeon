/**
 * Riddles — runtime helpers.
 *
 * Pure functions, no React. Applies a reward item's stat bonus to the active
 * hero. This is a SINGLE-hero game — the active hero is always the respondent,
 * so there is no character-picker step at the data layer.
 *
 * Balancing notes:
 *   - Bonuses are additive and modest (+1 ATK / +1 MAG / +2 maxHp).
 *   - Items are one-shot per run (each riddle appears at most once per run
 *     via dedupe in generateAllEncounters), so the aggregate cap is capped
 *     at ≈ +3 ATK / +3 MAG / +6 maxHp if all 10 riddles are answered — in
 *     practice runs see 1–3 riddles so this stays well within the combat
 *     balance.
 */

import type { Hero, RewardItem, StatBonus } from '../data/types';
import { REWARD_ITEMS } from '../data/rewardItems';
import { deriveMaxMp } from '../data/heroes';

export interface ApplyRewardResult {
  /** Hero with bonus baked into stats. */
  hero: Hero;
  /** New max HP (>= previous). */
  maxHp: number;
  /** New max MP (>= previous). */
  maxMp: number;
  /** HP healed on pickup — equal to the HP bump so we never shrink HP. */
  hpHealed: number;
  /** MP healed on pickup — equal to the MP bump. */
  mpHealed: number;
}

/** Sum the bonuses from a list of items — useful for display/tests. */
export function totalBonus(items: RewardItem[]): Required<StatBonus> {
  const total: Required<StatBonus> = { atk: 0, mag: 0, maxHp: 0, maxMp: 0 };
  for (const it of items) {
    total.atk   += it.bonus.atk   ?? 0;
    total.mag   += it.bonus.mag   ?? 0;
    total.maxHp += it.bonus.maxHp ?? 0;
    total.maxMp += it.bonus.maxMp ?? 0;
  }
  return total;
}

/**
 * Apply a single reward item's bonus to the hero. Returns a fresh hero (no
 * mutation) plus the new max HP / MP so the caller can patch the store in
 * one atomic `store.set`.
 *
 * Max MP = deriveMaxMp(hero) + item.bonus.maxMp (flat adds stack on top of
 * the MAG-derived base).
 */
export function applyRewardItem(
  hero: Hero,
  currentMaxHp: number,
  currentMaxMp: number,
  itemId: string,
): ApplyRewardResult | null {
  const item = REWARD_ITEMS[itemId];
  if (!item) return null;

  const { atk = 0, mag = 0, maxHp = 0, maxMp = 0 } = item.bonus;

  const newHero: Hero = {
    ...hero,
    stats: {
      atk: hero.stats.atk + atk,
      mag: hero.stats.mag + mag,
      hp:  hero.stats.hp  + maxHp,
    },
  };

  // Keep the "maxMp extra" semantics: flat +maxMp item stacks on top of
  // (MAG * 2). For a pure +MAG bonus the MP pool grows naturally via
  // deriveMaxMp(newHero).
  const derivedMp = deriveMaxMp(newHero);
  // How much extra MP the player had on top of the base before (ex-items) —
  // we preserve that delta and add the new flat +maxMp on top.
  const priorExtraMp = Math.max(0, currentMaxMp - deriveMaxMp(hero));
  const newMaxMp = derivedMp + priorExtraMp + maxMp;

  return {
    hero: newHero,
    maxHp: currentMaxHp + maxHp,
    maxMp: newMaxMp,
    hpHealed: maxHp,
    mpHealed: Math.max(0, newMaxMp - currentMaxMp),
  };
}
