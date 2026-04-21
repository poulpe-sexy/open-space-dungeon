/**
 * Maps a screen's zoneId to a CSS custom-property colour string.
 * Both slice screens (capitalised) and real screens (snake_case) are handled
 * by normalising the zoneId before lookup.
 */
export const ZONE_CSS: Record<string, string> = {
  accueil:    'var(--zone-accueil)',
  open_space: 'var(--zone-corridor)',
  salles_reu: 'var(--zone-projet)',
  technique:  'var(--zone-projet)',
  direction:  'var(--zone-direction)',
  archives:   'var(--zone-archives)',
};

/** Normalise and look up a zone colour. Falls back to --accent. */
export function getZoneColor(zoneId: string): string {
  const key = zoneId.toLowerCase().replace(/[\s-]+/g, '_');
  return ZONE_CSS[key] ?? 'var(--accent)';
}
