import { describe, it, expect } from 'vitest';
import { HEROES, deriveMaxMp } from '../data/heroes';
import { ATTACKS } from '../data/attacks';
import { ENEMIES } from '../data/enemies';
import {
  XP_PER_LEVEL_BASE,
  STAT_GAIN_PER_LEVEL,
  DIFFICULTY_THRESHOLDS,
  ORZAG_POWER_MULT,
  MAIN_BOSS_REFERENCE,
  BOSS_ROOMS_NEEDED,
  T3_COOLDOWN,
  T1_MP_GAIN,
} from './balance';
import { xpToNextLevel } from './leveling';
import { addDiscoveredRoom } from './store';

/**
 * Balance tests — assertions about the *shape* of progression and the
 * hero kits, not exact numeric targets. They're designed to fail loudly when
 * someone (a) breaks a hero's attack roster, (b) drifts Orzag away from the
 * 2× rule, (c) ships an XP curve that's trivially easy/hard, or (d) nerfs a
 * hero into the ground without noticing.
 *
 * Fine-grained numeric balance (exact damage numbers, exact XP totals) lives
 * in `docs/balance.md` — those move too often to freeze in tests.
 */

// ── Leveling & XP curve ─────────────────────────────────────────────────────

describe('XP curve', () => {
  it('xpToNextLevel(L) = L * XP_PER_LEVEL_BASE', () => {
    expect(xpToNextLevel(1)).toBe(XP_PER_LEVEL_BASE);
    expect(xpToNextLevel(5)).toBe(5 * XP_PER_LEVEL_BASE);
  });

  it('every level-up produces a non-zero stat gain', () => {
    const { atk, mag, hp } = STAT_GAIN_PER_LEVEL;
    expect(atk + mag + hp).toBeGreaterThan(0);
  });

  it('difficulty thresholds are monotonically increasing', () => {
    expect(DIFFICULTY_THRESHOLDS.easy).toBeLessThan(DIFFICULTY_THRESHOLDS.normal);
    expect(DIFFICULTY_THRESHOLDS.normal).toBeLessThan(DIFFICULTY_THRESHOLDS.hard);
    expect(DIFFICULTY_THRESHOLDS.hard).toBeLessThan(DIFFICULTY_THRESHOLDS.boss);
  });
});

// ── Hero kits ───────────────────────────────────────────────────────────────

describe('hero attack kits', () => {
  it('every hero has exactly 3 attacks, one per tier (1/2/3)', () => {
    for (const hero of Object.values(HEROES)) {
      const tiers = hero.attacks.map((id) => ATTACKS[id]?.tier).sort();
      expect(tiers).toEqual([1, 2, 3]);
    }
  });

  it('every tier-1 attack is free (cost 0) — the fallback filler', () => {
    for (const hero of Object.values(HEROES)) {
      const t1 = hero.attacks
        .map((id) => ATTACKS[id])
        .find((a) => a?.tier === 1);
      expect(t1?.cost).toBe(0);
    }
  });

  it('damage grows monotonically from tier 1 → 2 → 3 on the hero primary stat', () => {
    for (const hero of Object.values(HEROES)) {
      const byTier = [1, 2, 3].map((tier) =>
        hero.attacks
          .map((id) => ATTACKS[id])
          .find((a) => a?.tier === tier)!,
      );
      // "Damage" here = power × primary stat (physical → atk, magic → mag).
      const dmg = byTier.map((a) =>
        a.power * (a.kind === 'physical' ? hero.stats.atk : hero.stats.mag),
      );
      expect(dmg[0]).toBeLessThanOrEqual(dmg[1]);
      expect(dmg[1]).toBeLessThanOrEqual(dmg[2]);
    }
  });

  it('Marine (Choc) is physical-only — no magic attacks in her kit', () => {
    for (const id of HEROES.marine.attacks) {
      expect(ATTACKS[id].kind).toBe('physical');
    }
  });

  it('Laurent (Sage) is magic-only', () => {
    for (const id of HEROES.laurent.attacks) {
      expect(ATTACKS[id].kind).toBe('magic');
    }
  });

  it("Alphonse (Roublard) has a physical T1 and magic T2/T3", () => {
    const [t1id, t2id, t3id] = HEROES.alphonse.attacks;
    expect(ATTACKS[t1id].kind).toBe('physical');
    expect(ATTACKS[t2id].kind).toBe('magic');
    expect(ATTACKS[t3id].kind).toBe('magic');
  });

  it('each hero has at least one attack whose damage beats their free T1', () => {
    for (const hero of Object.values(HEROES)) {
      const stat = (a: (typeof ATTACKS)[string]) =>
        a.kind === 'physical' ? hero.stats.atk : hero.stats.mag;
      const kit = hero.attacks.map((id) => ATTACKS[id]);
      const t1 = kit.find((a) => a.tier === 1)!;
      const best = Math.max(...kit.map((a) => a.power * stat(a)));
      // At least one attack must be STRICTLY stronger than the free filler,
      // otherwise the hero has no reason to spend MP.
      expect(best).toBeGreaterThan(t1.power * stat(t1));
    }
  });
});

// ── Attack structure — anti-spam pass ──────────────────────────────────────

describe('attack anti-spam constraints', () => {
  /** Return the T1/T2/T3 attack object for a given hero. */
  const tierOf = (heroId: keyof typeof HEROES, tier: 1 | 2 | 3) => {
    const hero = HEROES[heroId];
    return hero.attacks.map((id) => ATTACKS[id]).find((a) => a?.tier === tier)!;
  };

  it('all T3 attacks have cooldown = T3_COOLDOWN (currently 2)', () => {
    for (const hero of Object.values(HEROES)) {
      const t3 = tierOf(hero.id as keyof typeof HEROES, 3);
      expect(t3.cooldown).toBe(T3_COOLDOWN);
    }
  });

  it('all T1 attacks recover mpGain MP on use (= T1_MP_GAIN, currently 1)', () => {
    for (const hero of Object.values(HEROES)) {
      const t1 = tierOf(hero.id as keyof typeof HEROES, 1);
      expect(t1.mpGain).toBe(T1_MP_GAIN);
    }
  });

  it('T3 costs more MP than T2 for every hero', () => {
    for (const hero of Object.values(HEROES)) {
      const t2 = tierOf(hero.id as keyof typeof HEROES, 2);
      const t3 = tierOf(hero.id as keyof typeof HEROES, 3);
      expect(t3.cost).toBeGreaterThan(t2.cost);
    }
  });

  it('T2 costs more MP than T1 for every hero', () => {
    // T1 is always free (cost 0) — T2 must cost something to justify the power gap.
    for (const hero of Object.values(HEROES)) {
      const t1 = tierOf(hero.id as keyof typeof HEROES, 1);
      const t2 = tierOf(hero.id as keyof typeof HEROES, 2);
      expect(t2.cost).toBeGreaterThan(t1.cost);
    }
  });

  it('T2 power > T1 power for every hero (T2 is worth spending MP on during a T3 CD)', () => {
    for (const hero of Object.values(HEROES)) {
      const t1 = tierOf(hero.id as keyof typeof HEROES, 1);
      const t2 = tierOf(hero.id as keyof typeof HEROES, 2);
      expect(t2.power).toBeGreaterThan(t1.power);
    }
  });

  it('Marine T3 cost ≤ her base maxMP (can cast once before going dry)', () => {
    // Marine base MAG = 2 → maxMP = 4. Her T3 must not cost more than that,
    // otherwise she can never use it at level 1.
    const marineMaxMp = deriveMaxMp(HEROES.marine);
    const t3 = tierOf('marine', 3);
    expect(t3.cost).toBeLessThanOrEqual(marineMaxMp);
  });

  it('T3_COOLDOWN is 2 (the designed lockout window)', () => {
    // Pinned: changing this is a deliberate pacing decision, update docs too.
    expect(T3_COOLDOWN).toBe(2);
  });

  it('T1_MP_GAIN is 1 (slow but meaningful recovery during CD window)', () => {
    expect(T1_MP_GAIN).toBe(1);
  });
});

// ── Boss / Orzag 2× rule ────────────────────────────────────────────────────

describe('boss balance', () => {
  it('main boss (Administration) matches MAIN_BOSS_REFERENCE', () => {
    const boss = ENEMIES.client_legendaire.stats;
    expect(boss.atk).toBe(MAIN_BOSS_REFERENCE.atk);
    expect(boss.mag).toBe(MAIN_BOSS_REFERENCE.mag);
    expect(boss.hp).toBe(MAIN_BOSS_REFERENCE.hp);
  });

  it('Orzag stats = main boss × ORZAG_POWER_MULT (the secret-ending promise)', () => {
    const orzag = ENEMIES.orzag_coeur_pierre.stats;
    const base  = ENEMIES.client_legendaire.stats;
    expect(orzag.atk).toBe(base.atk * ORZAG_POWER_MULT);
    expect(orzag.mag).toBe(base.mag * ORZAG_POWER_MULT);
    expect(orzag.hp).toBe(base.hp  * ORZAG_POWER_MULT);
  });

  it('Orzag rewards more XP than the main boss (true-ending prestige)', () => {
    expect(ENEMIES.orzag_coeur_pierre.rewardXp).toBeGreaterThan(
      ENEMIES.client_legendaire.rewardXp,
    );
  });
});

// ── XP budget sanity ────────────────────────────────────────────────────────

describe('XP economy', () => {
  it('a thorough run (~2 fights per enemy type) banks enough XP to hit level 5', () => {
    // The 7 regular enemies respawn across rooms: a player who clears
    // everything they see typically fights each type ~2× on the way to the
    // boss — a conservative floor even for the shorter 10-room era. That's
    // the right yardstick for the XP curve.
    const perRunEstimate = Object.values(ENEMIES)
      .filter((e) => e.difficulty !== 'boss')
      .reduce((sum, e) => sum + e.rewardXp * 2, 0);
    // Cost to reach L5 = base × (1+2+3+4).
    const costToL5 =
      xpToNextLevel(1) + xpToNextLevel(2) + xpToNextLevel(3) + xpToNextLevel(4);
    expect(perRunEstimate).toBeGreaterThanOrEqual(costToL5);
  });

  it('a thorough 15-room run (~3 fights per enemy type) banks enough XP for L6', () => {
    // 15-room pass (BOSS_ROOMS_NEEDED = 15) puts ~35–45 combats on the path
    // to the boss. Each enemy type is naturally seen ~3× across zones. That
    // should just reach L6 — the level the main boss is tuned against
    // (see "no hero dies from two full-power main-boss hits at L6").
    const perRun15 = Object.values(ENEMIES)
      .filter((e) => e.difficulty !== 'boss')
      .reduce((sum, e) => sum + e.rewardXp * 3, 0);
    const costToL6 =
      xpToNextLevel(1) + xpToNextLevel(2) + xpToNextLevel(3) +
      xpToNextLevel(4) + xpToNextLevel(5);
    expect(perRun15).toBeGreaterThanOrEqual(costToL6);
  });

  it('the main boss alone awards enough XP for at least two level-ups', () => {
    // Even a low-exploration run that just squeaks past the boss should get
    // a meaningful power-up spike for the post-victory lap / Orzag attempt.
    const bossXp = ENEMIES.client_legendaire.rewardXp;
    // 2 levels from L1 requires xpToNextLevel(1) + xpToNextLevel(2).
    expect(bossXp).toBeGreaterThanOrEqual(
      xpToNextLevel(1) + xpToNextLevel(2),
    );
  });
});

// ── Hero survivability floor ────────────────────────────────────────────────

describe('hero HP floor', () => {
  it('no hero dies from a single mid-tier enemy hit at level 1', () => {
    // Pick the hardest non-boss hit the early game can produce. `client_fantome`
    // has the highest regular atk (7). With jitter max (1.1), damage ≤ 8.
    const worstRegularHit = Math.ceil(7 * 1.1);
    for (const hero of Object.values(HEROES)) {
      expect(hero.stats.hp).toBeGreaterThan(worstRegularHit);
    }
  });

  it('no hero dies from two full-power main-boss hits once properly levelled (L6)', () => {
    // With BOSS_ROOMS_NEEDED = 15 the boss sits behind ~35–45 encounters —
    // the player is expected to arrive at L6. At L6 everyone should survive
    // a worst-case 2-shot from the boss, otherwise the fight becomes a coin
    // flip on turn order. L6 HP = base + 5 × HP-per-level.
    //
    // T3-spam pass: boss ATK 12 → 11. With T3 cooldown, the boss now lands
    // more hits per fight (player is forced into T1/T2 turns). −1 ATK
    // compensates: worst-case 2-shot = 2 × ceil(11 × 1.1) = 2 × 13 = 26.
    // Laurent at L6: 14 + 15 = 29 ≥ 26. ✓
    const bossAtk = ENEMIES.client_legendaire.stats.atk;
    const worstTwoShot = Math.ceil(bossAtk * 1.1) * 2;
    for (const hero of Object.values(HEROES)) {
      const l6Hp = hero.stats.hp + 5 * STAT_GAIN_PER_LEVEL.hp;
      expect(l6Hp).toBeGreaterThanOrEqual(worstTwoShot);
    }
  });

  it('derived maxMp keeps Sage > Roublard > Choc (identity is preserved)', () => {
    const choc     = deriveMaxMp(HEROES.marine);
    const roublard = deriveMaxMp(HEROES.alphonse);
    const sage     = deriveMaxMp(HEROES.laurent);
    expect(sage).toBeGreaterThan(roublard);
    expect(roublard).toBeGreaterThan(choc);
  });
});

// ── Run length / boss gating ────────────────────────────────────────────────

describe('boss progression gate', () => {
  it('BOSS_ROOMS_NEEDED is set to the tunable central value (15)', () => {
    // This is deliberately pinned: any change here is a deliberate pacing
    // decision and must be accompanied by a playtest + balance.md update.
    expect(BOSS_ROOMS_NEEDED).toBe(15);
  });

  it('BOSS_ROOMS_NEEDED is at least 10 and at most 20 (sane bounds)', () => {
    // <10: too few combats → boss feels under-levelled (the bug we just fixed).
    // >20: single-session runs start dragging.
    expect(BOSS_ROOMS_NEEDED).toBeGreaterThanOrEqual(10);
    expect(BOSS_ROOMS_NEEDED).toBeLessThanOrEqual(20);
  });
});

// ── Room discovery dedup ────────────────────────────────────────────────────

describe('addDiscoveredRoom', () => {
  it('appends a new room to the list', () => {
    expect(addDiscoveredRoom(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('returns the same array (no duplicate) when the room is already known', () => {
    const start = ['a', 'b'];
    const out   = addDiscoveredRoom(start, 'a');
    expect(out).toBe(start); // identity preserved — important for memoisation
    expect(out).toEqual(['a', 'b']);
  });

  it('handles the empty list', () => {
    expect(addDiscoveredRoom([], 'start')).toEqual(['start']);
  });

  it('discovering 15 distinct rooms crosses the boss-progression threshold', () => {
    // Simulate walking through 15 fresh rooms starting from the spawn.
    // The BOSS_ROOMS_NEEDED gate fires when visitedRooms.length === 15, so
    // after 15 additions (spawn + 14 new = 15 entries total) the next fresh
    // door will redirect to boss_room.
    let rooms: string[] = [];
    for (let i = 0; i < BOSS_ROOMS_NEEDED; i++) {
      rooms = addDiscoveredRoom(rooms, `room_${i}`);
    }
    expect(rooms).toHaveLength(BOSS_ROOMS_NEEDED);
  });

  it('revisiting rooms never inflates the count beyond the number of unique rooms', () => {
    // A player who back-tracks heavily shouldn't accidentally trip the boss
    // gate — the gate is about discovery, not footsteps.
    let rooms: string[] = [];
    const path = ['r0', 'r1', 'r0', 'r2', 'r1', 'r0', 'r2', 'r3'];
    for (const id of path) rooms = addDiscoveredRoom(rooms, id);
    expect(rooms).toEqual(['r0', 'r1', 'r2', 'r3']);
  });
});
