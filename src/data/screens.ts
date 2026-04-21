import type { ExitLink, ScreenDef, ScreenEncounter, ScreenType, Tile } from './types';

// -----------------------------------------------------------------------------
// Screen grid helpers
// -----------------------------------------------------------------------------
const W = 15;
const H = 10;

/** Build an enclosed rectangular room, with optional inner obstacles. */
const room = (obstacles: Array<[number, number]> = []): Tile[][] => {
  const rows: Tile[][] = [];
  for (let y = 0; y < H; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < W; x++) {
      const border = x === 0 || y === 0 || x === W - 1 || y === H - 1;
      row.push(border ? 1 : 0);
    }
    rows.push(row);
  }
  for (const [x, y] of obstacles) rows[y][x] = 1;
  return rows;
};

/** Punch a door tile at a grid coordinate (mutates the passed tiles). */
const door = (tiles: Tile[][], x: number, y: number) => {
  tiles[y][x] = 2;
};

type ScreenBuild = Omit<ScreenDef, 'width' | 'height' | 'tiles'> & {
  obstacles?: Array<[number, number]>;
};

/** Declarative factory: `build({ id, zoneId, type, title, flavor, obstacles, exits, encounters })` */
const build = (def: ScreenBuild): ScreenDef => {
  const tiles = room(def.obstacles);
  for (const ex of def.exits) door(tiles, ex.x, ex.y);
  return {
    id: def.id,
    zoneId: def.zoneId,
    type: def.type,
    title: def.title,
    flavor: def.flavor,
    width: W,
    height: H,
    tiles,
    exits: def.exits,
    encounters: def.encounters,
    isBossScreen: def.isBossScreen,
    grantsKeyItem: def.grantsKeyItem,
  };
};

// -----------------------------------------------------------------------------
// Directional exit helpers
// -----------------------------------------------------------------------------
const eastTo = (toScreen: string): ExitLink =>
  ({ x: W - 1, y: 5, toScreen, entryX: 1, entryY: 5 });
const westTo = (toScreen: string): ExitLink =>
  ({ x: 0, y: 5, toScreen, entryX: W - 2, entryY: 5 });
const northTo = (toScreen: string): ExitLink =>
  ({ x: 7, y: 0, toScreen, entryX: 7, entryY: H - 2 });
const southTo = (toScreen: string): ExitLink =>
  ({ x: 7, y: H - 1, toScreen, entryX: 7, entryY: 1 });

// -----------------------------------------------------------------------------
// 20 screens, 5 zones. Each screen has >= 2 encounters; at least one must be
// cleared before any exit is usable (enforced in DungeonScene).
// -----------------------------------------------------------------------------

const SCREENS_LIST: ScreenDef[] = [
  // ============ ZONE ACCUEIL (3) =============================================
  build({
    id: 'reception',
    zoneId: 'accueil',
    type: 'entrance',
    title: 'Reception',
    flavor: `Netflix joue en boucle. L'hote d'accueil ne regarde meme pas ton badge.`,
    exits: [eastTo('hallway_accueil')],
    encounters: [
      { x: 4,  y: 7, kind: 'event',  eventId: 'pep_talk',       once: true },
      { x: 10, y: 4, kind: 'combat', enemyId: 'client_hesitant', once: true },
    ],
  }),
  build({
    id: 'hallway_accueil',
    zoneId: 'accueil',
    type: 'corridor',
    title: `Hall d'accueil`,
    flavor: `Des plantes en plastique. Un ecran affiche "WELCOME ABOARD!".`,
    obstacles: [[4, 3], [4, 4], [10, 6], [10, 7]] as Array<[number, number]>,
    exits: [westTo('reception'), eastTo('escalator')],
    encounters: [
      { x: 7,  y: 5, kind: 'combat', enemyId: 'client_hesitant', once: true },
      { x: 10, y: 4, kind: 'trap',   trapId:  'cable_snare',     once: true },
    ],
  }),
  build({
    id: 'escalator',
    zoneId: 'accueil',
    type: 'corridor',
    title: 'Escalator',
    flavor: `En panne. Panneau "merci de monter a pied".`,
    exits: [westTo('hallway_accueil'), northTo('bullpen_a')],
    encounters: [
      { x: 4,  y: 5, kind: 'event',  eventId: 'coffee_machine',  once: true },
      { x: 10, y: 5, kind: 'combat', enemyId: 'client_sceptique', once: true },
    ],
    grantsKeyItem: 'badge',
  }),

  // ============ ZONE OPEN SPACE (5) ==========================================
  build({
    id: 'bullpen_a',
    zoneId: 'open_space',
    type: 'open_space',
    title: 'Open Space — Aile A',
    flavor: `Des tetes emergent par-dessus les cloisons. Puis disparaissent.`,
    obstacles: [[3, 3], [5, 3], [7, 3], [9, 3], [3, 6], [5, 6], [7, 6], [9, 6]] as Array<[number, number]>,
    exits: [southTo('escalator'), eastTo('kitchenette'), northTo('bullpen_b')],
    encounters: [
      { x: 11, y: 5, kind: 'combat', enemyId: 'client_sceptique', once: true },
      { x: 6,  y: 5, kind: 'trap',   trapId:  'cable_snare',      once: true },
    ],
  }),
  build({
    id: 'bullpen_b',
    zoneId: 'open_space',
    type: 'open_space',
    title: 'Open Space — Aile B',
    flavor: `Meme plan, autre vibe. Les stickers sur les laptops sont plus agressifs.`,
    obstacles: [[2, 2], [4, 2], [6, 2], [8, 2], [10, 2]] as Array<[number, number]>,
    exits: [southTo('bullpen_a'), eastTo('printer_room')],
    encounters: [
      { x: 7,  y: 6, kind: 'combat', enemyId: 'client_exigeant', once: true },
      { x: 11, y: 4, kind: 'trap',   trapId:  'floor_shock',     once: true },
    ],
  }),
  build({
    id: 'kitchenette',
    zoneId: 'open_space',
    type: 'break_room',
    title: 'Kitchenette',
    flavor: `Le micro-ondes ronronne. Personne ne sait pourquoi.`,
    obstacles: [[6, 4], [7, 4], [8, 4], [6, 5], [8, 5]] as Array<[number, number]>,
    exits: [westTo('bullpen_a'), eastTo('coffee_point')],
    encounters: [
      { x: 11, y: 3, kind: 'event',  eventId: 'coffee_machine', once: true },
      { x: 3,  y: 7, kind: 'puzzle', puzzleId: 'coffee_order',  once: true },
    ],
  }),
  build({
    id: 'coffee_point',
    zoneId: 'open_space',
    type: 'break_room',
    title: 'Coffee point',
    flavor: `Deux cafetieres de generations differentes se regardent en chien de faience.`,
    exits: [westTo('kitchenette'), northTo('meeting_corridor')],
    encounters: [
      { x: 7,  y: 5, kind: 'event',  eventId: 'mystery_memo',    once: true },
      { x: 11, y: 3, kind: 'combat', enemyId: 'client_sceptique', once: true },
    ],
  }),
  build({
    id: 'printer_room',
    zoneId: 'open_space',
    type: 'technical',
    title: 'Salle imprimante',
    flavor: `Bourrage papier. Depuis trois jours. L'odeur est saisissante.`,
    obstacles: [[5, 5], [6, 5], [8, 5], [9, 5]] as Array<[number, number]>,
    exits: [westTo('bullpen_b')],
    encounters: [
      { x: 7, y: 5, kind: 'combat', enemyId: 'client_anxieux', once: true },
      { x: 3, y: 3, kind: 'event',  eventId: 'mystery_memo',   once: true },
    ],
  }),

  // ============ ZONE SALLES DE REU (4) =======================================
  build({
    id: 'meeting_corridor',
    zoneId: 'salles_reu',
    type: 'corridor',
    title: 'Corridor des salles de reu',
    flavor: `Portes vitrees. Dans chacune, quelqu'un dessine un schema sur le tableau.`,
    obstacles: [[3, 2], [3, 7], [11, 2], [11, 7]] as Array<[number, number]>,
    exits: [
      southTo('coffee_point'),
      westTo('meeting_a'),
      eastTo('meeting_b'),
      northTo('brainstorm_cave'),
    ],
    encounters: [
      { x: 7,  y: 4, kind: 'trap',   trapId:  'cable_snare',     once: true },
      { x: 11, y: 5, kind: 'combat', enemyId: 'client_sceptique', once: true },
    ],
  }),
  build({
    id: 'meeting_a',
    zoneId: 'salles_reu',
    type: 'meeting_room',
    title: 'Salle Socrate',
    flavor: `Post-its partout. Aucun n'est lisible.`,
    obstacles: [[7, 4], [7, 5]] as Array<[number, number]>,
    exits: [eastTo('meeting_corridor')],
    encounters: [
      { x: 11, y: 5, kind: 'combat', enemyId: 'client_chronophage', once: true },
      { x: 3,  y: 3, kind: 'event',  eventId: 'pep_talk',           once: true },
    ],
  }),
  build({
    id: 'meeting_b',
    zoneId: 'salles_reu',
    type: 'meeting_room',
    title: 'Salle Sun Tzu',
    flavor: `Une plante crevee. Un white-board avec "pourquoi ?" entoure trois fois.`,
    exits: [westTo('meeting_corridor')],
    encounters: [
      { x: 7,  y: 5, kind: 'event',  eventId: 'mystery_memo',    once: true },
      { x: 11, y: 3, kind: 'combat', enemyId: 'client_sceptique', once: true },
    ],
  }),
  build({
    id: 'brainstorm_cave',
    zoneId: 'salles_reu',
    type: 'meeting_room',
    title: 'Brainstorm Cave',
    flavor: `Pouffs. Lumiere tamisee. L'odeur de trop de cafes froids.`,
    obstacles: [[4, 4], [10, 4], [4, 6], [10, 6]] as Array<[number, number]>,
    exits: [southTo('meeting_corridor'), northTo('server_entry')],
    encounters: [
      { x: 7,  y: 5, kind: 'combat', enemyId: 'client_anxieux', once: true },
      { x: 11, y: 5, kind: 'combat', enemyId: 'client_zen',     once: true },
    ],
  }),

  // ============ ZONE TECHNIQUE (4) ===========================================
  build({
    id: 'server_entry',
    zoneId: 'technique',
    type: 'technical',
    title: 'Entree datacenter',
    flavor: `Un lecteur de badge clignote rouge. BZZT.`,
    exits: [
      southTo('brainstorm_cave'),
      { x: W - 1, y: 5, toScreen: 'server_maze', entryX: 1, entryY: 5, requiresKeyItem: 'badge' },
    ],
    encounters: [
      { x: 7,  y: 5, kind: 'puzzle', puzzleId: 'coffee_order',  once: true },
      { x: 11, y: 3, kind: 'combat', enemyId: 'client_fantome', once: true },
    ],
  }),
  build({
    id: 'server_maze',
    zoneId: 'technique',
    type: 'technical',
    title: 'Labyrinthe de racks',
    flavor: `Des LED vertes, rouges, orange clignotent sans coherence.`,
    obstacles: [
      [3, 2], [3, 3], [3, 4], [3, 5],
      [6, 4], [6, 5], [6, 6], [6, 7],
      [9, 2], [9, 3], [9, 4], [9, 5],
      [12, 4], [12, 5], [12, 6], [12, 7],
    ] as Array<[number, number]>,
    exits: [westTo('server_entry'), eastTo('cable_room')],
    encounters: [
      { x: 7, y: 2, kind: 'combat', enemyId: 'client_fantome', once: true },
      { x: 5, y: 2, kind: 'trap',   trapId:  'floor_shock',    once: true },
    ],
    grantsKeyItem: 'password',
  }),
  build({
    id: 'cable_room',
    zoneId: 'technique',
    type: 'technical',
    title: 'Salle de brassage',
    flavor: `Des kilometres de RJ45. Tu entends l'electricite.`,
    obstacles: [[5, 3], [5, 4], [5, 5], [5, 6], [9, 3], [9, 4], [9, 5], [9, 6]] as Array<[number, number]>,
    exits: [westTo('server_maze'), northTo('air_co')],
    encounters: [
      { x: 11, y: 5, kind: 'trap',   trapId:  'floor_shock', once: true },
      { x: 3,  y: 5, kind: 'combat', enemyId: 'client_zen',  once: true },
    ],
    grantsKeyItem: 'tampon',
  }),
  build({
    id: 'air_co',
    zoneId: 'technique',
    type: 'technical',
    title: 'Local clim',
    flavor: `Il fait -4 degres. Quelqu'un a laisse un gilet sur un onduleur.`,
    exits: [southTo('cable_room'), eastTo('executive_hall')],
    encounters: [
      { x: 7,  y: 5, kind: 'combat', enemyId: 'client_zen',  once: true },
      { x: 11, y: 3, kind: 'trap',   trapId:  'cable_snare', once: true },
    ],
  }),

  // ============ ZONE DIRECTION (4) ===========================================
  build({
    id: 'executive_hall',
    zoneId: 'direction',
    type: 'executive',
    title: 'Couloir executif',
    flavor: `Moquette epaisse. Chaque porte porte un titre de 7 mots.`,
    obstacles: [[5, 3], [9, 3], [5, 7], [9, 7]] as Array<[number, number]>,
    exits: [westTo('air_co'), eastTo('vip_lounge'), northTo('ceo_corridor')],
    encounters: [
      { x: 7,  y: 5, kind: 'event',  eventId: 'pep_talk',          once: true },
      { x: 11, y: 5, kind: 'combat', enemyId: 'client_chronophage', once: true },
    ],
  }),
  build({
    id: 'vip_lounge',
    zoneId: 'direction',
    type: 'safe_room',
    title: 'Lounge VIP',
    flavor: `Un canape en cuir, trois bouteilles d'eau, zero humain. Tu respires.`,
    exits: [westTo('executive_hall')],
    encounters: [
      { x: 11, y: 5, kind: 'event',  eventId: 'coffee_machine', once: true },
      { x: 7,  y: 3, kind: 'puzzle', puzzleId: 'coffee_order',  once: true },
    ],
  }),
  build({
    id: 'ceo_corridor',
    zoneId: 'direction',
    type: 'corridor',
    title: 'Couloir du CEO',
    flavor: `Plantes vertes calibrees. Un silence ceremonial.`,
    exits: [
      southTo('executive_hall'),
      northTo('boss_room'),
    ],
    encounters: [
      { x: 7,  y: 5, kind: 'trap',   trapId:  'floor_shock',        once: true },
      { x: 11, y: 5, kind: 'combat', enemyId: 'client_chronophage', once: true },
    ],
  }),
  build({
    id: 'boss_room',
    zoneId: 'direction',
    type: 'boss_room',
    title: "Bureau de l'Administration",
    flavor: `Aucune chaise. Aucune lumiere. Un formulaire attend sur le bureau depuis 1987.`,
    obstacles: [[3, 3], [11, 3], [3, 6], [11, 6]] as Array<[number, number]>,
    exits: [southTo('ceo_corridor')],
    encounters: [
      { x: 7, y: 3, kind: 'combat', enemyId: 'client_legendaire', once: true },
      { x: 7, y: 7, kind: 'event',  eventId: 'pep_talk',          once: true },
    ],
    isBossScreen: true,
  }),
];

export const SCREENS: Record<string, ScreenDef> = Object.fromEntries(
  SCREENS_LIST.map((s) => [s.id, s]),
);

export const SCREEN_IDS = SCREENS_LIST.map((s) => s.id);

export const STARTING_SCREEN = 'reception';
export const STARTING_POS = { x: 2, y: 5 };

export const SCREENS_BY_ZONE: Record<string, ScreenDef[]> = SCREENS_LIST.reduce((acc, s) => {
  (acc[s.zoneId] ??= []).push(s);
  return acc;
}, {} as Record<string, ScreenDef[]>);

export const KNOWN_SCREEN_TYPES: ScreenType[] = [
  'entrance', 'corridor', 'open_space', 'meeting_room', 'break_room',
  'technical', 'executive', 'safe_room', 'boss_room',
];

export const findEncounter = (
  screenId: string,
  x: number,
  y: number,
): ScreenEncounter | undefined =>
  SCREENS[screenId]?.encounters.find((e) => e.x === x && e.y === y);
