import { useStore } from '../game/store';
import { SCREENS } from '../data/screens';
import { SLICE_SCREENS } from '../data/sliceScreens';
import { KEY_ITEMS } from '../data/keyItems';
import { xpToNextLevel } from '../game/leveling';
import { BOSS_ROOMS_NEEDED } from '../game/balance';
import { HeroPortrait } from './HeroPortrait';

export function Hud() {
  const hero     = useStore((s) => s.hero);
  const hp       = useStore((s) => s.hp);
  const mp       = useStore((s) => s.mp);
  const maxHp    = useStore((s) => s.maxHp);
  const maxMp    = useStore((s) => s.maxMp);
  const level    = useStore((s) => s.level);
  const xp       = useStore((s) => s.xp);
  const screenId = useStore((s) => s.currentScreenId);
  const keyItems = useStore((s) => s.keyItems);
  const visited  = useStore((s) => s.visitedRooms.length);
  if (!hero) return null;
  const screen   = SCREENS[screenId] ?? SLICE_SCREENS[screenId];
  const bossOpen = visited >= BOSS_ROOMS_NEEDED;
  const xpNext   = xpToNextLevel(level);
  return (
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
        <div className="hud-chip" title={keyItems.map((k) => KEY_ITEMS[k].name).join(' · ')}>
          {keyItems.map((k) => KEY_ITEMS[k].glyph).join(' ')}
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
      <div className="hud-chip" style={{ marginLeft: 'auto' }}>{screen?.title ?? ''}</div>
    </div>
  );
}

export function HelpRibbon() {
  return (
    <div className="help-ribbon">
      ← ↑ ↓ → / WASD pour se déplacer&ensp;·&ensp;⚔ combat&ensp;·&ensp;✉ événement&ensp;·&ensp;⚠ piège&ensp;·&ensp;◆ énigme
    </div>
  );
}
