import { useEffect, useMemo, useRef, useState } from 'react';
import { ATTACKS } from '../data/attacks';
import { ENEMIES } from '../data/enemies';
import { SCREENS } from '../data/screens';
import type { Attack } from '../data/types';
import { bus } from '../game/bus';
import { audio } from '../game/audio';
import type { SfxKey } from '../game/audio';
import { encounterKey, store, useStore } from '../game/store';
import { applyXpGain, STAT_GAIN_PER_LEVEL } from '../game/leveling';
import { ENEMY_FRAMES } from '../game/assets';
import { HeroPortrait } from './HeroPortrait';
import { TileSprite } from './TileSprite';
import { AnimatedSprite } from './AnimatedSprite';

const TIER_SFX: Record<1 | 2 | 3, SfxKey> = {
  1: 'hit-light',
  2: 'hit-medium',
  3: 'hit-heavy',
};

type LogLine = { kind: 'player' | 'enemy' | 'info' | 'special'; text: string };
type Turn = 'player' | 'enemy' | 'done';

const jitter = () => 0.9 + Math.random() * 0.2; // ±10%

/** Damage formula: power × relevant stat × small jitter. */
const rollHeroDamage = (atk: Attack, atkStat: number, magStat: number) => {
  const base = atk.kind === 'physical' ? atkStat : magStat;
  return Math.max(1, Math.round(atk.power * base * jitter()));
};

const rollEnemyDamage = (enemyAtk: number) =>
  Math.max(1, Math.round(enemyAtk * jitter()));

const pickRandom = <T,>(arr: readonly T[]) =>
  arr[Math.floor(Math.random() * arr.length)];

/** Human-readable badge label for each special kind. */
function specialLabel(special: NonNullable<(typeof ENEMIES)[string]['special']>): string {
  switch (special.kind) {
    case 'armor':      return `🛡 Armure −${special.reduction}`;
    case 'buff_self':  return `⬆ Frappe toutes les ${special.every} actions`;
    case 'debuff_atk': return `⬇ Sape ton ATK`;
    case 'debuff_mag': return `⬇ Brouille ta MAG`;
    case 'drain_hp':   return `🩸 Drain PV`;
    case 'alternate':  return `⚡ Imprévisible`;
  }
}

/**
 * Renders an enemy portrait.
 * Priority: animated sprite frames from ENEMY_FRAMES (asset pack PNGs) →
 * static portrait PNG (e.g. Orzag) → generic TileSprite silhouette.
 */
function EnemyPortrait({
  enemyId,
  portrait,
  altText,
  fallbackKind,
}: {
  enemyId: string;
  portrait?: string;
  altText: string;
  fallbackKind: 'combat' | 'boss';
}) {
  const [broken, setBroken] = useState(false);

  // Asset-pack enemies have a 4-frame animation registered in ENEMY_FRAMES.
  const frames = ENEMY_FRAMES[enemyId];
  if (frames?.length) {
    return (
      <AnimatedSprite
        frames={frames}
        fps={6}
        size={64}
        style={{ imageRendering: 'pixelated' }}
      />
    );
  }

  // Static portrait PNG (Orzag etc.)
  if (portrait && !broken) {
    return (
      <img
        src={portrait}
        alt={altText}
        className="enemy-portrait-img"
        onError={() => setBroken(true)}
        draggable={false}
      />
    );
  }

  // Generic fallback: animated TileSprite silhouette tinted by enemy color.
  return <TileSprite kind={fallbackKind} size={64} />;
}

export function CombatOverlay() {
  const pending = useStore((s) => s.pending);
  const hero = useStore((s) => s.hero);
  const hp = useStore((s) => s.hp);
  const mp = useStore((s) => s.mp);
  const maxHp = useStore((s) => s.maxHp);
  const maxMp = useStore((s) => s.maxMp);

  const enemy = useMemo(
    () => (pending?.encounter.enemyId ? ENEMIES[pending.encounter.enemyId] : null),
    [pending?.encounter.enemyId],
  );

  const [enemyHp, setEnemyHp] = useState(enemy?.stats.hp ?? 0);
  const [enemyMaxHp] = useState(enemy?.stats.hp ?? 1);
  const [log, setLog] = useState<LogLine[]>([]);
  const [turn, setTurn] = useState<Turn>('player');

  // ── Special-ability modifiers (local to this fight) ─────────────────────
  // We use refs for the "live" values (mutated during enemy turns without
  // triggering effect re-runs) and matching state vars for UI display.
  const enemyTurnCountRef = useRef(0);
  const enemyAtkBonusRef  = useRef(0);
  const heroAtkModRef     = useRef(0);
  const heroMagModRef     = useRef(0);

  const [enemyAtkBonus, setEnemyAtkBonus] = useState(0);
  const [heroAtkMod,    setHeroAtkMod]    = useState(0);
  const [heroMagMod,    setHeroMagMod]    = useState(0);

  // ── T3 cooldown tracking ─────────────────────────────────────────────────
  // cooldownsRef: live values mutated during enemy turns — avoids stale-closure
  // re-trigger on the enemy-turn effect. attackCooldowns: synced state for UI.
  // Format: { [attackId]: remainingEnemyTurns }  (absent = 0 = available)
  const cooldownsRef = useRef<Record<string, number>>({});
  const [attackCooldowns, setAttackCooldowns] = useState<Record<string, number>>({});

  const logRef = useRef<HTMLDivElement>(null);

  // ── Reset on new combat ──────────────────────────────────────────────────
  useEffect(() => {
    if (!enemy) return;
    setEnemyHp(enemy.stats.hp);
    // Reset all modifiers
    enemyTurnCountRef.current = 0;
    enemyAtkBonusRef.current  = 0;
    heroAtkModRef.current     = 0;
    heroMagModRef.current     = 0;
    setEnemyAtkBonus(0);
    setHeroAtkMod(0);
    setHeroMagMod(0);
    // Reset cooldowns
    cooldownsRef.current = {};
    setAttackCooldowns({});

    const opening: LogLine[] = [
      { kind: 'info', text: `${enemy.name} apparaît. ${enemy.description}` },
    ];
    if (enemy.introLine) opening.push({ kind: 'info', text: enemy.introLine });
    if (enemy.special) {
      opening.push({ kind: 'special', text: `⚡ Capacité spéciale : ${specialLabel(enemy.special)}` });
    }
    setLog(opening);
    setTurn('player');
  }, [enemy, pending?.screenId, pending?.encounter.x, pending?.encounter.y]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  // ── Enemy auto-play (with special abilities) ─────────────────────────────
  // Dependency array stays [turn, enemy] — modifiers are read from refs so
  // their updates don't re-trigger this effect mid-combat.
  useEffect(() => {
    if (turn !== 'enemy' || !enemy) return;
    const t = setTimeout(() => {
      // ── Decrement T3 cooldowns at the start of every enemy turn ──────────
      // This runs unconditionally (regardless of what the enemy does), so the
      // cooldown correctly ticks down even on idle/passive turns.
      const newCooldowns: Record<string, number> = {};
      for (const [id, cd] of Object.entries(cooldownsRef.current)) {
        const next = cd - 1;
        if (next > 0) newCooldowns[id] = next;
        // cd <= 1 → attack is available again; drop from map (no entry = 0 = unlocked)
      }
      cooldownsRef.current = newCooldowns;
      setAttackCooldowns({ ...newCooldowns });

      enemyTurnCountRef.current += 1;
      const turnCount = enemyTurnCountRef.current;
      const sp = enemy.special;
      const newLines: LogLine[] = [];

      // ── 1. buff_self: enemy ATK increases every `every` enemy turns ──────
      if (sp?.kind === 'buff_self' && turnCount % sp.every === 0) {
        enemyAtkBonusRef.current += sp.atkBonus;
        setEnemyAtkBonus(enemyAtkBonusRef.current);
        newLines.push({
          kind: 'special',
          text: `⬆ ${enemy.name} se galvanise ! ATK +${sp.atkBonus} (total +${enemyAtkBonusRef.current}).`,
        });
      }

      // ── 2. debuff_atk: hero effective ATK decreases every `every` turns ──
      if (sp?.kind === 'debuff_atk' && turnCount % sp.every === 0) {
        heroAtkModRef.current -= sp.amount;
        setHeroAtkMod(heroAtkModRef.current);
        newLines.push({
          kind: 'special',
          text: `⬇ ${enemy.name} sape ta conviction — ATK −${sp.amount}.`,
        });
      }

      // ── 3. debuff_mag: hero effective MAG decreases every `every` turns ──
      if (sp?.kind === 'debuff_mag' && turnCount % sp.every === 0) {
        heroMagModRef.current -= sp.amount;
        setHeroMagMod(heroMagModRef.current);
        newLines.push({
          kind: 'special',
          text: `⬇ ${enemy.name} brouille tes sortilèges — MAG −${sp.amount}.`,
        });
      }

      // ── 4. drain_hp: direct HP drain every `every` turns ─────────────────
      if (sp?.kind === 'drain_hp' && turnCount % sp.every === 0) {
        const currentHp = store.get().hp;
        const drained = Math.min(sp.amount, currentHp);
        const newHpAfterDrain = currentHp - drained;
        store.set({ hp: newHpAfterDrain });
        newLines.push({
          kind: 'special',
          text: `🩸 ${enemy.name} draine ${drained} PV directement.`,
        });
        if (newHpAfterDrain <= 0) {
          audio.playSfx('fail');
          setTurn('done');
          setLog((l) => [
            ...l, ...newLines,
            { kind: 'info', text: "Tu t'effondres. Fin de run." },
          ]);
          setTimeout(() => {
            store.set({ phase: 'defeat', pending: null });
            bus.emit('defeat', undefined);
          }, 900);
          return;
        }
      }

      // ── 5. alternate: passive turns skip the attack ───────────────────────
      if (sp?.kind === 'alternate') {
        const isIdle = turnCount % (sp.idleTurns + 1) !== 0;
        if (isIdle) {
          newLines.push({
            kind: 'enemy',
            text: `${enemy.name} t'observe en silence. (Attention au prochain tour.)`,
          });
          setLog((l) => [...l, ...newLines]);
          setTurn('player');
          return;
        }
      }

      // ── Normal attack (or alternate burst) ───────────────────────────────
      const isBurst = sp?.kind === 'alternate';
      const effectiveAtk = enemy.stats.atk + enemyAtkBonusRef.current;
      const rawDmg = rollEnemyDamage(effectiveAtk);
      const dmg = isBurst ? rawDmg * 2 : rawDmg;
      const attackName = pickRandom(enemy.attackNames);
      const newHp = Math.max(0, store.get().hp - dmg);
      audio.playSfx('hit-light');
      store.set({ hp: newHp });

      const attackText = isBurst
        ? `💥 ${enemy.name} libère toute sa rage — "${attackName}" — ${dmg} dégâts (×2) !`
        : `${enemy.name} lance "${attackName}" — ${dmg} dégâts.`;
      newLines.push({ kind: 'enemy', text: attackText });

      if (newHp <= 0) {
        audio.playSfx('fail');
        setTurn('done');
        setLog((l) => [
          ...l, ...newLines,
          { kind: 'info', text: "Tu t'effondres. Fin de run." },
        ]);
        setTimeout(() => {
          store.set({ phase: 'defeat', pending: null });
          bus.emit('defeat', undefined);
        }, 900);
      } else {
        setLog((l) => [...l, ...newLines]);
        setTurn('player');
      }
    }, 700);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, enemy]);

  if (!pending || !enemy || !hero) return null;

  // Guard against data-authoring mistakes: if a hero references an unknown
  // attack ID, skip it instead of crashing on an undefined Attack.
  const attacks = hero.attacks
    .map((id) => ATTACKS[id])
    .filter((a): a is Attack => Boolean(a));

  // ── Effective hero stats (debuffs applied in-combat only) ──────────────
  const effectiveAtk = Math.max(1, hero.stats.atk + heroAtkMod);
  const effectiveMag = Math.max(0, hero.stats.mag + heroMagMod);

  const playAttack = (atk: Attack) => {
    if (turn !== 'player') return;
    if (mp < atk.cost) return;
    // T3 locked during cooldown
    const cd = cooldownsRef.current[atk.id] ?? 0;
    if (cd > 0) return;

    const rawDmg  = rollHeroDamage(atk, effectiveAtk, effectiveMag);
    // armor: flat reduction per hit (min 1 always)
    const armorRed = enemy.special?.kind === 'armor' ? enemy.special.reduction : 0;
    const dmg      = Math.max(1, rawDmg - armorRed);
    const newEnemyHp = Math.max(0, enemyHp - dmg);
    audio.playSfx(TIER_SFX[atk.tier]);
    setEnemyHp(newEnemyHp);

    // MP cost (may be 0 for T1)
    const newMp = Math.max(0, mp - atk.cost);
    // MP recovery: T1 attacks give back mpGain (capped to maxMp)
    const recovered = atk.mpGain ?? 0;
    const finalMp = Math.min(maxMp, newMp + recovered);
    store.set({ mp: finalMp });

    // Set cooldown for T3 attacks
    if (atk.cooldown) {
      const updated = { ...cooldownsRef.current, [atk.id]: atk.cooldown };
      cooldownsRef.current = updated;
      setAttackCooldowns({ ...updated });
    }

    // Build log line
    const armorNote   = armorRed > 0 ? ` (armure −${armorRed})` : '';
    const costNote    = atk.cost    ? ` (−${atk.cost} MP)` : '';
    const recoverNote = recovered   ? ` (+${recovered} MP)` : '';
    const cdNote      = atk.cooldown ? ` [recharge ${atk.cooldown}]` : '';
    setLog((l) => [
      ...l,
      {
        kind: 'player',
        text: `${hero.name} utilise ${atk.name} — ${dmg} dégâts${armorNote}${costNote}${recoverNote}${cdNote}.`,
      },
    ]);

    if (newEnemyHp <= 0) {
      audio.playSfx('success');
      setTurn('done');

      // ── Apply XP & chained level-ups ─────────────────────────────────────
      const s0 = store.get();
      const result = applyXpGain(
        s0.hero!,
        s0.level,
        s0.xp,
        s0.maxHp,
        s0.maxMp,
        enemy.rewardXp,
      );

      setLog((l) => {
        const lines: LogLine[] = [
          ...l,
          { kind: 'info', text: `${enemy.name} est neutralisé. +${enemy.rewardXp} XP.` },
        ];
        if (result.levelsGained > 0) {
          lines.push({
            kind: 'info',
            text:
              `✦ NIVEAU ${result.level} ! ` +
              `ATK +${result.levelsGained * STAT_GAIN_PER_LEVEL.atk}, ` +
              `MAG +${result.levelsGained * STAT_GAIN_PER_LEVEL.mag}, ` +
              `PV +${result.levelsGained * STAT_GAIN_PER_LEVEL.hp}. ` +
              `PV & MP entièrement restaurés !`,
          });
        }
        return lines;
      });

      if (result.levelsGained > 0) audio.playSfx('level-up');

      const key = encounterKey(pending.screenId, pending.encounter.x, pending.encounter.y);
      setTimeout(() => {
        const isBoss = SCREENS[pending.screenId]?.isBossScreen ?? false;
        const leveled = result.levelsGained > 0;
        const phaseNow = store.get().phase;
        const nextPhase: typeof phaseNow =
          phaseNow === 'secret-combat' ? 'true-victory'
          : isBoss                     ? 'victory'
          :                              'dungeon';
        store.set((s) => ({
          defeatedEnemies: [...s.defeatedEnemies, key],
          pending: null,
          phase: nextPhase,
          hero:  result.hero,
          level: result.level,
          xp:    result.xp,
          maxHp: result.maxHp,
          maxMp: result.maxMp,
          hp:    leveled ? result.maxHp : s.hp,
          mp:    leveled ? result.maxMp : s.mp,
        }));
        if (nextPhase === 'victory' || nextPhase === 'true-victory') {
          bus.emit('victory', undefined);
        } else {
          bus.emit('resume', undefined);
        }
      }, 900);
    } else {
      setTurn('enemy');
    }
  };

  const atkDebuffed = heroAtkMod < 0;
  const magDebuffed = heroMagMod < 0;
  const atkBoosted  = enemyAtkBonus > 0;

  return (
    <div className="overlay">
      <div className="combat-stage">
        <div className="combat-side player">
          <div className="combat-name">
            {hero.name} — {hero.className}
            {' · ATK '}
            <span className={atkDebuffed ? 'combat-stat-debuff' : ''}>
              {effectiveAtk}{atkDebuffed ? ` (${heroAtkMod})` : ''}
            </span>
            {' · MAG '}
            <span className={magDebuffed ? 'combat-stat-debuff' : ''}>
              {effectiveMag}{magDebuffed ? ` (${heroMagMod})` : ''}
            </span>
          </div>
          <div className="combat-portrait">
            <HeroPortrait hero={hero} />
          </div>
          <div>PV {hp}/{maxHp}</div>
          <div className="bar"><span style={{ width: `${(hp / maxHp) * 100}%` }} /></div>
          <div>MP {mp}/{maxMp}</div>
          <div className="bar mp"><span style={{ width: `${maxMp === 0 ? 0 : (mp / maxMp) * 100}%` }} /></div>
        </div>
        <div className="combat-side enemy">
          <div className="combat-name">
            {enemy.name}
            {' · ATK '}
            <span className={atkBoosted ? 'combat-stat-buff' : ''}>
              {enemy.stats.atk + enemyAtkBonus}{atkBoosted ? ` (+${enemyAtkBonus})` : ''}
            </span>
            {' · '}{enemy.difficulty}
          </div>
          {enemy.special && (
            <div className="combat-special-badge">{specialLabel(enemy.special)}</div>
          )}
          <div className="combat-portrait">
            <div
              className="enemy-sprite-box"
              style={{
                '--enemy-color': `#${enemy.color.toString(16).padStart(6, '0')}`,
              } as React.CSSProperties}
            >
              <EnemyPortrait
                enemyId={enemy.id}
                portrait={enemy.portrait}
                altText={enemy.name}
                fallbackKind={enemy.difficulty === 'boss' ? 'boss' : 'combat'}
              />
            </div>
          </div>
          <div>{enemy.description}</div>
          <div className="bar">
            <span
              style={{
                width: `${(enemyHp / enemyMaxHp) * 100}%`,
                background: '#ff5a5a',
              }}
            />
          </div>
          <div>PV {enemyHp}/{enemyMaxHp}</div>
        </div>
      </div>

      <div className="combat-log" ref={logRef}>
        {log.map((l, i) => (
          <div key={i} className={`line ${l.kind}`}>› {l.text}</div>
        ))}
      </div>

      <div className="combat-actions">
        {attacks.map((atk) => {
          const cd = attackCooldowns[atk.id] ?? 0;
          const locked = cd > 0;
          return (
            <button
              key={atk.id}
              type="button"
              disabled={turn !== 'player' || mp < atk.cost || locked}
              onClick={() => playAttack(atk)}
              title={atk.description}
              className={locked ? 'attack-on-cooldown' : undefined}
            >
              <strong>T{atk.tier} · {atk.name}</strong>
              <small>
                {atk.kind === 'physical' ? 'PHYS' : 'MAG'} ×{atk.power.toFixed(1)}
                {' · '}{atk.cost} MP
                {atk.mpGain ? ` · +${atk.mpGain} MP` : ''}
                {locked
                  ? ` · ⏳ Recharge : ${cd}`
                  : atk.cooldown
                    ? ` · CD ${atk.cooldown}`
                    : ''}
              </small>
              <small>{atk.description}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}
