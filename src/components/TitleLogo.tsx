import { useState } from 'react';
import { TITLE_LOGO } from '../game/assets';

interface Props {
  /** CSS class applied to the root <img> (or fallback text) for sizing/theme. */
  className?: string;
  /** Visible text fallback if the PNG 404s. */
  fallbackText?: string;
}

/**
 * Renders the pixel-art "OPEN SPACE DUNGEON" logo. If the PNG is absent,
 * falls back to the stylized uppercase text so the game never looks broken.
 */
export function TitleLogo({ className, fallbackText = 'OPEN SPACE DUNGEON' }: Props) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return <span className={className}>{fallbackText}</span>;
  }
  return (
    <img
      src={TITLE_LOGO}
      alt={fallbackText}
      className={className}
      onError={() => setBroken(true)}
      draggable={false}
    />
  );
}
