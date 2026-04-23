import { useState } from 'react';
import { useStore } from '../game/store';
import { KEY_ITEMS } from '../data/keyItems';
import { xpToNextLevel } from '../game/leveling';
import { BOSS_ROOMS_NEEDED } from '../game/balance';
import { HeroPortrait } from './HeroPortrait';

// ── Panneau d'aide ────────────────────────────────────────────────────────────

function HelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-panel" onClick={(e) => e.stopPropagation()}>
        <button className="help-panel-close" type="button" onClick={onClose}>✕</button>

        <section className="help-section">
          <h4>Objectif</h4>
          <p>Explore <strong>{BOSS_ROOMS_NEEDED} salles</strong> du bureau, puis affronte le boss final qui apparaît à la salle suivante.</p>
        </section>

        <section className="help-section">
          <h4>Progression</h4>
          <p>Résous <strong>au moins 1 rencontre</strong> dans chaque salle pour débloquer les sorties.</p>
        </section>

        <section className="help-section">
          <h4>Rencontres</h4>
          <table className="help-table">
            <tbody>
              <tr><td>⚔</td><td><strong>Combat</strong> — bats l'ennemi pour avancer</td></tr>
              <tr><td>✉</td><td><strong>Événement</strong> — choix narratif, effets sur PV/PM</td></tr>
              <tr><td>⚠</td><td><strong>Piège</strong> — choix risqué, pénalité possible</td></tr>
              <tr><td>◆</td><td><strong>Énigme</strong> — puzzle avec récompense</td></tr>
              <tr><td>?</td><td><strong>Devinette</strong> — QCM lean-tech, récompense si correct</td></tr>
            </tbody>
          </table>
        </section>

        <section className="help-section">
          <h4>Stats</h4>
          <table className="help-table">
            <tbody>
              <tr><td>PV</td><td>Points de vie — à 0, c'est terminé</td></tr>
              <tr><td>PM</td><td>Mana — coût des attaques spéciales (T2/T3)</td></tr>
              <tr><td>ATK</td><td>Multiplicateur de dégâts physiques</td></tr>
              <tr><td>MAG</td><td>Multiplicateur de dégâts magiques</td></tr>
            </tbody>
          </table>
        </section>

        <section className="help-section">
          <h4>Niveaux</h4>
          <p>Les combats rapportent de l'XP. Monter de niveau <strong>restaure entièrement PV et PM</strong> et octroie un bonus permanent de stats.</p>
        </section>
      </div>
    </div>
  );
}

// ── HUD principal ─────────────────────────────────────────────────────────────

export function Hud() {
  const hero     = useStore((s) => s.hero);
  const hp       = useStore((s) => s.hp);
  const mp       = useStore((s) => s.mp);
  const maxHp    = useStore((s) => s.maxHp);
  const maxMp    = useStore((s) => s.maxMp);
  const level    = useStore((s) => s.level);
  const xp       = useStore((s) => s.xp);
  const keyItems = useStore((s) => s.keyItems);
  const visited  = useStore((s) => s.visitedRooms.length);

  const [helpOpen, setHelpOpen] = useState(false);

  if (!hero) return null;
  const bossOpen = visited >= BOSS_ROOMS_NEEDED;
  const xpNext   = xpToNextLevel(level);

  return (
    <>
      <div className="hud">
        <div className="hud-chip hud-hero-chip">
          <div className="hud-hero-thumb">
            <HeroPortrait hero={hero} />
          </div>
          <span>{hero.name} · {hero.className}</span>
        </div>
        <div className="hud-chip hp">PV {hp}/{maxHp}</div>
        <div className="hud-chip mp">MP {mp}/{maxMp}</div>
        <div
          className="hud-chip hud-level"
          title={`Niveau ${level} — ${xp}/${xpNext} XP vers le niveau suivant. Seuls les combats rapportent de l'XP.`}
        >
          ✦ Niv {level} · {xp}/{xpNext} XP
        </div>
        {keyItems.length > 0 && (
          <div className="hud-chip" title={keyItems.map((k) => KEY_ITEMS[k]?.name ?? k).join(' · ')}>
            {keyItems.map((k) => KEY_ITEMS[k]?.glyph ?? '?').join(' ')}
          </div>
        )}
        <div
          className="hud-chip hud-progress"
          title={
            bossOpen
              ? "La prochaine porte mène au bureau de l'Administration !"
              : `Explorez ${BOSS_ROOMS_NEEDED} pièces — la ${BOSS_ROOMS_NEEDED + 1}ᵉ sera le bureau de l'Administration`
          }
          style={{ color: bossOpen ? 'var(--danger)' : undefined }}
        >
          {bossOpen ? '💀' : '🏢'} {Math.min(visited, BOSS_ROOMS_NEEDED)}/{BOSS_ROOMS_NEEDED}
        </div>

        <button
          className="hud-help-btn"
          type="button"
          onClick={() => setHelpOpen(true)}
          title="Aide"
          aria-label="Afficher l'aide"
        >
          ?
        </button>
      </div>

      {helpOpen && <HelpPanel onClose={() => setHelpOpen(false)} />}
    </>
  );
}

export function HelpRibbon() {
  return (
    <div className="help-ribbon">
      ← ↑ ↓ → / WASD pour se déplacer&ensp;·&ensp;⚔ combat&ensp;·&ensp;✉ événement&ensp;·&ensp;⚠ piège&ensp;·&ensp;◆ énigme
    </div>
  );
}
