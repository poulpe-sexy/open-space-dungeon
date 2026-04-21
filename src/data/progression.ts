import type { HeroId, RunProgression } from './types';
import { HEROES, deriveMaxMp } from './heroes';

/**
 * Builds a fresh run. Called when the player picks a hero on the title screen.
 */
export const createRun = (heroId: HeroId, startScreenId: string): RunProgression => {
  const hero = HEROES[heroId];
  const maxMp = deriveMaxMp(hero);
  return {
    heroId,
    hp: hero.stats.hp,
    maxHp: hero.stats.hp,
    mp: maxMp,
    maxMp,
    currentScreenId: startScreenId,
    visitedScreens: [startScreenId],
    defeatedEnemies: [],
    resolvedEvents: [],
    keyItems: [],
    flags: {},
    runSeed: Date.now(),
    startedAt: Date.now(),
    stepCount: 0,
  };
};
