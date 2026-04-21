/**
 * AnimatedGifSprite — decodes an animated GIF once (bbox-crop + chroma-key the
 * dominant background so the result has true transparency) and cycles through
 * the resulting PNG frames in-place.
 *
 * Uses `fallbackSrc` as the rendered image while the GIF is decoding AND if
 * the decode fails — callers get a graceful PNG → animated-PNG swap and never
 * a blank tile.
 */

import { useEffect, useState, type CSSProperties } from 'react';
import { decodeGif } from './gifDecoder';

interface Props {
  /** Animated GIF URL. */
  src: string;
  /** Static fallback shown during decode and on decode failure. */
  fallbackSrc: string;
  /** Inline style applied to the underlying <img>. */
  style?: CSSProperties;
}

export function AnimatedGifSprite({ src, fallbackSrc, style }: Props) {
  const [frames, setFrames] = useState<string[]>([]);
  const [fps, setFps] = useState(8);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setFrames([]);
    setIdx(0);
    decodeGif(src)
      .then(({ frames: f, avgDelay }) => {
        if (cancelled) return;
        setFrames(f);
        setFps(Math.max(1, Math.round(1000 / avgDelay)));
      })
      .catch((e) => {
        console.error('[AnimatedGifSprite]', src, e);
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    if (frames.length <= 1) return;
    const id = window.setInterval(
      () => setIdx((i) => (i + 1) % frames.length),
      Math.round(1000 / fps),
    );
    return () => window.clearInterval(id);
  }, [frames.length, fps]);

  const currentSrc = frames.length ? frames[idx] : fallbackSrc;
  return <img src={currentSrc} style={style} aria-hidden alt="" />;
}
