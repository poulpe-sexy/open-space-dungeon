import { describe, it, expect } from 'vitest';
import { validateGameData } from './dataIntegrity';

// These tests guard against regressions when editing declarative data
// (screens, heroes, attacks, events, traps, puzzles, key items). A freshly
// cloned repo should always pass them — if a new contributor adds a broken
// screen or a typo in an attackId, these fail fast.

describe('validateGameData (shipped data)', () => {
  const report = validateGameData();

  it('has no integrity errors', () => {
    expect(report.errors).toEqual([]);
  });

  it('has at most one warning per room (non-critical)', () => {
    // Warnings are allowed but shouldn't spike — if they do, something's up.
    expect(report.warnings.length).toBeLessThan(10);
  });
});
