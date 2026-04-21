/**
 * generateDecorations — placement procédural des éléments de décor.
 *
 * Les décors sont purement cosmétiques MAIS bloquent le joueur (comme des
 * murs). Ils ne peuvent jamais :
 *   - recouvrir une porte (tile=2)
 *   - recouvrir un mur (tile=1)
 *   - recouvrir une tuile d'encounter
 *   - recouvrir la tuile d'approche d'une porte (la case intérieure
 *     adjacente — sinon on bloque la seule case d'accès à la sortie)
 *   - recouvrir la position de spawn dans la salle de départ
 *   - déconnecter une sortie d'une autre (vérifié par BFS)
 */

import type { ScreenEncounter, Tile } from '../data/types';
import { SCREENS, STARTING_SCREEN, STARTING_POS } from '../data/screens';

// Types/constantes publics ────────────────────────────────────────────────

export type DecorKind =
  | 'candle'
  | 'torch'
  | 'barrel'
  | 'crate'
  | 'skull'
  | 'plant'
  | 'bones';

export type DecorMap = Record<string, DecorKind>; // "x,y" → kind

// Poids par type pour la distribution visuelle — candles et torches dominent
// pour donner le ton "dungeon", les autres sont plus rares.
const DECOR_WEIGHTS: Array<[DecorKind, number]> = [
  ['candle', 28],
  ['torch',  22],
  ['barrel', 14],
  ['crate',  12],
  ['plant',  10],
  ['skull',   8],
  ['bones',   6],
];

// ── RNG seedé (xorshift32, même famille que les autres générateurs) ──────

function makeRng(seed: number): () => number {
  let s = (seed ^ 0xbadc0de) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

function pickWeighted(rng: () => number): DecorKind {
  const total = DECOR_WEIGHTS.reduce((a, [, w]) => a + w, 0);
  let r = rng() * total;
  for (const [kind, w] of DECOR_WEIGHTS) {
    if ((r -= w) <= 0) return kind;
  }
  return DECOR_WEIGHTS[0][0];
}

// ── BFS qui traite murs + décors comme infranchissables ──────────────────

function allExitsConnectedWithDecor(
  tiles: Tile[][],
  decor: DecorMap,
  exits: ReadonlyArray<{ x: number; y: number }>,
): boolean {
  if (exits.length <= 1) return true;
  const W = tiles[0].length;
  const H = tiles.length;
  const start = exits[0];
  const seen = new Set<string>([`${start.x},${start.y}`]);
  const queue: Array<[number, number]> = [[start.x, start.y]];
  while (queue.length) {
    const [x, y] = queue.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const key = `${nx},${ny}`;
      if (seen.has(key)) continue;
      if (tiles[ny][nx] === 1) continue; // mur
      if (decor[key]) continue;          // décor = infranchissable
      seen.add(key);
      queue.push([nx, ny]);
    }
  }
  return exits.every((e) => seen.has(`${e.x},${e.y}`));
}

// ── Main export ─────────────────────────────────────────────────────────

export function generateAllDecorations(
  seed: number,
  shapes: Record<string, Tile[][]>,
  encounters: Record<string, ScreenEncounter[]>,
): Record<string, DecorMap> {
  const rng = makeRng(seed);
  const result: Record<string, DecorMap> = {};

  for (const screen of Object.values(SCREENS)) {
    // Pas de décor dans la salle de boss — mise en scène à part.
    if (screen.isBossScreen) {
      result[screen.id] = {};
      continue;
    }

    const tiles = shapes[screen.id] ?? screen.tiles;
    const encsForScreen = encounters[screen.id] ?? screen.encounters;

    // Ensemble de tuiles interdites
    const W = tiles[0].length;
    const H = tiles.length;
    const forbidden = new Set<string>();
    for (const e of screen.exits) {
      forbidden.add(`${e.x},${e.y}`);               // la porte elle-même
      // Case d'approche : le voisin intérieur de la porte. Sans ça, un décor
      // peut spawner juste devant la sortie et bloquer l'accès (même si le BFS
      // valide, la porte n'est plus atteignable par le joueur).
      let ax = e.x;
      let ay = e.y;
      if      (e.x === 0)       ax = 1;
      else if (e.x === W - 1)   ax = W - 2;
      if      (e.y === 0)       ay = 1;
      else if (e.y === H - 1)   ay = H - 2;
      forbidden.add(`${ax},${ay}`);
    }
    for (const enc of encsForScreen) {
      forbidden.add(`${enc.x},${enc.y}`);
    }
    if (screen.id === STARTING_SCREEN) {
      forbidden.add(`${STARTING_POS.x},${STARTING_POS.y}`);
    }

    // Candidats = tuiles sol (0) hors forbidden
    const candidates: Array<[number, number]> = [];
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        if (tiles[y][x] !== 0) continue;
        if (forbidden.has(`${x},${y}`)) continue;
        candidates.push([x, y]);
      }
    }

    // Fisher-Yates pour ordre aléatoire
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    // Nombre cible : 2-6 pièces de décor par salle
    const target = Math.min(2 + Math.floor(rng() * 5), candidates.length);
    const decor: DecorMap = {};

    for (const [x, y] of candidates) {
      if (Object.keys(decor).length >= target) break;
      const kind = pickWeighted(rng);
      decor[`${x},${y}`] = kind;

      // Si l'ajout déconnecte une sortie, on retire ce décor et on continue.
      if (!allExitsConnectedWithDecor(tiles, decor, screen.exits)) {
        delete decor[`${x},${y}`];
      }
    }

    result[screen.id] = decor;
  }

  return result;
}
