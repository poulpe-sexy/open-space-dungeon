/**
 * Reward items — small stat boosts granted on successful riddles.
 *
 * Balance rules (kept deliberately modest so riddles don't trivialise combat):
 *   - Each item gives AT MOST a +1 ATK, +1 MAG, +2 maxHp, or +2 maxMp bump.
 *   - No item combines ATK and MAG. A single-stat bump keeps class identities.
 *   - Items are `once: true` per run (each riddle is unique → each item is
 *     unique), so a run caps at +10 ATK/MAG/HP aggregate assuming all 10
 *     riddles are answered correctly. Practical ceiling is much lower since
 *     only 1–3 riddles typically spawn per run.
 *
 * How to add a new reward item:
 *   1. Pick an id (snake_case).
 *   2. Append an entry below with: name, description, glyph (1 char), bonus.
 *   3. Reference it from a new riddle via `rewardItemId`.
 *   4. Data-integrity validator will warn if you forget either side.
 */

import type { RewardItem, RewardItemId } from './types';

export const REWARD_ITEMS: Record<RewardItemId, RewardItem> = {
  talisman_mvp: {
    id: 'talisman_mvp',
    name: 'Talisman du MVP',
    description: 'Imparfait mais utile. Taille les angles quand il le faut.',
    glyph: '★',
    bonus: { atk: 1 },
  },
  boussole_feedback: {
    id: 'boussole_feedback',
    name: 'Boussole du Feedback',
    description: "Pointe toujours vers la vérité qui dérange — mais construit.",
    glyph: '🧭',
    bonus: { mag: 1 },
  },
  chrono_flux: {
    id: 'chrono_flux',
    name: 'Chronomètre du Flux',
    description: 'Raccourcit le temps perdu. Ne se remonte jamais vers le passé.',
    glyph: '⏱',
    bonus: { maxHp: 2 },
  },
  sacoche_petits_lots: {
    id: 'sacoche_petits_lots',
    name: 'Sacoche des Petits Lots',
    description: 'Contient peu à la fois. Ça passe partout.',
    glyph: '🎒',
    bonus: { atk: 1 },
  },
  postit_kaizen: {
    id: 'postit_kaizen',
    name: 'Post-it Kaizen',
    description: 'Un petit carré jaune. Un pas de plus, tous les jours.',
    glyph: '▣',
    bonus: { mag: 1 },
  },
  loupe_antigaspi: {
    id: 'loupe_antigaspi',
    name: 'Loupe Anti-Gaspi',
    description: 'Révèle ce qui consomme sans jamais rien produire.',
    glyph: '🔍',
    bonus: { maxHp: 2 },
  },
  jeton_valeur: {
    id: 'jeton_valeur',
    name: 'Jeton de Valeur',
    description: "N'a de poids que si l'utilisateur le ramasse.",
    glyph: '◆',
    bonus: { atk: 1 },
  },
  carnet_apprentissage: {
    id: 'carnet_apprentissage',
    name: "Carnet d'Apprentissage",
    description: 'Rempli d\u2019hypothèses testées. Les ratées comptent double.',
    glyph: '📓',
    bonus: { mag: 1 },
  },
  badge_livraison: {
    id: 'badge_livraison',
    name: 'Badge de Livraison Continue',
    description: 'Dix petits pas battent toujours un grand saut raté.',
    glyph: '🏷',
    bonus: { atk: 1 },
  },
  bottes_terrain: {
    id: 'bottes_terrain',
    name: 'Bottes du Terrain',
    description: 'Boueuses. Vues. Utiles. Rien ne les remplace.',
    glyph: '🥾',
    bonus: { maxHp: 2 },
  },

  // ── Nouveaux items — épreuves supplémentaires ──────────────────────────────

  postit_action: {
    id: 'postit_action',
    name: "Post-it d'action",
    description: "Un seul point d'action. Concret, daté, attribué. Ça change tout.",
    glyph: '📌',
    bonus: { atk: 1 },
  },
  cuillere_gouvernance: {
    id: 'cuillere_gouvernance',
    name: 'Cuillère de Gouvernance',
    description: "Trouve dans chaque réunion un responsable, une date, une décision. Pas plus.",
    glyph: '🥄',
    bonus: { maxHp: 2 },
  },
  badge_provisoire: {
    id: 'badge_provisoire',
    name: 'Badge provisoire',
    description: "Estampille « provisoire » depuis 2019. Mais il ouvre encore les bonnes portes.",
    glyph: '🔖',
    bonus: { mag: 1 },
  },
  laser_priorisation: {
    id: 'laser_priorisation',
    name: 'Laser de Priorisation',
    description: "Pointe sur ce qui compte vraiment. Tout le reste pâlit.",
    glyph: '🔦',
    bonus: { mag: 1 },
  },
  tampon_net: {
    id: 'tampon_net',
    name: 'Tampon net',
    description: "Encre propre, décision claire. Un seul coup — sans ambiguïté.",
    glyph: '🖊',
    bonus: { maxHp: 2 },
  },
  casque_anti_ping: {
    id: 'casque_anti_ping',
    name: 'Casque anti-ping',
    description: "Filtre les @here à la source. Silence tactique, productivité maximale.",
    glyph: '🎧',
    bonus: { mag: 1 },
  },
  feuille_cadrage: {
    id: 'feuille_cadrage',
    name: 'Feuille de cadrage',
    description: "Périmètre, objectif, contraintes — une page, point. Les plantes approuvent.",
    glyph: '📄',
    bonus: { maxHp: 2 },
  },
  clarte_sprint: {
    id: 'clarte_sprint',
    name: 'Clarté de sprint',
    description: "Objectif de sprint lisible par toute l'équipe en moins de 10 secondes.",
    glyph: '🏁',
    bonus: { atk: 1 },
  },
};

export const REWARD_ITEM_IDS = Object.keys(REWARD_ITEMS) as RewardItemId[];
