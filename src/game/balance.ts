/**
 * OPEN SPACE DUNGEON — central balance constants.
 *
 * Every number that shapes difficulty, pacing, or the power curve lives here.
 * The rest of the codebase imports from this module instead of hard-coding.
 * → Tweaking balance = editing this single file.
 *
 * Companion doc: `docs/balance.md` — explains *why* the numbers are what they
 * are, and what each one actually does in a run.
 *
 * Design rule: this file is constants only, zero logic, zero imports of app
 * code. That way anything can import from here without circular-dep risk.
 */

import type { Difficulty } from '../data/types';

// ── Leveling & XP ───────────────────────────────────────────────────────────
// Consumed by `src/game/leveling.ts`.

/**
 * XP required to go from level L → L+1. Linear: `L * XP_PER_LEVEL_BASE`.
 * Total XP to reach level N = BASE × N × (N-1) / 2.
 *   base 10 → L5 = 100 XP, L7 = 210 XP, L10 = 450 XP.
 * A thorough run (≈20 combats, mostly normal/hard) banks ~160–200 XP
 * pre-boss, enough to go into the Administration fight at L5–L6.
 */
export const XP_PER_LEVEL_BASE = 10;

/**
 * Flat stat gain applied at every level-up (on top of current stats). Each
 * level also fully restores HP/MP as a "reward heal".
 *
 * Tuning intuition:
 *  - atk/mag +1: ≈ +1-3 damage per attack depending on tier.
 *  - hp +3: absorbs roughly one extra hit from a normal-tier enemy.
 */
export const STAT_GAIN_PER_LEVEL = { atk: 1, mag: 1, hp: 3 } as const;

// ── Resolution engine (trap / puzzle / event dice rolls) ────────────────────
// Consumed by `src/game/resolution.ts`.

/**
 * d6 target per difficulty tier. The player rolls a d6 and adds their
 * stat+class bonus; they need `total ≥ threshold` to succeed. Lower = easier.
 *
 * Sane bounds:
 *  - easy/normal must stay ≤ 7 so a fresh L1 hero with ≥+1 bonus has a chance.
 *  - hard ~ 9 makes mid-tier specialists roll 3+ (≈67 %).
 *  - boss ~ 12 is 6+ for most heroes — used only where narrative justifies it.
 */
export const DIFFICULTY_THRESHOLDS: Record<Difficulty, number> = {
  easy:   4,
  normal: 6,
  hard:   9,
  boss:   12,
};

// ── Secret boss (Orzag) ─────────────────────────────────────────────────────
// Consumed by `src/data/enemies.ts` for the stat numbers, and by
// `src/game/secretEnding.ts` for documentation.

/**
 * Multiplier applied to the main boss (client_legendaire) to derive Orzag.
 * The actual stat block is hard-coded in `src/data/enemies.ts` (so Orzag's
 * stats don't silently drift if we re-tune the main boss separately) — this
 * constant is the authoritative rule and is asserted by `balance.test.ts`.
 */
export const ORZAG_POWER_MULT = 2;

// ── Main boss reference stats ───────────────────────────────────────────────
// Used by `balance.test.ts` to assert the 2× rule between Administration
// and Orzag. The live numbers are the source of truth in `src/data/enemies.ts`.

export const MAIN_BOSS_REFERENCE = {
  atk: 11,
  mag: 10,
  hp:  60,
} as const;
