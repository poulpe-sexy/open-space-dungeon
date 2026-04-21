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
import { HeroPortrait } from './HeroPortrait';
import { TileSprite } from './TileSprite';

const TIER_SFX: Record<1 | 2 | 3, SfxKey> = {
  1: 'hit-light',
  2: 'hit-medium',
  3: 'hit-heavy',
};

type LogLine = { kind: 'player' | 'enemy' | 'info'; text: string };
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

/**
 * Renders an enemy portrait. If the enemy has a `portrait` PNG path we try to
 * load it; on 404 or any load error we fall back to the generic `TileSprite`
 * silhouette — so shipping without the PNG is non-blocking (the game still
 * runs, the silhouette just shows instead).
 */
function EnemyPortrait({
  portrait,
  altText,
  fallbackKind,
}: {
  portrait?: string;
  altText: string;
  fallbackKind: 'combat' | 'boss';
}) {
  const [broken, setBroken] = useState(false);
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
  const logRef = useRef<HTMLDivElement>(null);

  // Some enemies (Orzag, the hidden boss) define an `introLine` that appears
  // as a second info line right after their reveal. Completely optional — the
  // base 8 enemies leave it unset and nothing changes.
  useEffect(() => {
    if (!enemy) return;
    setEnemyHp(enemy.stats.hp);
    const opening: LogLine[] = [
      { kind: 'info', text: `${enemy.name} apparaît. ${enemy.description}` },
    ];
    if (enemy.introLine) opening.push({ kind: 'info', text: enemy.introLine });
    setLog(opening);
    setTurn('player');
  }, [enemy, pending?.screenId, pending?.encounter.x, pending?.encounter.y]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  // Enemy auto-play
  useEffect(() => {
    if (turn !== 'enemy' || !enemy) return;
    const t = setTimeout(() => {
      const dmg = rollEnemyDamage(enemy.stats.atk);
      const attackName = pickRandom(enemy.attackNames);
      const newHp = Math.max(0, store.get().hp - dmg);
      audio.playSfx('hit-light');
      store.set({ hp: newHp });
      setLog((l) => [
        ...l,
        {
          kind: 'enemy',
          text: `${enemy.name} lance "${attackName}" — ${dmg} dégâts.`,
        },
      ]);
      if (newHp <= 0) {
        audio.playSfx('fail');
        setTurn('done');
        setLog((l) => [...l, { kind: 'info', text: "Tu t'effondres. Fin de run." }]);
        setTimeout(() => {
          store.set({ phase: 'defeat', pending: null });
          bus.emit('defeat', undefined);
        }, 900);
      } else {
        setTurn('player');
      }
    }, 700);
    return () => clearTimeout(t);
  }, [turn, enemy]);

  if (!pending || !enemy || !hero) return null;

  // Guard against data-authoring mistakes: if a hero references an unknown
  // attack ID, skip it instead of crashing on an undefined Attack.
  const attacks = hero.attacks
    .map((id) => ATTACKS[id])
    .filter((a): a is Attack => Boolean(a));

  const playAttack = (atk: Attack) => {
    if (turn !== 'player') return;
    if (mp < atk.cost) return;

    const dmg = rollHeroDamage(atk, hero.stats.atk, hero.stats.mag);
    const newEnemyHp = Math.max(0, enemyHp - dmg);
    audio.playSfx(TIER_SFX[atk.tier]);
    setEnemyHp(newEnemyHp);

    const newMp = Math.max(0, mp - atk.cost);
    store.set({ mp: newMp });

    setLog((l) => [
      ...l,
      {
        kind: 'player',
        text: `${hero.name} utilise ${atk.name} — ${dmg} dégâts${atk.cost ? ` (-${atk.cost} MP)` : ''}.`,
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

      if (result.levelsGained > 0) {
        // Small celebratory fanfare that layers on top of the hit 'success'.
        audio.playSfx('level-up');
      }

      const key = encounterKey(pending.screenId, pending.encounter.x, pending.encounter.y);
      setTimeout(() => {
        // Safe lookup: if screen is missing from SCREENS (stale pending state
        // after a reset, or authoring typo), treat it as a non-boss screen so
        // we fall back to the normal "resume" flow instead of crashing.
        const isBoss = SCREENS[pending.screenId]?.isBossScreen ?? false;
        const leveled = result.levelsGained > 0;
        // The secret Orzag fight uses a synthetic screenId (not in SCREENS),
        // so `isBoss` above is false. Read the current phase to decide where
        // to route: `secret-combat` → `true-victory`, boss screen → `victory`,
        // anything else → back to dungeon navigation.
        const phaseNow = store.get().phase;
        const nextPhase: typeof phaseNow =
          phaseNow === 'secret-combat' ? 'true-victory'
          : isBoss                     ? 'victory'
          :                              'dungeon';
        store.set((s) => ({
          defeatedEnemies: [...s.defeatedEnemies, key],
          pending: null,
          phase: nextPhase,
          // Leveling updates:
          hero:  result.hero,
          level: result.level,
          xp:    result.xp,
          maxHp: result.maxHp,
          maxMp: result.maxMp,
          // Level-up full heal; otherwise no passive combat healing.
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

  return (
    <div className="overlay">
      <div className="combat-stage">
        <div className="combat-side player">
          <div className="combat-name">
            {hero.name} — {hero.className} · ATK {hero.stats.atk} · MAG {hero.stats.mag}
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
            {enemy.name} · ATK {enemy.stats.atk} · MAG {enemy.stats.mag} · {enemy.difficulty}
          </div>
          <div className="combat-portrait">
            <div
              className="enemy-sprite-box"
              style={{
                '--enemy-color': `#${enemy.color.toString(16).padStart(6, '0')}`,
              } as React.CSSProperties}
            >
              <EnemyPortrait
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
        {attacks.map((atk) => (
          <button
            key={atk.id}
            type="button"
            disabled={turn !== 'player' || mp < atk.cost}
            onClick={() => playAttack(atk)}
            title={atk.description}
          >
            <strong>T{atk.tier} · {atk.name}</strong>
            <small>
              {atk.kind === 'physical' ? 'PHYS' : 'MAG'} ×{atk.power.toFixed(1)} · {atk.cost} MP
            </small>
            <small>{atk.description}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
