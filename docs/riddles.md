# Devinettes (Riddles)

Sous-système d'événements aléatoires de type « devinette lean-tech » qui accordent
un objet-récompense aux petites statistiques en cas de bonne réponse.

## Boucle de jeu

1. En explorant le donjon, le joueur peut marcher sur une tuile de type
   **riddle** (carreau teal avec un `?` en surimpression).
2. Le jeu passe en phase `riddle` et affiche la `RiddleOverlay` :
   - énoncé (ex. « Qu'est-ce qu'un **MVP** ? »)
   - 3 ou 4 choix cliquables
3. L'**héros actif** répond (OPEN SPACE DUNGEON est un jeu solo —
   pas de sélection de personnage).
4. Bonne réponse → un `RewardItem` est ajouté au run et ses bonus sont
   immédiatement appliqués au héros (stats permanentes pour la session).
   Mauvaise réponse → feedback doux, aucun dégât, aucun XP perdu.
5. Fermer l'overlay retourne en phase `dungeon`.

**Les devinettes ne donnent jamais d'XP.** Le combat reste la seule
source de progression narrative. Les devinettes donnent uniquement des
**objets-récompense** avec de petits bonus stackables.

## Données

Toutes les données sont déclaratives et vivent dans `src/data/`.

### `src/data/riddles.ts`

10 devinettes. Chacune suit cette forme :

```typescript
{
  id:            'riddle_mvp',
  topic:         'Lean Tech — MVP',
  prompt:        'Qu\'est-ce qu\'un MVP ?',
  choices:       [...],        // 3 ou 4 choix
  correctIndex:  2,            // index (0-based) de la bonne réponse
  rewardItemId:  'talisman_mvp',
  successText:   'Exactement...',
  failText:      'Pas cette fois...',
}
```

### `src/data/rewardItems.ts`

10 objets, un par devinette. Chacun accorde un bonus **modeste** :
- **+1 ATK** ou **+1 MAG** → progression offensive / magique
- **+2 PV max** (avec heal automatique du delta)

```typescript
{
  id:          'talisman_mvp',
  name:        'Talisman du MVP',
  description: 'Un petit totem...',
  glyph:       '◈',
  bonus:       { atk: 1 },
}
```

Les bonus sont **cumulatifs** : un run peut théoriquement rassembler
les 10 objets (10 devinettes × 1 bonus), soit `+4 ATK · +3 MAG · +4 PV max`
dans le meilleur cas. Volontairement discret pour ne pas casser la courbe
de difficulté.

### `src/game/riddles.ts`

Deux fonctions pures :

- `applyRewardItem(hero, maxHp, maxMp, itemId)` → renvoie un nouvel héros
  (immutable) avec stats mises à jour, plus les `hpHealed` / `mpHealed`
  à appliquer. Gère correctement l'empilement de MP max en préservant
  le « surplus » déjà accumulé par des items flat (cf. tests).
- `totalBonus(items)` → somme les bonus d'une liste d'objets (utile
  pour du debug ou un futur écran de fin).

## Génération

Dans `src/game/generateEncounters.ts` :

- Au début d'un run, on mélange `RIDDLE_IDS` en un `riddleStack`
  via l'algorithme Fisher-Yates seedé avec le même RNG.
- Chaque rencontre générée a une chance `RIDDLE_EVENT_WEIGHT` (10 %)
  d'être convertie en devinette — **tant que la pile n'est pas vide**.
- On `pop()` un `riddleId` à chaque placement → **une même devinette
  ne peut jamais apparaître deux fois dans un run** (testé sur 5 seeds).
- Les tuiles de devinette sont marquées `once: true`.

Les écrans boss (`isBossScreen`) ne sont jamais touchés — ils gardent
leurs encounters scriptés.

## UI

- **`src/components/RiddleOverlay.tsx`** — overlay plein écran :
  - bandeau topic + titre + portrait du héros répondant
  - énoncé en italique, bordure gauche teal
  - 3-4 boutons de réponse ; désactivés après le choix, coloration
    verte pour la bonne / rouge pour la mauvaise / atténuée pour les
    autres
  - panneau feedback `is-ok` / `is-nope` avec le texte du riddle
  - carte de récompense (glyphe, nom, description, bonus stat formaté
    type `+1 ATK · +2 PV max`)
  - bouton **Continuer** qui atomise le patch de store (héros,
    maxHp/maxMp, rewardItems, resolvedEvents, phase).
- **`src/components/TileSprite.tsx`** — ajoute la frame `riddle`
  (réutilise l'anim puzzle ; la différenciation visuelle passe par
  le tile CSS + un `?` flottant).
- **`src/styles/global.css`** — classes :
  - `.td-enc-riddle` — tile teal avec pseudo-element `?`
  - `.riddle-panel`, `.riddle-close`, `.riddle-reward` — panneau overlay
  - `.is-correct`, `.is-wrong`, `.is-dim` — états des boutons réponse
  - `.ok`, `.nope` — panneau feedback

## Store

`src/game/store.ts` :

- `Phase` inclut `'riddle'`
- `rewardItems: RewardItemId[]` — collection accumulée sur le run
  (reset en début de nouveau run via `resetForNewRun`).

## Data integrity (boot)

`src/game/dataIntegrity.ts` valide au démarrage (dev only) :

- chaque `Riddle.rewardItemId` pointe vers un objet existant
- chaque riddle a 3 ou 4 choix
- `correctIndex` est dans les bornes
- chaque `ScreenEncounter` de kind `riddle` référence un `riddleId` valide

Les erreurs s'affichent en console avec le préfixe `[data-integrity]`.

## Ajouter une 11e devinette

1. Ajouter un **reward item** dans `src/data/rewardItems.ts` :
   ```typescript
   mon_nouvel_objet: {
     id:          'mon_nouvel_objet',
     name:        'Nom affiché',
     description: 'Phrase flavor.',
     glyph:       '◯',
     bonus:       { atk: 1 },   // ou { mag: 1 }, { maxHp: 2 }...
   },
   ```
   …et l'ID dans `REWARD_ITEM_IDS`.
2. Ajouter une **devinette** dans `src/data/riddles.ts` :
   ```typescript
   riddle_mon_sujet: {
     id:           'riddle_mon_sujet',
     topic:        'Lean Tech — Mon sujet',
     prompt:       'La question ?',
     choices:      ['A', 'B', 'C'],
     correctIndex: 1,
     rewardItemId: 'mon_nouvel_objet',
     successText:  '…',
     failText:     '…',
   },
   ```
   …et l'ID dans `RIDDLE_IDS`.
3. Les tests de `riddles.test.ts` vérifient « exactement 10 riddles et
   10 reward items » — **pense à mettre ces deux assertions à jour**
   si tu étends la collection.
4. Boot : l'intégrité est validée automatiquement, aucun câblage
   supplémentaire nécessaire.

## Régler les bonus

- Les chiffres vivent uniquement dans `REWARD_ITEMS[id].bonus`.
- `+1 ATK` se traduit en gain d'un point par objet ; vu l'unicité
  des devinettes dans un run, un joueur perfect (10/10) gagnerait
  environ ~4 ATK / 3 MAG / 4 PV max en plus. Adapter selon les
  retours de playtest.
- `maxHp` et `maxMp` sont auto-healed du delta au pickup (cf. tests
  `riddles.test.ts` → `hpHealed` / `mpHealed`).

## Tests

`src/game/riddles.test.ts` (9 cas) :
- `applyRewardItem` — unknown id, +1 ATK non-mutating, +2 maxHp heal,
  +1 MAG grows derived max MP, extra-MP preservation
- `totalBonus` — somme correcte
- Intégrité locale RIDDLES/REWARD_ITEMS

`src/game/generateEncounters.test.ts` — ajout d'un cas dédié :
- une devinette ne peut jamais apparaître plus d'une fois dans un run
  (testé sur 5 seeds différentes)
