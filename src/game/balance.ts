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

// ── Attack tuning knobs ─────────────────────────────────────────────────────
// Consumed by `src/data/attacks.ts` (values are authored there, not computed)
// and by `src/components/CombatOverlay.tsx` (mpGain applied on use).
// These constants exist purely to give the tuner a single labeled place to
// look; the actual numbers are repeated in attacks.ts so the data file stays
// self-documenting.

/**
 * Enemy turns a T3 attack stays locked after use.
 * 2 means: after using T3, the player must take exactly 1 non-T3 action
 * (T1 or T2) before T3 becomes available again — because the cooldown
 * decrements once per enemy turn, not per player action.
 *
 * Timeline with cooldown 2:
 *   Player: T3 → cooldown = 2
 *   Enemy turn:  cooldown → 1
 *   Player: forced T1 or T2 (T3 grayed out)
 *   Enemy turn:  cooldown → 0
 *   Player: T3 available again
 *
 * Raising to 3 would force TWO non-T3 player actions; lowering to 1 forces
 * none (just skips one enemy turn — too lenient).
 */
export const T3_COOLDOWN = 2;

/**
 * MP returned to the hero when they use their T1 (free) attack.
 * This gives T1 a second purpose beyond "desperation filler": during a T3
 * cooldown window the player actively wants to press T1 to top up MP for the
 * next T3. Creates a deliberate rhythm instead of mindless waiting.
 *
 * 1 is the sweet spot: meaningful over 2+ T1 uses but not strong enough to
 * fully recharge between T3 casts on its own (T3 costs 4–7 MP; two T1 uses
 * only recover 2).
 */
export const T1_MP_GAIN = 1;

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
// Rebalance note (T3-spam pass): ATK 12 → 11.
// T3 cooldown forces longer fights (more enemy turns per combat), so the boss
// lands more hits than before. Dropping ATK by 1 compensates — worst-case
// 2-shot is now 2 × ceil(11 × 1.1) = 26, still within every L6 hero's HP
// (Laurent 29, Alphonse 32, Marine 35). HP stays at 70 — the cooldown already
// makes the fight longer without needing more bulk.

export const MAIN_BOSS_REFERENCE = {
  atk: 11,
  mag: 11,
  hp:  70,
} as const;
