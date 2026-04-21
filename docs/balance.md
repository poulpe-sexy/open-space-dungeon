# Balance — OPEN SPACE DUNGEON

Ce document explique le pourquoi des chiffres. Les valeurs, elles, vivent
dans **un seul endroit** : `src/game/balance.ts`. Tout le reste du code
importe depuis ce module — pour re-tuner le jeu, éditer ce fichier suffit
presque toujours.

---

## Résumé — problèmes identifiés

Avant passe d'équilibrage, le run souffrait de **8 défauts** :

1. **Marine avait un T3 "piégé"** (`reframe`, magic, power 2.5). Comme Marine a
   MAG 2, son T3 faisait moins de dégâts que son T1 gratuit. Une case entière
   de son kit était inutile.
2. **Alphonse n'avait pas de T2 dédié**. Son kit était `charme` → `reframe`
   (partagé avec Marine) → `techno_boom_boom`. Le partage masquait le bug de
   `reframe` et Alphonse n'avait pas vraiment d'identité magique progressive.
3. **Laurent nukait le boss en 3 casts**. `decommissionnement` power 2.5 × MAG
   9 ≈ 22 dégâts × 3 = 66 > 55 HP boss. Le fight final était trivialisé.
4. **Le boss one-shot Laurent**. Boss ATK 13 × jitter → jusqu'à 14 dégâts, et
   Laurent avait 12 HP. La seule stratégie viable était "arriver à L6+", ce
   qui étirait artificiellement le run.
5. **Orzag non-tenu à sa promesse**. Le secret ending promet "deux fois plus
   fort que le boss final", mais rien dans le code ne forçait la règle. Un
   rééquilibrage du boss principal pouvait casser silencieusement Orzag.
6. **Constantes d'équilibrage éparpillées**. XP par niveau, seuils de
   difficulté, stat-gain au level-up, multiplicateur Orzag vivaient dans 4
   fichiers différents. Tuner = chasser les magic numbers.
7. **Aucun garde-fou côté tests**. Rien n'empêchait quelqu'un de rajouter un
   attaque cassé, ou de modifier le boss sans re-dériver Orzag.
8. **Économie XP floue**. Aucune ligne ne vérifiait qu'un run "honnête"
   (chaque ennemi battu ~2×) permettait effectivement d'atteindre L5 avant le
   boss.

---

## Changements appliqués

### Constantes centralisées — `src/game/balance.ts` (nouveau)

Module *constants-only* (zéro logique, zéro import de code applicatif → pas
de risque de cycle). Expose :

| Constante | Valeur | Ce que ça pilote |
|---|---|---|
| `XP_PER_LEVEL_BASE` | `10` | XP pour passer L → L+1. Linéaire : `L × base`. |
| `STAT_GAIN_PER_LEVEL` | `{atk:1, mag:1, hp:3}` | Gain de stats à chaque level-up. |
| `DIFFICULTY_THRESHOLDS` | `easy:4 normal:6 hard:9 boss:12` | Cibles d6 pour traps/puzzles/events. |
| `ORZAG_POWER_MULT` | `2` | Multiplicateur Orzag ↔ boss principal. |
| `MAIN_BOSS_REFERENCE` | `{atk:11, mag:10, hp:60}` | Référence assertée par les tests. |

Les modules existants (`leveling.ts`, `resolution.ts`, `secretEnding.ts`,
`enemies.ts`) importent depuis `balance.ts` et re-exportent pour conserver la
compatibilité ascendante — pas de churn imports côté consommateurs.

### Héros — `src/data/heroes.ts`

| Héros | Avant (ATK/MAG/HP) | Après | Raison |
|---|---|---|---|
| Marine (Choc) | 8 / 2 / 18 | 8 / 2 / **20** | +2 HP pour tenir 2 coups d'ennemi hard sans mourir. |
| Alphonse (Roublard) | 5 / 5 / 15 | 5 / 5 / **17** | Milieu de gamme — HP intermédiaire cohérent. |
| Laurent (Sage) | 2 / 9 / 12 | 2 / 9 / **14** | Toujours glass cannon, mais ne meurt plus en un coup en zone hard. |

**Kits d'attaques refondus** : chaque héros a maintenant 3 attaques
**dédiées**, du bon `kind` pour sa stat primaire, avec T1 gratuit et
progression monotone (T1 < T2 < T3 en dégâts sur la stat primaire).

- **Marine** (physical-only) : `impact` (T1) → `choc` (T2) → `pression` (T3, nouveau).
- **Alphonse** (magic-only) : `charme` (T1) → `baratin` (T2, nouveau) → `techno_boom_boom` (T3).
- **Laurent** (magic-only) : `apnee` (T1) → `figuier_etrangleur` (T2) → `decommissionnement` (T3, nerfé).

### Attaques — `src/data/attacks.ts`

- **Retiré** : `reframe` (magic T3 trompeur). Il n'est plus référencé nulle part.
- **Ajouté** : `pression` (Marine T3, physical, power 2.0, cost 3).
- **Ajouté** : `baratin` (Alphonse T2, magic, power 1.5, cost 2).
- **Nerf** : `decommissionnement` power 2.5 → 2.2. Laurent tue le boss en ~4
  casts au lieu de 3 — toujours fort, plus trivial.

### Ennemis — `src/data/enemies.ts`

Seuls le boss principal et Orzag bougent. Les 7 ennemis réguliers lisent
correctement (un L1 prend 3–7 dégâts par coup, gérable).

| Ennemi | Avant | Après | Raison |
|---|---|---|---|
| `client_legendaire` (boss) | 13 / 12 / 55 | **11 / 10 / 60** | Adoucit le one-shot, tanke un peu plus → combat dramatique mais faisable à L4-L5. |
| `orzag_coeur_pierre` | 26 / 24 / 110 (codé en dur) | **22 / 20 / 120** (dérivé) | Re-dérivé via `ORZAG_POWER_MULT`. Si on re-tune le boss, Orzag suit. |
| Orzag rewardXp | 120 | **150** | Récompenser l'effort de la vraie fin. |

### Tests d'équilibrage — `src/game/balance.test.ts` (nouveau, 17 tests)

Le fichier encadre la **forme** de l'équilibrage, pas les chiffres exacts.
Principes :

- Courbe XP monotone, stat-gain non-nul.
- Chaque héros a exactement 3 attaques, une par tier, T1 gratuit, dégâts
  monotones sur sa stat primaire.
- Marine = physical-only. Alphonse et Laurent = magic-only.
- Chaque kit a au moins **une** attaque plus forte que le T1 gratuit (sinon
  dépenser de la MP n'a pas de sens).
- Boss principal = `MAIN_BOSS_REFERENCE`. Orzag = boss × 2 sur atk/mag/hp.
  Orzag rewardXp > boss rewardXp.
- Un run honnête (~2 combats/type d'ennemi) banque assez d'XP pour L5.
  Le boss seul rapporte ≥ 2 level-ups.
- Aucun héros ne meurt d'un seul coup d'ennemi mid-tier à L1.
- Tous les héros survivent à un 2-shot du boss **au niveau attendu** (L5).

Le reste de la suite (leveling, resolution, riddles, store, data integrity,
generate encounters) reste intouché. **93 tests verts au total.**

---

## Flux d'un run — comment ça se tient

1. **L1 → L2-L3** en zone I / II : 10–30 XP via ennemis `easy`/`normal`.
   Level-up = +1 ATK, +1 MAG, +3 HP + restore complet.
2. **L3 → L4** en zone III : les `hard` font mal (14–15 XP/kill) mais sont
   digestes en groupe.
3. **L4 → L5** avant le boss : le joueur a typiquement 160–200 XP cumulés si
   tout est clear, largement au-dessus des 100 XP pour L5.
4. **Boss Administration** (L5 recommandé) : 60 HP à gratter, ~55–70 dégâts à
   encaisser selon RNG. Faisable, serré, dramatique. +60 XP → typiquement L6
   ou proche de L7 derrière.
5. **Victoire normale** ou **Orzag** (secret). Orzag = 22/20/120, attend un
   L6–L7 qui ne gaspille pas sa MP.

---

## Où tuner quoi — aide-mémoire

| Je veux… | Je change… |
|---|---|
| Rendre les levels plus rapides/plus lents | `XP_PER_LEVEL_BASE` dans `balance.ts`. |
| Changer la force du level-up | `STAT_GAIN_PER_LEVEL` dans `balance.ts`. |
| Rendre les énigmes/pièges plus durs | `DIFFICULTY_THRESHOLDS` dans `balance.ts`. |
| Changer la force d'Orzag relativement au boss | `ORZAG_POWER_MULT` dans `balance.ts`. |
| Re-tuner le boss principal | `ENEMIES.client_legendaire` dans `data/enemies.ts`. Mettre à jour `MAIN_BOSS_REFERENCE` en miroir (le test `balance.test.ts` te le rappellera). |
| Ajuster une attaque | `power` / `cost` dans `data/attacks.ts`. Changer un `power` de ±0.2 est perceptible ; ±0.5 est en général trop. |
| Ajuster les HP d'un héros | `stats.hp` dans `data/heroes.ts`. |

---

## Playtests — points à surveiller

Éléments qu'il vaut la peine d'observer en run réel, parce qu'ils dépendent
de trajectoires que les tests ne modélisent pas :

- **Pacing XP zone I → II.** L'estimation "2 combats/type" est moyenne ; un
  joueur qui route très directement peut arriver à la zone III encore L3.
  Regarder si ça créé un mur ou si c'est intentionnellement tendu.
- **Marine vs. boss.** Avec MAG 2 → 2 MP, elle ne peut lancer son T2
  qu'une fois. Vérifier que son run boss ne dépend pas trop de sa gestion
  MP (potentiellement : augmenter le pool de MP via `deriveMaxMp` ou lui
  donner un T2 à coût 1).
- **Laurent early.** 14 HP reste peu en zone I où un `client_sceptique`
  jitter-max fait 4 dégâts. Voir si les joueurs qui choisissent Laurent
  doivent systématiquement leveler avant d'explorer.
- **Économie MP.** Les trois T3 coûtent 3/4/5. Un run agressif vide sa MP et
  retombe sur le T1 gratuit — c'est voulu, mais si c'est perçu comme punitif,
  baisser les `cost` de 1 partout est le levier évident.
- **Fréquence des traps.** Les traps rongent lentement la HP (−2 à −5 par
  échec) et sont générés procéduralement. Si les runs finissent trop souvent
  en "HP 2/20 avant le boss", regarder la probabilité trap dans
  `generateEncounters.ts` — ça n'a pas été touché cette passe.
- **Orzag playtest.** Le fight n'a jamais été testé en conditions réelles
  avec les nouveaux stats. 22 ATK vs. L6 Sage (HP 26) = 2-shot serré.
  Possiblement encore trop punitif → ajuster `ORZAG_POWER_MULT` à 1.8
  suffirait.

---

## Design rule

> Tous les nombres qui façonnent la difficulté, le rythme ou la courbe de
> puissance vivent dans `src/game/balance.ts`. Un changement d'équilibrage
> devrait presque toujours se résumer à éditer ce seul fichier.
