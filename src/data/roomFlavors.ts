// =============================================================================
// Textes d'ambiance à l'entrée de chaque salle.
// Règles :
//   - Toujours commencer par "Tu..."
//   - Tonalité : corporate-fantasy, un peu absurde, un peu drôle
//   - Choisi au hasard dans le pool du type de salle
// =============================================================================

import type { ScreenType } from './types';

const FLAVORS: Record<ScreenType, readonly string[]> = {
  entrance: [
    "Tu sens un courant d'air et une odeur de café décaféiné.",
    "Tu franchis le tourniquet. Personne ne t'a demandé ton badge.",
    "Tu entends un vigile ronfler derrière le comptoir.",
    "Tu aperçois un pot de bonbons à l'accueil. Il est vide depuis 2019.",
    "Tu pousses la porte vitrée. Elle grince comme un vieux contrat CDD.",
  ],

  corridor: [
    "Tu avances dans un couloir qui sent la moquette humide et les open spaces oubliés.",
    "Tu entends un néon clignoter au loin comme un SOS en morse.",
    "Tu passes devant une imprimante abandonnée. Elle pleure doucement du toner.",
    "Tu marches sur une feuille imprimée en recto-verso pour rien.",
    "Tu sens qu'un mail \"urgent\" est en train de se rédiger quelque part.",
    "Tu longes des murs beiges qui n'ont jamais connu la lumière du jour.",
  ],

  open_space: [
    "Tu sens une odeur de sueur et de brainstorming ici.",
    "Tu entends trente claviers taper à l'unisson. C'est presque beau.",
    "Tu repères un stand-up meeting qui dure depuis 47 minutes.",
    "Tu aperçois un post-it rose sur lequel est écrit \"NE PAS PANIQUER\".",
    "Tu comprends que personne ne regarde son écran — tout le monde regarde Slack.",
    "Tu trébuches sur un câble USB mystérieusement branché à rien.",
    "Tu sens la tension d'une rétrospective mal digérée.",
  ],

  meeting_room: [
    "Tu entres dans une salle de réunion. Le projecteur affiche \"Connexion…\" depuis 2018.",
    "Tu sens l'odeur de vingt cafés tièdes et d'une décision qui ne sera jamais prise.",
    "Tu vois un paperboard couvert de flèches qui ne mènent nulle part.",
    "Tu remarques que la réunion d'avant n'est toujours pas terminée.",
    "Tu aperçois un agenda bloqué pour \"Sync stratégique récurrente\" jusqu'en 2031.",
    "Tu entends quelqu'un dire \"on va caler un point\". Tu frissonnes.",
  ],

  break_room: [
    "Tu sens un mélange de micro-ondes et de désespoir doux.",
    "Tu vois une machine à café qui demande un mot de passe.",
    "Tu trouves un Tupperware abandonné. Il bouge tout seul.",
    "Tu remarques le frigo collectif. Tu ne l'ouvriras pas.",
    "Tu aperçois le panneau \"Merci de laver vos tasses\" bafoué depuis des mois.",
    "Tu entends deux collègues débattre du nouveau logo. C'est le même logo.",
  ],

  technical: [
    "Tu entres dans la salle serveur. L'air est plus froid que ton manager.",
    "Tu entends un bourdonnement de ventilateurs qui masque toute pensée.",
    "Tu vois un écran noir avec un curseur qui clignote. Il attend quelque chose.",
    "Tu sens une odeur de plastique chaud et de dettes techniques.",
    "Tu aperçois un câble ethernet noué en huit. Tu ne veux pas savoir pourquoi.",
    "Tu remarques un sticker \"NE PAS DÉBRANCHER\" sur une multiprise improbable.",
  ],

  executive: [
    "Tu entres dans le bureau de direction. La moquette est épaisse. Trop épaisse.",
    "Tu aperçois un mug \"World's Best Boss\" couvert de poussière.",
    "Tu sens une odeur de cuir synthétique et de restructuration.",
    "Tu remarques un tableau Excel imprimé sur trois pages A3. Tu as peur.",
    "Tu vois une plaque dorée. Il n'y a pas de nom dessus.",
    "Tu entends une voix dicter des notes vocales depuis une porte fermée.",
  ],

  safe_room: [
    "Tu entres dans une pièce calme. Aucun mail n'arrive ici.",
    "Tu t'assois un instant. Personne ne te demande de \"prendre cinq minutes\".",
    "Tu sens que le temps a ralenti. Peut-être que c'est le Wi-Fi.",
    "Tu trouves une plante verte vivante. Un miracle corporate.",
    "Tu remarques l'absence totale de post-its. C'est presque spirituel.",
  ],

  boss_room: [
    "Tu avances. L'air devient lourd de formulaires non signés.",
    "Tu sens chaque fibre de moquette peser le poids de la hiérarchie.",
    "Tu entends une agrafeuse au loin. Elle attend son heure.",
    "Tu comprends que tu n'aurais peut-être pas dû venir seul.",
  ],
};

/**
 * Pick a random flavor line for a room type. Uses Math.random so each entry
 * feels fresh — reproducibility isn't needed for flavor lore.
 */
export function pickRoomFlavor(type: ScreenType): string {
  const pool = FLAVORS[type];
  if (!pool || pool.length === 0) return '';
  return pool[Math.floor(Math.random() * pool.length)];
}
