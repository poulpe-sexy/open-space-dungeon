import { describe, it, expect, beforeEach } from 'vitest';
import { store } from './store';

// Small helper: fully reset + apply a patch, then read back current state.
function reset() { store.reset(); }
function get()   { return store.get(); }

describe('store normalize (HP / MP / level / xp clamping)', () => {
  beforeEach(reset);

  it('clamps hp above maxHp down to maxHp', () => {
    store.set({ maxHp: 20, hp: 999 });
    expect(get().hp).toBe(20);
  });

  it('clamps negative hp to zero', () => {
    store.set({ maxHp: 20, hp: -50 });
    expect(get().hp).toBe(0);
  });

  it('clamps mp the same way', () => {
    store.set({ maxMp: 12, mp: 40 });
    expect(get().mp).toBe(12);
    store.set({ mp: -3 });
    expect(get().mp).toBe(0);
  });

  it('shrinking maxHp also shrinks hp to fit', () => {
    store.set({ maxHp: 30, hp: 25 });
    store.set({ maxHp: 10 });
    expect(get().hp).toBe(10);
  });

  it('never lets level fall below 1', () => {
    store.set({ level: 0 });
    expect(get().level).toBe(1);
    store.set({ level: -5 });
    expect(get().level).toBe(1);
  });

  it('never lets xp go negative', () => {
    store.set({ xp: -12 });
    expect(get().xp).toBe(0);
  });

  it('reset() restores the initial phase (title)', () => {
    store.set({ phase: 'combat' });
    store.reset();
    expect(get().phase).toBe('title');
  });
});
