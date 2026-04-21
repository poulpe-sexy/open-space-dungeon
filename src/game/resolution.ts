// =============================================================================
// OPEN SPACE DUNGEON — Generic Resolution Engine
//
// Formula:   total = statBonus(hero, kind) + classBonus(hero.class, kind) + d6
// Grades:    critical (gap ≥ +3) · success (gap ≥ 0) · failure (gap ≥ −2) · severe
// =============================================================================

import type { Hero, HeroClass, EncounterKind, Difficulty } from '../data/types';

/**
 * Riddles run through their own overlay (RiddleOverlay) — deterministic
 * multiple-choice, not a stat-driven dice roll. So the resolution engine
 * works on a narrowed set of kinds that excludes 'riddle'.
 */
export type ResolvableKind = Exclude<EncounterKind, 'riddle'>;

// ── Difficulty thresholds ─────────────────────────────────────────────────────
export const THRESHOLDS: Record<Difficulty, number> = {
  easy:   4,
  normal: 6,
  hard:   9,
  boss:   12,
};

// ── Class bonuses ─────────────────────────────────────────────────────────────
// Reflects each archetype's strengths across encounter types.
export const CLASS_BONUS: Record<HeroClass, Record<ResolvableKind, number>> = {
  Choc:   { combat: 3, trap: 1, puzzle: 0, event: 0 },
  Roublard: { combat: 1, trap: 0, puzzle: 1, event: 2 },
  Sage:   { combat: 0, trap: 0, puzzle: 3, event: 1 },
};

// ── Stat bonus ────────────────────────────────────────────────────────────────
// Each encounter type draws on a different stat from the hero's triad.
export function statBonus(hero: Hero, kind: ResolvableKind): number {
  const { atk, mag, hp } = hero.stats;
  switch (kind) {
    case 'combat': return Math.floor(atk / 3);          // physical power
    case 'puzzle': return Math.floor(mag / 3);          // mental acuity
    case 'trap':   return Math.floor(hp  / 6);          // resilience / reflexes
    case 'event':  return Math.floor((atk + mag) / 6);  // social versatility
  }
}

export function classBonus(heroClass: HeroClass, kind: ResolvableKind): number {
  return CLASS_BONUS[heroClass][kind];
}

/** Combined bonus before the dice roll. */
export function totalBonus(hero: Hero, kind: ResolvableKind): number {
  return statBonus(hero, kind) + classBonus(hero.className, kind);
}

// ── Success probability ───────────────────────────────────────────────────────
/**
 * Probability (0–100 %) of reaching at least a 'success' grade.
 * Counts how many faces of a d6 would yield total ≥ threshold.
 */
export function successChance(
  hero: Hero,
  kind: ResolvableKind,
  difficulty: Difficulty,
): number {
  const bonus     = totalBonus(hero, kind);
  const threshold = THRESHOLDS[difficulty];
  // Need: bonus + d6 ≥ threshold  →  d6 ≥ threshold − bonus
  const minRoll   = threshold - bonus;
  const successes = Math.max(0, Math.min(6, 7 - minRoll));
  return Math.round((successes / 6) * 100);
}

// ── Result grade ──────────────────────────────────────────────────────────────
export type ResolutionGrade = 'critical' | 'success' | 'failure' | 'severe';

export interface ResolutionResult {
  roll:      number;          // d6 face (1–6)
  bonus:     number;          // statBonus + classBonus
  total:     number;          // roll + bonus
  threshold: number;          // difficulty target
  grade:     ResolutionGrade;
  hpDelta:   number;
  mpDelta:   number;
  narrative: string;
}

// ── Grade effects per encounter type ─────────────────────────────────────────
const EFFECTS: Record<ResolvableKind, Record<ResolutionGrade, { hp: number; mp: number }>> = {
  combat: {
    critical: { hp:  2, mp:  1 },
    success:  { hp:  0, mp:  0 },
    failure:  { hp: -3, mp:  0 },
    severe:   { hp: -5, mp: -1 },
  },
  trap: {
    critical: { hp:  0, mp:  1 },
    success:  { hp:  0, mp:  0 },
    failure:  { hp: -2, mp:  0 },
    severe:   { hp: -4, mp: -1 },
  },
  puzzle: {
    critical: { hp:  2, mp:  2 },
    success:  { hp:  1, mp:  0 },
    failure:  { hp:  0, mp: -1 },
    severe:   { hp: -2, mp: -1 },
  },
  event: {
    critical: { hp:  1, mp:  1 },
    success:  { hp:  0, mp:  0 },
    failure:  { hp:  0, mp:  0 },
    severe:   { hp: -1, mp:  0 },
  },
};

// ── Narrative text per grade ──────────────────────────────────────────────────
const NARRATIVES: Record<ResolvableKind, Record<ResolutionGrade, string>> = {
  combat: {
    critical: 'Combattant·e de premier ordre. L\u2019ennemi recule avant la fin du round.',
    success:  'Tu tiens bon. L\u2019affrontement se conclut en ta faveur.',
    failure:  'L\u2019\u00e9change tourne mal. Tu repars meurtri·e.',
    severe:   'Tu prends une vraie ra\u00efl\u00e9e. Le moral en prend un coup.',
  },
  trap: {
    critical: 'R\u00e9flexes parfaits \u2014 tu traverses comme si \u00e7a n\u2019existait pas.',
    success:  'Tu navigues le pi\u00e8ge sans encombre.',
    failure:  'Le pi\u00e8ge t\u2019accroche au passage. A\u00ef\u00e9.',
    severe:   'Tu fonces dedans t\u00eate baiss\u00e9e. D\u00e9g\u00e2ts maximaux.',
  },
  puzzle: {
    critical: 'Brillant·e\u00a0! La solution s\u2019impose en un \u00e9clair.',
    success:  'Bonne r\u00e9ponse. Tu passes \u00e0 la suite.',
    failure:  'Pas exactement juste \u2014 quelques ressources perdues \u00e0 t\u00e2tonner.',
    severe:   'Compl\u00e8tement \u00e0 c\u00f4t\u00e9. Tu ressors confus·e et \u00e9puis\u00e9·e.',
  },
  event: {
    critical: 'Tu g\u00e8res la situation avec une aisance d\u00e9concertante.',
    success:  '\u00c7a se passe bien. L\u2019ambiance reste correcte.',
    failure:  'Un peu d\u2019inconfort, mais rien de dramatique.',
    severe:   'Maladresse totale. Tu t\u2019en souviendras.',
  },
};

// ── Advisor flavor per class × kind ──────────────────────────────────────────
const ADVISOR_FLAVOR: Record<HeroClass, Record<ResolvableKind, string>> = {
  Choc: {
    combat:  'Marine est dans son \u00e9l\u00e9ment. Attaque directe.',
    trap:    'Marine peut forcer le passage \u2014 attention aux d\u00e9g\u00e2ts.',
    puzzle:  'Ce n\u2019est pas le fort de Marine. Bonne chance.',
    event:   'Marine peut g\u00e9rer, sans \u00eatre dans son registre.',
  },
  Roublard: {
    combat:  'Alphonse peut tenir, sans \u00eatre le meilleur choix.',
    trap:    'Alphonse improvise \u2014 r\u00e9sultat incertain.',
    puzzle:  'Alphonse a l\u2019\u0153il pour les d\u00e9tails. Plut\u00f4t bon.',
    event:   'Alphonse est parfait ici. Il sait parler aux gens.',
  },
  Sage: {
    combat:  'Laurent pr\u00e9f\u00e8re les solutions distantes. Risqu\u00e9 en m\u00eal\u00e9e.',
    trap:    'Laurent proc\u00e8de m\u00e9thodiquement. R\u00e9sultat correct.',
    puzzle:  'Laurent est dans son domaine. Probabilit\u00e9 maximale.',
    event:   'Laurent \u00e9coute et analyse. Bon, sans \u00eatre brillant.',
  },
};

export function advisorFlavor(hero: Hero, kind: ResolvableKind): string {
  return ADVISOR_FLAVOR[hero.className][kind];
}

// ── Core resolve function ─────────────────────────────────────────────────────
/**
 * Roll once and return a complete result.
 * Pass `_rollOverride` (1–6) in unit tests to get a deterministic outcome.
 */
export function resolve(
  hero: Hero,
  kind: ResolvableKind,
  difficulty: Difficulty,
  _rollOverride?: number,
): ResolutionResult {
  const roll      = _rollOverride ?? (Math.floor(Math.random() * 6) + 1);
  const bonus     = totalBonus(hero, kind);
  const total     = roll + bonus;
  const threshold = THRESHOLDS[difficulty];
  const gap       = total - threshold;

  const grade: ResolutionGrade =
    gap >= 3  ? 'critical' :
    gap >= 0  ? 'success'  :
    gap >= -2 ? 'failure'  :
                'severe';

  const fx = EFFECTS[kind][grade];
  return {
    roll,
    bonus,
    total,
    threshold,
    grade,
    hpDelta:   fx.hp,
    mpDelta:   fx.mp,
    narrative: NARRATIVES[kind][grade],
  };
}

// ── Best-hero advisor ─────────────────────────────────────────────────────────
/**
 * Given a list of heroes, return the one with the highest success chance
 * for the specified encounter. On a tie, the first in the list wins.
 */
export function adviseBestHero(
  heroes: Hero[],
  kind:   ResolvableKind,
  difficulty: Difficulty,
): Hero {
  return heroes.reduce((best, h) =>
    successChance(h, kind, difficulty) > successChance(best, kind, difficulty) ? h : best,
  );
}
