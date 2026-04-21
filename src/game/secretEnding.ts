/**
 * secretEnding — unlock logic for the hidden Orzag encounter.
 *
 * The secret ending triggers when the player beats the main boss
 * (`client_legendaire` in `boss_room`) AND every encounter in every room they
 * visited has been resolved. It's "100 % of what they saw", not "100 % of the
 * entire dungeon" — rooms the player never stepped into don't count.
 *
 * Why "visited only"?
 * The dungeon is procedurally populated, and some runs naturally skip rooms
 * depending on door-guard rolls and exit choices. Requiring the player to
 * back-track through every untouched room would be punishing without making
 * the secret feel earned. Tracking *visited* rooms gives a clear, fair rule:
 * if you entered it, you must have cleared it.
 *
 * Tuning:
 *  - `ORZAG_POWER_MULT` documents the 2× multiplier applied to the base boss.
 *  - `SECRET_HINT` is the exact sentence injected into the victory screen.
 *  - `ORZAG_ENEMY_ID` points to the Enemy entry in `src/data/enemies.ts`.
 *  - `ORZAG_SCREEN_ID` is a synthetic screenId used only at runtime for the
 *    `pending` encounter slot — it intentionally does NOT exist in SCREENS so
 *    the data-integrity checker ignores it. CombatOverlay's lookup of
 *    `SCREENS[pending.screenId]?.isBossScreen` safely returns `undefined` and
 *    the phase is driven by our `'secret-combat'` flag instead.
 */

import type { GameState } from './store';
import type { ScreenEncounter } from '../data/types';
import { SCREENS } from '../data/screens';
import { encounterKey } from './store';

/** Inserted verbatim into the victory screen when the secret is unlocked. */
export const SECRET_HINT =
  'Cependant il reste une terrible menace au sein du Dungeon... ' +
  'saurez-vous en triompher ?';

/** Enemy ID of the hidden boss. See `src/data/enemies.ts`. */
export const ORZAG_ENEMY_ID = 'orzag_coeur_pierre';

/** Synthetic screen ID used for the pending encounter slot during the
 *  secret combat. It is NOT a real screen — do not add it to SCREENS. */
export const ORZAG_SCREEN_ID = '__orzag__';

/**
 * Multiplier applied to the MAIN boss (`client_legendaire`) to derive
 * Orzag's stats. Raise to make him tougher, lower to make him fairer.
 * The actual numbers live in `src/data/enemies.ts` — this constant is
 * informational / used by `docs/secret-ending.md`.
 */
export const ORZAG_POWER_MULT = 2;

/**
 * Is every encounter in every room the player has visited resolved?
 *
 * Implementation detail: we prefer per-run `sessionEncounters` (procedural)
 * when present, falling back to `screen.encounters` (hand-crafted). An
 * encounter is resolved if its `encounterKey` is in either `defeatedEnemies`
 * (combat) or `resolvedEvents` (everything else — events, traps, puzzles,
 * riddles).
 *
 * The starting room is always in `visitedRooms` (seeded by TitleScreen.start
 * on run begin), so the player can't sneak past the check by never moving.
 */
export function isRunFullyResolved(state: GameState): boolean {
  const { visitedRooms, sessionEncounters, defeatedEnemies, resolvedEvents } =
    state;

  // If the player somehow made it to victory without touching a single room,
  // we err on the cautious side: no secret unlock.
  if (visitedRooms.length === 0) return false;

  const defeated = new Set(defeatedEnemies);
  const resolved = new Set(resolvedEvents);

  for (const screenId of visitedRooms) {
    const encs: ScreenEncounter[] =
      sessionEncounters[screenId] ?? SCREENS[screenId]?.encounters ?? [];

    for (const enc of encs) {
      const key = encounterKey(screenId, enc.x, enc.y);
      const isDone =
        enc.kind === 'combat' ? defeated.has(key) : resolved.has(key);
      if (!isDone) return false;
    }
  }
  return true;
}
