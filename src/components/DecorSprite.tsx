/**
 * DecorSprite — purely cosmetic pixel-art decorations.
 *
 * No gameplay impact on its own (generateDecorations.ts handles the "blocks
 * the player" collision). Rendered inline as 16×16 SVG so we don't depend on
 * extra PNG assets and flames can animate cheaply via CSS.
 */

import type { DecorKind } from '../game/generateDecorations';

interface Props {
  kind: DecorKind;
  size?: number;
}

export function DecorSprite({ kind, size = 40 }: Props) {
  const svg = (children: React.ReactNode) => (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      style={{
        position: 'absolute',
        inset: 0,
        margin: 'auto',
        pointerEvents: 'none',
      }}
      aria-hidden
    >
      {children}
    </svg>
  );

  switch (kind) {
    // ── Candle : petite base crème + flamme qui pulse ─────────────────────
    case 'candle':
      return svg(
        <>
          {/* base (bougeoir) */}
          <rect x="4"  y="13" width="8" height="1" fill="#3a2f1f" />
          <rect x="5"  y="12" width="6" height="1" fill="#7a6342" />
          {/* cire */}
          <rect x="6"  y="7"  width="4" height="5" fill="#e8d8b0" />
          <rect x="6"  y="11" width="4" height="1" fill="#a58d5a" />
          {/* mèche */}
          <rect x="7"  y="6"  width="2" height="1" fill="#1a1208" />
          {/* flamme */}
          <g className="decor-flame">
            <rect x="7"  y="3"  width="2" height="3" fill="#ffcc33" />
            <rect x="6"  y="4"  width="1" height="2" fill="#ff8844" />
            <rect x="9"  y="4"  width="1" height="2" fill="#ff8844" />
            <rect x="7"  y="2"  width="2" height="1" fill="#ffe88a" />
          </g>
        </>,
      );

    // ── Torch : poteau en bois + flamme large ─────────────────────────────
    case 'torch':
      return svg(
        <>
          {/* poteau */}
          <rect x="7"  y="8"  width="2" height="7" fill="#5c3a1f" />
          <rect x="7"  y="12" width="2" height="1" fill="#3a2310" />
          {/* coupelle */}
          <rect x="5"  y="6"  width="6" height="2" fill="#8b6a3f" />
          <rect x="5"  y="7"  width="6" height="1" fill="#5c3a1f" />
          {/* flamme */}
          <g className="decor-flame">
            <rect x="6"  y="2"  width="4" height="4" fill="#ffcc33" />
            <rect x="5"  y="3"  width="1" height="3" fill="#ff8844" />
            <rect x="10" y="3"  width="1" height="3" fill="#ff8844" />
            <rect x="7"  y="1"  width="2" height="1" fill="#ffe88a" />
            <rect x="7"  y="0"  width="2" height="1" fill="#ff5a5a" />
          </g>
        </>,
      );

    // ── Barrel : tonneau avec cerclages ───────────────────────────────────
    case 'barrel':
      return svg(
        <>
          {/* corps */}
          <rect x="3"  y="5"  width="10" height="9" fill="#8b6a3f" />
          <rect x="3"  y="5"  width="10" height="1" fill="#a58255" />
          {/* cerclages */}
          <rect x="3"  y="7"  width="10" height="1" fill="#4a2e15" />
          <rect x="3"  y="11" width="10" height="1" fill="#4a2e15" />
          {/* ombres */}
          <rect x="3"  y="13" width="10" height="1" fill="#3a2310" />
          <rect x="4"  y="14" width="8"  height="1" fill="#1a0f05" />
          {/* dessus */}
          <rect x="4"  y="4"  width="8"  height="1" fill="#5c3a1f" />
        </>,
      );

    // ── Crate : caisse en bois ─────────────────────────────────────────────
    case 'crate':
      return svg(
        <>
          <rect x="2"  y="4"  width="12" height="11" fill="#8b6a3f" />
          <rect x="2"  y="4"  width="12" height="1"  fill="#a58255" />
          <rect x="2"  y="14" width="12" height="1"  fill="#3a2310" />
          {/* X-planks */}
          <rect x="2"  y="4"  width="1"  height="11" fill="#5c3a1f" />
          <rect x="13" y="4"  width="1"  height="11" fill="#5c3a1f" />
          <rect x="2"  y="9"  width="12" height="1"  fill="#5c3a1f" />
          {/* diagonale (approx avec deux pas) */}
          <rect x="4"  y="6"  width="1"  height="1"  fill="#5c3a1f" />
          <rect x="5"  y="7"  width="1"  height="1"  fill="#5c3a1f" />
          <rect x="10" y="6"  width="1"  height="1"  fill="#5c3a1f" />
          <rect x="11" y="7"  width="1"  height="1"  fill="#5c3a1f" />
        </>,
      );

    // ── Skull : petit crâne posé au sol ───────────────────────────────────
    case 'skull':
      return svg(
        <>
          {/* crâne */}
          <rect x="5"  y="5"  width="6" height="5" fill="#e8e0c8" />
          <rect x="4"  y="6"  width="1" height="3" fill="#e8e0c8" />
          <rect x="11" y="6"  width="1" height="3" fill="#e8e0c8" />
          {/* yeux */}
          <rect x="6"  y="7"  width="1" height="2" fill="#1a0f05" />
          <rect x="9"  y="7"  width="1" height="2" fill="#1a0f05" />
          {/* dents */}
          <rect x="6"  y="10" width="1" height="1" fill="#e8e0c8" />
          <rect x="8"  y="10" width="1" height="1" fill="#e8e0c8" />
          <rect x="10" y="10" width="1" height="1" fill="#e8e0c8" />
          {/* ombre au sol */}
          <rect x="4"  y="12" width="8" height="1" fill="rgba(0,0,0,0.3)" />
        </>,
      );

    // ── Plant : plante verte en pot (flavor corporate) ────────────────────
    case 'plant':
      return svg(
        <>
          {/* feuillage */}
          <rect x="4"  y="3"  width="8" height="1" fill="#3a7a3a" />
          <rect x="3"  y="4"  width="10" height="3" fill="#4caf50" />
          <rect x="4"  y="7"  width="8" height="1" fill="#3a7a3a" />
          <rect x="5"  y="8"  width="6" height="1" fill="#2d5c2d" />
          {/* tige */}
          <rect x="7"  y="9"  width="2" height="2" fill="#2d5c2d" />
          {/* pot */}
          <rect x="4"  y="11" width="8" height="3" fill="#8b6a3f" />
          <rect x="4"  y="11" width="8" height="1" fill="#a58255" />
          <rect x="4"  y="13" width="8" height="1" fill="#5c3a1f" />
        </>,
      );

    // ── Bones : tas d'ossements ───────────────────────────────────────────
    case 'bones':
      return svg(
        <>
          <rect x="3"  y="10" width="10" height="1" fill="#e8e0c8" />
          <rect x="2"  y="11" width="2"  height="1" fill="#e8e0c8" />
          <rect x="12" y="11" width="2"  height="1" fill="#e8e0c8" />
          <rect x="5"  y="8"  width="6"  height="1" fill="#e8e0c8" />
          <rect x="4"  y="9"  width="1"  height="1" fill="#e8e0c8" />
          <rect x="11" y="9"  width="1"  height="1" fill="#e8e0c8" />
          <rect x="6"  y="12" width="4"  height="1" fill="#c4b894" />
          {/* ombre */}
          <rect x="3"  y="13" width="10" height="1" fill="rgba(0,0,0,0.35)" />
        </>,
      );
  }
}
