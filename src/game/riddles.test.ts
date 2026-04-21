import { describe, it, expect } from 'vitest';
import { HEROES, deriveMaxMp } from '../data/heroes';
import { REWARD_ITEMS } from '../data/rewardItems';
import { RIDDLES } from '../data/riddles';
import { applyRewardItem, totalBonus } from './riddles';

describe('applyRewardItem', () => {
  const hero   = HEROES.alphonse;
  const maxHp  = hero.stats.hp;
  const maxMp  = deriveMaxMp(hero);

  it('returns null for an unknown item id', () => {
    expect(applyRewardItem(hero, maxHp, maxMp, 'does_not_exist')).toBeNull();
  });

  it('bumps ATK by the item delta without mutating the input hero', () => {
    const before = JSON.stringify(hero);
    const r = applyRewardItem(hero, maxHp, maxMp, 'talisman_mvp'); // +1 atk
    expect(r).not.toBeNull();
    expect(r!.hero.stats.atk).toBe(hero.stats.atk + 1);
    expect(r!.hero.stats.mag).toBe(hero.stats.mag);
    expect(r!.maxHp).toBe(maxHp);
    expect(JSON.stringify(hero)).toBe(before);
  });

  it('bumps maxHp AND heals for exactly the bump delta', () => {
    const r = applyRewardItem(hero, maxHp, maxMp, 'chrono_flux'); // +2 maxHp
    expect(r!.maxHp).toBe(maxHp + 2);
    expect(r!.hpHealed).toBe(2);
  });

  it('bumps MAG and grows derived max MP accordingly', () => {
    const r = applyRewardItem(hero, maxHp, maxMp, 'boussole_feedback'); // +1 mag
    expect(r!.hero.stats.mag).toBe(hero.stats.mag + 1);
    // +1 MAG → derived max MP grows by 2 (deriveMaxMp = mag * 2)
    expect(r!.maxMp).toBe(maxMp + 2);
    expect(r!.mpHealed).toBe(2);
  });

  it('preserves extra-MP stacked on top from a previous item', () => {
    // Simulate: earlier the player had +3 "extra" MP on top of the base pool.
    const priorMaxMp = maxMp + 3;
    const r = applyRewardItem(hero, maxHp, priorMaxMp, 'boussole_feedback');
    // New MP = (newMag * 2) + 3 extra
    expect(r!.maxMp).toBe((hero.stats.mag + 1) * 2 + 3);
  });
});

describe('totalBonus', () => {
  it('sums multiple items correctly', () => {
    const picks = [
      REWARD_ITEMS.talisman_mvp,
      REWARD_ITEMS.boussole_feedback,
      REWARD_ITEMS.chrono_flux,
    ];
    const total = totalBonus(picks);
    expect(total.atk).toBe(1);   // talisman_mvp
    expect(total.mag).toBe(1);   // boussole_feedback
    expect(total.maxHp).toBe(2); // chrono_flux
  });
});

describe('RIDDLES / REWARD_ITEMS data integrity (local view)', () => {
  it('every riddle targets a valid reward item', () => {
    for (const r of Object.values(RIDDLES)) {
      expect(REWARD_ITEMS[r.rewardItemId]).toBeDefined();
    }
  });

  it('every riddle has 3 or 4 choices with a valid correctIndex', () => {
    for (const r of Object.values(RIDDLES)) {
      expect(r.choices.length).toBeGreaterThanOrEqual(3);
      expect(r.choices.length).toBeLessThanOrEqual(4);
      expect(r.correctIndex).toBeGreaterThanOrEqual(0);
      expect(r.correctIndex).toBeLessThan(r.choices.length);
    }
  });

  it('ships exactly 10 riddles and 10 reward items', () => {
    expect(Object.keys(RIDDLES).length).toBe(10);
    expect(Object.keys(REWARD_ITEMS).length).toBe(10);
  });
});
