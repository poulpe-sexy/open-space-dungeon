// =============================================================================
// Simple leveling system — only combat grants XP. Each level boosts ATK / MAG /
// HP for the active hero. Intentionally lightweight so it is easy to tune.
// =============================================================================

import type { Hero } from '../data/types';
import { deriveMaxMp } from '../data/heroes';

/** XP needed to go from `level` to `level + 1`. Linear — trivial to tune. */
export function xpToNextLevel(level: number): number {
  return level * 10;
}

/** Flat per-level stat gains. Tweak here to rebalance the whole curve. */
export const STAT_GAIN_PER_LEVEL = {
  atk: 1,
  mag: 1,
  hp:  3,
} as const;

export interface LevelUpResult {
  /** New level after absorbing the XP. */
  level: number;
  /** Carry-over XP inside the new level. */
  xp: number;
  /** Number of level-ups that fired (for the UI banner). */
  levelsGained: number;
  /** Mutated hero, stats bumped per level-up. */
  hero: Hero;
  /** New max HP after bumps. */
  maxHp: number;
  /** New max MP after bumps (derived from mag). */
  maxMp: number;
  /** HP restored by the level-up (= total HP gained, to reward the player). */
  hpHealed: number;
  /** MP restored by the level-up (= total MP gained). */
  mpHealed: number;
}

/**
 * Apply `gainedXp` to the current (level, xp, hero). Handles chained level-ups
 * when a single kill grants enough XP to cross multiple thresholds.
 */
export function applyXpGain(
  hero: Hero,
  level: number,
  xp: number,
  maxHp: number,
  maxMp: number,
  gainedXp: number,
): LevelUpResult {
  let newLevel  = level;
  let newXp     = xp + gainedXp;
  let levelsGained = 0;

  // Work on a fresh copy so React sees a new reference.
  let workingHero: Hero = { ...hero, stats: { ...hero.stats } };
  let workingMaxHp = maxHp;

  while (newXp >= xpToNextLevel(newLevel)) {
    newXp   -= xpToNextLevel(newLevel);
    newLevel += 1;
    levelsGained += 1;

    workingHero = {
      ...workingHero,
      stats: {
        atk: workingHero.stats.atk + STAT_GAIN_PER_LEVEL.atk,
        mag: workingHero.stats.mag + STAT_GAIN_PER_LEVEL.mag,
        hp:  workingHero.stats.hp  + STAT_GAIN_PER_LEVEL.hp,
      },
    };
    workingMaxHp += STAT_GAIN_PER_LEVEL.hp;
  }

  const newMaxMp  = deriveMaxMp(workingHero);
  const hpHealed  = levelsGained * STAT_GAIN_PER_LEVEL.hp;
  const mpHealed  = newMaxMp - maxMp;

  return {
    level: newLevel,
    xp: newXp,
    levelsGained,
    hero: workingHero,
    maxHp: workingMaxHp,
    maxMp: newMaxMp,
    hpHealed,
    mpHealed,
  };
}
