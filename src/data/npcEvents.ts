/**
 * Événements narratifs NPC — Chevalier Max
 *
 * Ces événements sont purement narratifs : aucun effet sur les PV/MP/XP.
 * Ils utilisent le flux à deux phases de EventOverlay (choix → réponse).
 *
 * Distribution dans les zones :
 *   Max → salles_reu (salles 6-11), technique (salles 9-13)
 *
 * Sprite :
 *   Max → portrait: 'max' (public/assets/npcs/swordsman_max.png — Swordsman lvl3)
 */

import type { EventDef } from './types';

// ── Banque de réactions bonus ─────────────────────────────────────────────────
// Une réaction est tirée aléatoirement après chaque scène NPC (EventOverlay).

export const NPC_REACTIONS: readonly string[] = [
  'Ils repartent en courant sans vérifier si tu les suis.',
  'Le chevalier semble rassuré, sans raison identifiable.',
  'Un silence grave s\u2019installe, puis plus rien.',
  'Tu n\u2019as rien résolu, mais quelqu\u2019un semble convaincu du contraire.',
  'Le problème demeure entier, mais avec davantage de solennité.',
];

// ── Chevalier Max (4 scènes) ──────────────────────────────────────────────────

export const NPC_EVENTS: Record<string, EventDef> = {

  npc_max_postit: {
    id: 'npc_max_postit',
    title: 'Le post-it élu par le destin',
    text:
      'Vite ! Ce post-it doit rejoindre sa destinée avant la fin du cycle ! '
      + 'Je ne sais pas où il va, mais il y va intensément.',
    portrait: 'max',
    npcName: 'Chevalier Max',
    choices: [
      {
        label: 'Donne-moi le post-it.',
        log: 'Prends-le. Tu sentiras peut-être son orientation morale.',
      },
      {
        label: 'Quelle est sa destinée exactement ?',
        log: 'Si je le savais, nous serions déjà sauvés.',
      },
      {
        label: 'Je pense que ce post-it bluffe.',
        log: 'C\u2019est possible. Mais peut-on vraiment prendre ce risque ?',
      },
    ],
  },

  npc_max_chargeur: {
    id: 'npc_max_chargeur',
    title: 'Le chargeur digne de ce nom',
    text:
      'C\u2019est une crise logistique ! Il nous faut le dernier chargeur digne de ce nom ! '
      + 'Tous les autres ne transmettent que du courant sans conviction.',
    portrait: 'max',
    npcName: 'Chevalier Max',
    choices: [
      {
        label: 'Je vais chercher près des prises.',
        log: 'Bonne piste. Les grands chargeurs finissent souvent près de leur source.',
      },
      {
        label: 'Un chargeur sans conviction me semble suffisant.',
        log: 'Voilà précisément le genre de raisonnement qui mène aux batteries à 3 %.',
      },
      {
        label: 'Comment reconnaît-on un chargeur digne ?',
        log: 'À sa tenue. À sa droiture. À son câble presque sans nœud.',
      },
    ],
  },

  npc_max_plante: {
    id: 'npc_max_plante',
    title: 'La plante désalignée',
    text:
      'Regarde ! Cette plante verte n\u2019est plus alignée avec la vision du royaume ! '
      + 'Si personne n\u2019intervient, elle pourrait pencher idéologiquement.',
    portrait: 'max',
    npcName: 'Chevalier Max',
    choices: [
      {
        label: 'Je vais la réaligner.',
        log: 'Merci. Une feuille bien orientée vaut parfois mieux qu\u2019un discours.',
      },
      {
        label: 'La vision du royaume survivra.',
        log: 'Peut-être. Mais au prix de quelle inclinaison ?',
      },
      {
        label: 'Depuis quand une plante a-t-elle une ligne stratégique ?',
        log: 'Depuis qu\u2019elle a été mise en pot, évidemment.',
      },
    ],
  },

  npc_max_password: {
    id: 'npc_max_password',
    title: 'Le mot de passe perdu mais validé',
    text:
      'Situation critique ! Le mot de passe a été oublié, mais il reste valide. '
      + 'Nous sommes donc verrouillés par quelque chose qui fonctionne parfaitement.',
    portrait: 'max',
    npcName: 'Chevalier Max',
    choices: [
      {
        label: 'Essayons les évidences.',
        log: 'Nous l\u2019avons fait. Elles étaient toutes trop évidentes.',
      },
      {
        label: 'C\u2019est profondément inquiétant.',
        log: 'Enfin quelqu\u2019un qui mesure la gravité administrative de la situation.',
      },
      {
        label: 'Peut-être faut-il simplement l\u2019accepter.',
        log: 'Accepter ? Ce serait reconnaître la souveraineté du mot de passe.',
      },
    ],
  },
};
