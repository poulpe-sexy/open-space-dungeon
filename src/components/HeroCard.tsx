import type { Hero } from '../data/types';
import { deriveMaxMp } from '../data/heroes';
import { HeroPortrait } from './HeroPortrait';

interface Props {
  hero: Hero;
  selected?: boolean;
  onSelect?: () => void;
}

/**
 * Selectable hero card for the title screen.
 * Portrait is the PNG from /public/assets/characters/<ID>.png with
 * automatic initial-letter fallback if the file is missing.
 */
export function HeroCard({ hero, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      data-class={hero.className}
      className={`hero-card${selected ? ' selected' : ''}`}
      onClick={onSelect}
    >
      <div className="hero-portrait">
        <HeroPortrait hero={hero} />
      </div>
      <div>
        <div className="hero-name">{hero.name}</div>
        <div className="hero-class">Classe : {hero.className}</div>
      </div>
      <div className="hero-tag">{hero.tag}</div>
      <div className="hero-stats">
        ATK {hero.stats.atk} · MAG {hero.stats.mag} · PV {hero.stats.hp} · MP {deriveMaxMp(hero)}
      </div>
    </button>
  );
}
