/**
 * dataIntegrity — boot-time sanity checks for declarative game data.
 *
 * Runs once (from main.tsx, DEV only) to catch authoring mistakes before they
 * become runtime crashes:
 *   - Hero attack IDs exist in the ATTACKS table
 *   - Screen exits point to real screen IDs
 *   - Screen encounters reference real enemy / event / trap / puzzle IDs
 *   - Exit doors are on the border of the grid, and entryX/entryY land on a
 *     walkable floor tile inside the destination screen
 *   - `grantsKeyItem` references a known key item
 *
 * Each issue is reported via console.warn with a stable prefix so they show
 * up clearly in the devtools console. The function never throws — it collects
 * and reports, so the game still boots.
 */
import { ATTACKS } from '../data/attacks';
import { ENEMIES } from '../data/enemies';
import { EVENTS } from '../data/events';
import { TRAPS } from '../data/traps';
import { PUZZLES } from '../data/puzzles';
import { HEROES } from '../data/heroes';
import { KEY_ITEMS } from '../data/keyItems';
import { RIDDLES } from '../data/riddles';
import { REWARD_ITEMS } from '../data/rewardItems';
import { SCREENS } from '../data/screens';
import type { ScreenDef, ScreenEncounter } from '../data/types';

const TAG = '[data-integrity]';

export interface IntegrityReport {
  errors: string[];
  warnings: string[];
}

function checkEncounter(screen: ScreenDef, enc: ScreenEncounter, errors: string[]) {
  const where = `${screen.id} (${enc.x},${enc.y})`;
  const W = screen.width;
  const H = screen.height;
  if (enc.x < 0 || enc.y < 0 || enc.x >= W || enc.y >= H) {
    errors.push(`${where}: encounter out of bounds (${W}×${H})`);
    return;
  }
  switch (enc.kind) {
    case 'combat':
      if (!enc.enemyId) errors.push(`${where}: combat encounter has no enemyId`);
      else if (!ENEMIES[enc.enemyId]) errors.push(`${where}: unknown enemyId "${enc.enemyId}"`);
      break;
    case 'event':
      if (!enc.eventId) errors.push(`${where}: event encounter has no eventId`);
      else if (!EVENTS[enc.eventId]) errors.push(`${where}: unknown eventId "${enc.eventId}"`);
      break;
    case 'trap':
      if (!enc.trapId) errors.push(`${where}: trap encounter has no trapId`);
      else if (!TRAPS[enc.trapId]) errors.push(`${where}: unknown trapId "${enc.trapId}"`);
      break;
    case 'puzzle':
      if (!enc.puzzleId) errors.push(`${where}: puzzle encounter has no puzzleId`);
      else if (!PUZZLES[enc.puzzleId]) errors.push(`${where}: unknown puzzleId "${enc.puzzleId}"`);
      break;
    case 'riddle':
      if (!enc.riddleId) errors.push(`${where}: riddle encounter has no riddleId`);
      else if (!RIDDLES[enc.riddleId]) errors.push(`${where}: unknown riddleId "${enc.riddleId}"`);
      break;
  }
}

function checkScreen(screen: ScreenDef, errors: string[], warnings: string[]) {
  const { id, exits, tiles, width: W, height: H } = screen;

  // Sliced screens have empty tile grids (tiles: []). They use ScreenView, not
  // the tile renderer, so skip grid-level checks for them.
  const hasGrid = tiles.length > 0 && tiles[0]?.length > 0;

  for (const exit of exits) {
    // Destination exists
    if (!SCREENS[exit.toScreen]) {
      errors.push(`${id}: exit to unknown screen "${exit.toScreen}"`);
      continue;
    }
    if (!hasGrid) continue;

    // Exit door must be on the border of THIS screen
    const onBorder = exit.x === 0 || exit.x === W - 1 || exit.y === 0 || exit.y === H - 1;
    if (!onBorder) {
      errors.push(`${id}: exit (${exit.x},${exit.y}) is not on the grid border`);
    }
    // EntryX/Y lands inside the DESTINATION screen and on a floor tile
    const dest = SCREENS[exit.toScreen];
    const destHasGrid = dest.tiles.length > 0 && dest.tiles[0]?.length > 0;
    if (destHasGrid) {
      if (
        exit.entryX < 0 || exit.entryY < 0 ||
        exit.entryX >= dest.width || exit.entryY >= dest.height
      ) {
        errors.push(`${id}: exit to ${exit.toScreen} has entry out of bounds (${exit.entryX},${exit.entryY})`);
      } else {
        const t = dest.tiles[exit.entryY]?.[exit.entryX];
        if (t === 1) {
          errors.push(`${id}: exit to ${exit.toScreen} entry (${exit.entryX},${exit.entryY}) lands on a wall`);
        }
      }
    }
    // Key item gate refers to a real item
    if (exit.requiresKeyItem && !KEY_ITEMS[exit.requiresKeyItem]) {
      errors.push(`${id}: exit requires unknown keyItem "${exit.requiresKeyItem}"`);
    }
  }

  // Encounters
  for (const enc of screen.encounters) {
    checkEncounter(screen, enc, errors);
  }

  // grantsKeyItem references a real item
  if (screen.grantsKeyItem && !KEY_ITEMS[screen.grantsKeyItem]) {
    errors.push(`${id}: grantsKeyItem references unknown item "${screen.grantsKeyItem}"`);
  }

  // Sanity warning: a non-boss room with zero encounters is trivially exitable
  if (!screen.isBossScreen && screen.encounters.length === 0) {
    warnings.push(`${id}: has no static encounters (procedural generation must add some or the room is free-exit)`);
  }
}

export function validateGameData(): IntegrityReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Heroes reference real attacks
  for (const hero of Object.values(HEROES)) {
    for (const attackId of hero.attacks) {
      if (!ATTACKS[attackId]) {
        errors.push(`hero "${hero.id}": unknown attack "${attackId}"`);
      }
    }
  }

  // Riddles reference real reward items and have a valid correctIndex
  for (const riddle of Object.values(RIDDLES)) {
    if (!REWARD_ITEMS[riddle.rewardItemId]) {
      errors.push(`riddle "${riddle.id}": unknown rewardItemId "${riddle.rewardItemId}"`);
    }
    if (riddle.choices.length < 3 || riddle.choices.length > 4) {
      errors.push(`riddle "${riddle.id}": must have 3 or 4 choices, got ${riddle.choices.length}`);
    }
    if (riddle.correctIndex < 0 || riddle.correctIndex >= riddle.choices.length) {
      errors.push(
        `riddle "${riddle.id}": correctIndex ${riddle.correctIndex} out of range (choices: ${riddle.choices.length})`,
      );
    }
  }

  // Screens
  for (const screen of Object.values(SCREENS)) {
    checkScreen(screen, errors, warnings);
  }

  // Exactly one boss screen — otherwise the run-end logic is ambiguous
  const bossScreens = Object.values(SCREENS).filter((s) => s.isBossScreen);
  if (bossScreens.length !== 1) {
    errors.push(`expected exactly one isBossScreen, found ${bossScreens.length}`);
  }

  return { errors, warnings };
}

/** Run validation and log findings. Safe to call at boot. */
export function reportGameDataIntegrity(): void {
  const { errors, warnings } = validateGameData();
  for (const w of warnings) console.warn(`${TAG} warn: ${w}`);
  for (const e of errors)   console.error(`${TAG} error: ${e}`);
  if (errors.length === 0 && warnings.length === 0) {
    console.info(`${TAG} ok`);
  }
}
