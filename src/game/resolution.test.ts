import { describe, it, expect } from 'vitest';
import { HEROES } from '../data/heroes';
import {
  statBonus,
  classBonus,
  totalBonus,
  successChance,
  resolve,
  adviseBestHero,
  THRESHOLDS,
  CLASS_BONUS,
} from './resolution';

// ── statBonus ─────────────────────────────────────────────────────────────────

describe('statBonus', () => {
  it('Marine combat = floor(8/3) = 2', () => {
    expect(statBonus(HEROES.marine, 'combat')).toBe(2);
  });
  it('Laurent puzzle = floor(9/3) = 3', () => {
    expect(statBonus(HEROES.laurent, 'puzzle')).toBe(3);
  });
  it('Marine trap = floor(18/6) = 3', () => {
    expect(statBonus(HEROES.marine, 'trap')).toBe(3);
  });
  it('Alphonse trap = floor(15/6) = 2', () => {
    expect(statBonus(HEROES.alphonse, 'trap')).toBe(2);
  });
  it('Alphonse event = floor((5+5)/6) = 1', () => {
    expect(statBonus(HEROES.alphonse, 'event')).toBe(1);
  });
  it('Laurent combat = floor(2/3) = 0', () => {
    expect(statBonus(HEROES.laurent, 'combat')).toBe(0);
  });
});

// ── classBonus ────────────────────────────────────────────────────────────────

describe('classBonus', () => {
  it('Choc gets +3 for combat', () => {
    expect(classBonus('Choc', 'combat')).toBe(3);
  });
  it('Sage gets +3 for puzzle', () => {
    expect(classBonus('Sage', 'puzzle')).toBe(3);
  });
  it('Roublard gets +2 for event', () => {
    expect(classBonus('Roublard', 'event')).toBe(2);
  });
  it('Choc gets 0 for puzzle', () => {
    expect(classBonus('Choc', 'puzzle')).toBe(0);
  });
  it('Sage gets 0 for trap', () => {
    expect(classBonus('Sage', 'trap')).toBe(0);
  });
});

// ── totalBonus ────────────────────────────────────────────────────────────────

describe('totalBonus', () => {
  it('Marine combat: 2 + 3 = 5', () => {
    expect(totalBonus(HEROES.marine, 'combat')).toBe(5);
  });
  it('Marine trap: 3 + 1 = 4', () => {
    expect(totalBonus(HEROES.marine, 'trap')).toBe(4);
  });
  it('Laurent puzzle: 3 + 3 = 6', () => {
    expect(totalBonus(HEROES.laurent, 'puzzle')).toBe(6);
  });
  it('Alphonse event: 1 + 2 = 3', () => {
    expect(totalBonus(HEROES.alphonse, 'event')).toBe(3);
  });
  it('Laurent combat: 0 + 0 = 0', () => {
    expect(totalBonus(HEROES.laurent, 'combat')).toBe(0);
  });
});

// ── THRESHOLDS sanity ─────────────────────────────────────────────────────────

describe('THRESHOLDS', () => {
  it('easy < normal < hard < boss', () => {
    expect(THRESHOLDS.easy).toBeLessThan(THRESHOLDS.normal);
    expect(THRESHOLDS.normal).toBeLessThan(THRESHOLDS.hard);
    expect(THRESHOLDS.hard).toBeLessThan(THRESHOLDS.boss);
  });
});

// ── successChance ─────────────────────────────────────────────────────────────

describe('successChance', () => {
  it('Marine combat easy = 100% (bonus 5 + any d6 ≥ threshold 4)', () => {
    expect(successChance(HEROES.marine, 'combat', 'easy')).toBe(100);
  });
  it('Marine combat normal = 100% (bonus 5 + roll ≥ 1 satisfies threshold 6)', () => {
    // min roll needed = 6 − 5 = 1 → all 6 faces succeed
    expect(successChance(HEROES.marine, 'combat', 'normal')).toBe(100);
  });
  it('Laurent puzzle hard = 67% (bonus 6, need d6 ≥ 3 → 4/6)', () => {
    // threshold=9, bonus=6 → minRoll=3 → successes=4 → 4/6 ≈ 67%
    expect(successChance(HEROES.laurent, 'puzzle', 'hard')).toBe(67);
  });
  it('Laurent combat boss = 0% (bonus 0, threshold 12 → impossible)', () => {
    expect(successChance(HEROES.laurent, 'combat', 'boss')).toBe(0);
  });
  it('Alphonse event normal = 67% (bonus 3, minRoll 3 → 4/6)', () => {
    // bonus=3, threshold=6 → minRoll=3 → successes=4 → 67%
    expect(successChance(HEROES.alphonse, 'event', 'normal')).toBe(67);
  });
  it('result is always in [0, 100]', () => {
    for (const hero of Object.values(HEROES)) {
      for (const kind of ['combat', 'trap', 'puzzle', 'event'] as const) {
        for (const diff of ['easy', 'normal', 'hard', 'boss'] as const) {
          const c = successChance(hero, kind, diff);
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThanOrEqual(100);
        }
      }
    }
  });
});

// ── resolve ───────────────────────────────────────────────────────────────────

describe('resolve — grade boundaries', () => {
  // Marine combat normal: bonus=5, threshold=6
  it('critical: gap ≥ 3  (Marine combat normal, roll 4 → total 9, gap +3)', () => {
    const r = resolve(HEROES.marine, 'combat', 'normal', 4);
    expect(r.grade).toBe('critical');
    expect(r.roll).toBe(4);
    expect(r.total).toBe(9);
    expect(r.threshold).toBe(6);
  });
  it('success: gap 0–2  (Marine combat normal, roll 1 → total 6, gap 0)', () => {
    const r = resolve(HEROES.marine, 'combat', 'normal', 1);
    expect(r.grade).toBe('success');
  });
  it('success upper edge  (Marine combat normal, roll 3 → total 8, gap +2)', () => {
    const r = resolve(HEROES.marine, 'combat', 'normal', 3);
    expect(r.grade).toBe('success');
  });
  // Laurent combat normal: bonus=0, threshold=6
  it('failure: gap −1  (Laurent combat normal, roll 5 → total 5)', () => {
    const r = resolve(HEROES.laurent, 'combat', 'normal', 5);
    expect(r.grade).toBe('failure');
  });
  it('failure: gap −2  (Laurent combat normal, roll 4 → total 4)', () => {
    const r = resolve(HEROES.laurent, 'combat', 'normal', 4);
    expect(r.grade).toBe('failure');
  });
  it('severe: gap ≤ −3  (Laurent combat normal, roll 3 → total 3, gap −3)', () => {
    const r = resolve(HEROES.laurent, 'combat', 'normal', 3);
    expect(r.grade).toBe('severe');
  });
  it('severe: deep miss  (Laurent combat hard, roll 1 → total 1, gap −8)', () => {
    const r = resolve(HEROES.laurent, 'combat', 'hard', 1);
    expect(r.grade).toBe('severe');
  });
});

describe('resolve — effects', () => {
  it('trap critical: 0 hp, +1 mp', () => {
    // Marine trap easy: bonus=4, threshold=4 → roll=6 → total=10, gap=+6 → critical
    const r = resolve(HEROES.marine, 'trap', 'easy', 6);
    expect(r.grade).toBe('critical');
    expect(r.hpDelta).toBe(0);
    expect(r.mpDelta).toBe(1);
  });
  it('trap severe: −4 hp, −1 mp', () => {
    // Laurent trap hard: bonus=2, threshold=9 → roll=1 → total=3, gap=−6 → severe
    const r = resolve(HEROES.laurent, 'trap', 'hard', 1);
    expect(r.grade).toBe('severe');
    expect(r.hpDelta).toBe(-4);
    expect(r.mpDelta).toBe(-1);
  });
  it('puzzle critical: +2 hp, +2 mp', () => {
    // Laurent puzzle easy: bonus=6, threshold=4 → roll=6 → total=12, gap=+8 → critical
    const r = resolve(HEROES.laurent, 'puzzle', 'easy', 6);
    expect(r.grade).toBe('critical');
    expect(r.hpDelta).toBe(2);
    expect(r.mpDelta).toBe(2);
  });
  it('puzzle severe: −2 hp, −1 mp', () => {
    // Marine puzzle hard: bonus=0, threshold=9 → roll=1 → total=1, gap=−8 → severe
    const r = resolve(HEROES.marine, 'puzzle', 'hard', 1);
    expect(r.grade).toBe('severe');
    expect(r.hpDelta).toBe(-2);
    expect(r.mpDelta).toBe(-1);
  });
  it('includes a non-empty narrative', () => {
    const r = resolve(HEROES.alphonse, 'event', 'normal', 3);
    expect(r.narrative.length).toBeGreaterThan(0);
  });
});

describe('resolve — roll override validation', () => {
  it('bonus and total are consistent', () => {
    const r = resolve(HEROES.marine, 'combat', 'normal', 3);
    expect(r.total).toBe(r.roll + r.bonus);
  });
  it('roll is the override value', () => {
    const r = resolve(HEROES.alphonse, 'trap', 'easy', 5);
    expect(r.roll).toBe(5);
  });
});

// ── adviseBestHero ────────────────────────────────────────────────────────────

describe('adviseBestHero', () => {
  const heroes = Object.values(HEROES);

  it('recommends Marine for combat (normal)', () => {
    expect(adviseBestHero(heroes, 'combat', 'normal').id).toBe('marine');
  });
  it('recommends Laurent for puzzle (normal)', () => {
    expect(adviseBestHero(heroes, 'puzzle', 'normal').id).toBe('laurent');
  });
  it('recommends Alphonse for event (normal)', () => {
    expect(adviseBestHero(heroes, 'event', 'normal').id).toBe('alphonse');
  });
  it('works with a single-hero list', () => {
    expect(adviseBestHero([HEROES.laurent], 'puzzle', 'easy').id).toBe('laurent');
  });
});

// ── CLASS_BONUS completeness ──────────────────────────────────────────────────

describe('CLASS_BONUS completeness', () => {
  const classes = ['Choc', 'Roublard', 'Sage'] as const;
  const kinds   = ['combat', 'trap', 'puzzle', 'event'] as const;

  it('has a defined bonus for every class × kind combination', () => {
    for (const c of classes) {
      for (const k of kinds) {
        expect(typeof CLASS_BONUS[c][k]).toBe('number');
      }
    }
  });
  it('all bonuses are non-negative', () => {
    for (const c of classes) {
      for (const k of kinds) {
        expect(CLASS_BONUS[c][k]).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
