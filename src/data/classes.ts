import type { ClassDef, HeroClass } from './types';

/**
 * The three playable classes. Used for UI labelling and the class accent color
 * (same color as the hero tint, re-exported here so menus can pull from one
 * place without importing HEROES).
 */
export const CLASSES: Record<HeroClass, ClassDef> = {
  Choc: {
    id: 'Choc',
    name: 'Choc',
    role: 'Frontline / Physique',
    color: '#ff7a4d',
    description:
      'Gros ATK, HP en béton, MAG symbolique. Frappe fort, encaisse, bouscule.',
  },
  Roublard: {
    id: 'Roublard',
    name: 'Roublard',
    role: 'Polyvalent / Social',
    color: '#63c6ff',
    description:
      'Stats équilibrées. Alterne entre physique et magique selon le contexte.',
  },
  Sage: {
    id: 'Sage',
    name: 'Sage',
    role: 'Magique / Contrôle',
    color: '#c78cff',
    description:
      'Dégâts massifs via MAG, HP fragile. Reste à distance, contrôle le combat.',
  },
  Sensei: {
    id: 'Sensei',
    name: 'Sensei',
    role: 'Progression / Kaizen',
    color: '#56b884',
    description:
      'Avec le pouvoir du Kaizen, il transforme chaque combat en opportunité d\'apprentissage.',
  },
};
