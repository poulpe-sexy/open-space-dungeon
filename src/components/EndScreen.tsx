import { store, useStore } from '../game/store';
import {
  ORZAG_ENEMY_ID,
  ORZAG_SCREEN_ID,
  SECRET_HINT,
  isRunFullyResolved,
} from '../game/secretEnding';

/**
 * EndScreen handles every terminal / semi-terminal phase :
 *   - `defeat`        → burn-out screen.
 *   - `victory`       → normal ending. Appends the SECRET_HINT + a button to
 *                       engage Orzag, but only if the run was fully resolved.
 *   - `secret-intro`  → short dramatic intro before the Orzag fight. Single
 *                       button starts the combat (phase flips to
 *                       `secret-combat`, CombatOverlay takes over).
 *   - `true-victory`  → terminal "you beat the real final boss" ending.
 *
 * We intentionally don't render anything for `secret-combat` — the overlay
 * handles that phase itself.
 */
export function EndScreen() {
  const phase = useStore((s) => s.phase);

  // Orzag is only reachable via the victory screen — if the player lost the
  // main boss fight, they get the plain burn-out screen regardless of how
  // many rooms they cleared.
  const secretUnlocked = useStore((s) =>
    s.phase === 'victory' ? isRunFullyResolved(s) : false,
  );

  if (
    phase !== 'victory' &&
    phase !== 'defeat' &&
    phase !== 'secret-intro' &&
    phase !== 'true-victory'
  ) {
    return null;
  }

  // ── Defeat ───────────────────────────────────────────────────────────────
  if (phase === 'defeat') {
    return (
      <div className="end-screen defeat">
        <h2>BURN-OUT</h2>
        <p>
          Les tickets ont eu raison de toi. Une réunion rétro s’organise déjà
          sans toi.
        </p>
        <button type="button" onClick={() => store.reset()}>
          Recommencer une run
        </button>
      </div>
    );
  }

  // ── Normal victory (with optional secret hint) ──────────────────────────
  if (phase === 'victory') {
    return (
      <div className="end-screen victory">
        <h2>DOSSIER CLASSÉ SANS SUITE</h2>
        <p>
          L’Administration a été contresignée, paraphée, archivée. Les guichets
          ferment. Les imprimantes s’apaisent. L’open space respire — pour la
          première fois depuis des générations de stagiaires.
        </p>
        {secretUnlocked ? (
          <>
            <p className="end-secret-hint">{SECRET_HINT}</p>
            <button type="button" onClick={() => store.set({ phase: 'secret-intro' })}>
              Affronter la menace
            </button>
          </>
        ) : (
          <button type="button" onClick={() => store.reset()}>
            Recommencer une run
          </button>
        )}
      </div>
    );
  }

  // ── Secret intro — dramatic fade before the Orzag fight ─────────────────
  if (phase === 'secret-intro') {
    const startOrzagFight = () => {
      store.set({
        phase: 'secret-combat',
        pending: {
          screenId: ORZAG_SCREEN_ID,
          encounter: {
            x: 0,
            y: 0,
            kind: 'combat',
            enemyId: ORZAG_ENEMY_ID,
            once: true,
          },
        },
      });
    };
    return (
      <div className="end-screen secret-intro">
        <h2>L'OMBRE DU DUNGEON</h2>
        <p>
          L'open space est vide. Les néons ont cessé de grésiller. Sur la
          moquette, une petite silhouette grise avance sans bruit, la queue
          basse, les yeux jaunes.
        </p>
        <p>
          Il n'a pas de badge. Il n'a pas de titre. Il s'assoit au centre du
          couloir, et tu entends — tout au fond de toi — un seul mot résonner&nbsp;:
        </p>
        <p className="end-secret-line">
          <em>« Miaou. »</em>
        </p>
        <p>
          Tu comprends alors que <strong>Orzag Cœur de Pierre</strong> t'attendait
          depuis le début.
        </p>
        <button type="button" onClick={startOrzagFight}>
          Engager le combat
        </button>
      </div>
    );
  }

  // ── True victory — Orzag vaincu ─────────────────────────────────────────
  return (
    <div className="end-screen true-victory">
      <h2>LE DUNGEON EST LIBRE</h2>
      <p>
        Orzag ferme les yeux. Il ronronne, une seconde, une seule. Puis il
        disparaît — comme s'il n'avait jamais été là, comme s'il n'avait
        jamais eu besoin d'être là.
      </p>
      <p>
        Tu sors enfin. Dehors, le soleil. Personne ne saura ce que tu as
        affronté. C'est peut-être ça, être un·e vrai·e héros du tertiaire.
      </p>
      <button type="button" onClick={() => store.reset()}>
        Recommencer une run
      </button>
    </div>
  );
}
