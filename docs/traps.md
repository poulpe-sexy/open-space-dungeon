# Ajouter un piège (trap) — OPEN SPACE DUNGEON

Les pièges sont des épreuves courtes à traverser, avec 2 à 4 approches possibles.
Ils utilisent exactement la même structure que les événements (`EventDef`).

---

## Structure minimale

```ts
// src/data/traps.ts
mon_piege: {
  id: 'mon_piege',
  title: 'Titre visible en jeu',
  text: 'Une phrase ou deux. Le danger est clair. Peu de texte.',
  recommendedHero: 'Choc',   // optionnel — Choc | Roublard | Sage
  choices: [
    {
      label: 'Approche physique (-3 PV, +1 MP)',
      log: 'Tu passes en force. L\u2019adrénaline compense.',
      effect: { hpDelta: -3, mpDelta: 1 },
    },
    {
      label: 'Approche méthodique (-2 MP, +2 PV)',
      log: 'Tu prends le temps de comprendre le mécanisme.',
      effect: { mpDelta: -2, hpDelta: 2 },
    },
  ],
},
```

Puis ajouter l'ID dans les zones concernées de `src/game/generateEncounters.ts` :

```ts
open_space: {
  traps: ['cable_snare', 'floor_shock', ..., 'mon_piege'],
  // ...
},
```

C'est tout. L'épreuve s'injecte automatiquement dans le tirage procédural.

---

## Règles de design

### Chaque choix doit avoir un avantage ET un coût

| Archétype | Effet typique | Héros avantagé |
|---|---|---|
| Physique / rush | `-3 PV, +1 MP` | Choc (Marine) |
| Méthodique | `-2 MP, +2 PV` | Sage (Laurent) |
| Agile / bluff | `-1 PV, +2 MP` | Roublard (Alphonse) |
| Prudent | `-1 MP, +1 PV` | Tous |
| Risqué mais payant | `-4 PV, +2 MP` | Tanks uniquement |

Les choix **purement négatifs** ou **purement gratuits** sont interdits — ils
suppriment le dilemme.

### Accessibilité

Tous les héros doivent pouvoir tenter tous les choix.
`recommendedHero` est un **indice** contextuel, jamais une restriction.

### Récompenses permanentes

Un choix peut accorder un `RewardItem` via `grantRewardItemId`, mais il doit
**toujours avoir un coût** (typiquement `-1` à `-2 MP`) pour ne pas trivialiser
le choix en début de run.

```ts
{
  label: 'Approche intelligente (-1 MP)',
  log: 'Tu trouves l\u2019objet caché dans le mécanisme.',
  effect: { mpDelta: -1, grantRewardItemId: 'mon_item' },
},
```

Voir `src/data/rewardItems.ts` pour ajouter un nouvel item.

---

## Pièges actuels (12 total)

| ID | Titre | Zones |
|---|---|---|
| `cable_snare` | Nœud de câbles | accueil, open_space, salles_reu, technique, direction |
| `floor_shock` | Moquette statique | open_space, salles_reu, technique, direction |
| `reunion_infinie` | Réunion infinie | salles_reu, direction |
| `tunnel_validation` | Tunnel de validation | open_space, technique, direction |
| `chaise_roulettes` | Chaise à roulettes possédée | open_space, salles_reu, direction |
| `scanner_demoniaque` | Scanner démoniaque | technique, direction |
| `avalanche_postit` | Avalanche de post-it | open_space, salles_reu |
| `neon_conformite` | Néon de la conformité | salles_reu, technique, direction |
| `sol_cire` | Sol fraîchement ciré | accueil, open_space |
| `imprimante_infinie` | Imprimante à formulaire infini | open_space, salles_reu, technique |
| `portique_alignement` | Portique d'alignement | technique, direction |
| `gobelet_maudit` | Le Gobelet renversé maudit | accueil, salles_reu, direction |

---

## Checklist avant de commit

- [ ] `id` correspond à la clé dans `TRAPS`.
- [ ] L'ID est présent dans au moins un pool de zone.
- [ ] Chaque choix a un coût ET un avantage (ou au moins l'un des deux est non-nul).
- [ ] Si `grantRewardItemId` : l'item existe dans `rewardItems.ts`.
- [ ] `npm run build` passe sans erreur TypeScript.
- [ ] `npm test` passe (les tests de robustesse vérifient les IDs de zone automatiquement).
