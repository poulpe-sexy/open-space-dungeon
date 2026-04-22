import type { Hero } from '../data/types';
import { ATTACKS } from '../data/attacks';
import { HeroPortrait } from './HeroPortrait';
import { tierLabel } from './CombatOverlay';

interface Props {
  hero: Hero;
  selected?: boolean;
  onSelect?: () => void;
}

/**
 * Selectable hero card for the title screen.
 * Portrait is the PNG from /public/assets/characters/<ID>.png with
 * automatic initial-letter fallback if the file is missing.
 *
 * Shows a compact attack kit preview below the class name — three colored
 * chips (Basique / Technique / Signature) with the attack name inside, so
 * the player can see their full kit before committing to a hero.
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

      {/* Attack kit preview — one chip per tier, colors match combat badges */}
      <div className="hero-attacks">
        {hero.attacks.map((id, i) => {
          const atk = ATTACKS[id];
          const tier = (i + 1) as 1 | 2 | 3;
          return (
            <span
              key={id}
              className={`attack-tier tier-${tier}`}
              title={atk?.description}
            >
              {tierLabel(tier)} · {atk?.name ?? id}
            </span>
          );
        })}
      </div>
    </button>
  );
}
