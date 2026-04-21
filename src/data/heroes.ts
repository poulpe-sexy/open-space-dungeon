import type { Hero, HeroId } from './types';
import { HERO_PORTRAITS, HERO_TINT } from '../game/assets';

/**
 * Three fixed heroes. Stats are authored here (atk / mag / hp).
 * Attacks is a triple in ascending tier order.
 */
export const HEROES: Record<HeroId, Hero> = {
  marine: {
    id: 'marine',
    name: 'MARINE',
    className: 'Choc',
    stats: { atk: 8, mag: 2, hp: 18 },
    portrait: HERO_PORTRAITS.marine,
    tint: HERO_TINT.marine,
    tag: 'Frontline dévouée. Prend les coups pour que la réu commence à l’heure.',
    attacks: ['impact', 'choc', 'reframe'],
  },
  alphonse: {
    id: 'alphonse',
    name: 'ALPHONSE',
    className: 'Roublard',
    stats: { atk: 5, mag: 5, hp: 15 },
    portrait: HERO_PORTRAITS.alphonse,
    tint: HERO_TINT.alphonse,
    tag: 'Polyvalent, accessible, toujours prêt à recadrer en souplesse.',
    attacks: ['charme', 'reframe', 'techno_boom_boom'],
  },
  laurent: {
    id: 'laurent',
    name: 'LAURENT',
    className: 'Sage',
    stats: { atk: 2, mag: 9, hp: 12 },
    portrait: HERO_PORTRAITS.laurent,
    tint: HERO_TINT.laurent,
    tag: 'Mage & sage. Ses mémos arcanes peuvent briser une roadmap.',
    attacks: ['apnee', 'figuier_etrangleur', 'decommissionnement'],
  },
};

export const HEROES_LIST: Hero[] = Object.values(HEROES);

export const getHero = (id: HeroId) => HEROES[id];

/**
 * Max MP is derived: `stats.mag * 2`. Keeps the stat block a clean triad while
 * giving Sages a deep magic pool and Chocs a very small one.
 */
export const deriveMaxMp = (hero: Hero): number => hero.stats.mag * 2;
