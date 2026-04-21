/**
 * generateRoomShapes — procedural interior layouts for each room.
 *
 * For every non-boss screen we pick:
 *   - one CORNER style (square / rounded / notched — varies the silhouette)
 *   - one INTERIOR style (pillars / cubicles / bars / etc.)
 *
 * The result is a fresh Tile[][] that replaces `screen.tiles` for the run.
 * We re-punch the doors for the screen's exits afterwards, and validate full
 * connectivity via BFS before returning — if a combo ever disconnects an
 * exit, we fall back to the bare "square + open" layout.
 *
 * Called once at game-start (TitleScreen.start()) and passed into
 * generateAllEncounters so encounter placement respects the new shapes.
 */

import type { ScreenDef, Tile } from '../data/types';
import { SCREENS } from '../data/screens';

// ── Seeded RNG (xorshift32) — keep the same algo as generateEncounters ─────

function makeRng(seed: number): () => number {
  let s = (seed ^ 0x5eed_cafe) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

function pickFrom<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ── Corner silhouettes ─────────────────────────────────────────────────────
// Every coord is guaranteed OFF the cardinal exit path (exits live at
// (0,5), (W-1,5), (7,0), (7,H-1)) — we never touch row y=5 nor column x=7.

type Coord = [number, number];

const NE = (x: number, y: number, W: number): Coord => [W - 1 - x, y];
const SW = (x: number, y: number, H: number): Coord => [x, H - 1 - y];
const SE = (x: number, y: number, W: number, H: number): Coord => [W - 1 - x, H - 1 - y];

/** Return the obstacle cells that round / notch / fill each of the 4 corners. */
function cornerShape(
  style: 'square' | 'rounded' | 'diag_notch' | 'bay_nw' | 'bay_se' | 'alcoves',
  W: number,
  H: number,
): Coord[] {
  const small: Coord[] = [[1, 1], [2, 1], [1, 2]]; // small L in NW corner
  const bay:   Coord[] = [[1, 1], [2, 1], [1, 2], [2, 2]]; // 2x2 corner block
  switch (style) {
    case 'square':
      return [];
    case 'rounded':
      // Small L notches on all 4 corners
      return [
        ...small,
        ...small.map(([x, y]) => NE(x, y, W)),
        ...small.map(([x, y]) => SW(x, y, H)),
        ...small.map(([x, y]) => SE(x, y, W, H)),
      ];
    case 'diag_notch':
      // NW + SE rounded, NE + SW plain — diagonal silhouette
      return [
        ...small,
        ...small.map(([x, y]) => SE(x, y, W, H)),
      ];
    case 'bay_nw':
      return bay;
    case 'bay_se':
      return bay.map(([x, y]) => SE(x, y, W, H));
    case 'alcoves':
      // Fill both left corners = alcove effect
      return [
        ...bay,
        ...bay.map(([x, y]) => SW(x, y, H)),
      ];
  }
}

// ── Interior styles ────────────────────────────────────────────────────────

type Interior =
  | 'open'
  | 'four_pillars'
  | 'cubicles'
  | 'double_row'
  | 'inner_ring'
  | 'horizontal_bar'
  | 'diagonal_scatter'
  | 'cross_blocks'
  | 'desk_cluster'
  | 'side_walls';

function interiorShape(style: Interior): Coord[] {
  switch (style) {
    case 'open':
      return [];

    case 'four_pillars':
      return [[3, 3], [11, 3], [3, 7], [11, 7]];

    case 'cubicles':
      // Cubicle partitions top + bottom, flanking the central horizontal cross
      return [
        [3, 2], [4, 2], [10, 2], [11, 2],
        [3, 8], [4, 8], [10, 8], [11, 8],
      ];

    case 'double_row':
      return [
        [2, 3], [4, 3], [6, 3], [8, 3], [10, 3], [12, 3],
      ];

    case 'inner_ring':
      return [
        [4, 3], [10, 3],
        [4, 7], [10, 7],
      ];

    case 'horizontal_bar':
      return [
        [2, 2], [3, 2], [4, 2],
        [10, 2], [11, 2], [12, 2],
        [2, 8], [3, 8], [4, 8],
        [10, 8], [11, 8], [12, 8],
      ];

    case 'diagonal_scatter':
      return [[2, 2], [5, 3], [10, 6], [12, 7], [3, 7], [11, 3]];

    case 'cross_blocks':
      return [
        [5, 3], [5, 4],
        [9, 3], [9, 4],
        [5, 6], [5, 7],
        [9, 6], [9, 7],
      ];

    case 'desk_cluster':
      // Clustered desks on one side, open corridor on the other
      return [
        [3, 2], [4, 2], [3, 3], [4, 3],
        [3, 7], [4, 7], [3, 8], [4, 8],
      ];

    case 'side_walls':
      // Short vertical walls carving side alcoves
      return [
        [4, 2], [4, 3],
        [10, 2], [10, 3],
        [4, 7], [4, 8],
        [10, 7], [10, 8],
      ];
  }
}

const CORNER_STYLES = ['square', 'rounded', 'diag_notch', 'bay_nw', 'bay_se', 'alcoves'] as const;
const INTERIOR_STYLES: Interior[] = [
  'open',
  'four_pillars',
  'cubicles',
  'double_row',
  'inner_ring',
  'horizontal_bar',
  'diagonal_scatter',
  'cross_blocks',
  'desk_cluster',
  'side_walls',
];

// ── Tile builders ──────────────────────────────────────────────────────────

function emptyRoom(W: number, H: number): Tile[][] {
  const rows: Tile[][] = [];
  for (let y = 0; y < H; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < W; x++) {
      const border = x === 0 || y === 0 || x === W - 1 || y === H - 1;
      row.push(border ? 1 : 0);
    }
    rows.push(row);
  }
  return rows;
}

function applyObstacles(tiles: Tile[][], obs: Coord[]) {
  for (const [x, y] of obs) {
    if (!tiles[y] || tiles[y][x] === undefined) continue;
    tiles[y][x] = 1;
  }
}

function punchDoors(tiles: Tile[][], screen: ScreenDef) {
  for (const ex of screen.exits) {
    tiles[ex.y][ex.x] = 2;
  }
}

// ── Connectivity check (BFS from one exit tile) ────────────────────────────

function allExitsConnected(tiles: Tile[][], screen: ScreenDef): boolean {
  if (screen.exits.length <= 1) return true;
  const W = tiles[0].length;
  const H = tiles.length;
  const start = screen.exits[0];
  const visited = new Set<string>();
  const queue: Coord[] = [[start.x, start.y]];
  visited.add(`${start.x},${start.y}`);
  while (queue.length) {
    const [x, y] = queue.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      const t = tiles[ny][nx];
      if (t === 1) continue;
      visited.add(key);
      queue.push([nx, ny]);
    }
  }
  return screen.exits.every((e) => visited.has(`${e.x},${e.y}`));
}

// ── Main export ────────────────────────────────────────────────────────────

export function generateAllRoomShapes(seed: number): Record<string, Tile[][]> {
  const rng = makeRng(seed);
  const result: Record<string, Tile[][]> = {};

  for (const screen of Object.values(SCREENS)) {
    // Boss rooms keep their hand-crafted layout (dramatic emptiness of the
    // Administration's bureau is intentional).
    if (screen.isBossScreen) continue;

    const W = screen.width;
    const H = screen.height;

    // Try up to 6 random combos before bailing out to the plain room.
    let built: Tile[][] | null = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      const cornerStyle   = pickFrom(CORNER_STYLES,   rng);
      const interiorStyle = pickFrom(INTERIOR_STYLES, rng);

      const tiles = emptyRoom(W, H);
      applyObstacles(tiles, cornerShape(cornerStyle, W, H));
      applyObstacles(tiles, interiorShape(interiorStyle));
      // Punch doors AFTER obstacles so exits always win if they collide.
      punchDoors(tiles, screen);

      if (allExitsConnected(tiles, screen)) {
        built = tiles;
        break;
      }
    }

    if (!built) {
      // Worst case: plain room (always connected).
      built = emptyRoom(W, H);
      punchDoors(built, screen);
    }

    result[screen.id] = built;
  }

  return result;
}
