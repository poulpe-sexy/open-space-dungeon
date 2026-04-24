import type { Hero, HeroId } from './types';
import { HERO_PORTRAITS, HERO_TINT } from '../game/assets';

/**
 * Three fixed heroes. Stats are authored here (atk / mag / hp).
 * `attacks` is a triple in ascending tier order — see `src/data/attacks.ts`.
 *
 * Balance identity (asserted by `balance.test.ts`):
 *  - Marine (Choc)    — high ATK, thick HP, tiny MP. Physical-only kit.
 *  - Alphonse (Roublard) — middle of the road, magic-leaning. Social kit.
 *  - Laurent (Sage)   — peak MAG, low HP. Magic-only kit; glass cannon.
 *
 * HP floor tuning: the three heroes had 18 / 15 / 12 HP, which caused the
 * final boss (then ATK 13) to one-shot Laurent and two-shot the others at
 * early levels. Bumping each +2 gives level-1 a tolerable floor while still
 * rewarding level-ups.
 */
export const HEROES: Record<HeroId, Hero> = {
  marine: {
    id: 'marine',
    name: 'MARINE',
    className: 'Choc',
    stats: { atk: 8, mag: 2, hp: 20 },
    portrait: HERO_PORTRAITS.marine,
    tint: HERO_TINT.marine,
    tag: "Guerrière de choc, elle délivre de l’impact, surtout dans tes dents.",
    attacks: ['impact', 'choc', 'pression'],
  },
  alphonse: {
    id: 'alphonse',
    name: 'ALPHONSE',
    className: 'Roublard',
    stats: { atk: 5, mag: 5, hp: 17 },
    portrait: HERO_PORTRAITS.alphonse,
    tint: HERO_TINT.alphonse,
    tag: "Combattant polyvalent, ses sarcasmes affûtés ont déjà rendu fou plus d'un adversaire.",
    attacks: ['charme', 'baratin', 'techno_boom_boom'],
  },
  laurent: {
    id: 'laurent',
    name: 'LAURENT',
    className: 'Sage',
    stats: { atk: 2, mag: 9, hp: 14 },
    portrait: HERO_PORTRAITS.laurent,
    tint: HERO_TINT.laurent,
    tag: "Mage redoutable, dont les savoirs font trembler l'architecture même du donjon.",
    attacks: ['apnee', 'figuier_etrangleur', 'decommissionnement'],
  },
  matthieu: {
    id: 'matthieu',
    name: 'MATTHIEU',
    className: 'Sensei',
    stats: { atk: 4, mag: 4, hp: 16 },
    portrait: HERO_PORTRAITS.matthieu,
    tint: HERO_TINT.matthieu,
    tag: "Avec le pouvoir du Kaizen, il transforme chaque combat en opportunité d'apprentissage.",
    attacks: ['reframe', 'challenge', 'jai_appele_le_client'],
    xpBonus: 2,
  },
};

export const HEROES_LIST: Hero[] = Object.values(HEROES);

export const getHero = (id: HeroId) => HEROES[id];

/**
 * Max MP is derived: `stats.mag * 2`. Keeps the stat block a clean triad while
 * giving Sages a deep magic pool and Chocs a very small one.
 */
export const deriveMaxMp = (hero: Hero): number => hero.stats.mag * 2;
