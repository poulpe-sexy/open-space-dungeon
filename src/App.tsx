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

export function App() {
  const phase    = useStore((s) => s.phase);
  const screenId = useStore((s) => s.currentScreenId);

  const isSlice = screenId in SLICE_SCREENS;

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
            <Hud />
            {phase === 'dungeon' && !isSlice && <HelpRibbon />}
            {(phase === 'combat' || phase === 'secret-combat') && <CombatOverlay />}
            {phase === 'event' && <EventOverlay />}
            {(phase === 'trap' || phase === 'puzzle') && <ResolutionOverlay />}
            {phase === 'riddle' && <RiddleOverlay />}
            <EndScreen />
          </>
        )}
        <DebugPanel />
      </div>
    </div>
  );
}
