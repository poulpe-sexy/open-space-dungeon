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

export const HERO_ID = ['marine', 'alphonse', 'laurent'] as const;
export type HeroId = (typeof HERO_ID)[number];

export const HERO_PORTRAITS: Record<HeroId, string> = {
  marine: asset('assets/characters/MARINE.png'),
  alphonse: asset('assets/characters/ALPHONSE.png'),
  laurent: asset('assets/characters/LAURENT.png'),
};

/**
 * Walking-cycle GIFs used on the dungeon tile map. Decoded once at runtime by
 * `AnimatedGifSprite` (bbox-crop + chroma-key) so the solid backdrops in the
 * source GIFs come out with real transparency. `HERO_PORTRAITS` remains the
 * static fallback while the GIF decodes.
 */
export const HERO_WALK_GIF: Record<HeroId, string> = {
  marine: asset('assets/characters/marine.gif'),
  alphonse: asset('assets/characters/alphonse.gif'),
  laurent: asset('assets/characters/laurent.gif'),
};

/**
 * Class tint used as accent color AND as fallback background when the PNG is
 * missing (HeroPortrait falls back to initial + tint).
 */
export const HERO_TINT: Record<HeroId, string> = {
  marine: '#ff7a4d',
  alphonse: '#63c6ff',
  laurent: '#c78cff',
};

/** Title logo displayed on the intro + title screens. Text fallback if missing. */
export const TITLE_LOGO = asset('assets/branding/title-logo.png');

/** Check if a public asset is served (used once on boot to log missing PNGs). */
export const probeAsset = async (url: string): Promise<boolean> => {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
};
