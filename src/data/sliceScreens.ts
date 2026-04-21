import type { ScreenDef } from './types';

const s = (def: Omit<ScreenDef, 'tiles' | 'width' | 'height'>): ScreenDef => ({
  ...def,
  width: 0,
  height: 0,
  tiles: [],
});

export const SLICE_START = 'slice_tuto';

export const SLICE_ORDER = [
  'slice_tuto',
  'slice_combat',
  'slice_trap',
  'slice_enigme',
] as const;

export const SLICE_SCREENS: Record<string, ScreenDef> = {
  // 1 — Tutorial: deux événements, pas de danger immédiat
  slice_tuto: s({
    id: 'slice_tuto',
    zoneId: 'Accueil',
    type: 'entrance',
    title: 'Réception',
    flavor:
      `Bienvenue dans l'open space. Netflix tourne en sourdine. ` +
      `L'hôte d'accueil ne regarde même pas ton badge.`,
    exits: [{ x: 0, y: 0, toScreen: 'slice_combat', entryX: 0, entryY: 0, direction: 'E' }],
    encounters: [
      { x: 1, y: 1, kind: 'event',  eventId: 'pep_talk',       once: true },
      { x: 2, y: 2, kind: 'event',  eventId: 'coffee_machine', once: true },
    ],
  }),

  // 2 — Premier combat + mémo mystère
  slice_combat: s({
    id: 'slice_combat',
    zoneId: 'Open Space',
    type: 'open_space',
    title: 'Open Space A',
    flavor:
      `Rangées de bureaux standardisés. Un client tourne en rond ` +
      `près de la photocopieuse. Il t'a repéré.`,
    exits: [{ x: 0, y: 0, toScreen: 'slice_trap', entryX: 0, entryY: 0, direction: 'S' }],
    encounters: [
      { x: 3, y: 3, kind: 'combat', enemyId: 'client_hesitant' },
      { x: 4, y: 3, kind: 'event',  eventId: 'mystery_memo',   once: true },
    ],
  }),

  // 3 — Piège + combat
  slice_trap: s({
    id: 'slice_trap',
    zoneId: 'Technique',
    type: 'technical',
    title: 'Couloir Technique',
    flavor:
      `Moquette grise, câbles partout, un néon qui grésille. ` +
      `Chaque pas crépite d'électricité statique.`,
    exits: [{ x: 0, y: 0, toScreen: 'slice_enigme', entryX: 0, entryY: 0, direction: 'E' }],
    encounters: [
      { x: 5, y: 5, kind: 'trap',   trapId: 'cable_snare',    difficulty: 'easy'   },
      { x: 6, y: 5, kind: 'combat', enemyId: 'client_sceptique' },
    ],
  }),

  // 4 — Mini-énigme + piège (boss final : victoire sur Next)
  slice_enigme: s({
    id: 'slice_enigme',
    zoneId: 'Direction',
    type: 'executive',
    title: 'Break Room',
    flavor:
      `Trois mugs fument sur le plan de travail. Un post-it attend ` +
      `sa commande parfaite. La Liche RH n'est plus très loin.`,
    exits: [],
    encounters: [
      { x: 7, y: 7, kind: 'puzzle', puzzleId: 'coffee_order', difficulty: 'easy'   },
      { x: 8, y: 7, kind: 'trap',   trapId:   'floor_shock',  difficulty: 'normal' },
    ],
  }),
};
