import { useEffect, useCallback, useState } from 'react';
import { SCREENS } from '../data/screens';
import { SLICE_SCREENS } from '../data/sliceScreens';
import { ENEMIES } from '../data/enemies';
import { KEY_ITEMS } from '../data/keyItems';
import { pickRoomFlavor } from '../data/roomFlavors';
import type { EncounterKind } from '../data/types';
import { store, useStore, encounterKey } from '../game/store';
import { DecorSprite } from './DecorSprite';
/** The dedicated boss arena (11th room of the run). */
const BOSS_SCREEN_ID = 'boss_room';
/** Key of the hand-crafted boss encounter placed inside boss_room at (7,3). */
const BOSS_ENCOUNTER_KEY = `${BOSS_SCREEN_ID}:7,3`;
/** Rooms the player must have visited before the next door leads to the boss
 *  room. Starting room is visited[0], so at length === 10 the next door forces
 *  boss_room — which becomes the 11th entry in visitedRooms. */
const BOSS_ROOMS_NEEDED = 10;
import { audio } from '../game/audio';
import { getZoneColor } from '../game/zoneTheme';
import { TileSprite } from './TileSprite';

// ── Visual constants ───────────────────────────────────────────────────────────
const CELL = 52; // px per tile

// ── Module-level callbacks so move() can trigger React-rendered toasts ───────
// Registered by the component on mount, cleared on unmount.
let _onBlocked: ((msg: string) => void) | null = null;
let _onRoomEnter: ((msg: string) => void) | null = null;
// Tracks the runSeed for which we've already shown the starting-room flavor.
// Prevents re-firing when TileDungeon remounts after combat/event overlays.
let _flavoredRunSeed = -1;

// ── Movement helper ───────────────────────────────────────────────────────────
// Reads fresh state from store.get() to avoid stale-closure issues.
function move(dx: number, dy: number) {
  const s  = store.get();
  const sc = SCREENS[s.currentScreenId] ?? SLICE_SCREENS[s.currentScreenId];
  if (!sc || !sc.tiles.length) return;

  const nx = s.playerX + dx;
  const ny = s.playerY + dy;

  if (nx < 0 || ny < 0 || nx >= sc.width || ny >= sc.height) return;

  // Use this run's procedural shape if present, otherwise the static layout.
  const tiles = s.sessionRoomShapes[s.currentScreenId] ?? sc.tiles;
  const tile  = tiles[ny]?.[nx];
  if (tile === 1) return; // wall — blocked

  // Decor pieces (candles, barrels…) block movement but trigger nothing.
  const decorOnScreen = s.sessionDecorations[s.currentScreenId];
  if (decorOnScreen && decorOnScreen[`${nx},${ny}`]) return;

  store.set({ playerX: nx, playerY: ny });

  // Use session-generated encounters if available, else fall back to static
  const encounters = s.sessionEncounters[s.currentScreenId] ?? sc.encounters;

  // ── Exit tile (tile === 2) ────────────────────────────────────────────────
  if (tile === 2) {
    const exit = sc.exits.find((e) => e.x === nx && e.y === ny);
    if (exit) {
      // At least one encounter in this room must be resolved before leaving.
      const hasMinCleared =
        encounters.length === 0 ||
        encounters.some((enc) => {
          const key = encounterKey(s.currentScreenId, enc.x, enc.y);
          return enc.kind === 'combat'
            ? s.defeatedEnemies.includes(key)
            : s.resolvedEvents.includes(key);
        });

      if (!hasMinCleared) {
        audio.playSfx('fail');
        _onBlocked?.('⚠\u2005Résolvez au moins une rencontre pour franchir cette sortie');
        return;
      }

      if (exit.requiresKeyItem && !s.keyItems.includes(exit.requiresKeyItem)) {
        audio.playSfx('fail');
        const item = KEY_ITEMS[exit.requiresKeyItem];
        _onBlocked?.(
          item
            ? `🔒\u2005Porte verrouillée — il faut « ${item.name} » pour passer`
            : '🔒\u2005Porte verrouillée',
        );
        return;
      }

      // ── Track room visits & force boss_room as the 11th unique room ────────
      // When the player would discover their 11th distinct room, redirect them
      // to the dedicated boss arena instead. Backtracking through already-seen
      // rooms is unaffected. If they're already heading to boss_room naturally
      // via ceo_corridor, let them through — no redirect needed.
      const isNewRoom    = !s.visitedRooms.includes(exit.toScreen);
      const newVisited   = isNewRoom
        ? [...s.visitedRooms, exit.toScreen]
        : s.visitedRooms;

      const bossDefeated = s.defeatedEnemies.includes(BOSS_ENCOUNTER_KEY);
      const forceBoss =
        !bossDefeated &&
        isNewRoom &&
        s.currentScreenId !== BOSS_SCREEN_ID &&
        exit.toScreen   !== BOSS_SCREEN_ID &&
        s.visitedRooms.length === BOSS_ROOMS_NEEDED;

      audio.playSfx('door');

      // Walk INTO `destId`: update current screen, award its grantsKeyItem the
      // first time it's entered, then play the room-flavor toast.
      const walkInto = (destId: string, px: number, py: number, visited: string[]) => {
        const dest = SCREENS[destId] ?? SLICE_SCREENS[destId];
        const hasAlready = dest?.grantsKeyItem
          ? s.keyItems.includes(dest.grantsKeyItem)
          : true;
        const newKeyItems =
          dest?.grantsKeyItem && !hasAlready
            ? [...s.keyItems, dest.grantsKeyItem]
            : s.keyItems;
        store.set({
          currentScreenId: destId,
          playerX: px,
          playerY: py,
          visitedRooms: visited,
          keyItems: newKeyItems,
        });
        if (dest?.grantsKeyItem && !hasAlready) {
          const item = KEY_ITEMS[dest.grantsKeyItem];
          if (item) {
            audio.playSfx('success');
            _onRoomEnter?.(`✦\u2005Objet obtenu : ${item.name}`);
            return;
          }
        }
        if (dest) {
          const msg = pickRoomFlavor(dest.type);
          if (msg) _onRoomEnter?.(msg);
        }
      };

      if (forceBoss) {
        const bossVisited = s.visitedRooms.includes(BOSS_SCREEN_ID)
          ? s.visitedRooms
          : [...s.visitedRooms, BOSS_SCREEN_ID];
        // South-entry of boss_room (matches ceo_corridor's northTo entry).
        walkInto(BOSS_SCREEN_ID, 7, 8, bossVisited);
      } else {
        walkInto(exit.toScreen, exit.entryX, exit.entryY, newVisited);
      }
      return;
    }
  }

  // ── Encounter on this tile ────────────────────────────────────────────────
  const enc = encounters.find((e) => e.x === nx && e.y === ny);
  if (enc) {
    const key      = encounterKey(s.currentScreenId, nx, ny);
    const resolved = enc.kind === 'combat'
      ? s.defeatedEnemies.includes(key)
      : s.resolvedEvents.includes(key);
    if (!resolved) {
      audio.playSfx('ui-click');
      store.set({ pending: { screenId: s.currentScreenId, encounter: enc }, phase: enc.kind });
    }
  }
}

// =============================================================================

export function TileDungeon() {
  const screenId          = useStore((s) => s.currentScreenId);
  const playerX           = useStore((s) => s.playerX);
  const playerY           = useStore((s) => s.playerY);
  const defeatedEnemies   = useStore((s) => s.defeatedEnemies);
  const resolvedEvents    = useStore((s) => s.resolvedEvents);
  const hero              = useStore((s) => s.hero);
  const sessionEncounters = useStore((s) => s.sessionEncounters);
  const sessionRoomShapes = useStore((s) => s.sessionRoomShapes);
  const sessionDecorations = useStore((s) => s.sessionDecorations);

  // ── Blocked-exit toast ──────────────────────────────────────────────────────
  const [blockedMsg, setBlockedMsg] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    _onBlocked = (msg: string) => {
      setBlockedMsg(msg);
      clearTimeout(timer);
      timer = setTimeout(() => setBlockedMsg(null), 2800);
    };
    return () => {
      _onBlocked = null;
      clearTimeout(timer);
    };
  }, []);

  // ── Room-enter flavor toast ────────────────────────────────────────────────
  // Keyed by id so retriggering the same room restarts the fade animation.
  const [flavor, setFlavor] = useState<{ id: number; text: string } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let nextId = 1;
    const show = (msg: string) => {
      setFlavor({ id: nextId++, text: msg });
      clearTimeout(timer);
      timer = setTimeout(() => setFlavor(null), 4200);
    };
    _onRoomEnter = show;

    // Fire the flavor once per run for the STARTING room — which is never
    // reached via move() (the player spawns there). Keyed by runSeed so this
    // correctly re-fires on a new run but stays silent on post-combat remount.
    const s = store.get();
    if (s.runSeed !== _flavoredRunSeed) {
      _flavoredRunSeed = s.runSeed;
      const sc = SCREENS[s.currentScreenId] ?? SLICE_SCREENS[s.currentScreenId];
      if (sc) {
        const msg = pickRoomFlavor(sc.type);
        if (msg) show(msg);
      }
    }

    return () => {
      _onRoomEnter = null;
      clearTimeout(timer);
    };
  }, []);

  // Stable callback — move() reads fresh store, no stale data
  const tryMove = useCallback((dx: number, dy: number) => move(dx, dy), []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't steal input from other interactive elements
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement) return;
      if (['ArrowUp',    'w', 'W'].includes(e.key)) { e.preventDefault(); tryMove( 0, -1); }
      if (['ArrowDown',  's', 'S'].includes(e.key)) { e.preventDefault(); tryMove( 0,  1); }
      if (['ArrowLeft',  'a', 'A'].includes(e.key)) { e.preventDefault(); tryMove(-1,  0); }
      if (['ArrowRight', 'd', 'D'].includes(e.key)) { e.preventDefault(); tryMove( 1,  0); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tryMove]);

  const screen = SCREENS[screenId];
  if (!screen || !hero) return null;

  const zoneColor = getZoneColor(screen.zoneId);

  // Use session-generated encounters if available, else fall back to static
  const activeEncounters = sessionEncounters[screenId] ?? screen.encounters;
  // Same for the room layout — procedural per run, except boss room.
  const activeTiles      = sessionRoomShapes[screenId] ?? screen.tiles;
  const activeDecor      = sessionDecorations[screenId] ?? {};

  // Build a fast encounter lookup by tile position
  type EncInfo = { kind: EncounterKind; resolved: boolean; isBoss: boolean };
  const encAt = new Map<string, EncInfo>();
  for (const enc of activeEncounters) {
    const key      = encounterKey(screenId, enc.x, enc.y);
    const resolved = enc.kind === 'combat'
      ? defeatedEnemies.includes(key)
      : resolvedEvents.includes(key);
    const isBoss = enc.kind === 'combat' && !!enc.enemyId &&
      ENEMIES[enc.enemyId]?.difficulty === 'boss';
    encAt.set(`${enc.x},${enc.y}`, { kind: enc.kind, resolved, isBoss });
  }

  // Build exit lookup to mark door tiles
  const exitAt = new Set(screen.exits.map((e) => `${e.x},${e.y}`));

  return (
    <div
      className="td-wrapper"
      style={{ '--zone-color': zoneColor } as React.CSSProperties}
    >

      {/* ── Tile grid ────────────────────────────────────────────── */}
      <div
        className="td-grid"
        style={{
          gridTemplateColumns: `repeat(${screen.width}, ${CELL}px)`,
          gridTemplateRows:    `repeat(${screen.height}, ${CELL}px)`,
        }}
      >
        {activeTiles.flatMap((row, y) =>
          row.map((tile, x) => {
            const isPlayer = x === playerX && y === playerY;
            const enc      = encAt.get(`${x},${y}`);
            const isDoor   = exitAt.has(`${x},${y}`);
            const decor    = activeDecor[`${x},${y}`];

            const classes = [
              'td-cell',
              tile === 1 ? 'td-wall' : tile === 2 ? 'td-door' : 'td-floor',
              isPlayer ? 'td-player' : '',
              enc && !enc.resolved && !isPlayer
                ? `td-enc td-enc-${enc.kind}${enc.isBoss ? ' td-enc-boss' : ''}`
                : '',
              enc &&  enc.resolved && !isPlayer ? 'td-enc td-enc-done' : '',
              !isPlayer && !enc && decor ? 'td-decor' : '',
            ].filter(Boolean).join(' ');

            return (
              <div key={`${x},${y}`} className={classes}>
                {isPlayer && (
                  <TileSprite kind="player" tint={hero.tint} heroClass={hero.className} />
                )}
                {!isPlayer && enc && (
                  <TileSprite
                    kind={enc.isBoss ? 'boss' : enc.kind}
                    resolved={enc.resolved}
                  />
                )}
                {!isPlayer && !enc && isDoor && (
                  <TileSprite kind="door" />
                )}
                {!isPlayer && !enc && !isDoor && decor && (
                  <DecorSprite kind={decor} />
                )}
              </div>
            );
          })
        )}
      </div>


      {/* ── Blocked-exit toast ───────────────────────────────────── */}
      {blockedMsg && (
        <div className="td-blocked-toast" role="status">
          {blockedMsg}
        </div>
      )}

      {/* ── Room-enter flavor toast ──────────────────────────────── */}
      {flavor && (
        <div
          key={flavor.id}
          className="td-flavor-toast"
          role="status"
        >
          {flavor.text}
        </div>
      )}

    </div>
  );
}
