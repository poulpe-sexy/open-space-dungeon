import { useState, useCallback } from 'react';
import { useStore } from './game/store';
import { SLICE_SCREENS } from './data/sliceScreens';
import { TitleScreen } from './components/TitleScreen';
import { TileDungeon } from './components/TileDungeon';
import { ScreenView } from './components/ScreenView';
import { Hud, HelpRibbon } from './components/Hud';
import { CombatOverlay } from './components/CombatOverlay';
import { EventOverlay } from './components/EventOverlay';
import { ResolutionOverlay } from './components/ResolutionOverlay';
import { RiddleOverlay } from './components/RiddleOverlay';
import { EndScreen } from './components/EndScreen';
import { DebugPanel } from './components/DebugPanel';
import { HowToPlayModal } from './components/HowToPlayModal';

const HELP_SEEN_KEY = 'osd_help_seen';

/** Auto-open on the very first visit; false on subsequent ones. */
function firstVisit(): boolean {
  try {
    if (!localStorage.getItem(HELP_SEEN_KEY)) return true;
  } catch { /* localStorage can be blocked in some environments */ }
  return false;
}

export function App() {
  const phase    = useStore((s) => s.phase);
  const screenId = useStore((s) => s.currentScreenId);

  const isSlice = screenId in SLICE_SCREENS;

  const [showHelp, setShowHelp] = useState(firstVisit);

  const closeHelp = useCallback(() => {
    try { localStorage.setItem(HELP_SEEN_KEY, '1'); } catch { /* ignore */ }
    setShowHelp(false);
  }, []);

  const toggleHelp = useCallback(() => setShowHelp((v) => !v), []);

  return (
    <div className="app-shell">
      <div className="stage">
        {phase === 'title' ? (
          <TitleScreen />
        ) : (
          <>
            {phase === 'dungeon' && (
              isSlice
                ? <ScreenView key={screenId} />
                : <TileDungeon />
            )}
            <Hud onToggleHelp={toggleHelp} />
            {phase === 'dungeon' && !isSlice && <HelpRibbon />}
            {(phase === 'combat' || phase === 'secret-combat') && <CombatOverlay />}
            {phase === 'event' && <EventOverlay />}
            {(phase === 'trap' || phase === 'puzzle') && <ResolutionOverlay />}
            {phase === 'riddle' && <RiddleOverlay />}
            <EndScreen />
          </>
        )}
        <DebugPanel />

        {/* How-to-play modal — available at all times, z-index 28 */}
        {showHelp && <HowToPlayModal onClose={closeHelp} />}
      </div>
    </div>
  );
}
