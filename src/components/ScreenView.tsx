import { SLICE_SCREENS, SLICE_ORDER } from '../data/sliceScreens';
import { ENEMIES } from '../data/enemies';
import { EVENTS } from '../data/events';
import { TRAPS } from '../data/traps';
import { PUZZLES } from '../data/puzzles';
import type { EncounterKind, ExitDirection, ScreenEncounter } from '../data/types';
import { encounterKey, store, useStore } from '../game/store';
import { audio } from '../game/audio';
import { successChance, advisorFlavor, type ResolvableKind } from '../game/resolution';
import { getZoneColor } from '../game/zoneTheme';
import { HeroPortrait } from './HeroPortrait';

// ---------------------------------------------------------------------------
// Encounter metadata helpers
// ---------------------------------------------------------------------------

const KIND_ICON: Record<EncounterKind, string> = {
  combat: '⚔',
  event:  '✉',
  trap:   '⚠',
  puzzle: '◆',
  riddle: '?',
};

const KIND_LABEL: Record<EncounterKind, string> = {
  combat: 'Combat',
  event:  'Événement',
  trap:   'Piège',
  puzzle: 'Énigme',
  riddle: 'Devinette',
};

const ACTION_LABEL: Record<EncounterKind, string> = {
  combat: 'Affronter',
  event:  'Interagir',
  trap:   'Approcher',
  puzzle: 'Réfléchir',
  riddle: 'Répondre',
};

const trunc = (str: string, n = 95) =>
  str.length > n ? str.slice(0, n) + '…' : str;

function chanceColor(pct: number): string {
  if (pct >= 67) return 'var(--ok)';
  if (pct >= 34) return 'var(--accent)';
  return 'var(--danger)';
}

const DIR_ARROW: Record<ExitDirection, string> = {
  N: '▲',
  S: '▼',
  E: '▶',
  W: '◀',
};

function encTitle(enc: ScreenEncounter): string {
  if (enc.kind === 'combat' && enc.enemyId)  return ENEMIES[enc.enemyId]?.name   ?? '???';
  if (enc.kind === 'event'  && enc.eventId)  return EVENTS[enc.eventId]?.title   ?? '???';
  if (enc.kind === 'trap'   && enc.trapId)   return TRAPS[enc.trapId]?.title     ?? '???';
  if (enc.kind === 'puzzle' && enc.puzzleId) return PUZZLES[enc.puzzleId]?.title ?? '???';
  return '???';
}

function encDesc(enc: ScreenEncounter): string {
  if (enc.kind === 'combat' && enc.enemyId) {
    const e = ENEMIES[enc.enemyId];
    if (!e) return '';
    return `${e.difficulty} · ATK ${e.stats.atk} · PV ${e.stats.hp} — ${trunc(e.description, 70)}`;
  }
  if (enc.kind === 'event'  && enc.eventId)  return trunc(EVENTS[enc.eventId]?.text  ?? '');
  if (enc.kind === 'trap'   && enc.trapId)   return trunc(TRAPS[enc.trapId]?.text    ?? '');
  if (enc.kind === 'puzzle' && enc.puzzleId) return trunc(PUZZLES[enc.puzzleId]?.text ?? '');
  return '';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScreenView() {
  const screenId        = useStore((s) => s.currentScreenId);
  const defeatedEnemies = useStore((s) => s.defeatedEnemies);
  const resolvedEvents  = useStore((s) => s.resolvedEvents);
  const keyItems        = useStore((s) => s.keyItems);
  const hero  = useStore((s) => s.hero);
  const hp    = useStore((s) => s.hp);
  const mp    = useStore((s) => s.mp);
  const maxHp = useStore((s) => s.maxHp);
  const maxMp = useStore((s) => s.maxMp);

  const screen = SLICE_SCREENS[screenId];
  if (!screen || !hero) return null;

  const zoneColor = getZoneColor(screen.zoneId);
  const stepIdx = (SLICE_ORDER as readonly string[]).indexOf(screenId);

  const isResolved = (enc: ScreenEncounter) => {
    const key = encounterKey(screenId, enc.x, enc.y);
    return enc.kind === 'combat'
      ? defeatedEnemies.includes(key)
      : resolvedEvents.includes(key);
  };

  const hasMinCleared =
    screen.encounters.length === 0 || screen.encounters.some(isResolved);

  const triggerEncounter = (enc: ScreenEncounter) => {
    if (isResolved(enc)) return;
    audio.playSfx('ui-click');
    store.set({ pending: { screenId, encounter: enc }, phase: enc.kind });
  };

  const handleNavigate = (toScreenId: string) => {
    audio.playSfx('door');
    store.set({ currentScreenId: toScreenId });
  };

  const handleVictory = () => {
    audio.playSfx('door');
    store.set({ phase: 'victory' });
  };

  return (
    <div
      className="screen-view"
      style={{ '--zone-color': zoneColor } as React.CSSProperties}
    >

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="screen-header">
        <div className="screen-header-meta">
          <span className="screen-zone retro-title">{screen.zoneId.toUpperCase()}</span>
          {stepIdx >= 0 && (
            <span className="screen-step">
              {stepIdx + 1}&thinsp;/&thinsp;{SLICE_ORDER.length}
            </span>
          )}
        </div>
        <h2 className="screen-title">{screen.title}</h2>
        <p className="screen-flavor">{screen.flavor}</p>
      </div>

      {/* ── Body: hero panel + encounter cards ─────────────────── */}
      <div className="screen-body">

        {/* Hero panel */}
        <div className="sv-hero-panel">
          <div className="sv-hero-portrait">
            <HeroPortrait hero={hero} />
          </div>
          <div className="sv-hero-name">{hero.name}</div>
          <div className="sv-hero-class">{hero.className}</div>
          <div className="sv-stat-row">
            <span className="sv-stat-label">PV</span>
            <span>{hp}/{maxHp}</span>
          </div>
          <div className="bar">
            <span style={{ width: `${maxHp === 0 ? 0 : (hp / maxHp) * 100}%` }} />
          </div>
          <div className="sv-stat-row">
            <span className="sv-stat-label">MP</span>
            <span>{mp}/{maxMp}</span>
          </div>
          <div className="bar mp">
            <span style={{ width: `${maxMp === 0 ? 0 : (mp / maxMp) * 100}%` }} />
          </div>
        </div>

        {/* Encounters */}
        <div className="sv-encounters">
          {screen.encounters.map((enc, i) => {
            const done = isResolved(enc);
            const showChance =
              !done &&
              (enc.kind === 'trap' || enc.kind === 'puzzle') &&
              !!enc.difficulty;
            const chance = showChance
              ? successChance(hero, enc.kind as ResolvableKind, enc.difficulty!)
              : null;
            return (
              <div
                key={i}
                className={`sv-encounter-card ${enc.kind}${done ? ' done' : ''}`}
              >
                <div className="sv-enc-kind">
                  <span className="sv-enc-icon">{KIND_ICON[enc.kind]}</span>
                  <span className="sv-enc-type">{KIND_LABEL[enc.kind]}</span>
                  {done && <span className="sv-enc-done">· résolu ✓</span>}
                </div>
                <div className="sv-enc-title">{encTitle(enc)}</div>
                <div className="sv-enc-desc">{encDesc(enc)}</div>
                {showChance && chance !== null && (
                  <div className="sv-enc-chance">
                    <div className="sv-enc-chance-bar">
                      <div
                        style={{
                          width:      `${chance}%`,
                          background: chanceColor(chance),
                        }}
                      />
                    </div>
                    <span
                      className="sv-enc-chance-pct"
                      style={{ color: chanceColor(chance) }}
                    >
                      {chance}% de succès
                    </span>
                    <span className="sv-enc-advisor-tip">
                      {advisorFlavor(hero, enc.kind as ResolvableKind)}
                    </span>
                  </div>
                )}
                {!done && (
                  <button
                    type="button"
                    className="sv-enc-btn"
                    onClick={() => triggerEncounter(enc)}
                  >
                    {ACTION_LABEL[enc.kind]} →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────────────── */}
      <div className="sv-footer">
        {!hasMinCleared && (
          <span className="sv-hint">
            Résous au moins une rencontre pour débloquer la sortie.
          </span>
        )}

        <div className="sv-nav-row">
          {screen.exits.length === 0 ? (
            /* Final screen — no real exit, trigger victory */
            <button
              type="button"
              className={`sv-nav-card sv-nav-end${!hasMinCleared ? ' locked' : ''}`}
              disabled={!hasMinCleared}
              onClick={handleVictory}
            >
              <span className="sv-nav-arrow">★</span>
              <span className="sv-nav-dest">Terminer le run</span>
            </button>
          ) : (
            screen.exits.map((exit, i) => {
              const needsItem = !!(exit.requiresKeyItem && !keyItems.includes(exit.requiresKeyItem));
              const locked    = !hasMinCleared || needsItem;
              const destTitle = SLICE_SCREENS[exit.toScreen]?.title ?? exit.toScreen;
              const arrow     = DIR_ARROW[exit.direction ?? 'E'];
              return (
                <button
                  key={i}
                  type="button"
                  className={`sv-nav-card${locked ? ' locked' : ''}`}
                  disabled={locked}
                  onClick={() => handleNavigate(exit.toScreen)}
                  title={needsItem ? `Objet requis : ${exit.requiresKeyItem}` : undefined}
                >
                  <span className="sv-nav-arrow">{arrow}</span>
                  <span className="sv-nav-dest">{destTitle}</span>
                  {needsItem && <span className="sv-nav-lock">🔒</span>}
                </button>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
