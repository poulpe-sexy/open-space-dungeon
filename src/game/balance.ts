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

// ── Run length / boss gating ───────────────────────────────────────────────
// Consumed by `src/components/TileDungeon.tsx` (forced redirect to boss_room)
// and `src/components/Hud.tsx` (progress chip).

/**
 * Number of *distinct* rooms the player must discover before the next new
 * door they take routes them to `boss_room`.
 *
 * Semantics: the starting room counts as visit #1 (seeded by `TitleScreen`).
 * When `visitedRooms.length === BOSS_ROOMS_NEEDED` and the player opens a door
 * into a room they haven't seen yet, that door is overridden and they walk
 * into the Administration's office instead. Backtracking through already-seen
 * rooms never triggers the override — only a fresh discovery does.
 *
 * Tuning intuition:
 *  - 10 (previous value) felt too short: L1 start → L5 L6 before boss, most
 *    encounters skipped, no real attrition on HP/MP. Players called the run
 *    trivial.
 *  - 15 gives ~35–45 encounters before boss (≈50 % more than before), enough
 *    trap/combat pressure that HP/MP management starts to matter, and lets
 *    the player comfortably hit L6 without trivialising the fight.
 *  - 20 would overstay the welcome on a single-session run; stick near 15.
 */
export const BOSS_ROOMS_NEEDED = 15;

// ── Leveling & XP ───────────────────────────────────────────────────────────
// Consumed by `src/game/leveling.ts`.

/**
 * XP required to go from level L → L+1. Linear: `L * XP_PER_LEVEL_BASE`.
 * Total XP to reach level N = BASE × N × (N-1) / 2.
 *   base 12 → L5 = 120 XP, L6 = 180 XP, L7 = 252 XP.
 *
 * A thorough 15-room run (≈35–45 combats, mostly normal/hard) banks
 * ~280–340 XP pre-boss, landing the player at L6 — the level the main boss
 * is tuned against (see `MAIN_BOSS_REFERENCE` and the L6 2-shot test in
 * `balance.test.ts`).
 */
export const XP_PER_LEVEL_BASE = 12;

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
//
// Rebalance note (15-room run): bumped from 11/10/60 → 12/11/70. With the
// longer run the player reaches the boss at L6 (not L5), so +1 atk / +1 mag
// / +10 hp restores tension without breaking the 2-shot survival floor —
// L6 Laurent has 29 HP, worst-case 2-shot = 2 × ceil(12 × 1.1) = 28.

export const MAIN_BOSS_REFERENCE = {
  atk: 12,
  mag: 11,
  hp:  70,
} as const;
