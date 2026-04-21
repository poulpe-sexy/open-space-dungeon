/**
 * HowToPlayModal — encart "Comment jouer" rétro 16-bit.
 *
 * ╔══════════════════════════════════════╗
 * ║  Tout le texte du jeu est en bas     ║
 * ║  dans les constantes CONTENT.*       ║
 * ║  Modifiez uniquement cette section.  ║
 * ╚══════════════════════════════════════╝
 */

interface Props {
  onClose: () => void;
}

// =============================================================================
// ✏️  CONTENU — modifiez ici sans toucher au reste
// =============================================================================

const CONTENT = {
  goal: `Survivez à 20 salles d'open-space infernal, battez des clients impossibles
et affrontez le Boss final pour finir votre journée.`,

  map: `5 zones × 4 écrans  ·  Déplacement tuile par tuile (WASD ou D-pad).
Résolvez au moins une rencontre par salle pour débloquer la sortie.`,

  encounters: [
    {
      icon: '⚔',
      color: 'var(--danger)',
      label: 'Combat',
      desc: 'Affrontez un ennemi tour par tour. Seuls les combats rapportent de l\'XP.',
    },
    {
      icon: '✉',
      color: 'var(--classe)',
      label: 'Événement',
      desc: 'Choisissez une option : soin, MP ou autre bonus inattendu.',
    },
    {
      icon: '⚠',
      color: 'var(--accent)',
      label: 'Piège',
      desc: 'Jet de dé + bonus ATK vs seuil de difficulté. Esquivez ou encaissez.',
    },
    {
      icon: '◆',
      color: 'var(--sage)',
      label: 'Énigme',
      desc: 'Jet de dé + bonus MAG vs seuil. Le Sage excelle ici.',
    },
  ],

  heroes: [
    {
      name: 'MARINE',
      className: 'Choc',
      tint: 'var(--choc)',
      atk: 8,
      mag: 2,
      hp: 18,
      role: 'Tank. Écrase en combat, fragile aux énigmes.',
    },
    {
      name: 'ALPHONSE',
      className: 'Roublard',
      tint: 'var(--classe)',
      atk: 5,
      mag: 5,
      hp: 15,
      role: 'Polyvalent. Aucun point faible, aucun point fort.',
    },
    {
      name: 'LAURENT',
      className: 'Sage',
      tint: 'var(--sage)',
      atk: 2,
      mag: 9,
      hp: 12,
      role: 'Mage. Imbattable sur pièges et énigmes, fragile au combat.',
    },
  ],

  bossTip: `Récupérez les objets-clés (badge, tampon, mot de passe…) pour débloquer
les passages gardés. Arrivez soin complet devant l'Administration — elle frappe fort.`,
} as const;

// =============================================================================
// Composant
// =============================================================================

export function HowToPlayModal({ onClose }: Props) {
  return (
    <div className="htp-backdrop" onClick={onClose}>
      <div className="htp-panel" onClick={(e) => e.stopPropagation()}>

        {/* ── En-tête ───────────────────────────────────────────── */}
        <div className="htp-header">
          <span className="htp-title">▸ COMMENT JOUER</span>
          <button className="htp-close" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        {/* ── Corps scrollable ──────────────────────────────────── */}
        <div className="htp-body">

          <section className="htp-section">
            <h3 className="htp-section-title">OBJECTIF</h3>
            <p className="htp-text">{CONTENT.goal}</p>
          </section>

          <section className="htp-section">
            <h3 className="htp-section-title">LA CARTE</h3>
            <p className="htp-text">{CONTENT.map}</p>
          </section>

          <section className="htp-section">
            <h3 className="htp-section-title">TYPES DE RENCONTRES</h3>
            <ul className="htp-enc-list">
              {CONTENT.encounters.map((e) => (
                <li key={e.label} className="htp-enc-row">
                  <span className="htp-enc-icon" style={{ color: e.color }}>{e.icon}</span>
                  <span className="htp-enc-label" style={{ color: e.color }}>{e.label}</span>
                  <span className="htp-enc-desc">{e.desc}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="htp-section">
            <h3 className="htp-section-title">LES HÉROS</h3>
            <ul className="htp-hero-list">
              {CONTENT.heroes.map((h) => (
                <li key={h.name} className="htp-hero-row">
                  <span className="htp-hero-name" style={{ color: h.tint }}>{h.name}</span>
                  <span className="htp-hero-class">{h.className}</span>
                  <span className="htp-hero-stats">
                    <span className="htp-stat" title="Attaque physique">ATK&thinsp;{h.atk}</span>
                    <span className="htp-stat" title="Magie / sorts">MAG&thinsp;{h.mag}</span>
                    <span className="htp-stat" title="Points de vie">PV&thinsp;{h.hp}</span>
                  </span>
                  <span className="htp-hero-role">{h.role}</span>
                </li>
              ))}
            </ul>
            <p className="htp-subtext">
              ★ Seuls les <span style={{ color: 'var(--danger)' }}>combats</span> rapportent de l'XP.
              ATK booste les attaques physiques, MAG booste magie + pièges + énigmes.
            </p>
          </section>

          <section className="htp-section htp-section-boss">
            <h3 className="htp-section-title">OBJETS-CLÉS &amp; BOSS FINAL</h3>
            <p className="htp-text">{CONTENT.bossTip}</p>
          </section>

        </div>

        {/* ── Pied ─────────────────────────────────────────────── */}
        <div className="htp-footer">
          <button className="htp-ok" onClick={onClose}>
            COMPRIS — AU BOULOT&ensp;▶
          </button>
        </div>

      </div>
    </div>
  );
}
