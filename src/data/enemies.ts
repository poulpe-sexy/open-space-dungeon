import type { Enemy } from './types';
import { ORZAG_POWER_MULT } from '../game/balance';
// Enemy frame sets (animated portraits from the 2D Pixel Dungeon Asset Pack)
// are declared in src/game/assets.ts (ENEMY_FRAMES) and consumed by
// CombatOverlay via EnemyPortrait. No import needed here — the frame lookup
// is keyed by enemy.id at render time.

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
  // ─── Special-mechanic enemies (6 new archetypes) ──────────────────────────
  //
  // These enemies come from the 2D Pixel Dungeon Asset Pack and each introduce
  // a distinct combat pattern handled by CombatOverlay's special-ability engine.
  // Their sprites live in public/assets/enemies/ (24 PNGs, 4 frames each).
  // See ENEMY_FRAMES in src/game/assets.ts for the URL mapping.

  // ── 1. Client Blindé — armour archetype ─────────────────────────────────
  // sprite: skeleton2 v1  (steel-grey armoured skeleton)
  // mechanic: every player hit is reduced by 4 (min 1) — high HP, low damage
  client_blinde: {
    id: 'client_blinde',
    name: 'Client Blindé',
    stats: { atk: 2, mag: 1, hp: 38 },
    difficulty: 'normal',
    rewardXp: 12,
    color: 0x8b9ab8,
    description: "Il est là depuis dix ans. Aucune critique ne traverse plus son blindage.",
    attackNames: ['Procédure intangible', 'Non catégoriel', 'Refus tacite'],
    special: { kind: 'armor', reduction: 4 },
  },

  // ── 2. Client Moteur — self-buff archetype ───────────────────────────────
  // sprite: priest1 v1  (robed preacher with staff)
  // mechanic: gains +2 ATK every 2 enemy turns — starts weak, becomes scary
  client_moteur: {
    id: 'client_moteur',
    name: 'Client Moteur',
    stats: { atk: 4, mag: 3, hp: 16 },
    difficulty: 'normal',
    rewardXp: 11,
    color: 0xffaa33,
    description: "S'autoproclame visionnaire. Son ego s'emballe à chaque tour.",
    attackNames: ['Disruption positive', 'Synergies infinies', 'Vision Q4'],
    special: { kind: 'buff_self', atkBonus: 2, every: 2 },
  },

  // ── 3. Client Démoraliseur — hero ATK-debuff archetype ───────────────────
  // sprite: vampire v1  (caped drainer)
  // mechanic: hero effective ATK -2 every 2 enemy turns, capped at 1 min
  client_demoraliseur: {
    id: 'client_demoraliseur',
    name: 'Client Démoraliseur',
    stats: { atk: 5, mag: 4, hp: 15 },
    difficulty: 'normal',
    rewardXp: 12,
    color: 0x9b59b6,
    description: "Sa spécialité : faire douter. Chaque frappe perd de sa conviction.",
    attackNames: ['Critique sournoise', 'Commentaire non sollicité'],
    special: { kind: 'debuff_atk', amount: 2, every: 2 },
  },

  // ── 4. Client Brouilleur — hero MAG-debuff archetype ────────────────────
  // sprite: priest3 v1  (hunched dark-robed figure)
  // mechanic: hero effective MAG -2 every 2 enemy turns, capped at 0 min
  client_brouilleur: {
    id: 'client_brouilleur',
    name: 'Client Brouilleur',
    stats: { atk: 3, mag: 7, hp: 14 },
    difficulty: 'normal',
    rewardXp: 12,
    color: 0x2ecc71,
    description: "Émet un bruit de fond permanent. La concentration devient impossible.",
    attackNames: ['Bruit de fond', 'Interruption structurelle', 'Open space acoustique'],
    special: { kind: 'debuff_mag', amount: 2, every: 2 },
  },

  // ── 5. Client Vampirique — HP-drain archetype ────────────────────────────
  // sprite: vampire v2  (darker bat-cape)
  // mechanic: drains 3 HP directly every 2 enemy turns ON TOP of the attack
  client_vampirique: {
    id: 'client_vampirique',
    name: 'Client Vampirique',
    stats: { atk: 5, mag: 5, hp: 22 },
    difficulty: 'hard',
    rewardXp: 15,
    color: 0x8e44ad,
    description: "Chaque interaction lui profite. Il repart toujours avec quelque chose de toi.",
    attackNames: ['Extraction de valeur', 'Bilan asymétrique', 'ROI unilatéral'],
    special: { kind: 'drain_hp', amount: 3, every: 2 },
  },

  // ── 6. Client Lunatique — alternate passive/burst archetype ─────────────
  // sprite: skull v1  (glowing blue skull)
  // mechanic: odd enemy turns → passive (observes); even → burst hit (ATK ×2)
  client_lunatique: {
    id: 'client_lunatique',
    name: 'Client Lunatique',
    stats: { atk: 7, mag: 5, hp: 20 },
    difficulty: 'hard',
    rewardXp: 14,
    color: 0x3498db,
    description: "Absent et silencieux un tour. Furieux et dévastateur le suivant.",
    attackNames: ['Réveil brutal', 'Retour de flamme', 'Décharge émotionnelle'],
    special: { kind: 'alternate', idleTurns: 1 },
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
