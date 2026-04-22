/**
 * Événements narratifs NPC — Chavalier Matt & Chevalier Max
 *
 * Ces événements sont purement narratifs : aucun effet sur les PV/MP/XP.
 * Ils utilisent le flux à deux phases de EventOverlay (choix → réponse).
 *
 * Distribution dans les zones :
 *   Matt → open_space (salles 3-8), salles_reu (salles 6-11)
 *   Max  → salles_reu (salles 6-11), technique (salles 9-13)
 *
 * Sprites :
 *   Matt → portrait: 'combat'  (frames combat_1-4.png — squelette combattant)
 *   Max  → portrait: 'event'   (frames event_1-4.png  — figure lumineuse)
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

// ── Chavalier Matt (4 scènes) ─────────────────────────────────────────────────

const MATT_EVENTS: Record<string, EventDef> = {

  npc_matt_trombone: {
    id: 'npc_matt_trombone',
    title: 'Le trombone stratégique',
    text:
      'Halte, aventurier ! Catastrophe majeure ! '
      + 'Le trombone stratégique a disparu du secteur nord ! '
      + 'Sans lui, tout classement devient hérésie !',
    portrait: 'combat',
    npcName: 'Chavalier Matt',
    choices: [
      {
        label: 'Quel trombone exactement ?',
        log: 'Le petit. Pas celui qui attache. Celui qui rassure.',
      },
      {
        label: 'Je vais fouiller immédiatement.',
        log: 'Trop tard. J\u2019en ai trouvé un autre, mais il n\u2019avait pas la bonne énergie.',
      },
      {
        label: 'Ce problème me semble… secondaire.',
        log: 'Secondaire ?! C\u2019est exactement ce qu\u2019aurait dit le chaos.',
      },
    ],
  },

  npc_matt_imprimante: {
    id: 'npc_matt_imprimante',
    title: 'L\u2019imprimante tombée au champ d\u2019honneur',
    text:
      'Par pitié, viens vite ! Une imprimante a péri en service actif. '
      + 'Elle a donné tout ce qu\u2019elle avait\u2026 y compris un bourrage niveau 4.',
    portrait: 'combat',
    npcName: 'Chavalier Matt',
    choices: [
      {
        label: 'Je m\u2019incline devant son sacrifice.',
        log: 'Ta dignité honore sa mémoire et le bac 2.',
      },
      {
        label: 'Peut-on encore la redémarrer ?',
        log: 'Redémarrer ? Tu parles d\u2019un miracle, pas d\u2019une réparation.',
      },
      {
        label: 'Je préfère me souvenir d\u2019elle vivante.',
        log: 'Sage décision. Son dernier bip était déjà un adieu.',
      },
    ],
  },

  npc_matt_reunion: {
    id: 'npc_matt_reunion',
    title: 'La réunion vide sous haute surveillance',
    text:
      'Urgence absolue ! Il faut sécuriser immédiatement la salle de réunion B12. '
      + 'Elle est vide\u2026 mais d\u2019un vide hautement suspect.',
    portrait: 'combat',
    npcName: 'Chavalier Matt',
    choices: [
      {
        label: 'Je vais vérifier la pièce.',
        log: 'Magnifique. Si tu n\u2019y vois rien, c\u2019est que le danger est discret.',
      },
      {
        label: 'Un vide suspect reste un vide.',
        log: 'Erreur classique. C\u2019est exactement comme ça qu\u2019on se fait surprendre par l\u2019absence.',
      },
      {
        label: 'As-tu essayé d\u2019y entrer toi-même ?',
        log: 'Oui. J\u2019ai ressenti un silence inhabituellement structuré.',
      },
    ],
  },

  npc_matt_mug: {
    id: 'npc_matt_mug',
    title: 'Le mug en détresse',
    text:
      'Aventurier ! Un mug est resté seul en salle de pause depuis l\u2019aube. '
      + 'Il n\u2019est ni lavé, ni revendiqué. '
      + 'Il faut agir avant qu\u2019il ne choisisse un camp.',
    portrait: 'combat',
    npcName: 'Chavalier Matt',
    choices: [
      {
        label: 'Je vais le déplacer en terrain neutre.',
        log: 'Excellente initiative. La diplomatie par évier reste une valeur sûre.',
      },
      {
        label: 'Je refuse de m\u2019impliquer dans ce conflit.',
        log: 'Alors l\u2019histoire se souviendra de ton retrait.',
      },
      {
        label: 'As-tu essayé de lui parler calmement ?',
        log: 'Oui. Il n\u2019a répondu que par une odeur tiède.',
      },
    ],
  },
};

// ── Chevalier Max (4 scènes) ──────────────────────────────────────────────────

const MAX_EVENTS: Record<string, EventDef> = {

  npc_max_postit: {
    id: 'npc_max_postit',
    title: 'Le post-it élu par le destin',
    text:
      'Vite ! Ce post-it doit rejoindre sa destinée avant la fin du cycle ! '
      + 'Je ne sais pas où il va, mais il y va intensément.',
    portrait: 'event',
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
    portrait: 'event',
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
    portrait: 'event',
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
    portrait: 'event',
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

// ── Export fusionné ────────────────────────────────────────────────────────────

export const NPC_EVENTS: Record<string, EventDef> = {
  ...MATT_EVENTS,
  ...MAX_EVENTS,
};
