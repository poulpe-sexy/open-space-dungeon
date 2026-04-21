import { describe, it, expect } from 'vitest';
import { SCREENS } from '../data/screens';
import { generateAllEncounters } from './generateEncounters';

describe('generateAllEncounters', () => {
  it('produces an entry for every screen', () => {
    const result = generateAllEncounters(1234);
    for (const id of Object.keys(SCREENS)) {
      expect(result[id]).toBeDefined();
    }
  });

  it('is deterministic for a given seed', () => {
    const a = generateAllEncounters(42);
    const b = generateAllEncounters(42);
    expect(a).toEqual(b);
  });

  it('produces different output for different seeds', () => {
    const a = generateAllEncounters(1);
    const b = generateAllEncounters(9999);
    // At least one screen must differ between two seeds — otherwise the RNG
    // is not actually seeded.
    const changed = Object.keys(SCREENS).some(
      (id) => JSON.stringify(a[id]) !== JSON.stringify(b[id]),
    );
    expect(changed).toBe(true);
  });

  it('keeps boss-room encounters untouched', () => {
    const bossId = Object.values(SCREENS).find((s) => s.isBossScreen)?.id;
    expect(bossId).toBeDefined();
    const gen = generateAllEncounters(777);
    expect(gen[bossId!]).toEqual(SCREENS[bossId!].encounters);
  });

  it('places encounters only on floor tiles and never on door/exit tiles', () => {
    const gen = generateAllEncounters(555);
    for (const screen of Object.values(SCREENS)) {
      if (screen.isBossScreen) continue;
      if (!screen.tiles.length) continue;
      const exitSet = new Set(screen.exits.map((e) => `${e.x},${e.y}`));
      for (const enc of gen[screen.id]) {
        // Not on a wall:
        expect(screen.tiles[enc.y][enc.x]).not.toBe(1);
        // Not on an exit:
        expect(exitSet.has(`${enc.x},${enc.y}`)).toBe(false);
      }
    }
  });

  it('every encounter references a valid kind-id pair', () => {
    const gen = generateAllEncounters(123);
    for (const encs of Object.values(gen)) {
      for (const e of encs) {
        switch (e.kind) {
          case 'combat':  expect(typeof e.enemyId).toBe('string');  break;
          case 'event':   expect(typeof e.eventId).toBe('string');  break;
          case 'trap':    expect(typeof e.trapId).toBe('string');   break;
          case 'puzzle':  expect(typeof e.puzzleId).toBe('string'); break;
          case 'riddle':  expect(typeof e.riddleId).toBe('string'); break;
        }
      }
    }
  });

  it('a riddle never appears more than once across a run', () => {
    // Try several seeds — if dedupe is broken, at least one will duplicate.
    for (const seed of [1, 42, 1234, 9001, 2024]) {
      const gen = generateAllEncounters(seed);
      const seen = new Set<string>();
      for (const encs of Object.values(gen)) {
        for (const e of encs) {
          if (e.kind === 'riddle' && e.riddleId) {
            expect(seen.has(e.riddleId)).toBe(false);
            seen.add(e.riddleId);
          }
        }
      }
    }
  });
});
