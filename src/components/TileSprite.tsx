/**
 * TileSprite — pixel-art sprites for dungeon tiles.
 *
 * Player sprites: custom hero PNGs (Alphonse / Laurent / Marine), transparent bg.
 * Encounter sprites: 4-frame animated 16×16 assets from the asset pack.
 *
 * Usage:
 *   <TileSprite kind="combat" />
 *   <TileSprite kind="player" heroClass="Sage" tint="#c78cff" size={44} />
 *   <TileSprite kind="boss" size={64} />
 */

import type { EncounterKind, HeroClass } from '../data/types';
import { AnimatedSprite } from './AnimatedSprite';
import { useStore } from '../game/store';

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

// ── Player sprites — one PNG per hero (static, transparent background) ────────

const PLAYER_SPRITE: Record<HeroClass, string> = {
  Choc:     `${A}/player_choc.png`,    // Marine   — Choc
  Roublard: `${A}/player_classe.png`,  // Alphonse — Roublard (filename kept for asset stability)
  Sage:     `${A}/player_sage.png`,    // Laurent  — Sage
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
    return (
      <HeroWalkSprite
        src={PLAYER_SPRITE[heroClass]}
        size={size}
        opacity={opacity}
        tint={tint}
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

// ── Walking animation wrapper ────────────────────────────────────────────────
//
// Given a single idle PNG, this simulates a walk by layering four sober,
// mutually-reinforcing effects:
//
//   1. Idle loop — a permanent, very subtle Y-bounce + micro-rotation so the
//      hero "breathes" even when standing still.
//   2. Step pulse — each successful move bumps `stepCount` in the store; we
//      use that as a React `key`, which remounts the element and retriggers
//      a one-shot, stronger bounce/oscillation (the walk "step").
//   3. Slide-in — the step animation also starts a few pixels away from the
//      target in the direction the hero came from, giving the feel of
//      walking *into* the new tile instead of teleporting onto it.
//   4. Shadow pulse — a ground shadow that shrinks as the hero rises,
//      strengthening the bounce perception.
//
// Facing is a pure horizontal flip of the whole stack (img + shadow).
// Preserved on vertical moves so the hero doesn't "snap straight" when
// climbing stairs.

interface HeroWalkSpriteProps {
  src: string;
  size: number;
  opacity: number;
  tint?: string;
}

function HeroWalkSprite({ src, size, opacity, tint }: HeroWalkSpriteProps) {
  const facing    = useStore((s) => s.facing);
  const stepCount = useStore((s) => s.stepCount);
  const lastDx    = useStore((s) => s.lastDx);

  const h = size === 32 ? 48 : size;
  // Slide-in offset — the sprite starts one step "behind" and animates forward.
  // Magnitude kept small (6 px) so it feels like a step, not a dash.
  const slideX = lastDx * -6;

  return (
    <div
      key={stepCount}
      className="hero-walk"
      style={{
        // `--walk-slide-x` is read by the step keyframe's 0 % frame (see CSS).
        ['--walk-slide-x' as string]: `${slideX}px`,
        ['--walk-facing' as string]: facing === 'left' ? '-1' : '1',
      } as React.CSSProperties}
    >
      <div className="hero-walk-shadow" />
      <img
        src={src}
        className="hero-walk-img"
        style={{
          height: `${h}px`,
          opacity,
          filter: `drop-shadow(0 0 6px ${tint ?? 'var(--accent)'})`,
        }}
        aria-hidden
        alt=""
      />
    </div>
  );
}
