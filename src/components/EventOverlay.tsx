import { useMemo } from 'react';
import { EVENTS } from '../data/events';
import { TRAPS } from '../data/traps';
import { PUZZLES } from '../data/puzzles';
import type { EventChoice, EventDef, ScreenEncounter } from '../data/types';
import { bus } from '../game/bus';
import { audio } from '../game/audio';
import { encounterKey, store, useStore } from '../game/store';

const resolveEncounterDef = (enc: ScreenEncounter | undefined): EventDef | null => {
  if (!enc) return null;
  if (enc.kind === 'trap' && enc.trapId) return TRAPS[enc.trapId] ?? null;
  if (enc.kind === 'puzzle' && enc.puzzleId) return PUZZLES[enc.puzzleId] ?? null;
  if (enc.kind === 'event' && enc.eventId) return EVENTS[enc.eventId] ?? null;
  return null;
};

const TITLE_PREFIX: Record<string, string> = {
  trap: '⚠ PIÈGE — ',
  puzzle: '◆ ÉNIGME — ',
};

export function EventOverlay() {
  const pending = useStore((s) => s.pending);
  const hp = useStore((s) => s.hp);
  const mp = useStore((s) => s.mp);
  const maxHp = useStore((s) => s.maxHp);
  const maxMp = useStore((s) => s.maxMp);
  const event = useMemo(() => resolveEncounterDef(pending?.encounter), [pending]);

  if (!pending || !event) return null;

  const pickChoice = (choice: EventChoice) => {
    const hpDelta = choice.effect?.hpDelta ?? 0;
    const mpDelta = choice.effect?.mpDelta ?? 0;
    if (choice.effect?.grantKeyItemId) audio.playSfx('key-item');
    else if (hpDelta < 0 || mpDelta < 0)  audio.playSfx('fail');
    else if (hpDelta > 0 || mpDelta > 0)  audio.playSfx('success');
    else                                   audio.playSfx('ui-click');
    const newHp = Math.max(0, Math.min(maxHp, hp + hpDelta));
    const newMp = Math.max(0, Math.min(maxMp, mp + mpDelta));
    const key = encounterKey(pending.screenId, pending.encounter.x, pending.encounter.y);
    store.set((s) => ({
      hp: newHp,
      mp: newMp,
      resolvedEvents: [...s.resolvedEvents, key],
      pending: null,
      phase: 'dungeon',
      keyItems:
        choice.effect?.grantKeyItemId && !s.keyItems.includes(choice.effect.grantKeyItemId)
          ? [...s.keyItems, choice.effect.grantKeyItemId]
          : s.keyItems,
    }));
    bus.emit('resume', undefined);
  };

  const prefix = pending.encounter.kind ? TITLE_PREFIX[pending.encounter.kind] ?? '' : '';

  return (
    <div className="overlay">
      <div className="event-panel">
        <h3>{prefix}{event.title}</h3>
        <p>{event.text}</p>
        <div className="choices">
          {event.choices.map((c, i) => (
            <button key={i} type="button" onClick={() => pickChoice(c)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
