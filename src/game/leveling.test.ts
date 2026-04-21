import { describe, it, expect } from 'vitest';
import { HEROES, deriveMaxMp } from '../data/heroes';
import { applyXpGain, xpToNextLevel, STAT_GAIN_PER_LEVEL } from './leveling';

// ── xpToNextLevel ─────────────────────────────────────────────────────────────

describe('xpToNextLevel', () => {
  it('returns level * 10', () => {
    expect(xpToNextLevel(1)).toBe(10);
    expect(xpToNextLevel(5)).toBe(50);
    expect(xpToNextLevel(42)).toBe(420);
  });
});

// ── applyXpGain ───────────────────────────────────────────────────────────────

describe('applyXpGain', () => {
  const hero   = HEROES.marine;
  const maxHp  = hero.stats.hp;
  const maxMp  = deriveMaxMp(hero);

  it('accumulates sub-threshold XP without levelling up', () => {
    const r = applyXpGain(hero, 1, 0, maxHp, maxMp, 5);
    expect(r.level).toBe(1);
    expect(r.xp).toBe(5);
    expect(r.levelsGained).toBe(0);
    expect(r.hero.stats).toEqual(hero.stats);
  });

  it('triggers a single level-up on exact threshold', () => {
    const r = applyXpGain(hero, 1, 0, maxHp, maxMp, 10);
    expect(r.level).toBe(2);
    expect(r.xp).toBe(0);
    expect(r.levelsGained).toBe(1);
    expect(r.hero.stats.atk).toBe(hero.stats.atk + STAT_GAIN_PER_LEVEL.atk);
    expect(r.hero.stats.mag).toBe(hero.stats.mag + STAT_GAIN_PER_LEVEL.mag);
    expect(r.hero.stats.hp).toBe(hero.stats.hp + STAT_GAIN_PER_LEVEL.hp);
    expect(r.maxHp).toBe(maxHp + STAT_GAIN_PER_LEVEL.hp);
  });

  it('chains multiple level-ups from a single big reward', () => {
    // L1→L2 costs 10; L2→L3 costs 20; L3→L4 costs 30. Total = 60.
    const r = applyXpGain(hero, 1, 0, maxHp, maxMp, 65);
    expect(r.level).toBe(4);
    expect(r.xp).toBe(5);
    expect(r.levelsGained).toBe(3);
    expect(r.hero.stats.atk).toBe(hero.stats.atk + 3 * STAT_GAIN_PER_LEVEL.atk);
  });

  it('never mutates the input hero object', () => {
    const before = JSON.stringify(hero);
    applyXpGain(hero, 1, 0, maxHp, maxMp, 100);
    expect(JSON.stringify(hero)).toBe(before);
  });

  it('heals an amount equal to the gained max HP over multiple level-ups', () => {
    const r = applyXpGain(hero, 1, 0, maxHp, maxMp, 30);
    expect(r.levelsGained).toBe(2);
    expect(r.hpHealed).toBe(2 * STAT_GAIN_PER_LEVEL.hp);
  });

  it('keeps max MP in sync with hero MAG via deriveMaxMp', () => {
    const r = applyXpGain(hero, 1, 0, maxHp, maxMp, 10);
    expect(r.maxMp).toBe(deriveMaxMp(r.hero));
  });
});
