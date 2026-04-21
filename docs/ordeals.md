# Épreuves absurdes (ordeals)

Ce document couvre le catalogue des **rencontres non-combat** du jeu :
`events`, `traps`, `puzzles`. Ce sont les épreuves courtes / drôles /
absurdes que le joueur rencontre en marchant sur une tuile.

(Les devinettes lean-tech sont un système à part, cf. `docs/riddles.md`.)

## Vue d'ensemble

| Type | Fichier | UI utilisée | Héros favorisé (classe) | Bonus de classe |
|---|---|---|---|---|
| `event` | `src/data/events.ts` | overlay choix direct (`EventOverlay`) | Alphonse (Roublard) | +2 event |
| `trap` | `src/data/traps.ts` | overlay dé + seuil (`ResolutionOverlay`) | Marine (Choc) | +1 trap |
| `puzzle` | `src/data/puzzles.ts` | overlay dé + seuil (`ResolutionOverlay`) | Laurent (Sage) | +3 puzzle |

Les `traps` et `puzzles` passent par un jet de dé vs seuil, avec bonus
de stat + classe. Les `events` sont un simple choix direct — pas de
dé, chaque option a un effet déterministe.

Tous partagent la même forme de données (`EventDef`) :

```typescript
interface EventDef {
  id: string;
  title: string;
  text: string;
  choices: EventChoice[];
  recommendedHero?: HeroClass;  // métadonnée optionnelle
}

interface EventChoice {
  label: string;
  log: string;
  effect?: {
    hpDelta?: number;
    mpDelta?: number;
    grantAttackId?: string;
    grantKeyItemId?: KeyItemId;
    setFlag?: string;
  };
  requiresKeyItem?: KeyItemId;  // choix gated par un objet-clé
}
```

## Catalogue actuel

### Events (Alphonse / Roublard)

| id | titre | idée absurde |
|---|---|---|
| `coffee_machine` | Machine à café runique | café qui change les stats |
| `mystery_memo` | Mémo non lu | savoir interdit |
| `pep_talk` | Motivational poster | slogan qui soigne |
| **`slack_maudit`** | Slack maudit | canal #urgent à 47 notifs |
| **`powerpoint_interdit`** | PowerPoint interdit | roadmap v37 clignotante |
| **`ascenseur_priorites`** | Ascenseur des priorités | 4 boutons, 0 étage |

### Traps (Marine / Choc)

| id | titre | idée absurde |
|---|---|---|
| `cable_snare` | Nœud de câbles | cable management = danger |
| `floor_shock` | Moquette statique | le sol te zappe |
| **`reunion_infinie`** | Réunion infinie | ordre du jour en boucle |
| **`tunnel_validation`** | Tunnel de validation | signer jusqu'au bout |
| **`comite_plantes`** | Comité des plantes vertes | 7 ficus délibèrent |

### Puzzles (Laurent / Sage)

| id | titre | idée absurde |
|---|---|---|
| `coffee_order` | La commande du CEO | 3 mugs, 1 bon |
| **`frigo_maudit`** | Frigo maudit | 3 tupperwares, 1 sûr |
| **`badgeuse_prophetique`** | Badgeuse prophétique | 3 prophéties, 1 vraie |
| **`cafe_quantique`** | Machine à café quantique | superposition de gobelets |
| **`bureau_sens_cache`** | Le bureau du sens caché | détecter le jargon creux |

*(Les entrées en gras sont les 10 nouvelles épreuves ajoutées.)*

## Génération procédurale

`src/game/generateEncounters.ts` — la table `ZONE_POOLS` définit
quels IDs peuvent spawner dans chaque zone. Chaque zone a :

- `combat[]`, `events[]`, `traps[]`, `puzzles[]` — les pools
- `weights: [combat, event, trap, puzzle]` — les poids relatifs

Pour qu'une épreuve apparaisse en jeu, **il faut l'ajouter au pool de
la ou les zones pertinentes**, sinon elle reste orpheline dans la
table mais jamais tirée.

## Ajouter une 11ème épreuve

1. **Choisir le type** selon le mécanisme voulu :
   - `event` → choix direct, pas de dé (Alphonse-friendly)
   - `trap` → dé + ATK/HP (Marine-friendly)
   - `puzzle` → dé + MAG (Laurent-friendly)
2. **Ajouter l'entrée** au fichier data correspondant :
   ```typescript
   mon_epreuve: {
     id: 'mon_epreuve',
     title: 'Titre court',
     text: 'Une phrase de contexte.',
     recommendedHero: 'Choc', // optionnel, metadata uniquement
     choices: [
       { label: '…', log: '…', effect: { hpDelta: 2 } },
       { label: '…', log: '…', effect: { hpDelta: -3 } },
     ],
   },
   ```
3. **Brancher l'ID** dans `ZONE_POOLS` (`src/game/generateEncounters.ts`)
   pour ≥ 1 zone, sinon l'épreuve ne spawnera jamais.
4. **Rien d'autre à faire** : l'intégrité au boot (`dataIntegrity.ts`)
   valide automatiquement que les refs `eventId`/`trapId`/`puzzleId`
   dans les encounters pointent sur des entrées valides. Les tests
   continuent de passer.

## Effets disponibles (palette)

| Effet | Champ | Usage |
|---|---|---|
| Perte de PV | `hpDelta: -N` | dégâts d'échec |
| Petit soin | `hpDelta: +N` | récompense |
| Perte de MP | `mpDelta: -N` | fatigue mentale |
| Gain de MP | `mpDelta: +N` | illumination |
| Attaque offerte | `grantAttackId: 'id'` | débloque un skill |
| Objet-clé | `grantKeyItemId: 'badge'…` | unlock de sortie |
| Flag narratif | `setFlag: 'name'` | state custom |
| Choix gated | `requiresKeyItem: 'badge'` | option exige un item |

## Conseils de tuning

- **Bonne réponse** : +2 à +5 PV **et** +1 à +3 MP (récompense généreuse).
- **Piège évident** : -2 à -4 PV (punition claire mais pas brutale).
- **Piège cringe** : -1 à -2 MP (perte mineure, effet comique).
- **Option "passer"** : 0 delta (no-op narratif), utile pour
  décourager la passivité systémique.
- **Attention aux events** : pas de dé → chaque option a un effet
  déterministe. Ne pas rendre tous les choix gagnants : il faut
  au moins un trade-off.

## Intégration avec le conseil IA

Pour les `traps` et `puzzles`, l'overlay de résolution affiche une
phrase de conseil propre à la classe du héros :

```typescript
// src/game/resolution.ts
const ADVISOR_FLAVOR: Record<HeroClass, Record<ResolvableKind, string>> = {
  Choc:     { trap: 'Marine peut forcer le passage…', … },
  Roublard: { trap: 'Alphonse improvise — résultat incertain.', … },
  Sage:     { trap: 'Laurent procède méthodiquement…', … },
};
```

Ces phrases sont **par classe**, pas par épreuve. Ajouter une épreuve
ne demande donc rien à modifier dans `resolution.ts` — le conseil
générique est automatiquement servi.

## Tests

Les tests de `generateEncounters.test.ts` vérifient implicitement :
- chaque encounter a un kind et un ID correspondant dans sa table
- les IDs référencés depuis `ZONE_POOLS` doivent exister (sinon
  `makeEncounter` retournerait `undefined` et le test `every encounter
  references a valid kind-id pair` détecterait un `typeof !== 'string'`)

Pas besoin d'ajouter un test par nouvelle épreuve — la boucle de
validation passe automatiquement dessus.
