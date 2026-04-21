# Fin secrète & boss alternatif (Orzag Cœur de Pierre)

Ce document décrit le **chemin caché** d'OPEN SPACE DUNGEON : une fin
spéciale et un boss bonus, **Orzag Cœur de Pierre**, petit chat gris
aux yeux jaunes, ennemi ultime du Dungeon.

## Vue d'ensemble

Il y a désormais **deux fins possibles** :

| Fin | Condition | Écran terminal |
|---|---|---|
| **Normale** | Battre le boss principal (`client_legendaire`) | `phase: 'victory'` |
| **Vraie** / secrète | Fin normale + 100 % résolu dans toutes les salles visitées + battre Orzag | `phase: 'true-victory'` |

Le texte de la fin normale est **inchangé** quand la condition cachée
n'est pas remplie. Quand elle l'est, on *ajoute* (sans retirer) une
phrase indice + un bouton pour engager Orzag.

## Déclenchement pas-à-pas

```
  [dungeon] ── bat le boss ──▶ [victory] ──┐
                                           │ 100 % clear ?
                         ┌──non──┐         │
                         ▼       │         ▼ oui
                     (fin normale)    +phrase indice + bouton
                                           │ click "Affronter la menace"
                                           ▼
                                     [secret-intro]
                                           │ click "Engager le combat"
                                           ▼
                                     [secret-combat]
                                           │ bat Orzag
                                           ▼
                                     [true-victory]
```

## Phrase indice (verbatim)

Apparaît sur l'écran de fin normale **uniquement** si la condition 100 %
est remplie :

> « Cependant il reste une terrible menace au sein du Dungeon... saurez-vous en triompher ? »

Définie comme `SECRET_HINT` dans `src/game/secretEnding.ts`.

## Calcul du 100 %

`src/game/secretEnding.ts` → `isRunFullyResolved(state: GameState): boolean`

Le calcul est volontairement **"100 % de ce que le joueur a vu"**, pas
"100 % du donjon complet". Les salles jamais visitées ne comptent pas.

Pour chaque salle dans `state.visitedRooms` (liste construite par
`TileDungeon.tsx` à chaque entrée d'une nouvelle pièce + par
`TitleScreen.tsx` qui seed la salle de départ), on prend :

- `state.sessionEncounters[screenId]` si la salle a été re-générée
  procéduralement à ce run ;
- sinon `SCREENS[screenId].encounters` (boss room = statique).

Pour chaque encounter, on vérifie que sa clé
(`encounterKey(screenId, x, y)`) est présente dans :

- `state.defeatedEnemies` si `kind === 'combat'` ;
- `state.resolvedEvents` sinon (events, traps, puzzles, riddles).

Dès qu'une seule rencontre visible est non-résolue, la fonction retourne
`false` → fin normale uniquement.

**Pourquoi "visitées" et pas "toutes les salles du donjon" ?**
Le donjon est procédural ; les door-guards, clés et choix de sorties font
qu'un run parfait peut tout-à-fait éviter plusieurs pièces. Obliger le
joueur à repasser par toutes les salles inexplorées serait punitif sans
rendre le secret plus "gagnant". La règle "si tu l'as vu, il fallait le
résoudre" est claire et honnête.

## Orzag Cœur de Pierre — où le modifier

`src/data/enemies.ts` → entrée `orzag_coeur_pierre`.

```typescript
orzag_coeur_pierre: {
  stats: { atk: 26, mag: 24, hp: 110 },  // client_legendaire × 2
  attackNames: ['Miaou'],                 // seule attaque
  portrait: '/assets/bosses/orzag-coeur-de-pierre.png',
  introLine: '...',
  ...
}
```

### Règle des 2× (multiplicateur)

Orzag est défini comme **exactement 2× le boss principal**. La règle est :

```
base (client_legendaire) :  atk 13 · mag 12 · hp 55
Orzag (× ORZAG_POWER_MULT) : atk 26 · mag 24 · hp 110
```

`ORZAG_POWER_MULT = 2` est documenté dans `src/game/secretEnding.ts`.
C'est une **constante informative** — la valeur réelle vit en dur dans
`ENEMIES.orzag_coeur_pierre.stats`. Pour tuner la difficulté :

1. Choisir un nouveau multiplicateur (ex : 2.5 pour un Orzag plus dur).
2. Recalculer les stats à la main : `round(base × mult)`.
3. Mettre à jour les 3 chiffres dans `enemies.ts`.
4. Mettre à jour `ORZAG_POWER_MULT` dans `secretEnding.ts` pour cohérence
   et mettre à jour ce tableau dans le doc.

### PNG du boss

Chemin attendu : `public/assets/bosses/orzag-coeur-de-pierre.png`

- **Non-bloquant** : si le fichier est absent, `EnemyPortrait` dans
  `CombatOverlay.tsx` rattrape `onError` et affiche la silhouette
  `<TileSprite kind="boss" />` par défaut. Le jeu ne crashe jamais.
- Format recommandé : PNG 64×64 ou 128×128 avec transparence, palette
  sombre (anthracite / basalte). `object-fit: contain` + `image-rendering:
  pixelated` sont appliqués par `.enemy-portrait-img`.

### Intro-line (flavor avant le premier tour)

`enemy.introLine` est une deuxième ligne `info` automatiquement poussée
dans le log de combat au spawn de l'ennemi (voir `CombatOverlay.tsx`).
Optionnel — sans impact sur les 8 ennemis de base.

## Fichiers créés / modifiés

### Créés
- `src/game/secretEnding.ts` — sélecteur + constantes (SECRET_HINT, multiplicateur, enemy/screen IDs).
- `public/assets/bosses/` — dossier pour le PNG (+ README.txt rappelant où le déposer).
- `docs/secret-ending.md` — ce document.

### Modifiés
- `src/game/store.ts` — Phase union étendue avec `'secret-intro'`, `'secret-combat'`, `'true-victory'`.
- `src/data/enemies.ts` — nouveau type `EnemyWithPortrait` + entrée `orzag_coeur_pierre`.
- `src/components/CombatOverlay.tsx` — `EnemyPortrait` component (PNG + fallback), support `introLine`, routage post-victoire basé sur la phase courante (`secret-combat → true-victory`).
- `src/components/EndScreen.tsx` — branches pour les 4 phases terminales (defeat / victory / secret-intro / true-victory) + phrase indice conditionnelle.
- `src/App.tsx` — rend CombatOverlay aussi sur `phase === 'secret-combat'`.
- `src/styles/global.css` — styles minimaux pour les nouveaux écrans et l'image-portrait d'ennemi.

## Tests rapides

### 1. Fin normale inchangée (fin "non-secrète")
- Commencer une run, s'arranger pour ignorer au moins une rencontre dans
  une salle visitée (ex : entrer et ressortir sans cliquer dessus).
- Battre le boss → écran "DOSSIER CLASSÉ SANS SUITE".
- Vérifier qu'il n'y a **pas** de phrase indice et **pas** de bouton
  "Affronter la menace".

### 2. Fin secrète — unlock
- Commencer une run. Résoudre **toutes** les rencontres de **chaque**
  salle visitée (la phrase indice ignore les salles jamais entrées).
- Battre le boss → écran normal **+** phrase indice
  `"Cependant il reste une terrible menace…"` **+** bouton "Affronter la menace".

### 3. Combat Orzag
- Depuis la fin secrète, cliquer "Affronter la menace".
- Écran `secret-intro` : flavor dramatique + bouton "Engager le combat".
- Cliquer → `CombatOverlay` avec Orzag Cœur de Pierre, portrait PNG (ou
  fallback TileSprite si le fichier manque), une seule attaque "Miaou".
- Intro-line `"Le petit chat s'assoit..."` en 2ᵉ ligne du log.
- Le battre → écran "LE DUNGEON EST LIBRE" (`true-victory`).

### 4. Robustesse
- Sans `orzag-coeur-de-pierre.png` dans `public/assets/bosses/`, le combat
  tourne quand même (silhouette TileSprite).
- `npm run build && npm test` → tous les tests verts (75/75).

## Notes d'implémentation

- **ORZAG_SCREEN_ID = `'__orzag__'`** : screen synthétique utilisé
  uniquement pour remplir `pending.screenId` pendant le combat Orzag.
  N'existe PAS dans `SCREENS`, donc `dataIntegrity.ts` l'ignore et la
  règle "exactement un `isBossScreen`" reste respectée. Le lookup
  `SCREENS[pending.screenId]?.isBossScreen` retourne `undefined` → le
  routage post-victoire se fait via la phase courante (`secret-combat`).
- **Pas de nouvelles dépendances, pas de nouvel asset obligatoire.** Tout
  le reste du jeu tourne à l'identique quand le joueur ne déclenche pas
  le secret.
