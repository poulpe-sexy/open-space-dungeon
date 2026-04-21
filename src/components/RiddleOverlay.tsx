import { useMemo, useState } from 'react';
import { RIDDLES } from '../data/riddles';
import { REWARD_ITEMS } from '../data/rewardItems';
import type { RewardItem } from '../data/types';
import { bus } from '../game/bus';
import { audio } from '../game/audio';
import { applyRewardItem } from '../game/riddles';
import { encounterKey, store, useStore } from '../game/store';
import { HeroPortrait } from './HeroPortrait';

/**
 * RiddleOverlay — multiple-choice lean-tech devinettes.
 *
 * Single-hero game: the active hero answers. No character-picker step.
 * On success the hero gains a reward item (+1 ATK / +1 MAG / +2 maxHp, etc.).
 * On failure: short neutral line, no penalty, no XP — combat is the only
 * XP source.
 */
export function RiddleOverlay() {
  const pending = useStore((s) => s.pending);
  const hero    = useStore((s) => s.hero);

  const riddle = useMemo(
    () => (pending?.encounter.riddleId ? RIDDLES[pending.encounter.riddleId] : null),
    [pending?.encounter.riddleId],
  );

  const [answer, setAnswer] = useState<number | null>(null);
  const [awarded, setAwarded] = useState<RewardItem | null>(null);

  if (!pending || !riddle || !hero) return null;

  const pickAnswer = (idx: number) => {
    if (answer !== null) return; // already answered, wait for "Continuer"
    setAnswer(idx);
    const correct = idx === riddle.correctIndex;
    if (correct) {
      const item = REWARD_ITEMS[riddle.rewardItemId];
      if (item) {
        setAwarded(item);
        audio.playSfx('success');
      } else {
        audio.playSfx('ui-click');
      }
    } else {
      audio.playSfx('fail');
    }
  };

  const close = () => {
    const s = store.get();
    const key = encounterKey(pending.screenId, pending.encounter.x, pending.encounter.y);
    const correct = answer === riddle.correctIndex;

    if (correct && awarded && s.hero && !s.rewardItems.includes(awarded.id)) {
      // Bake the bonus into the active hero + patch maxHp/maxMp + heal by the delta.
      const r = applyRewardItem(s.hero, s.maxHp, s.maxMp, awarded.id);
      if (r) {
        store.set((st) => ({
          hero:  r.hero,
          maxHp: r.maxHp,
          maxMp: r.maxMp,
          hp:    Math.min(r.maxHp, st.hp + r.hpHealed),
          mp:    Math.min(r.maxMp, st.mp + r.mpHealed),
          rewardItems: [...st.rewardItems, awarded.id],
          resolvedEvents: [...st.resolvedEvents, key],
          pending: null,
          phase: 'dungeon',
        }));
        bus.emit('resume', undefined);
        return;
      }
    }

    // Failure OR couldn't apply the item — still close cleanly.
    store.set((st) => ({
      resolvedEvents: [...st.resolvedEvents, key],
      pending: null,
      phase: 'dungeon',
    }));
    bus.emit('resume', undefined);
  };

  const answered = answer !== null;
  const correct  = answer === riddle.correctIndex;

  return (
    <div className="overlay">
      <div className="riddle-panel">
        <div className="riddle-topic">◇ {riddle.topic}</div>
        <h3 className="riddle-title">Devinette</h3>

        <div className="riddle-respondent">
          <div className="riddle-respondent-thumb">
            <HeroPortrait hero={hero} />
          </div>
          <span>{hero.name} réfléchit…</span>
        </div>

        <p className="riddle-prompt">« {riddle.prompt} »</p>

        <div className="riddle-choices">
          {riddle.choices.map((label, i) => {
            const isCorrectRow = i === riddle.correctIndex;
            const isPicked     = i === answer;
            const cls = [
              'riddle-choice',
              answered && isCorrectRow ? 'is-correct' : '',
              answered && isPicked && !isCorrectRow ? 'is-wrong' : '',
              answered && !isPicked && !isCorrectRow ? 'is-dim' : '',
            ].filter(Boolean).join(' ');
            return (
              <button
                key={i}
                type="button"
                className={cls}
                disabled={answered}
                onClick={() => pickAnswer(i)}
              >
                {label}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={`riddle-feedback ${correct ? 'ok' : 'nope'}`}>
            {correct ? riddle.successText : riddle.failText}
          </div>
        )}

        {answered && correct && awarded && (
          <div className="riddle-reward" title={awarded.description}>
            <span className="riddle-reward-glyph">{awarded.glyph}</span>
            <div className="riddle-reward-body">
              <strong>{awarded.name}</strong>
              <small>{awarded.description}</small>
              <small className="riddle-reward-bonus">{formatBonus(awarded)}</small>
            </div>
          </div>
        )}

        {answered && (
          <button type="button" className="riddle-close" onClick={close}>
            Continuer
          </button>
        )}
      </div>
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────────────────────

function formatBonus(item: RewardItem): string {
  const parts: string[] = [];
  if (item.bonus.atk)   parts.push(`+${item.bonus.atk} ATK`);
  if (item.bonus.mag)   parts.push(`+${item.bonus.mag} MAG`);
  if (item.bonus.maxHp) parts.push(`+${item.bonus.maxHp} PV max`);
  if (item.bonus.maxMp) parts.push(`+${item.bonus.maxMp} MP max`);
  return parts.length ? `Bonus : ${parts.join(' · ')}` : '';
}
