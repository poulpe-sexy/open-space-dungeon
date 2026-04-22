import { useMemo, useState } from 'react';
import { EVENTS } from '../data/events';
import { TRAPS } from '../data/traps';
import { PUZZLES } from '../data/puzzles';
import { NPC_REACTIONS } from '../data/npcEvents';
import type { EncounterKind, EventChoice, EventDef, ScreenEncounter } from '../data/types';
import { bus } from '../game/bus';
import { audio } from '../game/audio';
import { applyRewardItem } from '../game/riddles';
import { encounterKey, store, useStore } from '../game/store';
import { TileSprite } from './TileSprite';

const resolveEncounterDef = (enc: ScreenEncounter | undefined): EventDef | null => {
  if (!enc) return null;
  if (enc.kind === 'trap' && enc.trapId) return TRAPS[enc.trapId] ?? null;
  if (enc.kind === 'puzzle' && enc.puzzleId) return PUZZLES[enc.puzzleId] ?? null;
  if (enc.kind === 'event' && enc.eventId) return EVENTS[enc.eventId] ?? null;
  return null;
};

// Only trap and puzzle get a prefix — event/combat/riddle show the title as-is.
const TITLE_PREFIX: Partial<Record<EncounterKind, string>> = {
  trap:   '⚠ PIÈGE — ',
  puzzle: '◆ ÉNIGME — ',
};

export function EventOverlay() {
  const pending = useStore((s) => s.pending);
  const event   = useMemo(() => resolveEncounterDef(pending?.encounter), [pending]);

  // NPC events: two-phase flow (choices → response + random reaction → dismiss).
  // null = choice phase. non-null = result phase.
  const [npcResult, setNpcResult] = useState<{ log: string; reaction: string } | null>(null);

  if (!pending || !event) return null;

  const pickChoice = (choice: EventChoice) => {
    const hpDelta  = choice.effect?.hpDelta ?? 0;
    const mpDelta  = choice.effect?.mpDelta ?? 0;
    const rewardId = choice.effect?.grantRewardItemId;
    const isNpc    = !!event.portrait;

    if (choice.effect?.grantKeyItemId || rewardId) audio.playSfx('key-item');
    else if (hpDelta < 0 || mpDelta < 0)           audio.playSfx('fail');
    else if (hpDelta > 0 || mpDelta > 0)           audio.playSfx('success');
    else                                            audio.playSfx('ui-click');

    const key = encounterKey(pending.screenId, pending.encounter.x, pending.encounter.y);

    store.set((s) => {
      const baseHp = Math.max(0, Math.min(s.maxHp, s.hp + hpDelta));
      const baseMp = Math.max(0, Math.min(s.maxMp, s.mp + mpDelta));

      // Apply permanent reward item if present and not already held.
      const rr =
        rewardId && s.hero && !s.rewardItems.includes(rewardId)
          ? applyRewardItem(s.hero, s.maxHp, s.maxMp, rewardId)
          : null;

      const base = {
        hp:    rr ? Math.min(rr.maxHp, baseHp + rr.hpHealed) : baseHp,
        mp:    rr ? Math.min(rr.maxMp, baseMp + rr.mpHealed) : baseMp,
        maxHp: rr ? rr.maxHp : s.maxHp,
        maxMp: rr ? rr.maxMp : s.maxMp,
        hero:  rr ? rr.hero  : s.hero,
        rewardItems: rr && rewardId ? [...s.rewardItems, rewardId] : s.rewardItems,
        resolvedEvents: [...s.resolvedEvents, key],
        keyItems:
          choice.effect?.grantKeyItemId && !s.keyItems.includes(choice.effect.grantKeyItemId)
            ? [...s.keyItems, choice.effect.grantKeyItemId]
            : s.keyItems,
      };

      // NPC events keep the overlay open to show the NPC response.
      // Regular events close immediately.
      if (isNpc) return base;
      return { ...base, pending: null, phase: 'dungeon' as const };
    });

    if (isNpc) {
      const reaction = NPC_REACTIONS[Math.floor(Math.random() * NPC_REACTIONS.length)];
      setNpcResult({ log: choice.log, reaction });
    } else {
      bus.emit('resume', undefined);
    }
  };

  const closeNpc = () => {
    store.set({ pending: null, phase: 'dungeon' });
    bus.emit('resume', undefined);
    setNpcResult(null);
  };

  const prefix = pending.encounter.kind ? TITLE_PREFIX[pending.encounter.kind] ?? '' : '';

  // ── NPC event — result phase ─────────────────────────────────────────────
  if (event.portrait && npcResult) {
    return (
      <div className="overlay">
        <div className="event-panel event-panel--npc">
          <div className="npc-speaker">
            <div className="npc-sprite">
              <TileSprite kind={event.portrait} size={36} />
            </div>
            <span className="npc-name">{event.npcName}</span>
          </div>
          <p className="npc-log">« {npcResult.log} »</p>
          <p className="npc-reaction">{npcResult.reaction}</p>
          <button type="button" className="npc-continue" onClick={closeNpc}>
            Continuer →
          </button>
        </div>
      </div>
    );
  }

  // ── NPC event — choice phase ─────────────────────────────────────────────
  if (event.portrait) {
    return (
      <div className="overlay">
        <div className="event-panel event-panel--npc">
          <div className="npc-speaker">
            <div className="npc-sprite">
              <TileSprite kind={event.portrait} size={36} />
            </div>
            <span className="npc-name">{event.npcName}</span>
          </div>
          <p>{event.text}</p>
          <div className="choices">
            {event.choices.map((c, i) => (
              <button key={`${event.id}-${i}`} type="button" onClick={() => pickChoice(c)}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Regular event / trap / puzzle ────────────────────────────────────────
  return (
    <div className="overlay">
      <div className="event-panel">
        <h3>{prefix}{event.title}</h3>
        <p>{event.text}</p>
        <div className="choices">
          {event.choices.map((c, i) => (
            <button key={`${event.id}-${i}`} type="button" onClick={() => pickChoice(c)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
