import { useState, useEffect, useCallback } from 'react';
import { HEROES_LIST, deriveMaxMp } from '../data/heroes';
import type { HeroId } from '../data/types';
import { store } from '../game/store';
import { STARTING_SCREEN, STARTING_POS } from '../data/screens';
import { generateAllEncounters } from '../game/generateEncounters';
import { generateAllRoomShapes } from '../game/generateRoomShapes';
import { generateAllDecorations } from '../game/generateDecorations';
import { HeroCard } from './HeroCard';
import { TitleLogo } from './TitleLogo';

export function TitleScreen() {
  const [showIntro, setShowIntro] = useState(true);
  const [selected, setSelected] = useState<HeroId>('marine');

  const skipIntro = useCallback(() => setShowIntro(false), []);

  // Any keypress skips intro
  useEffect(() => {
    if (!showIntro) return;
    const onKey = () => setShowIntro(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showIntro]);

  const start = () => {
    const hero    = HEROES_LIST.find((h) => h.id === selected)!;
    const maxMp   = deriveMaxMp(hero);
    const runSeed = Date.now();
    // Shapes first — encounter placement respects the freshly-generated layout.
    const sessionRoomShapes  = generateAllRoomShapes(runSeed);
    const sessionEncounters  = generateAllEncounters(runSeed, sessionRoomShapes);
    // Decor placed LAST: avoids exits, entries, encounters, and the starting
    // spawn; validated via BFS so it can never fully block a path.
    const sessionDecorations = generateAllDecorations(
      runSeed,
      sessionRoomShapes,
      sessionEncounters,
    );
    store.set({
      phase: 'dungeon',
      hero,
      hp: hero.stats.hp,
      mp: maxMp,
      maxHp: hero.stats.hp,
      maxMp,
      level: 1,
      xp: 0,
      currentScreenId: STARTING_SCREEN,
      playerX: STARTING_POS.x,
      playerY: STARTING_POS.y,
      defeatedEnemies: [],
      resolvedEvents: [],
      keyItems: [],
      pending: null,
      runSeed,
      sessionRoomShapes,
      sessionEncounters,
      sessionDecorations,
      visitedRooms: [STARTING_SCREEN],
    });
  };

  if (showIntro) {
    return (
      <div className="intro-screen" onClick={skipIntro}>
        <TitleLogo className="intro-logo" fallbackText="⚔ Open Space Dungeon ⚔" />
        <div className="intro-body">
          <p className="intro-p">
            Dans les profondeurs du bureau oublié, là où bourdonnent les néons
            et grondent les imprimantes sacrées, un mal antique s'est réveillé.
          </p>
          <p className="intro-p">
            Des clients énervés hantent les couloirs. Les salles de réunion piègent
            les imprudents. Et derrière les portes scellées règne une puissance
            redoutée de tous&nbsp;: <strong>l'Administration…</strong>
          </p>
          <p className="intro-p">
            Heureusement, trois champions osent encore se dresser contre l'absurde.
          </p>
          <p className="intro-p">En avant, héros du tertiaire&nbsp;!</p>
        </div>
        <span className="intro-continue">— cliquer ou appuyer sur une touche —</span>
      </div>
    );
  }

  return (
    <div className="title-screen">
      <h1>OPEN SPACE DUNGEON</h1>
      <p className="subtitle">
        Un mini RPG corporate-fantasy. Choisis ton héros, explore l'open space,
        survis à l'Administration. ← ↑ ↓ → ou WASD pour bouger.
      </p>

      <div className="hero-grid">
        {HEROES_LIST.map((hero) => (
          <HeroCard
            key={hero.id}
            hero={hero}
            selected={selected === hero.id}
            onSelect={() => setSelected(hero.id)}
          />
        ))}
      </div>

      <button className="start-btn" type="button" onClick={start}>
        Entrer dans l'open space
      </button>
    </div>
  );
}
