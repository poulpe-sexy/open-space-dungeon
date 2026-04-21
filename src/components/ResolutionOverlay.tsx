import { useState, useRef } from 'react';
import { TRAPS }   from '../data/traps';
import { PUZZLES } from '../data/puzzles';
import { audio }   from '../game/audio';
import { encounterKey, store, useStore } from '../game/store';
import {
  resolve,
  successChance,
  advisorFlavor,
  type ResolutionGrade,
  type ResolutionResult,
  type ResolvableKind,
} from '../game/resolution';
import type { Difficulty } from '../data/types';

// ── Grade presentation ────────────────────────────────────────────────────────

const GRADE_LABEL: Record<ResolutionGrade, string> = {
  critical: 'SUCCÈS CRITIQUE  ✦',
  success:  'SUCCÈS  ✓',
  failure:  'ÉCHEC',
  severe:   'ÉCHEC SÉVÈRE  ✗',
};

// ── Helper: colour for a success-chance percentage ────────────────────────────
function chanceColor(pct: number): string {
  if (pct >= 67) return 'var(--ok)';
  if (pct >= 34) return 'var(--accent)';
  return 'var(--danger)';
}

// ── Helper: readable effect line ("+ 2 PV, − 1 MP") ─────────────────────────
function effectText(hp: number, mp: number): string {
  const parts: string[] = [];
  if (hp > 0) parts.push(`+${hp} PV`);
  if (hp < 0) parts.push(`${hp} PV`);
  if (mp > 0) parts.push(`+${mp} MP`);
  if (mp < 0) parts.push(`${mp} MP`);
  return parts.length ? parts.join('  ·  ') : 'Aucun effet sur les stats.';
}

// ── Kind labels ───────────────────────────────────────────────────────────────
const KIND_ICON  = { trap: '⚠', puzzle: '◆' } as Record<string, string>;
const KIND_LABEL = { trap: 'Piège', puzzle: 'Énigme' } as Record<string, string>;

// ── Roll phase ────────────────────────────────────────────────────────────────
type RollPhase = 'idle' | 'rolling' | 'result';

// =============================================================================

export function ResolutionOverlay() {
  const pending = useStore((s) => s.pending);
  const hero    = useStore((s) => s.hero);
  const hp      = useStore((s) => s.hp);
  const mp      = useStore((s) => s.mp);
  const maxHp   = useStore((s) => s.maxHp);
  const maxMp   = useStore((s) => s.maxMp);

  const [rollPhase,   setRollPhase]   = useState<RollPhase>('idle');
  const [displayRoll, setDisplayRoll] = useState<number>(1);
  const [result,      setResult]      = useState<ResolutionResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!pending || !hero) return null;

  const enc        = pending.encounter;
  const difficulty = (enc.difficulty ?? 'normal') as Difficulty;
  // This overlay only ever runs for trap/puzzle phases — riddles have their own overlay.
  const kind       = enc.kind as ResolvableKind;
  const chance     = successChance(hero, kind, difficulty);
  const flavor     = advisorFlavor(hero, kind);

  // Encounter text from data tables
  const encTitle = enc.kind === 'trap'   && enc.trapId   ? TRAPS[enc.trapId]?.title
                 : enc.kind === 'puzzle' && enc.puzzleId ? PUZZLES[enc.puzzleId]?.title
                 : '???';
  const encText  = enc.kind === 'trap'   && enc.trapId   ? TRAPS[enc.trapId]?.text
                 : enc.kind === 'puzzle' && enc.puzzleId ? PUZZLES[enc.puzzleId]?.text
                 : '';

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleRoll = () => {
    if (rollPhase !== 'idle') return;
    audio.playSfx('ui-click');

    // Pre-compute the result so the animation converges to the right number
    const r = resolve(hero, kind, difficulty);
    setResult(r);
    setRollPhase('rolling');

    let elapsed = 0;
    timerRef.current = setInterval(() => {
      setDisplayRoll(Math.floor(Math.random() * 6) + 1);
      elapsed += 80;
      if (elapsed >= 720) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        setDisplayRoll(r.roll);
        setRollPhase('result');
        if (r.grade === 'critical' || r.grade === 'success') audio.playSfx('success');
        else if (r.grade === 'severe')                        audio.playSfx('fail');
        else                                                  audio.playSfx('ui-click');
      }
    }, 80);
  };

  const handleContinue = () => {
    if (!result) return;
    const key   = encounterKey(pending.screenId, enc.x, enc.y);
    const newHp = Math.max(0, Math.min(maxHp, hp + result.hpDelta));
    const newMp = Math.max(0, Math.min(maxMp, mp + result.mpDelta));
    store.set((s) => ({
      hp: newHp,
      mp: newMp,
      resolvedEvents: [...s.resolvedEvents, key],
      pending: null,
      phase: 'dungeon',
    }));
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="overlay ro-overlay">
      <div className="ro-panel">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="ro-header">
          <span className="ro-kind-badge">
            {KIND_ICON[enc.kind] ?? '?'}&ensp;
            {KIND_LABEL[enc.kind] ?? enc.kind.toUpperCase()}
          </span>
          <h3 className="ro-title">{encTitle}</h3>
          <p className="ro-flavor">{encText}</p>
        </div>

        {/* ── Advisor (idle + rolling only) ──────────────────────── */}
        {rollPhase !== 'result' && (
          <div className="ro-advisor">
            <div className="ro-chance-row">
              <span className="ro-chance-label">Chances de succès</span>
              <span
                className="ro-chance-pct"
                style={{ color: chanceColor(chance) }}
              >
                {chance}&thinsp;%
              </span>
            </div>
            <div className="ro-chance-bar">
              <div
                className="ro-chance-fill"
                style={{
                  width:      `${chance}%`,
                  background: chanceColor(chance),
                }}
              />
            </div>
            <p className="ro-advisor-tip">{flavor}</p>
          </div>
        )}

        {/* ── Dice display ────────────────────────────────────────── */}
        <div className="ro-dice-row">
          <div
            className={[
              'ro-dice',
              rollPhase === 'idle'    ? 'ro-dice-idle'    : '',
              rollPhase === 'rolling' ? 'ro-dice-rolling' : '',
              rollPhase === 'result'  ? 'ro-dice-done'    : '',
            ].join(' ').trim()}
          >
            {rollPhase === 'idle' ? '🎲' : displayRoll}
          </div>

          {rollPhase !== 'idle' && result && (
            <div className="ro-dice-math">
              <span className="ro-dice-roll">{displayRoll}</span>
              <span className="ro-dice-op"> + </span>
              <span className="ro-dice-bonus">{result.bonus}</span>
              <span className="ro-dice-op"> = </span>
              <span className="ro-dice-total">{displayRoll + result.bonus}</span>
              {rollPhase === 'result' && (
                <span className="ro-dice-vs">
                  &ensp;·&ensp;seuil&nbsp;{result.threshold}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Result block ────────────────────────────────────────── */}
        {rollPhase === 'result' && result && (
          <div className={`ro-result ro-result-${result.grade}`}>
            <div className="ro-grade-label">
              {GRADE_LABEL[result.grade]}
            </div>
            <p className="ro-narrative">{result.narrative}</p>
            <div className={`ro-effect ${result.hpDelta < 0 || result.mpDelta < 0 ? 'ro-effect-bad' : result.hpDelta > 0 || result.mpDelta > 0 ? 'ro-effect-good' : ''}`}>
              {effectText(result.hpDelta, result.mpDelta)}
            </div>
          </div>
        )}

        {/* ── Action buttons ──────────────────────────────────────── */}
        <div className="ro-actions">
          {rollPhase === 'idle' && (
            <button type="button" className="ro-btn ro-btn-roll" onClick={handleRoll}>
              Tenter l'épreuve →
            </button>
          )}
          {rollPhase === 'rolling' && (
            <button type="button" className="ro-btn ro-btn-roll" disabled>
              Résolution en cours…
            </button>
          )}
          {rollPhase === 'result' && (
            <button type="button" className="ro-btn ro-btn-continue" onClick={handleContinue}>
              Continuer →
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
