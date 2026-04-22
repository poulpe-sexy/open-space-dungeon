import { useSyncExternalStore } from 'react';
import type { Hero, KeyItemId, RewardItemId, ScreenEncounter, Tile } from '../data/types';
import type { DecorMap } from './generateDecorations';

export type Phase =
  | 'title'
  | 'dungeon'
  | 'combat'
  | 'event'
  | 'trap'
  | 'puzzle'
  | 'riddle'
  | 'victory'
  /** Transitional screen shown between the normal victory and the secret
   *  Orzag combat (short dramatic intro, then one click to engage). */
  | 'secret-intro'
  /** Player is in the hidden Orzag fight. Uses CombatOverlay like a regular
   *  boss combat — only the post-win routing differs (see CombatOverlay). */
  | 'secret-combat'
  /** Terminal phase after defeating Orzag. Shows the ultimate ending. */
  | 'true-victory'
  | 'defeat';

export interface PendingEncounter {
  screenId: string;
  encounter: ScreenEncounter;
}

export interface GameState {
  phase: Phase;
  hero: Hero | null;
  hp: number;
  mp: number;
  maxHp: number;
  maxMp: number;
  /** Hero level (starts at 1). Only combat grants XP. */
  level: number;
  /** Current XP progress toward the next level (resets on level-up). */
  xp: number;
  currentScreenId: string;
  playerX: number;
  playerY: number;
  defeatedEnemies: string[]; // keys like "screenId:x,y"
  resolvedEvents: string[];
  keyItems: KeyItemId[];
  /** Lean-tech reward items earned via riddles this run (cosmetic + stat bump
   *  already baked into hero stats / maxHp / maxMp — this list is just for
   *  UI display and so we can prevent duplicate grants). */
  rewardItems: RewardItemId[];
  flags: Record<string, boolean>;
  pending: PendingEncounter | null;
  runSeed: number;
  /** Per-run procedurally generated encounters, keyed by screenId. */
  sessionEncounters: Record<string, ScreenEncounter[]>;
  /** Per-run procedural room shapes (tile grid), keyed by screenId. Boss room
   *  keeps its hand-crafted layout and is absent from this map. */
  sessionRoomShapes: Record<string, Tile[][]>;
  /** Per-run procedural decor placement (blocks player, no gameplay effect). */
  sessionDecorations: Record<string, DecorMap>;
  /** Screen IDs visited at least once this run (in order of first entry). */
  visitedRooms: string[];
}

const INITIAL: GameState = {
  phase: 'title',
  hero: null,
  hp: 0,
  mp: 0,
  maxHp: 0,
  maxMp: 0,
  level: 1,
  xp: 0,
  currentScreenId: 'reception',
  playerX: 2,
  playerY: 5,
  defeatedEnemies: [],
  resolvedEvents: [],
  keyItems: [],
  rewardItems: [],
  flags: {},
  pending: null,
  runSeed: Date.now(),
  sessionEncounters: {},
  sessionRoomShapes: {},
  sessionDecorations: {},
  visitedRooms: [],
};

type Listener = () => void;
const listeners = new Set<Listener>();
let state: GameState = INITIAL;

const emit = () => listeners.forEach((l) => l());

/**
 * Keep HP / MP within [0, max] and level/xp non-negative, no matter what the
 * caller passed. This is a defence-in-depth clamp: individual call sites
 * already clamp before calling `set`, but a single place that enforces the
 * invariant means a silly regression elsewhere can't produce a negative HP or
 * an HP > maxHp bar that renders past 100 %.
 */
function normalize(next: GameState): GameState {
  const maxHp = Math.max(0, next.maxHp | 0);
  const maxMp = Math.max(0, next.maxMp | 0);
  const hp    = Math.max(0, Math.min(next.hp | 0, maxHp));
  const mp    = Math.max(0, Math.min(next.mp | 0, maxMp));
  const level = Math.max(1, next.level | 0);
  const xp    = Math.max(0, next.xp | 0);
  if (
    hp === next.hp && mp === next.mp &&
    maxHp === next.maxHp && maxMp === next.maxMp &&
    level === next.level && xp === next.xp
  ) {
    return next;
  }
  return { ...next, hp, mp, maxHp, maxMp, level, xp };
}

export const store = {
  get: () => state,
  set: (patch: Partial<GameState> | ((s: GameState) => Partial<GameState>)) => {
    const diff = typeof patch === 'function' ? patch(state) : patch;
    state = normalize({ ...state, ...diff });
    emit();
  },
  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  reset: () => {
    state = { ...INITIAL, runSeed: Date.now() };
    emit();
  },
};

export const useStore = <T>(selector: (s: GameState) => T): T =>
  useSyncExternalStore(store.subscribe, () => selector(store.get()));

export const encounterKey = (screenId: string, x: number, y: number) =>
  `${screenId}:${x},${y}`;

/**
 * Append `screenId` to `rooms` only if it isn't already there. Used by the
 * movement handler to maintain `state.visitedRooms` (the deduped list of
 * distinct rooms the player has discovered this run).
 *
 * Returns the SAME array reference when `screenId` is already present — so
 * React memoisation and identity checks stay stable across backtracking steps.
 * A brand-new discovery produces a fresh array (spread), triggering a render.
 */
export function addDiscoveredRoom(
  rooms: readonly string[],
  screenId: string,
): string[] {
  return rooms.includes(screenId) ? (rooms as string[]) : [...rooms, screenId];
}
