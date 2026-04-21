import { describe, it, expect } from 'vitest';
import { HEROES, deriveMaxMp } from '../data/heroes';
import { ATTACKS } from '../data/attacks';
import { ENEMIES } from '../data/enemies';
import {
  XP_PER_LEVEL_BASE,
  STAT_GAIN_PER_LEVEL,
  DIFFICULTY_THRESHOLDS,
  ORZAG_POWER_MULT,
  MAIN_BOSS_REFERENCE,
} from './balance';
import { xpToNextLevel } from './leveling';

/**
 * Balance tests — assertions about the *shape* of progression and the
 * hero kits, not exact numeric targets. They're designed to fail loudly when
 * someone (a) breaks a hero's attack roster, (b) drifts Orzag away from the
 * 2× rule, (c) ships an XP curve that's trivially easy/hard, or (d) nerfs a
 * hero into the ground without noticing.
 *
 * Fine-grained numeric balance (exact damage numbers, exact XP totals) lives
 * in `docs/balance.md` — those move too often to freeze in tests.
 */

// ── Leveling & XP curve ─────────────────────────────────────────────────────

describe('XP curve', () => {
  it('xpToNextLevel(L) = L * XP_PER_LEVEL_BASE', () => {
    expect(xpToNextLevel(1)).toBe(XP_PER_LEVEL_BASE);
    expect(xpToNextLevel(5)).toBe(5 * XP_PER_LEVEL_BASE);
  });

  it('every level-up produces a non-zero stat gain', () => {
    const { atk, mag, hp } = STAT_GAIN_PER_LEVEL;
    expect(atk + mag + hp).toBeGreaterThan(0);
  });

  it('difficulty thresholds are monotonically increasing', () => {
    expect(DIFFICULTY_THRESHOLDS.easy).toBeLessThan(DIFFICULTY_THRESHOLDS.normal);
    expect(DIFFICULTY_THRESHOLDS.normal).toBeLessThan(DIFFICULTY_THRESHOLDS.hard);
    expect(DIFFICULTY_THRESHOLDS.hard).toBeLessThan(DIFFICULTY_THRESHOLDS.boss);
  });
});

// ── Hero kits ───────────────────────────────────────────────────────────────

describe('hero attack kits', () => {
  it('every hero has exactly 3 attacks, one per tier (1/2/3)', () => {
    for (const hero of Object.values(HEROES)) {
      const tiers = hero.attacks.map((id) => ATTACKS[id]?.tier).sort();
      expect(tiers).toEqual([1, 2, 3]);
    }
  });

  it('every tier-1 attack is free (cost 0) — the fallback filler', () => {
    for (const hero of Object.values(HEROES)) {
      const t1 = hero.attacks
        .map((id) => ATTACKS[id])
        .find((a) => a?.tier === 1);
      expect(t1?.cost).toBe(0);
    }
  });

  it('damage grows monotonically from tier 1 → 2 → 3 on the hero primary stat', () => {
    for (const hero of Object.values(HEROES)) {
      const byTier = [1, 2, 3].map((tier) =>
        hero.attacks
          .map((id) => ATTACKS[id])
          .find((a) => a?.tier === tier)!,
      );
      // "Damage" here = power × primary stat (physical → atk, magic → mag).
      const dmg = byTier.map((a) =>
        a.power * (a.kind === 'physical' ? hero.stats.atk : hero.stats.mag),
      );
      expect(dmg[0]).toBeLessThanOrEqual(dmg[1]);
      expect(dmg[1]).toBeLessThanOrEqual(dmg[2]);
    }
  });

  it('Marine (Choc) is physical-only — no magic attacks in her kit', () => {
    for (const id of HEROES.marine.attacks) {
      expect(ATTACKS[id].kind).toBe('physical');
    }
  });

  it('Alphonse and Laurent (magic classes) are magic-only', () => {
    for (const heroId of ['alphonse', 'laurent'] as const) {
      for (const id of HEROES[heroId].attacks) {
        expect(ATTACKS[id].kind).toBe('magic');
      }
    }
  });

  it('each hero has at least one attack whose damage beats their free T1', () => {
    for (const hero of Object.values(HEROES)) {
      const stat = (a: (typeof ATTACKS)[string]) =>
        a.kind === 'physical' ? hero.stats.atk : hero.stats.mag;
      const kit = hero.attacks.map((id) => ATTACKS[id]);
      const t1 = kit.find((a) => a.tier === 1)!;
      const best = Math.max(...kit.map((a) => a.power * stat(a)));
      // At least one attack must be STRICTLY stronger than the free filler,
      // otherwise the hero has no reason to spend MP.
      expect(best).toBeGreaterThan(t1.power * stat(t1));
    }
  });
});

// ── Boss / Orzag 2× rule ────────────────────────────────────────────────────

describe('boss balance', () => {
  it('main boss (Administration) matches MAIN_BOSS_REFERENCE', () => {
    const boss = ENEMIES.client_legendaire.stats;
    expect(boss.atk).toBe(MAIN_BOSS_REFERENCE.atk);
    expect(boss.mag).toBe(MAIN_BOSS_REFERENCE.mag);
    expect(boss.hp).toBe(MAIN_BOSS_REFERENCE.hp);
  });

  it('Orzag stats = main boss × ORZAG_POWER_MULT (the secret-ending promise)', () => {
    const orzag = ENEMIES.orzag_coeur_pierre.stats;
    const base  = ENEMIES.client_legendaire.stats;
    expect(orzag.atk).toBe(base.atk * ORZAG_POWER_MULT);
    expect(orzag.mag).toBe(base.mag * ORZAG_POWER_MULT);
    expect(orzag.hp).toBe(base.hp  * ORZAG_POWER_MULT);
  });

  it('Orzag rewards more XP than the main boss (true-ending prestige)', () => {
    expect(ENEMIES.orzag_coeur_pierre.rewardXp).toBeGreaterThan(
      ENEMIES.client_legendaire.rewardXp,
    );
  });
});

// ── XP budget sanity ────────────────────────────────────────────────────────

describe('XP economy', () => {
  it('a thorough run (~2 fights per enemy type) banks enough XP to hit level 5', () => {
    // The 8 regular enemies respawn across rooms: a player who clears
    // everything they see typically fights each type ~2× on the way to the
    // boss. That — not a single-kill tally — is the right yardstick for the
    // XP curve.
    const perRunEstimate = Object.values(ENEMIES)
      .filter((e) => e.difficulty !== 'boss')
      .reduce((sum, e) => sum + e.rewardXp * 2, 0);
    // Cost to reach L5 = 10 + 20 + 30 + 40 = 100.
    const costToL5 =
      xpToNextLevel(1) + xpToNextLevel(2) + xpToNextLevel(3) + xpToNextLevel(4);
    expect(perRunEstimate).toBeGreaterThanOrEqual(costToL5);
  });

  it('the main boss alone awards enough XP for at least two level-ups', () => {
    // Even a low-exploration run that just squeaks past the boss should get
    // a meaningful power-up spike for the post-victory lap / Orzag attempt.
    const bossXp = ENEMIES.client_legendaire.rewardXp;
    // 2 levels from L1 = 10 + 20 = 30.
    expect(bossXp).toBeGreaterThanOrEqual(30);
  });
});

// ── Hero survivability floor ────────────────────────────────────────────────

describe('hero HP floor', () => {
  it('no hero dies from a single mid-tier enemy hit at level 1', () => {
    // Pick the hardest non-boss hit the early game can produce. `client_fantome`
    // has the highest regular atk (7). With jitter max (1.1), damage ≤ 8.
    const worstRegularHit = Math.ceil(7 * 1.1);
    for (const hero of Object.values(HEROES)) {
      expect(hero.stats.hp).toBeGreaterThan(worstRegularHit);
    }
  });

  it('no hero dies from two full-power main-boss hits once properly levelled (L5)', () => {
    // The boss sits behind 4–5 levels of dungeon. By the time players reach
    // him, everyone should survive a worst-case 2-shot — otherwise the fight
    // becomes a coin flip on turn order. L5 = base HP + 4 × HP-per-level.
    const bossAtk = ENEMIES.client_legendaire.stats.atk;
    const worstTwoShot = Math.ceil(bossAtk * 1.1) * 2;
    for (const hero of Object.values(HEROES)) {
      const l5Hp = hero.stats.hp + 4 * STAT_GAIN_PER_LEVEL.hp;
      expect(l5Hp).toBeGreaterThanOrEqual(worstTwoShot);
    }
  });

  it('derived maxMp keeps Sage > Roublard > Choc (identity is preserved)', () => {
    const choc     = deriveMaxMp(HEROES.marine);
    const roublard = deriveMaxMp(HEROES.alphonse);
    const sage     = deriveMaxMp(HEROES.laurent);
    expect(sage).toBeGreaterThan(roublard);
    expect(roublard).toBeGreaterThan(choc);
  });
});
