import { useEffect, useState } from 'react';
import { useStore } from '../game/store';

/**
 * Minimal debug panel. Toggle with backtick (`).
 * Shows phase, current screen, hero stats, and last encounter.
 */
export function DebugPanel() {
  const [open, setOpen] = useState(import.meta.env.DEV);
  const phase = useStore((s) => s.phase);
  const hero = useStore((s) => s.hero);
  const hp = useStore((s) => s.hp);
  const mp = useStore((s) => s.mp);
  const maxHp = useStore((s) => s.maxHp);
  const maxMp = useStore((s) => s.maxMp);
  const screenId = useStore((s) => s.currentScreenId);
  const pending = useStore((s) => s.pending);
  const defeated = useStore((s) => s.defeatedEnemies.length);
  const resolved = useStore((s) => s.resolvedEvents.length);
  const keyItems = useStore((s) => s.keyItems);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '`') setOpen((o) => !o);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;

  return (
    <aside className="debug-panel" aria-label="Debug panel">
      <header>
        <strong>DEBUG</strong>
        <button type="button" onClick={() => setOpen(false)}>×</button>
      </header>
      <dl>
        <dt>Phase</dt><dd>{phase}</dd>
        <dt>Screen</dt><dd>{screenId}</dd>
        <dt>Hero</dt><dd>{hero ? `${hero.name} / ${hero.className}` : '—'}</dd>
        <dt>PV</dt><dd>{hero ? `${hp}/${maxHp}` : '—'}</dd>
        <dt>MP</dt><dd>{hero ? `${mp}/${maxMp}` : '—'}</dd>
        <dt>Kills</dt><dd>{defeated}</dd>
        <dt>Events</dt><dd>{resolved}</dd>
        <dt>Keys</dt><dd>{keyItems.join(', ') || '—'}</dd>
        <dt>Pending</dt>
        <dd>
          {pending
            ? `${pending.encounter.kind}@${pending.encounter.x},${pending.encounter.y}`
            : '—'}
        </dd>
      </dl>
      <footer>` pour masquer</footer>
    </aside>
  );
}
