/**
 * AnimatedSprite — cycles through an array of PNG frame URLs at a given fps.
 * Frames are 16×16 px pixel-art assets scaled to `size` with `image-rendering: pixelated`.
 */

import { useEffect, useState } from 'react';

interface Props {
  /** Array of image URL strings, one per frame. */
  frames: string[];
  /** Frames per second (default 8). */
  fps?: number;
  /** Rendered size in px (applied to both width and height). */
  size: number;
  style?: React.CSSProperties;
}

export function AnimatedSprite({ frames, fps = 8, size, style }: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    // Reset to frame 0 when the frame list changes (different sprite kind).
    setIdx(0);
    if (frames.length <= 1) return;
    const id = setInterval(
      () => setIdx((i) => (i + 1) % frames.length),
      Math.round(1000 / fps),
    );
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames.join('|'), fps]);

  return (
    <img
      src={frames[idx] ?? frames[0]}
      width={size}
      height={size}
      style={{
        imageRendering: 'pixelated',
        display: 'block',
        flexShrink: 0,
        ...style,
      }}
      aria-hidden
      alt=""
    />
  );
}
