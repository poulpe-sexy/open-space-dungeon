import type { Enemy } from './types';
import { ORZAG_POWER_MULT } from '../game/balance';

/**
 * Some enemies (currently only Orzag, the hidden boss) ship with a dedicated
 * portrait PNG. `Enemy` doesn't require this field — if it's absent the combat
 * overlay falls back to a generic TileSprite silhouette tinted with
 * `enemy.color`. Kept optional + declared-inline so the extra data flows
 * without touching the `Enemy` type (no impact on the 8 base enemies).
 */
export interface EnemyWithPortrait extends Enemy {
  portrait?: string;
  /** Optional short stinger shown before the first combat turn. Used by the
   *  secret boss to deliver its "Miaou" intro line; ignored when absent. */
  introLine?: string;
}

/**
 * 8 enemy templates, all themed "Client + adjectif" as the dungeon is a
 * corporate-fantasy nightmare. Difficulty tiers are:
 *   easy   — zone accueil / open_space début
 *   normal — open_space, salles_reu
 *   hard   — technique
 *   boss   — direction (final encounter)
 *
 * Damage formula at combat time: round(stats.atk * (0.9 + rand*0.2)).
 * `attackNames` is purely flavor, displayed in the combat log.
 *
 * Balance note: the mid-tier enemies were left untouched — they read as
 * correctly scaled (an L1 hero takes 3–7 damage per hit, manageable). Only
 * the final boss and Orzag moved. See `docs/balance.md`.
 */
export const ENEMIES: Record<string, EnemyWithPortrait> = {
  client_hesitant: {
    id: 'client_hesitant',
    name: 'Client Hésitant',
    stats: { atk: 3, mag: 1, hp: 8 },
    difficulty: 'easy',
    rewardXp: 3,
    color: 0x63e6a1,
    description: "Ne sait pas ce qu'il veut. Change d'avis chaque tour.",
    attackNames: ['Hésitation', 'Demande contradictoire'],
  },
  client_sceptique: {
    id: 'client_sceptique',
    name: 'Client Sceptique',
    stats: { atk: 4, mag: 2, hp: 10 },
    difficulty: 'easy',
    rewardXp: 4,
    color: 0x8a93b8,
    description: 'Croise les bras. Place "ok… mais" devant chaque phrase.',
    attackNames: ['Sourcil levé', 'Ok mais'],
  },
  client_exigeant: {
    id: 'client_exigeant',
    name: 'Client Exigeant',
    stats: { atk: 6, mag: 3, hp: 14 },
    difficulty: 'normal',
    rewardXp: 8,
    color: 0xffcc33,
    description: 'Demande "le premium". Rejette systématiquement le devis.',
    attackNames: ['Renégociation', 'Cahier des charges v12'],
  },
  client_anxieux: {
    id: 'client_anxieux',
    name: 'Client Anxieux',
    stats: { atk: 3, mag: 6, hp: 12 },
    difficulty: 'normal',
    rewardXp: 8,
    color: 0xff7a4d,
    description: "Envoie 40 mails d'affilée puis appelle \"juste pour checker\".",
    attackNames: ['Chaîne de mails', 'Ping vocal'],
  },
  client_chronophage: {
    id: 'client_chronophage',
    name: 'Client Chronophage',
    stats: { atk: 5, mag: 4, hp: 18 },
    difficulty: 'normal',
    rewardXp: 10,
    color: 0xc78cff,
    description: "Ses 1:1 durent 2 h. Aucune décision n'est prise.",
    attackNames: ['Réunion allongée', 'Sujet annexe'],
  },
  client_fantome: {
    id: 'client_fantome',
    name: 'Client Fantôme',
    stats: { atk: 7, mag: 5, hp: 20 },
    difficulty: 'hard',
    rewardXp: 14,
    color: 0x9ab0ff,
    description: 'Ne répond plus depuis 3 semaines. Réapparaît en crise.',
    attackNames: ['Silence radio', 'Retour urgence'],
  },
  client_zen: {
    id: 'client_zen',
    name: 'Client Zen',
    stats: { atk: 4, mag: 8, hp: 22 },
    difficulty: 'hard',
    rewardXp: 15,
    color: 0x63c6ff,
    description: "Sourit. Cite Sun Tzu. T'ignore poliment.",
    attackNames: ['Respiration consciente', 'Citation zen'],
  },
  // ─── Final boss ────────────────────────────────────────────────────────────
  // Rebalanced from 13 / 12 / 55 → 11 / 10 / 60. The old 13-damage swing
  // one-shot Laurent (HP 12) and two-shot Marine/Alphonse at level 1, forcing
  // a mandatory L6–L7 before a fair fight. New profile: slightly tankier
  // (longer fight = more drama), slightly softer hits (L4–L5 survivable).
  client_legendaire: {
    id: 'client_legendaire',
    name: "l'Administration",
    stats: { atk: 11, mag: 10, hp: 60 },
    difficulty: 'boss',
    rewardXp: 60,
    color: 0xff5a5a,
    description: "Entité bureaucratique suprême. Personne ne l'a vue. Tout le monde la craint.",
    attackNames: [
      'Formulaire en triple exemplaire',
      'Renvoi au service compétent',
      'Décret irrévocable',
      'Audit-surprise',
    ],
  },

  // ─── Hidden boss (secret ending, see src/game/secretEnding.ts) ───────────
  //
  // Orzag is NOT referenced by any screen. He only spawns when the player
  // unlocks the secret ending (100 % of visited rooms resolved). Because he
  // lives outside SCREENS, dataIntegrity.ts never walks into him — which is
  // by design.
  //
  // Stat rule: Orzag = client_legendaire × ORZAG_POWER_MULT (currently 2).
  //   base  = 11 / 10 / 60
  //   orzag = 22 / 20 / 120
  // The rule is asserted by `balance.test.ts` — if you re-tune the main boss
  // the test will nag you to re-derive Orzag, keeping the 2× promise honest.
  // Reward XP bumped to 150 — beating Orzag is the true ending, worth more.
  orzag_coeur_pierre: {
    id: 'orzag_coeur_pierre',
    name: 'Orzag Cœur de Pierre',
    stats: {
      atk: 11 * ORZAG_POWER_MULT,
      mag: 10 * ORZAG_POWER_MULT,
      hp:  60 * ORZAG_POWER_MULT,
    },
    difficulty: 'boss',
    rewardXp: 150,
    color: 0x2a2d36, // anthracite / basalt grey
    description:
      "Un petit chat gris aux yeux jaunes. Il ne cligne pas. Il ne miaule qu'une fois.",
    // A single, dramatic, completely overpowered attack. The combat log
    // renders it verbatim — part of the joke is that every turn it's the
    // same word and it still hurts.
    attackNames: ['Miaou'],
    // BASE_URL prefix keeps this URL working both in local dev (`/...`) and
    // under a GitHub Pages subpath (e.g. `/open-space-dungeon/...`).
    portrait: `${import.meta.env.BASE_URL}assets/bosses/orzag-coeur-de-pierre.png`,
    introLine:
      'Le petit chat s\'assoit. Il te fixe. Tu comprends que tu ne sortiras pas d\'ici sans un combat — et que lui, oui.',
  },
};
