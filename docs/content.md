# Ajouter une 13ème épreuve — OPEN SPACE DUNGEON

Ce guide explique comment ajouter une nouvelle épreuve (event, trap, puzzle ou
riddle) sans modifier le code du moteur. Le système est entièrement déclaratif :
ajouter une épreuve = ajouter des données.

---

## Choisir le type d'épreuve

| Type | Mécanisme | Fichier source | Overlay affiché |
|---|---|---|---|
| **Event** | Choix directs, effets déterministes (PV/MP/item) | `src/data/events.ts` | `EventOverlay` |
| **Trap** | Choix directs avec conséquences inévitables | `src/data/traps.ts` | `EventOverlay` |
| **Puzzle** | Un choix correct donne un bonus, les autres coûtent | `src/data/puzzles.ts` | `EventOverlay` |
| **Riddle** | QCM lean-tech, bonne réponse → objet permanent | `src/data/riddles.ts` | `RiddleOverlay` |

**Règle simple :** si la récompense est permanente (+ATK/MAG/HP max), utilise un
**Riddle** ou un choix avec `grantRewardItemId`. Si les effets sont temporaires
(PV/MP du run), utilise un **Event** / **Trap** / **Puzzle**.

---

## Ajouter un Event, Trap ou Puzzle

### 1. Écrire l'entrée dans le bon fichier

```ts
// src/data/events.ts  (ou traps.ts / puzzles.ts)
ma_nouvelle_epreuve: {
  id: 'ma_nouvelle_epreuve',
  title: 'Titre visible en jeu',
  text: 'Description de la situation. Deux ou trois phrases max.',
  recommendedHero: 'Sage',  // optionnel — Choc | Roublard | Sage
  choices: [
    {
      label: 'Libellé du bouton (résumé de l'effet)',
      log:   'Message affiché dans le journal après le choix.',
      effect: {
        hpDelta: 3,        // +/- PV (optionnel)
        mpDelta: -1,       // +/- MP (optionnel)
        grantKeyItemId: 'badge',        // objet-clé (optionnel)
        grantRewardItemId: 'mon_item',  // objet permanent (optionnel, voir §4)
      },
    },
    {
      label: 'Autre choix',
      log:   'Autre message.',
      effect: { hpDelta: -2 },
    },
    {
      // Choix sans effet — juste un texte de passage
      label: 'Ignorer',
      log:   'Tu passes ton chemin.',
    },
  ],
},
```

Contraintes :
- `id` doit correspondre à la clé dans le `Record<string, EventDef>`.
- Au moins 2 choix. Maximum pratique : 4.
- `hpDelta` est toujours clampé entre 0 et `maxHp` (jamais de mort par event).
- `mpDelta` est clampé entre 0 et `maxMp`.

### Règles d'équilibrage des choix

Chaque choix doit présenter un **vrai arbitrage**. Éviter :
- Un choix uniquement positif (domination triviale).
- Un choix uniquement négatif (jamais choisi volontairement).
- Un choix neutre sans intérêt (ni coût, ni gain).

Cibles d'équilibrage :
| Archétype | Exemple |
|---|---|
| Gain PV / coût MP | `hpDelta: 3, mpDelta: -1` — bon pour les tanks |
| Gain MP / coût PV | `mpDelta: 3, hpDelta: -1` — bon pour les mages |
| Gain PV+MP faibles | `hpDelta: 1, mpDelta: 1` — choix prudent / sans risque |
| Reward item / coût MP | `mpDelta: -2, grantRewardItemId: …` — long terme > court terme |
| Coup double negatif | Acceptable si compensé par un gain unique ailleurs |

**Les choix `grantRewardItemId` doivent toujours avoir un coût** (typiquement `-1` à `-2 MP`)
pour que l'item ne soit pas une évidence absolue — surtout en début de run avec un MP plein.

### 2. Ajouter l'ID dans le pool de zone

Dans `src/game/generateEncounters.ts`, ajoute l'ID dans la liste appropriée
de la (ou des) zone(s) où tu veux qu'elle apparaisse :

```ts
accueil: {
  events: ['pep_talk', 'coffee_machine', 'slack_maudit', 'ma_nouvelle_epreuve'],
  // ...
},
```

Pour un **trap**, ajoute-le dans `traps: [...]`.
Pour un **puzzle**, dans `puzzles: [...]`.

L'épreuve se retrouve automatiquement dans le tirage procédural des runs suivants.

---

## Ajouter un Riddle

Les riddles sont gérés séparément : ils ont leur propre pool (auto-injecté avec
10 % de chance par slot d'encounter), et octroient un `RewardItem` permanent.

### 3. Créer le RewardItem (si nécessaire)

Dans `src/data/rewardItems.ts` :

```ts
mon_item: {
  id: 'mon_item',
  name: 'Nom affiché en jeu',
  description: 'Une ligne de saveur. Ce que l'objet symbolise.',
  glyph: '★',  // 1 caractère unicode (emoji ou symbole)
  bonus: { atk: 1 },  // atk | mag | maxHp | maxMp — un seul stat max
},
```

Règles de balance :
- Maximum **+1 ATK**, **+1 MAG**, **+2 maxHp** ou **+2 maxMp** par item.
- Un item ne combine pas ATK et MAG (préserve l'identité de classe).

### 4. Écrire le Riddle

Dans `src/data/riddles.ts` :

```ts
mon_riddle: {
  id: 'mon_riddle',
  topic: 'Lean Tech — Sous-thème',    // affiché au-dessus du prompt
  prompt: 'La question posée au héros, en première personne ou énigme.',
  choices: [
    'Réponse A',
    'Réponse B (correcte)',
    'Réponse C',
    'Réponse D (optionnelle)',
  ],
  correctIndex: 1,        // index 0-based de la bonne réponse
  rewardItemId: 'mon_item',
  successText: 'Feedback court sur la bonne réponse (≤ 2 phrases).',
  failText:    'Feedback neutre sur l'échec (≤ 2 phrases, pas punitif).',
},
```

**Le riddle est automatiquement injecté** dans le tirage procédural via
`RIDDLE_IDS = Object.keys(RIDDLES)` — pas besoin de toucher `generateEncounters.ts`.
Chaque riddle apparaît au plus une fois par run (stack shuffled + pop).

### 5. Utiliser `grantRewardItemId` dans un Event/Puzzle/Trap

Pour qu'un choix non-riddle accorde un RewardItem permanent :

```ts
{
  label: 'Choix gagnant',
  log:   'Tu trouves l\u2019objet dans le placard.',
  effect: { grantRewardItemId: 'mon_item' },
},
```

`EventOverlay` applique le bonus, l'ajoute à `store.rewardItems` pour éviter
les doublons, et joue le son `key-item`. Le bonus est identique à celui octroyé
par un riddle — permanent pour le run.

---

## Checklist avant de commit

- [ ] `id` de l'épreuve correspond à la clé dans son `Record<string, EventDef>` ou `Record<RiddleId, Riddle>`.
- [ ] Si `grantRewardItemId` : l'item existe dans `rewardItems.ts`.
- [ ] Si riddle : `correctIndex` est dans `[0, choices.length - 1]`.
- [ ] L'ID est présent dans au moins un pool de zone dans `generateEncounters.ts` (ou c'est un riddle — auto-injecté).
- [ ] `npm run build` passe sans erreur TypeScript.
- [ ] `npm test` passe (les tests de balance vérifient la cohérence de certains IDs).

---

## Pools de zones actuels

| Zone | Thème | Difficulté |
|---|---|---|
| `accueil` | Hall, zone d'accueil | Facile |
| `open_space` | Open space standard | Normal |
| `salles_reu` | Salles de réunion | Normal / Difficile |
| `technique` | Local technique | Difficile |
| `direction` | Zone direction | Difficile (gauntlet final) |

Pour qu'une épreuve s'affiche dans plusieurs zones, ajoute son ID dans chacune.
Pour qu'elle soit **rare**, ne l'ajoute qu'à une seule zone.

---

## Exemple complet — épreuve « Imprimante rebelle »

```ts
// src/data/traps.ts
imprimante_rebelle: {
  id: 'imprimante_rebelle',
  title: 'Imprimante rebelle',
  text:
    'L\u2019imprimante clignote en orange. Un message s\u2019affiche : '
    + '« BOURRAGE PAPIER (AUCUN PAPIER) ». Elle chauffe.',
  recommendedHero: 'Choc',
  choices: [
    {
      label: 'Démonter le bac (-3 PV, résout)',
      log: 'Tu la forces. Un ticket de caisse de 2017 était coincé dedans.',
      effect: { hpDelta: -3 },
    },
    {
      label: 'Éteindre et rallumer (-1 MP, classique)',
      log: 'Elle redemarre. Le problème attend la prochaine fois.',
      effect: { mpDelta: -1 },
    },
    {
      label: 'Appeler le support (-2 MP, -2 PV)',
      log: 'On te dit d\u2019éteindre et de rallumer. Tu savais.',
      effect: { hpDelta: -2, mpDelta: -2 },
    },
  ],
},
```

```ts
// src/game/generateEncounters.ts — dans open_space.traps
traps: ['cable_snare', 'floor_shock', 'tunnel_validation', 'imprimante_rebelle'],
```

C'est tout. Lance `npm run build` pour vérifier, et l'imprimante rebelle
apparaîtra dans les prochains runs.
