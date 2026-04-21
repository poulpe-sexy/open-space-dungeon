/**
 * TileSprite — pixel-art sprites for dungeon tiles.
 *
 * Player sprites: animated GIF walk cycles (Marine / Alphonse / Laurent),
 * decoded at runtime to strip the solid backdrop to real transparency.
 * Encounter sprites: 4-frame animated 16×16 assets from the asset pack.
 *
 * Usage:
 *   <TileSprite kind="combat" />
 *   <TileSprite kind="player" heroClass="Sage" tint="#c78cff" size={44} />
 *   <TileSprite kind="boss" size={64} />
 */

import { HERO_WALK_GIF, type HeroId } from '../game/assets';
import type { EncounterKind, HeroClass } from '../data/types';
import { AnimatedGifSprite } from './AnimatedGifSprite';
import { AnimatedSprite } from './AnimatedSprite';

export type SpriteKind = EncounterKind | 'door' | 'player' | 'boss';

interface Props {
  kind: SpriteKind;
  /** Hero class — picks Marine / Alphonse / Laurent sprite for 'player'. */
  heroClass?: HeroClass;
  /** Drop-shadow tint colour for the player sprite. */
  tint?: string;
  /** Rendered size in px (default 32 for encounter sprites, 44 for player). */
  size?: number;
  /** Low opacity when the encounter has already been resolved. */
  resolved?: boolean;
}

// ── Encounter sprite frames (16×16, 4-frame animated) ────────────────────────

// Prefix with BASE_URL so this works under both `/` (dev) and `/open-space-dungeon/` (Pages).
const A = `${import.meta.env.BASE_URL}assets/dungeon`;
const f4 = (name: string) => [1, 2, 3, 4].map((i) => `${A}/${name}_${i}.png`);

const SPRITE_FRAMES: Record<Exclude<SpriteKind, 'player'>, string[]> = {
  combat: f4('combat'),   // skeleton
  event:  f4('event'),    // glowing skull
  trap:   f4('trap'),     // spike peaks
  puzzle: f4('puzzle'),   // treasure chest
  // Riddles reuse the puzzle frames for now — differentiated by a distinct
  // tile bg (`.td-enc-riddle`) and the on-tile "?" glyph overlay.
  riddle: f4('puzzle'),
  boss:   f4('boss'),     // vampire
  door:   f4('door'),     // key
};

// ── Player sprites — one animated walk GIF per hero, with the static tile PNG
//     as fallback during decode / on decode failure. ───────────────────────────

const PLAYER_SPRITE: Record<HeroClass, string> = {
  Choc:     `${A}/player_choc.png`,    // Marine   — Choc
  Roublard: `${A}/player_classe.png`,  // Alphonse — Roublard (filename kept for asset stability)
  Sage:     `${A}/player_sage.png`,    // Laurent  — Sage
};

const CLASS_TO_HERO: Record<HeroClass, HeroId> = {
  Choc: 'marine',
  Roublard: 'alphonse',
  Sage: 'laurent',
};

// ── Component ────────────────────────────────────────────────────────────────

export function TileSprite({
  kind,
  heroClass = 'Choc',
  tint,
  size = 32,
  resolved = false,
}: Props) {
  const opacity = resolved ? 0.3 : 1;

  // ── Player: height-driven sizing so the character fills the tile vertically.
  //    width: auto respects the sprite's natural aspect ratio.
  //    Absolute positioning lets the sprite overflow upward when needed.
  if (kind === 'player') {
    // On the tile map, default to 48 px tall (≈ full tile height).
    // Callers can pass a different size for portraits etc.
    const h = size === 32 ? 48 : size;
    return (
      <AnimatedGifSprite
        src={HERO_WALK_GIF[CLASS_TO_HERO[heroClass]]}
        fallbackSrc={PLAYER_SPRITE[heroClass]}
        style={{
          imageRendering: 'pixelated',
          height: `${h}px`,
          width: 'auto',
          maxWidth: '52px',
          display: 'block',
          position: 'absolute',
          bottom: '1px',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity,
          filter: `drop-shadow(0 0 6px ${tint ?? 'var(--accent)'})`,
          zIndex: 2,
        }}
      />
    );
  }

  // ── Encounter / door sprites: 4-frame animation ──────────────────────────
  return (
    <AnimatedSprite
      frames={SPRITE_FRAMES[kind]}
      fps={8}
      size={size}
      style={{ opacity }}
    />
  );
}
