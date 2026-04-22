import { describe, it, expect } from 'vitest';
import { HEROES, deriveMaxMp } from '../data/heroes';
import { applyXpGain, xpToNextLevel, STAT_GAIN_PER_LEVEL } from './leveling';
import { XP_PER_LEVEL_BASE } from './balance';

// ── xpToNextLevel ─────────────────────────────────────────────────────────────

describe('xpToNextLevel', () => {
  it('returns level * XP_PER_LEVEL_BASE', () => {
    // Formula is asserted against the central constant so these stay green
    // when tuning the XP curve from balance.ts.
    expect(xpToNextLevel(1)).toBe(1 * XP_PER_LEVEL_BASE);
    expect(xpToNextLevel(5)).toBe(5 * XP_PER_LEVEL_BASE);
    expect(xpToNextLevel(42)).toBe(42 * XP_PER_LEVEL_BASE);
  });
});

// ── applyXpGain ───────────────────────────────────────────────────────────────

describe('applyXpGain', () => {
  const hero   = HEROES.marine;
  const maxHp  = hero.stats.hp;
  const maxMp  = deriveMaxMp(hero);

  /** XP needed to climb from L1 up through L(N). */
  const xpToReachLevel = (n: number) => {
    let total = 0;
    for (let L = 1; L < n; L++) total += xpToNextLevel(L);
    return total;
  };

  it('accumulates sub-threshold XP without levelling up', () => {
    const sub = xpToNextLevel(1) - 1;
    const r   = applyXpGain(hero, 1, 0, maxHp, maxMp, sub);
    expect(r.level).toBe(1);
    expect(r.xp).toBe(sub);
    expect(r.levelsGained).toBe(0);
    expect(r.hero.stats).toEqual(hero.stats);
  });

  it('triggers a single level-up on exact threshold', () => {
    const r = applyXpGain(hero, 1, 0, maxHp, maxMp, xpToNextLevel(1));
    expect(r.level).toBe(2);
    expect(r.xp).toBe(0);
    expect(r.levelsGained).toBe(1);
    expect(r.hero.stats.atk).toBe(hero.stats.atk + STAT_GAIN_PER_LEVEL.atk);
    expect(r.hero.stats.mag).toBe(hero.stats.mag + STAT_GAIN_PER_LEVEL.mag);
    expect(r.hero.stats.hp).toBe(hero.stats.hp + STAT_GAIN_PER_LEVEL.hp);
    expect(r.maxHp).toBe(maxHp + STAT_GAIN_PER_LEVEL.hp);
  });

  it('chains multiple level-ups from a single big reward', () => {
    // Enough XP to reach L4 plus a small leftover that must land in L4's bar.
    const leftover = 5;
    const gain     = xpToReachLevel(4) + leftover;
    const r        = applyXpGain(hero, 1, 0, maxHp, maxMp, gain);
    expect(r.level).toBe(4);
    expect(r.xp).toBe(leftover);
    expect(r.levelsGained).toBe(3);
    expect(r.hero.stats.atk).toBe(hero.stats.atk + 3 * STAT_GAIN_PER_LEVEL.atk);
  });

  it('never mutates the input hero object', () => {
    const before = JSON.stringify(hero);
    applyXpGain(hero, 1, 0, maxHp, maxMp, 100);
    expect(JSON.stringify(hero)).toBe(before);
  });

  it('heals an amount equal to the gained max HP over multiple level-ups', () => {
    const r = applyXpGain(hero, 1, 0, maxHp, maxMp, xpToReachLevel(3));
    expect(r.levelsGained).toBe(2);
    expect(r.hpHealed).toBe(2 * STAT_GAIN_PER_LEVEL.hp);
  });

  it('keeps max MP in sync with hero MAG via deriveMaxMp', () => {
    const r = applyXpGain(hero, 1, 0, maxHp, maxMp, xpToNextLevel(1));
    expect(r.maxMp).toBe(deriveMaxMp(r.hero));
  });
});
