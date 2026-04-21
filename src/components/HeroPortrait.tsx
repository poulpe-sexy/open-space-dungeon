import { useState } from 'react';
import type { Hero } from '../data/types';

interface Props {
  hero: Hero;
  alt?: string;
}

/**
 * Renders the hero's PNG portrait if available under /public, otherwise a
 * styled placeholder using the hero initial + class tint.
 */
export function HeroPortrait({ hero, alt }: Props) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div
        className="placeholder"
        style={{ color: hero.tint, width: '100%', textAlign: 'center' }}
      >
        {hero.name[0]}
      </div>
    );
  }
  return (
    <img
      src={hero.portrait}
      alt={alt ?? hero.name}
      onError={() => setBroken(true)}
      draggable={false}
    />
  );
}
