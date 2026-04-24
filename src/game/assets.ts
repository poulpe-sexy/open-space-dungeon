/**
 * Single source of truth for every external asset the game loads.
 * Any component / scene that needs a URL should import from here, so renaming
 * a file means changing one line.
 *
 * ── Base-path awareness ───────────────────────────────────────────────────
 * The game is deployed to GitHub Pages under a subpath (e.g.
 * `https://user.github.io/open-space-dungeon/`). Vite's `base` config makes
 * `import.meta.env.BASE_URL` resolve to that subpath in production and to
 * `/` in local dev — so prefixing every asset URL with BASE lets the same
 * string work in both environments.
 *
 * BASE_URL always ends with `/`, so asset paths here must NOT start with a `/`.
 */

const BASE = import.meta.env.BASE_URL;

/** Prefixes a relative asset path (no leading slash) with the current base URL. */
export const asset = (path: string): string => `${BASE}${path}`;

export const HERO_ID = ['marine', 'alphonse', 'laurent', 'matthieu'] as const;
export type HeroId = (typeof HERO_ID)[number];

export const HERO_PORTRAITS: Record<HeroId, string> = {
  marine:   asset('assets/characters/MARINE.png'),
  alphonse: asset('assets/characters/ALPHONSE.png'),
  laurent:  asset('assets/characters/LAURENT.png'),
  matthieu: asset('assets/characters/MATTHIEU_portrait.png'),
};

/**
 * Class tint used as accent color AND as fallback background when the PNG is
 * missing (HeroPortrait falls back to initial + tint).
 */
export const HERO_TINT: Record<HeroId, string> = {
  marine:   '#ff7a4d',
  alphonse: '#63c6ff',
  laurent:  '#c78cff',
  matthieu: '#56b884', // vert jade — Kaizen, progression, croissance
};

/** Title logo displayed on the intro + title screens. Text fallback if missing. */
export const TITLE_LOGO = asset('assets/branding/title-logo.png');

/**
 * Enemy portrait frame sets — 4-frame idle animations from the
 * 2D Pixel Dungeon Asset Pack. Each entry maps an enemy id to the four
 * sequential PNG paths. CombatOverlay renders them as AnimatedSprite.
 *
 * Sprite sources (all 16×16 px, displayed at 64×64 with pixelated scaling):
 *   client_blinde       → skeleton2 v1  (armoured skeleton)
 *   client_moteur       → priest1  v1   (robed preacher)
 *   client_demoraliseur → vampire  v1   (caped drainer)
 *   client_brouilleur   → priest3  v1   (hunched dark robe)
 *   client_vampirique   → vampire  v2   (darker bat-cape)
 *   client_lunatique    → skull    v1   (glowing blue skull)
 */
const E = asset('assets/enemies');
const eFrames = (name: string) =>
  [1, 2, 3, 4].map((i) => `${E}/${name}_${i}.png`);

export const ENEMY_FRAMES: Record<string, string[]> = {
  client_blinde:       eFrames('blinde'),
  client_moteur:       eFrames('moteur'),
  client_demoraliseur: eFrames('demoraliseur'),
  client_brouilleur:   eFrames('brouilleur'),
  client_vampirique:   eFrames('vampirique'),
  client_lunatique:    eFrames('lunatique'),
};

/** Check if a public asset is served (used once on boot to log missing PNGs). */
export const probeAsset = async (url: string): Promise<boolean> => {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
};
