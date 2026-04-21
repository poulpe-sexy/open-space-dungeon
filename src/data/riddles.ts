/**
 * Riddles — lean-tech themed multiple-choice events.
 *
 * Each riddle:
 *   - Displays a short prompt and 3–4 answer choices.
 *   - Grants one reward item on the correct answer (see rewardItems.ts).
 *   - On failure, shows a short neutral line — no stat penalty, no XP.
 *
 * How to add a new riddle:
 *   1. Pick an id (snake_case).
 *   2. Ensure a matching RewardItem exists in rewardItems.ts.
 *   3. Append an entry below.
 *   4. (optional) Tweak `RIDDLE_EVENT_WEIGHT` in generateEncounters.ts if you
 *      want riddles to spawn more or less frequently.
 *
 * Data-integrity validator (run at boot in DEV) flags:
 *   - unknown rewardItemId
 *   - correctIndex out of range
 */

import type { Riddle, RiddleId } from './types';

export const RIDDLES: Record<RiddleId, Riddle> = {
  mvp: {
    id: 'mvp',
    topic: 'Lean Tech — Produit',
    prompt:
      'Je suis petit, imparfait, mais je vais au front avant les autres. Qui suis-je ?',
    choices: [
      'Le MVP',
      'Le comité de pilotage',
      'Le cahier des charges infini',
      'La roadmap à 3 ans',
    ],
    correctIndex: 0,
    rewardItemId: 'talisman_mvp',
    successText: 'Juste. Mieux vaut un MVP debout qu\u2019une v1 qui n\u2019arrive jamais.',
    failText: 'Pas tout à fait. Un MVP se tient debout même avec un œil au beurre noir.',
  },

  feedback: {
    id: 'feedback',
    topic: 'Lean Tech — Feedback',
    prompt:
      'Plus je viens tôt, moins tu souffres plus tard. Pourtant beaucoup me craignent. Qui suis-je ?',
    choices: ['Le feedback', 'Le bug final', 'La dette cachée', 'Le tunnel projet'],
    correctIndex: 0,
    rewardItemId: 'boussole_feedback',
    successText: 'Oui — tôt et précis. Le feedback est un cadeau, même mal emballé.',
    failText: 'Pas exactement. Ce qu\u2019on craint d\u2019entendre est souvent ce qui sauve le plus de temps.',
  },

  lead_time: {
    id: 'lead_time',
    topic: 'Lean Tech — Flux',
    prompt:
      'On me raccourcit pour aller plus vite, mais je ne suis ni une réunion ni un déjeuner. Qui suis-je ?',
    choices: ['Le lead time', 'Le stand-up', 'Le sprint review', 'Le backlog'],
    correctIndex: 0,
    rewardItemId: 'chrono_flux',
    successText: 'Exact. Raccourcir le lead time, c\u2019est donner de l\u2019air au flux.',
    failText: 'Pas cette fois. Les rituels sont utiles, mais ici c\u2019est le temps de traversée qui compte.',
  },

  petits_lots: {
    id: 'petits_lots',
    topic: 'Lean Tech — Lots',
    prompt:
      'Quand je suis trop gros, tout se bloque. Quand je suis petit, tout respire. Que suis-je ?',
    choices: ['Le lot de travail', 'Le bureau du boss', 'Le tableau Excel', 'Le couloir RH'],
    correctIndex: 0,
    rewardItemId: 'sacoche_petits_lots',
    successText: 'Oui. Des petits lots, fréquents, finis — le flux adore ça.',
    failText: 'Non. On parle ici de ce qu\u2019on fait circuler dans le système.',
  },

  amelioration_continue: {
    id: 'amelioration_continue',
    topic: 'Lean Tech — Kaizen',
    prompt:
      'Je ne promets pas la perfection demain, seulement un mieux régulier aujourd\u2019hui. Qui suis-je ?',
    choices: [
      'L\u2019amélioration continue',
      'La refonte totale',
      'Le miracle produit',
      'Le gel des décisions',
    ],
    correctIndex: 0,
    rewardItemId: 'postit_kaizen',
    successText: 'Correct. Kaizen : 1 % mieux, tous les jours, sans héroïsme.',
    failText: 'Presque. La refonte totale promet beaucoup, tient rarement.',
  },

  gaspillage: {
    id: 'gaspillage',
    topic: 'Lean Tech — Muda',
    prompt:
      'Je consomme du temps, de l\u2019énergie et de l\u2019espoir, tout en donnant l\u2019impression d\u2019être utile. Que suis-je ?',
    choices: ['Le gaspillage', 'Le déploiement', 'Le test utilisateur', 'Le pair programming'],
    correctIndex: 0,
    rewardItemId: 'loupe_antigaspi',
    successText: 'Oui. Le muda adore se déguiser en travail sérieux.',
    failText: 'Pas tout à fait. Ces trois-là produisent de la valeur — même si ça ne saute pas aux yeux.',
  },

  valeur: {
    id: 'valeur',
    topic: 'Lean Tech — Valeur',
    prompt:
      'On parle souvent de moi, mais seul l\u2019utilisateur peut vraiment dire si j\u2019existe. Que suis-je ?',
    choices: ['La valeur', 'La vélocité', 'La documentation', 'La gouvernance'],
    correctIndex: 0,
    rewardItemId: 'jeton_valeur',
    successText: 'Exact. La valeur est jugée côté usage, pas côté tableau.',
    failText: 'Non. Ce qu\u2019on mesure en interne n\u2019est pas toujours ce qui compte dehors.',
  },

  apprentissage: {
    id: 'apprentissage',
    topic: 'Lean Tech — Apprentissage',
    prompt:
      'Dans une équipe saine, je compte parfois plus qu\u2019avoir raison du premier coup. Qui suis-je ?',
    choices: ['L\u2019apprentissage', 'L\u2019autorité', 'Le process figé', 'Le silence'],
    correctIndex: 0,
    rewardItemId: 'carnet_apprentissage',
    successText: 'Oui. Apprendre vite bat avoir raison lentement.',
    failText: 'Pas cette fois. Les équipes qui apprennent dépassent celles qui se défendent.',
  },

  livraison_frequente: {
    id: 'livraison_frequente',
    topic: 'Lean Tech — Livraison',
    prompt:
      'Je préfère dix petits pas utiles à un grand saut livré trop tard. Qui suis-je ?',
    choices: [
      'La livraison fréquente',
      'Le tunnel de développement',
      'La big bang release',
      'La validation finale unique',
    ],
    correctIndex: 0,
    rewardItemId: 'badge_livraison',
    successText: 'Correct. Livrer souvent, c\u2019est apprendre souvent.',
    failText: 'Non. Un gros bouquet le jour J impressionne, mais apprend peu.',
  },

  terrain: {
    id: 'terrain',
    topic: 'Lean Tech — Gemba',
    prompt:
      'Si tu veux comprendre vraiment un problème, il faut aller me voir plutôt que l\u2019imaginer de loin. Où suis-je ?',
    choices: [
      'Sur le terrain',
      'Dans le slide deck',
      'Dans la roadmap annuelle',
      'Dans le rituel hebdo',
    ],
    correctIndex: 0,
    rewardItemId: 'bottes_terrain',
    successText: 'Oui. Gemba : le vrai se passe là où les mains se salissent.',
    failText: 'Pas tout à fait. Les slides et les rituels décrivent le problème — ils ne le révèlent pas.',
  },
};

export const RIDDLE_IDS = Object.keys(RIDDLES) as RiddleId[];
