import type { Zone } from './types';

/**
 * 5 zones. Each screen declares its `zoneId`. Zones are used to tune
 * difficulty curves, theme the HUD and tag key-item placements.
 */
export const ZONES: Record<string, Zone> = {
  accueil: {
    id: 'accueil',
    name: 'Accueil',
    theme: 'Entrée dans l’open space. Léger, presque tutoriel.',
    difficulty: 'easy',
    description: 'Plantes décoratives, hôte⋅sse qui regarde Netflix.',
  },
  open_space: {
    id: 'open_space',
    name: 'Open Space',
    theme: 'Cubicles, kitchenette, imprimantes en colère.',
    difficulty: 'normal',
    description: 'Le cœur du bureau. Stand-ups éternels.',
  },
  salles_reu: {
    id: 'salles_reu',
    name: 'Salles de réu',
    theme: 'Corridor de salles vitrées qui cachent chacune un piège social.',
    difficulty: 'normal',
    description: 'Les murs gardent la mémoire des brainstorms violents.',
  },
  technique: {
    id: 'technique',
    name: 'Zone technique',
    theme: 'Serveurs, câbles, onduleurs. Esthétique cyberpunk low-cost.',
    difficulty: 'hard',
    description: 'Le CFO n’y met jamais les pieds — et c’est pire pour ça.',
  },
  direction: {
    id: 'direction',
    name: 'Étage direction',
    theme: 'Moquette épaisse, plantes vertes, bureaux verrouillés.',
    difficulty: 'boss',
    description: 'L’endroit où l’on prend les décisions. Ou pas.',
  },
};

export const ZONE_ORDER = ['accueil', 'open_space', 'salles_reu', 'technique', 'direction'] as const;
export type ZoneId = (typeof ZONE_ORDER)[number];
