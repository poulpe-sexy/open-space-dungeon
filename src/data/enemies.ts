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
 * Balance note (15-room pass): every regular enemy gained +1 or +2 HP so
 * combats last ~10 % longer — the longer run needed more MP/HP pressure per
 * fight. ATK floors are unchanged (the "no L1 one-shot" test still holds).
 * Main boss re-tuned 11/10/60 → 12/11/70 to match the new L6-expected entry.
 * See `docs/balance.md`.
 */
export const ENEMIES: Record<string, EnemyWithPortrait> = {
  client_hesitant: {
    id: 'client_hesitant',
    name: 'Client Hésitant',
    stats: { atk: 3, mag: 1, hp: 9 },
    difficulty: 'easy',
    rewardXp: 3,
    color: 0x63e6a1,
    description: "Ne sait pas ce qu'il veut. Change d'avis chaque tour.",
    attackNames: ['Hésitation', 'Demande contradictoire'],
  },
  client_sceptique: {
    id: 'client_sceptique',
    name: 'Client Sceptique',
    stats: { atk: 4, mag: 2, hp: 11 },
    difficulty: 'easy',
    rewardXp: 4,
    color: 0x8a93b8,
    description: 'Croise les bras. Place "ok… mais" devant chaque phrase.',
    attackNames: ['Sourcil levé', 'Ok mais'],
  },
  client_exigeant: {
    id: 'client_exigeant',
    name: 'Client Exigeant',
    stats: { atk: 6, mag: 3, hp: 16 },
    difficulty: 'normal',
    rewardXp: 8,
    color: 0xffcc33,
    description: 'Demande "le premium". Rejette systématiquement le devis.',
    attackNames: ['Renégociation', 'Cahier des charges v12'],
  },
  client_anxieux: {
    id: 'client_anxieux',
    name: 'Client Anxieux',
    stats: { atk: 4, mag: 6, hp: 13 },
    difficulty: 'normal',
    rewardXp: 8,
    color: 0xff7a4d,
    description: "Envoie 40 mails d'affilée puis appelle \"juste pour checker\".",
    attackNames: ['Chaîne de mails', 'Ping vocal'],
  },
  client_chronophage: {
    id: 'client_chronophage',
    name: 'Client Chronophage',
    stats: { atk: 5, mag: 4, hp: 20 },
    difficulty: 'normal',
    rewardXp: 10,
    color: 0xc78cff,
    description: "Ses 1:1 durent 2 h. Aucune décision n'est prise.",
    attackNames: ['Réunion allongée', 'Sujet annexe'],
  },
  client_fantome: {
    id: 'client_fantome',
    name: 'Client Fantôme',
    stats: { atk: 7, mag: 5, hp: 22 },
    difficulty: 'hard',
    rewardXp: 14,
    color: 0x9ab0ff,
    description: 'Ne répond plus depuis 3 semaines. Réapparaît en crise.',
    attackNames: ['Silence radio', 'Retour urgence'],
  },
  client_zen: {
    id: 'client_zen',
    name: 'Client Zen',
    stats: { atk: 4, mag: 8, hp: 24 },
    difficulty: 'hard',
    rewardXp: 15,
    color: 0x63c6ff,
    description: "Sourit. Cite Sun Tzu. T'ignore poliment.",
    attackNames: ['Respiration consciente', 'Citation zen'],
  },
  // ─── Final boss ────────────────────────────────────────────────────────────
  // History:
  //  - Original: 13 / 12 / 55. Too spiky (one-shot Laurent, forced L6+ start).
  //  - 10-room pass: 11 / 10 / 60. Softer, tanky enough for L5 entry.
  //  - 15-room pass (current): 12 / 11 / 70. Longer run → L6 expected, so
  //    the boss recovers a bit of teeth. Still survives a worst-case 2-shot
  //    at L6 (see test `no hero dies from two full-power main-boss hits at
  //    L6`). Kept in lock-step with `MAIN_BOSS_REFERENCE` in balance.ts.
  client_legendaire: {
    id: 'client_legendaire',
    name: "l'Administration",
    stats: { atk: 12, mag: 11, hp: 70 },
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
  //   base  = 12 / 11 / 70
  //   orzag = 24 / 22 / 140
  // The rule is asserted by `balance.test.ts` — if you re-tune the main boss
  // the test will nag you to re-derive Orzag, keeping the 2× promise honest.
  // Reward XP bumped to 150 — beating Orzag is the true ending, worth more.
  orzag_coeur_pierre: {
    id: 'orzag_coeur_pierre',
    name: 'Orzag Cœur de Pierre',
    stats: {
      atk: 12 * ORZAG_POWER_MULT,
      mag: 11 * ORZAG_POWER_MULT,
      hp:  70 * ORZAG_POWER_MULT,
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
