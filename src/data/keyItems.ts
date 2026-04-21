import type { KeyItem, KeyItemId } from './types';

/**
 * 4 key items. They gate progress inside the dungeon:
 * - `badge`         : ouvre les portes marquées "BADGE" (zone accueil → open_space)
 * - `password`      : débloque le terminal du datacenter (zone technique)
 * - `tampon`        : nécessaire pour valider le formulaire final
 * - `signed_form`   : récompense finale, permet d’entrer dans la boss_room
 */
export const KEY_ITEMS: Record<KeyItemId, KeyItem> = {
  badge: {
    id: 'badge',
    name: 'Badge',
    glyph: 'B',
    description: 'Badge plastifié "Intérimaire longue durée". Ouvre les portes sécurisées.',
    unlocks: 'badge_doors',
  },
  password: {
    id: 'password',
    name: 'Mot de passe',
    glyph: 'P',
    description: '"Passw0rd2024!" griffonné sur un post-it oublié sous un clavier.',
    unlocks: 'intranet_terminal',
  },
  tampon: {
    id: 'tampon',
    name: 'Tampon',
    glyph: 'T',
    description: 'Tampon officiel "VU ET APPROUVÉ". Plus lourd qu’il n’en a l’air.',
    unlocks: 'form_validation',
  },
  signed_form: {
    id: 'signed_form',
    name: 'Formulaire signé',
    glyph: 'F',
    description: 'Formulaire dûment signé, tamponné, parafé, daté. Ouvre la porte de la direction.',
    unlocks: 'boss_door',
  },
};

export const KEY_ITEM_ORDER: KeyItemId[] = ['badge', 'password', 'tampon', 'signed_form'];
