/**
 * generateEncounters — procedural encounter placement for each room.
 *
 * Called once at game-start (in TitleScreen.start()).
 * Returns a map  screenId → ScreenEncounter[]  that overrides the static
 * `screen.encounters` for the duration of the run.
 *
 * Rules:
 *  - Boss rooms keep their hand-crafted encounters unchanged.
 *  - Every other room gets 2–5 randomly placed encounters drawn from
 *    a zone-appropriate pool (enemies, events, traps, puzzles).
 *  - Encounters are placed only on floor tiles (value 0), never on exits.
 */

import type { ScreenEncounter, Tile } from '../data/types';
import { SCREENS } from '../data/screens';
import { RIDDLE_IDS } from '../data/riddles';

/**
 * Relative weight of riddles vs. the zone's (combat/event/trap/puzzle) draw.
 * Tuned low so riddles stay a pleasant surprise rather than a constant.
 * Raise this to make riddles more frequent, lower it to make them rarer.
 */
const RIDDLE_EVENT_WEIGHT = 10;

/**
 * Probability that any given door gets "guarded" — i.e. an encounter placed on
 * its approach tile (the interior floor cell directly adjacent to the door).
 * This turns a fraction of exits into tactical gates the player must resolve
 * (or dodge, if another exit is available) to leave the room.
 */
const DOOR_GUARD_CHANCE = 0.4;

/**
 * Returns the interior floor cell directly adjacent to a door located on the
 * grid border at (x, y). Handles all four cardinal borders.
 */
function approachTile(
  x: number, y: number, W: number, H: number,
): { x: number; y: number } {
  let ax = x;
  let ay = y;
  if      (x === 0)       ax = 1;
  else if (x === W - 1)   ax = W - 2;
  if      (y === 0)       ay = 1;
  else if (y === H - 1)   ay = H - 2;
  return { x: ax, y: ay };
}

// ── Seeded RNG (xorshift32) ────────────────────────────────────────────────

function makeRng(seed: number): () => number {
  let s = (seed ^ 0xdeadbeef) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ── Encounter pool per zone ────────────────────────────────────────────────

type Kind = 'combat' | 'event' | 'trap' | 'puzzle';

export interface ZonePool {
  combat:  string[];
  events:  string[];
  traps:   string[];
  puzzles: string[];
  /** Relative weights for [combat, event, trap, puzzle] */
  weights: [number, number, number, number];
}

export const ZONE_POOLS: Record<string, ZonePool> = {
  accueil: {
    // Zone I — introductory. Special enemies start appearing from open_space.
    combat:  ['client_hesitant', 'client_sceptique'],
    events:  ['pep_talk', 'coffee_machine', 'slack_maudit', 'standup_eternel', 'comite_plantes'],
    traps:   ['cable_snare', 'sol_cire', 'gobelet_maudit'],
    puzzles: ['badgeuse_prophetique', 'frigo_maudit'],
    weights: [40, 25, 20, 15],
  },
  open_space: {
    // Zone II — first special enemies introduced (normal difficulty only).
    // client_blinde: tanky armoured (first encounter with armor mechanic).
    // client_moteur: self-buffs (learn to kill fast before ATK snowballs).
    // NPC: Chavalier Matt apparaît ici (salles ~3-8).
    combat:  ['client_sceptique', 'client_exigeant', 'client_anxieux',
               'client_blinde', 'client_moteur'],
    events:  ['coffee_machine', 'mystery_memo', 'slack_maudit', 'standup_eternel', 'comite_plantes',
               'npc_matt_trombone', 'npc_matt_imprimante'],
    traps:   ['cable_snare', 'floor_shock', 'tunnel_validation',
               'chaise_roulettes', 'avalanche_postit', 'sol_cire', 'imprimante_infinie'],
    puzzles: ['coffee_order', 'cafe_quantique', 'frigo_maudit', 'mur_postit'],
    weights: [40, 25, 20, 15],
  },
  salles_reu: {
    // Zone III — debuffers start showing up (ATK & MAG sapping).
    // client_demoraliseur: drains ATK; client_lunatique: burst pattern.
    // NPC: Matt (fin de ses scènes) + Max (début de ses scènes), salles ~6-11.
    combat:  ['client_exigeant', 'client_anxieux', 'client_chronophage',
               'client_blinde', 'client_demoraliseur', 'client_lunatique'],
    events:  ['mystery_memo', 'pep_talk', 'slack_maudit', 'standup_eternel',
               'npc_matt_reunion', 'npc_matt_mug',
               'npc_max_postit', 'npc_max_chargeur'],
    traps:   ['cable_snare', 'floor_shock', 'reunion_infinie',
               'chaise_roulettes', 'avalanche_postit', 'neon_conformite',
               'imprimante_infinie', 'gobelet_maudit'],
    puzzles: ['coffee_order', 'frigo_maudit', 'mur_postit'],
    weights: [35, 25, 25, 15],
  },
  technique: {
    // Zone IV — harder specials: MAG brouilleur, vampirique drain.
    // NPC: Chevalier Max (salles ~9-13).
    combat:  ['client_fantome', 'client_zen', 'client_anxieux',
               'client_brouilleur', 'client_vampirique'],
    events:  ['mystery_memo', 'slack_maudit', 'standup_eternel',
               'npc_max_plante', 'npc_max_password'],
    traps:   ['floor_shock', 'cable_snare', 'tunnel_validation',
               'scanner_demoniaque', 'neon_conformite', 'portique_alignement',
               'imprimante_infinie'],
    puzzles: ['cafe_quantique', 'badgeuse_prophetique', 'mur_postit'],
    weights: [40, 15, 30, 15],
  },
  direction: {
    // Zone V (final gauntlet) — full roster of special enemies alongside hard regulars.
    combat:  ['client_chronophage', 'client_fantome', 'client_zen',
               'client_demoraliseur', 'client_brouilleur',
               'client_vampirique', 'client_lunatique'],
    events:  ['pep_talk', 'mystery_memo', 'standup_eternel', 'comite_plantes'],
    traps:   ['floor_shock', 'cable_snare', 'reunion_infinie', 'tunnel_validation',
               'chaise_roulettes', 'scanner_demoniaque', 'neon_conformite',
               'portique_alignement', 'gobelet_maudit'],
    puzzles: ['coffee_order', 'cafe_quantique', 'badgeuse_prophetique', 'mur_postit'],
    weights: [35, 20, 25, 20],
  },
};

const FALLBACK_POOL = ZONE_POOLS['open_space'];

function pickKind(pool: ZonePool, rng: () => number): Kind {
  const [wc, we, wt, wp] = pool.weights;
  const total = wc + we + wt + wp;
  let r = rng() * total;
  if ((r -= wc) <= 0) return 'combat';
  if ((r -= we) <= 0) return 'event';
  if ((r -= wt) <= 0) return 'trap';
  return 'puzzle';
}

function makeEncounter(
  x: number,
  y: number,
  pool: ZonePool,
  rng: () => number,
  /** Mutable stack of riddle IDs remaining for this run. Pop from the end. */
  riddleStack: string[],
): ScreenEncounter {
  // Riddle draw is independent of the zone kind-weights. We roll a small
  // chance on every encounter to turn it into a riddle — but only if the
  // per-run riddle stack isn't exhausted (each riddle appears at most once).
  if (riddleStack.length > 0 && rng() * 100 < RIDDLE_EVENT_WEIGHT) {
    const riddleId = riddleStack.pop()!;
    return { x, y, kind: 'riddle', riddleId, once: true };
  }

  // Try up to 3 times to get a kind with a non-empty pool
  for (let attempt = 0; attempt < 3; attempt++) {
    const kind = pickKind(pool, rng);
    switch (kind) {
      case 'combat':
        if (pool.combat.length)
          return { x, y, kind: 'combat', enemyId: pick(pool.combat, rng), once: true };
        break;
      case 'event':
        if (pool.events.length)
          return { x, y, kind: 'event', eventId: pick(pool.events, rng), once: true };
        break;
      case 'trap':
        if (pool.traps.length)
          return { x, y, kind: 'trap', trapId: pick(pool.traps, rng), once: true };
        break;
      case 'puzzle':
        if (pool.puzzles.length)
          return { x, y, kind: 'puzzle', puzzleId: pick(pool.puzzles, rng), once: true };
        break;
    }
  }
  // Last-resort fallback: use the open_space combat pool which is always
  // guaranteed to be non-empty. This prevents pick() from receiving [].
  const fallbackCombat = pool.combat.length ? pool.combat : FALLBACK_POOL.combat;
  return { x, y, kind: 'combat', enemyId: pick(fallbackCombat, rng), once: true };
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateAllEncounters(
  seed: number,
  shapes?: Record<string, Tile[][]>,
): Record<string, ScreenEncounter[]> {
  const rng = makeRng(seed);
  const result: Record<string, ScreenEncounter[]> = {};

  // Per-run riddle pool — shuffled once, popped as we place riddle encounters.
  // This guarantees each riddle appears AT MOST once per run (each unique
  // riddle grants a unique reward item, so duplicates would stack the same
  // bonus twice — undesirable).
  const riddleStack = [...RIDDLE_IDS];
  for (let i = riddleStack.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [riddleStack[i], riddleStack[j]] = [riddleStack[j], riddleStack[i]];
  }

  for (const screen of Object.values(SCREENS)) {
    // Boss rooms: keep the hand-crafted encounter (the boss must always be there)
    if (screen.isBossScreen) {
      result[screen.id] = screen.encounters;
      continue;
    }

    const pool = ZONE_POOLS[screen.zoneId] ?? FALLBACK_POOL;
    // Use the procedural shape for this run if provided, otherwise fall back
    // to the static layout.
    const tiles = shapes?.[screen.id] ?? screen.tiles;
    const W = screen.width;
    const H = screen.height;

    // Collect eligible floor tiles (not walls, not door/exit tiles)
    const exitSet = new Set(screen.exits.map((e) => `${e.x},${e.y}`));
    const floor: Array<[number, number]> = [];
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        if (tiles[y][x] === 0 && !exitSet.has(`${x},${y}`)) {
          floor.push([x, y]);
        }
      }
    }

    // ── Door-guard placements (DOOR_GUARD_CHANCE per exit) ──────────────
    // For each exit, roll independently. On success, reserve the approach
    // tile so an encounter spawns on it. These reserved positions are
    // removed from the normal floor pool to prevent duplicates.
    const guardSpots: Array<[number, number]> = [];
    const reservedSet = new Set<string>();
    for (const e of screen.exits) {
      if (rng() >= DOOR_GUARD_CHANCE) continue;
      const a = approachTile(e.x, e.y, W, H);
      // Must be a floor tile and not already reserved.
      if (tiles[a.y]?.[a.x] !== 0) continue;
      const k = `${a.x},${a.y}`;
      if (reservedSet.has(k)) continue;
      reservedSet.add(k);
      guardSpots.push([a.x, a.y]);
    }

    // Fisher-Yates shuffle the non-reserved floor pool
    const openFloor = floor.filter(([x, y]) => !reservedSet.has(`${x},${y}`));
    for (let i = openFloor.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [openFloor[i], openFloor[j]] = [openFloor[j], openFloor[i]];
    }

    // Target count: 2–5 (capped to total available tiles including guards).
    // Guards always count toward the total, then we top up with random picks.
    const target    = 2 + Math.floor(rng() * 4);
    const available = guardSpots.length + openFloor.length;
    const count     = Math.min(target, available);
    const remaining = Math.max(0, count - guardSpots.length);

    const picks: Array<[number, number]> = [
      ...guardSpots.slice(0, count), // cap if target < guardSpots.length
      ...openFloor.slice(0, remaining),
    ];

    const encs: ScreenEncounter[] = picks.map(([x, y]) =>
      makeEncounter(x, y, pool, rng, riddleStack),
    );

    // ── Guarantee at least one combat encounter per room ─────────────────
    // If the random draw produced zero combats, force one.
    // 60 % chance: placed on the interior floor cell in front of an exit.
    // 40 % chance: placed on any remaining open floor tile.
    if (!encs.some((e) => e.kind === 'combat')) {
      const usedSet = new Set(picks.map(([x, y]) => `${x},${y}`));

      // Approach tiles of exits that are still free
      const doorApproaches: Array<[number, number]> = screen.exits
        .map((e) => approachTile(e.x, e.y, W, H))
        .filter(({ x, y }) => tiles[y]?.[x] === 0 && !usedSet.has(`${x},${y}`))
        .map(({ x, y }): [number, number] => [x, y]);

      // Remaining open floor tiles (excludes all already-used positions)
      const allOpen = floor.filter(([x, y]) => !usedSet.has(`${x},${y}`));

      let cx = -1;
      let cy = -1;
      if (doorApproaches.length > 0 && rng() < 0.6) {
        [cx, cy] = pick(doorApproaches, rng);
      } else if (allOpen.length > 0) {
        [cx, cy] = pick(allOpen, rng);
      } else if (doorApproaches.length > 0) {
        // 60 % roll failed but no open floor left — fall back to door approach
        [cx, cy] = pick(doorApproaches, rng);
      }
      // (If cx < 0, the room is completely packed — skip, shouldn't happen.)
      if (cx >= 0) {
        const forceCombat = pool.combat.length ? pool.combat : FALLBACK_POOL.combat;
        encs.push({
          x: cx, y: cy,
          kind: 'combat',
          enemyId: pick(forceCombat, rng),
          once: true,
        });
      }
    }

    result[screen.id] = encs;
  }

  return result;
}
