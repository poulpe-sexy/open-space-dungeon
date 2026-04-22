# Événements narratifs NPC — OPEN SPACE DUNGEON

Les événements narratifs NPC (Chavalier Matt et Chevalier Max) sont des rencontres
purement comiques, sans impact sur l'équilibrage. Ils apparaissent aléatoirement
dans le milieu de la run pour rythmer l'exploration.

---

## Où sont définis ces événements

**`src/data/npcEvents.ts`** — source unique :
- `NPC_REACTIONS` — banque de 5 réactions bonus tirées aléatoirement
- `MATT_EVENTS` — 4 scènes de Chavalier Matt
- `MAX_EVENTS` — 4 scènes de Chevalier Max
- `NPC_EVENTS` — export fusionné (auto-injecté dans `EVENTS`)

**`src/data/events.ts`** — importe et spread `NPC_EVENTS` :
```ts
import { NPC_EVENTS } from './npcEvents';
export const EVENTS = { ...NPC_EVENTS, /* autres events */ };
```

---

## Sprites utilisés

| Personnage | Portrait | Sprite source | Description |
|---|---|---|---|
| **Chavalier Matt** | `portrait: 'combat'` | `assets/dungeon/combat_1-4.png` | Squelette combattant — 4 frames animés |
| **Chevalier Max** | `portrait: 'event'` | `assets/dungeon/event_1-4.png` | Figure lumineuse — 4 frames animés |

Ces sprites sont les frames existants du pack de donjon. Tous les sprites du pack
sont des personnages en pixel-art 16×16. Les frames `combat_*` ont une apparence
de guerrier, les frames `event_*` ont une apparence de figure mystérieuse — les
deux conviennent à des "chevaliers" corporate-fantasy.

---

## Comment fonctionne leur apparition

**Placement procédural :**
Les NPC events sont ajoutés aux pools de zones dans `src/game/generateEncounters.ts`.
Ils sont tirés comme n'importe quel autre event (poids équivalent dans le pool).

| Zone | NPC events présents | Salles approx. |
|---|---|---|
| `open_space` | `npc_matt_trombone`, `npc_matt_imprimante` | 3-8 |
| `salles_reu` | `npc_matt_reunion`, `npc_matt_mug`, `npc_max_postit`, `npc_max_chargeur` | 6-11 |
| `technique` | `npc_max_plante`, `npc_max_password` | 9-13 |
| `accueil` | *(aucun — trop tôt)* | 1-3 |
| `direction` | *(aucun — gauntlet final)* | 13-15 |

**Flux en deux phases dans EventOverlay :**
1. **Choix** — le joueur voit le portrait du PNJ + le texte de la scène + 2-3 réponses
2. **Réponse** — le PNJ répond (champ `log` du choix), une réaction de `NPC_REACTIONS` est tirée au hasard, puis un bouton "Continuer →" ferme la scène

Les effets gameplay sont vides (aucun `effect` sur les choix). La rencontre est
marquée résolue (`resolvedEvents`) après le choix, comme tout event ordinaire.

---

## Ajouter une 9ème scène pour Matt ou Max

### 1. Écrire la scène dans `npcEvents.ts`

```ts
// Dans MATT_EVENTS ou MAX_EVENTS :
npc_matt_exemple: {
  id: 'npc_matt_exemple',
  title: 'Le titre de la scène',
  text: 'Le texte d\u2019introduction — ce que Matt dit en arrivant.',
  portrait: 'combat',     // Matt → 'combat' | Max → 'event'
  npcName: 'Chavalier Matt',
  choices: [
    {
      label: 'Première réponse du joueur',
      log: 'Ce que Matt répond après cette réponse.',
    },
    {
      label: 'Deuxième réponse',
      log: 'Autre réponse de Matt.',
    },
  ],
},
```

**Règles :**
- `id` doit correspondre à la clé dans l'objet
- Minimum 2 choix, maximum 4
- `log` = réponse du PNJ (affiché en phase 2 après le choix)
- Pas d'`effect` → zéro impact gameplay (intentionnel)

### 2. Ajouter l'ID dans le bon pool de zone

Dans `src/game/generateEncounters.ts` :

```ts
open_space: {
  events: [..., 'npc_matt_exemple'],  // Matt → open_space ou salles_reu
},
```

C'est tout. La scène sera automatiquement tirée dans les runs suivants.

---

## Fréquence attendue

Avec les poids actuels (25 % events dans la majorité des zones) et 2-5 encounters
par salle, un joueur traversant les 15 salles d'un run rencontrera typiquement
**2 à 4 scènes NPC** au total — Matt en milieu de run, Max en fin de milieu.

Pour augmenter la fréquence : ajouter les IDs dans plus de zones.
Pour les rendre plus rares : retirer des zones (garder au moins 2 zones par PNJ).
