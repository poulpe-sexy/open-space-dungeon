/**
 * Robustness tests — data-integrity and engine-safety assertions.
 *
 * These tests exist to catch mismatched IDs, missing table entries, bad
 * cross-references, and logic regressions that the type-checker alone cannot
 * detect (e.g. a string key that looks valid but has no corresponding entry
 * in a Record).
 *
 * If a test here fails it means a content author forgot to wire up both sides
 * of a reference (e.g. added a grantRewardItemId to an event choice but forgot
 * to add the item to rewardItems.ts).
 */

import { describe, it, expect } from 'vitest';
import { EVENTS } from '../data/events';
import { TRAPS } from '../data/traps';
import { PUZZLES } from '../data/puzzles';
import { REWARD_ITEMS } from '../data/rewardItems';
import { ENEMIES } from '../data/enemies';
import { KEY_ITEMS } from '../data/keyItems';
import { generateAllEncounters, ZONE_POOLS } from './generateEncounters';

// Derive unique IDs from the actual pools — always in sync, never stale.
const unique = (arr: string[]) => [...new Set(arr)];
const allEvents  = unique(Object.values(ZONE_POOLS).flatMap((p) => p.events));
const allTraps   = unique(Object.values(ZONE_POOLS).flatMap((p) => p.traps));
const allPuzzles = unique(Object.values(ZONE_POOLS).flatMap((p) => p.puzzles));
const allEnemies = unique(Object.values(ZONE_POOLS).flatMap((p) => p.combat));

// ── Zone pool cross-reference ────────────────────────────────────────────────

describe('Zone pool cross-references', () => {
  it('every event ID in pools resolves to an EVENTS entry', () => {
    for (const id of allEvents) {
      expect(EVENTS[id], `Event "${id}" missing from EVENTS`).toBeDefined();
    }
  });

  it('every trap ID in pools resolves to a TRAPS entry', () => {
    for (const id of allTraps) {
      expect(TRAPS[id], `Trap "${id}" missing from TRAPS`).toBeDefined();
    }
  });

  it('every puzzle ID in pools resolves to a PUZZLES entry', () => {
    for (const id of allPuzzles) {
      expect(PUZZLES[id], `Puzzle "${id}" missing from PUZZLES`).toBeDefined();
    }
  });

  it('every enemy ID in pools resolves to an ENEMIES entry', () => {
    for (const id of allEnemies) {
      expect(ENEMIES[id], `Enemy "${id}" missing from ENEMIES`).toBeDefined();
    }
  });
});

// ── grantRewardItemId cross-references ───────────────────────────────────────

function collectRewardRefs(defs: Record<string, { choices: Array<{ effect?: { grantRewardItemId?: string } }> }>) {
  const refs: Array<{ defId: string; itemId: string }> = [];
  for (const [defId, def] of Object.entries(defs)) {
    for (const choice of def.choices) {
      const itemId = choice.effect?.grantRewardItemId;
      if (itemId) refs.push({ defId, itemId });
    }
  }
  return refs;
}

describe('grantRewardItemId cross-references', () => {
  it('all events with grantRewardItemId point to existing reward items', () => {
    for (const { defId, itemId } of collectRewardRefs(EVENTS)) {
      expect(
        REWARD_ITEMS[itemId],
        `Event "${defId}" references unknown rewardItemId "${itemId}"`,
      ).toBeDefined();
    }
  });

  it('all traps with grantRewardItemId point to existing reward items', () => {
    for (const { defId, itemId } of collectRewardRefs(TRAPS)) {
      expect(
        REWARD_ITEMS[itemId],
        `Trap "${defId}" references unknown rewardItemId "${itemId}"`,
      ).toBeDefined();
    }
  });

  it('all puzzles with grantRewardItemId point to existing reward items', () => {
    for (const { defId, itemId } of collectRewardRefs(PUZZLES)) {
      expect(
        REWARD_ITEMS[itemId],
        `Puzzle "${defId}" references unknown rewardItemId "${itemId}"`,
      ).toBeDefined();
    }
  });
});

// ── grantKeyItemId cross-references ──────────────────────────────────────────

describe('grantKeyItemId cross-references', () => {
  const allDefs = { ...EVENTS, ...TRAPS, ...PUZZLES };

  it('all grantKeyItemId values point to existing key items', () => {
    for (const [defId, def] of Object.entries(allDefs)) {
      for (const choice of def.choices) {
        const kid = choice.effect?.grantKeyItemId;
        if (kid) {
          expect(
            KEY_ITEMS[kid],
            `"${defId}" references unknown keyItemId "${kid}"`,
          ).toBeDefined();
        }
      }
    }
  });
});

// ── generateAllEncounters safety ──────────────────────────────────────────────

describe('generateAllEncounters output integrity', () => {
  // Run three seeds to get different random paths through the generator.
  const seeds = [1, 42, 99999];

  for (const seed of seeds) {
    it(`seed ${seed}: no encounter has an undefined enemyId/eventId/trapId/puzzleId/riddleId`, () => {
      const result = generateAllEncounters(seed);
      for (const [screenId, encs] of Object.entries(result)) {
        for (const enc of encs) {
          if (enc.kind === 'combat') {
            expect(enc.enemyId, `seed ${seed} screen ${screenId}: combat encounter missing enemyId`).toBeDefined();
            expect(ENEMIES[enc.enemyId!], `seed ${seed}: unknown enemyId "${enc.enemyId}"`).toBeDefined();
          }
          if (enc.kind === 'event') {
            expect(enc.eventId, `seed ${seed} screen ${screenId}: event encounter missing eventId`).toBeDefined();
            expect(EVENTS[enc.eventId!], `seed ${seed}: unknown eventId "${enc.eventId}"`).toBeDefined();
          }
          if (enc.kind === 'trap') {
            expect(enc.trapId, `seed ${seed} screen ${screenId}: trap encounter missing trapId`).toBeDefined();
            expect(TRAPS[enc.trapId!], `seed ${seed}: unknown trapId "${enc.trapId}"`).toBeDefined();
          }
          if (enc.kind === 'puzzle') {
            expect(enc.puzzleId, `seed ${seed} screen ${screenId}: puzzle encounter missing puzzleId`).toBeDefined();
            expect(PUZZLES[enc.puzzleId!], `seed ${seed}: unknown puzzleId "${enc.puzzleId}"`).toBeDefined();
          }
        }
      }
    });
  }
});

// ── store normalize behaviour ────────────────────────────────────────────────

import { store } from './store';
import { HEROES } from '../data/heroes';
import { deriveMaxMp } from '../data/heroes';

describe('store.normalize (via store.set)', () => {
  const hero = HEROES.marine;
  const maxHp = hero.stats.hp;
  const maxMp = deriveMaxMp(hero);

  function freshState() {
    store.set({ hero, hp: maxHp, mp: maxMp, maxHp, maxMp, level: 1, xp: 0 });
  }

  it('clamps HP below 0 to 0', () => {
    freshState();
    store.set({ hp: -999 });
    expect(store.get().hp).toBe(0);
  });

  it('clamps HP above maxHp to maxHp', () => {
    freshState();
    store.set({ hp: 99999 });
    expect(store.get().hp).toBe(maxHp);
  });

  it('clamps MP below 0 to 0', () => {
    freshState();
    store.set({ mp: -1 });
    expect(store.get().mp).toBe(0);
  });

  it('never lets level drop below 1', () => {
    freshState();
    store.set({ level: 0 });
    expect(store.get().level).toBe(1);
    store.set({ level: -5 });
    expect(store.get().level).toBe(1);
  });

  it('truncates fractional HP (no sub-pixel HP bars)', () => {
    freshState();
    store.set({ hp: 7.9 });
    expect(store.get().hp).toBe(7);
  });
});

// ── Run-reset coherence ───────────────────────────────────────────────────────

describe('run-reset coherence', () => {
  it('rewardItems are not present in initial store state', () => {
    store.reset();
    expect(store.get().rewardItems).toEqual([]);
  });

  it('flags are empty in initial store state', () => {
    store.reset();
    expect(store.get().flags).toEqual({});
  });

  it('rewardItems persist across store.set patches (merge behaviour)', () => {
    store.reset();
    store.set({ rewardItems: ['talisman_mvp'] });
    store.set({ hp: 5 }); // unrelated patch
    // Should still be present — merge must not drop them
    expect(store.get().rewardItems).toContain('talisman_mvp');
  });
});
