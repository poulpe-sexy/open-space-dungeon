// =============================================================================
// OPEN SPACE DUNGEON — data models
// Everything the game consumes is described by these types. Gameplay logic
// reads from declarative tables (HEROES, ATTACKS, ENEMIES, SCREENS, …); there
// is no mutable "character class" hidden somewhere else.
// =============================================================================

// ---------- Stats --------------------------------------------------------------
/** Primary stat triad used by both heroes and enemies. */
export interface Stats {
  atk: number; // physical damage multiplier
  mag: number; // magic damage multiplier AND max MP is derived from it
  hp: number;  // max health
}

// ---------- Classes ------------------------------------------------------------
export type HeroClass = 'Choc' | 'Roublard' | 'Sage';

export interface ClassDef {
  id: HeroClass;
  name: string;
  role: string;
  color: string;        // UI tint
  description: string;
}

// ---------- Attacks ------------------------------------------------------------
export type AttackKind = 'physical' | 'magic';
export type AttackTier = 1 | 2 | 3;

export interface Attack {
  id: string;
  name: string;
  kind: AttackKind;
  tier: AttackTier;
  /** Multiplier applied to `stats.atk` (physical) or `stats.mag` (magic). */
  power: number;
  /** MP cost. 0 means always available. */
  cost: number;
  description: string;
  /**
   * Number of enemy turns this attack is locked after use.
   * Absent / 0 = no cooldown. Used on T3 attacks to prevent spamming.
   * The player must use T1 or T2 during the lockout window.
   */
  cooldown?: number;
  /**
   * MP returned to the caster when this attack is used.
   * Absent / 0 = no recovery. Set to 1 on all T1 attacks so the free filler
   * doubles as a slow MP-recovery tool during T3 cooldown windows.
   */
  mpGain?: number;
}

// ---------- Heroes -------------------------------------------------------------
export type HeroId = 'marine' | 'alphonse' | 'laurent';

export interface Hero {
  id: HeroId;
  name: string;
  className: HeroClass;
  stats: Stats;
  portrait: string;
  tag: string;
  /** Attack ids, ordered ascending by tier / power. */
  attacks: readonly [string, string, string];
  tint: string;
}

// ---------- Enemies ------------------------------------------------------------
export type Difficulty = 'easy' | 'normal' | 'hard' | 'boss';

/**
 * Optional special behaviour wired into CombatOverlay.
 * Each variant is self-contained — the combat engine reads `kind` and applies
 * the effect automatically. Effects are LOCAL to the fight (they reset on the
 * next encounter) unless otherwise noted.
 *
 * | kind          | effect                                                      |
 * |---------------|-------------------------------------------------------------|
 * | armor         | flat damage reduction on every player hit (min 1)           |
 * | buff_self     | enemy ATK increases every `every` enemy turns               |
 * | debuff_atk    | hero effective ATK decreases every `every` enemy turns      |
 * | debuff_mag    | hero effective MAG decreases every `every` enemy turns      |
 * | drain_hp      | extra raw HP drain every `every` enemy turns (no armor)     |
 * | alternate     | odd turns → passive (skip), even turns → burst (ATK ×2)    |
 */
export type EnemySpecial =
  | { kind: 'armor';      reduction: number }
  | { kind: 'buff_self';  atkBonus: number;  every: number }
  | { kind: 'debuff_atk'; amount:   number;  every: number }
  | { kind: 'debuff_mag'; amount:   number;  every: number }
  | { kind: 'drain_hp';   amount:   number;  every: number }
  | { kind: 'alternate';  idleTurns: number };

export interface Enemy {
  id: string;
  name: string;
  stats: Stats;
  difficulty: Difficulty;
  rewardXp: number;
  color: number;          // Phaser-style 0xRRGGBB
  description: string;
  /** Flavor-only names used in the combat log. */
  attackNames: readonly string[];
  /** Optional special ability handled by CombatOverlay. */
  special?: EnemySpecial;
}

// ---------- Key items ----------------------------------------------------------
export type KeyItemId = 'badge' | 'tampon' | 'password' | 'signed_form';

export interface KeyItem {
  id: KeyItemId;
  name: string;
  /** Short ASCII/unicode glyph used in HUD chips. */
  glyph: string;
  description: string;
  /** Logical feature unlocked — used by screens/events to gate things. */
  unlocks?: string;
}

// ---------- Zones --------------------------------------------------------------
export interface Zone {
  id: string;
  name: string;
  theme: string;
  difficulty: Difficulty;
  description: string;
}

// ---------- Screens ------------------------------------------------------------
export type ScreenType =
  | 'entrance'
  | 'corridor'
  | 'open_space'
  | 'meeting_room'
  | 'break_room'
  | 'technical'
  | 'executive'
  | 'safe_room'
  | 'boss_room';

export type Tile = 0 | 1 | 2 | 3;
// 0 = floor, 1 = wall/obstacle, 2 = door/exit, 3 = reserved (visual marker)

export type ExitDirection = 'N' | 'S' | 'E' | 'W';

export interface ExitLink {
  x: number;
  y: number;
  toScreen: string;
  entryX: number;
  entryY: number;
  /** Optional key-item gate; if set, player must have this item. */
  requiresKeyItem?: KeyItemId;
  /** Number of distinct rooms that must be cleared before this exit opens. */
  requiresClearedRooms?: number;
  /** Cardinal direction shown on the navigation card. */
  direction?: ExitDirection;
}

export type EncounterKind = 'combat' | 'event' | 'trap' | 'puzzle' | 'riddle';

export interface ScreenEncounter {
  x: number;
  y: number;
  kind: EncounterKind;
  enemyId?: string;
  eventId?: string;
  trapId?: string;
  puzzleId?: string;
  /** Only set when kind === 'riddle'. References RIDDLES[riddleId]. */
  riddleId?: string;
  once?: boolean;
  /** Used by the resolution system to set the challenge threshold. */
  difficulty?: Difficulty;
}

export interface ScreenDef {
  id: string;
  zoneId: string;
  type: ScreenType;
  title: string;
  flavor: string;
  width: number;
  height: number;
  tiles: Tile[][];
  exits: ExitLink[];
  encounters: ScreenEncounter[];
  /** Present on the single screen that ends the run. */
  isBossScreen?: boolean;
  /** If set, the first time the player enters this screen, they receive it. */
  grantsKeyItem?: KeyItemId;
}

// ---------- Events / traps / puzzles -------------------------------------------
export interface EventChoice {
  label: string;
  log: string;
  effect?: {
    hpDelta?: number;
    mpDelta?: number;
    grantAttackId?: string;
    grantKeyItemId?: KeyItemId;
    /**
     * Grant a permanent stat-boost item (same as riddle rewards).
     * Handled by EventOverlay: applies the bonus once, adds to rewardItems
     * so duplicates are skipped if the same item is offered again.
     */
    grantRewardItemId?: RewardItemId;
    setFlag?: string;
  };
  /** If set, the choice is disabled unless the player has the item. */
  requiresKeyItem?: KeyItemId;
}

export interface EventDef {
  id: string;
  title: string;
  text: string;
  choices: EventChoice[];
  /**
   * Optional metadata: which hero class is best suited to this ordeal.
   * Currently informational only (designer notes / future UI hint).
   */
  recommendedHero?: HeroClass;
  /**
   * NPC narrative events only. Identifies which swordsman spritesheet to use.
   * 'matt' → swordsman_matt.png (Swordsman lvl1 — Chavalier Matt).
   * 'max'  → swordsman_max.png  (Swordsman lvl3 — Seigneur Maxilowicz).
   * When set, EventOverlay enters a two-phase flow:
   *   1. choices panel  2. NPC response + random reaction → dismiss.
   */
  portrait?: 'max';
  /** Display name shown in the NPC portrait header. */
  npcName?: string;
}

// ---------- Riddles (lean-tech themed) ----------------------------------------
/**
 * Multiple-choice mini-events. Correct answer grants the active hero a light
 * stat-boost item. Failure is neutral — no stat penalty, no XP (combat is the
 * only XP source).
 */
export type RiddleId = string;
export type RewardItemId = string;

/** Small additive modifiers to apply to the active hero on pickup. */
export interface StatBonus {
  atk?: number;   // +ATK
  mag?: number;   // +MAG (also raises derived max MP)
  maxHp?: number; // +max HP (current HP is healed by the same delta)
  maxMp?: number; // +max MP flat (stacks on top of MAG-derived mp)
}

export interface RewardItem {
  id: RewardItemId;
  name: string;
  /** Short description shown in tooltips / HUD. */
  description: string;
  /** 1-char unicode glyph for the HUD inventory chip. */
  glyph: string;
  bonus: StatBonus;
}

export interface Riddle {
  id: RiddleId;
  /** Short context tag, e.g. "Lean Tech — MVP". Rendered above the prompt. */
  topic: string;
  prompt: string;
  /** 3 or 4 answer labels. */
  choices: readonly string[];
  /** Index into `choices` of the single correct answer. */
  correctIndex: number;
  /** Item granted on success. */
  rewardItemId: RewardItemId;
  /** Short, positive feedback on success. */
  successText: string;
  /** Short, non-punitive feedback on failure. */
  failText: string;
}

// ---------- Combat state -------------------------------------------------------
export type CombatTurn = 'player' | 'enemy' | 'resolving' | 'done';
export type CombatOutcome = 'pending' | 'victory' | 'defeat';

export interface CombatLogEntry {
  actor: 'hero' | 'enemy' | 'system';
  text: string;
}

export interface CombatState {
  heroId: HeroId;
  enemyId: string;
  heroHp: number;
  heroMp: number;
  enemyHp: number;
  enemyMaxHp: number;
  turn: CombatTurn;
  outcome: CombatOutcome;
  round: number;
  log: CombatLogEntry[];
}

// ---------- Run progression ----------------------------------------------------
export interface RunProgression {
  heroId: HeroId;
  hp: number;
  mp: number;
  maxHp: number;
  maxMp: number;
  currentScreenId: string;
  visitedScreens: string[];
  defeatedEnemies: string[];
  resolvedEvents: string[];
  keyItems: KeyItemId[];
  flags: Record<string, boolean>;
  runSeed: number;
  startedAt: number;
  stepCount: number;
}
