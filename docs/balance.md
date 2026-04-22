# Balance — OPEN SPACE DUNGEON

Ce document explique le pourquoi des chiffres. Les valeurs, elles, vivent
dans **un seul endroit** : `src/game/balance.ts`. Tout le reste du code
importe depuis ce module — pour re-tuner le jeu, éditer ce fichier suffit
presque toujours.

---

## Passe d'équilibrage actuelle — « Anti-spam T3 »

### Problème identifié

Playtest : **le jeu était encore trop facile**, et **la stratégie optimale
était triviale** : appuyer sur T3 à chaque tour. Trois causes :

1. **Aucune contrepartie au T3.** Pas de cooldown, pas de dégraissage, pas de
   coût caché. Strictement meilleur que T1/T2 tant qu'on a de la MP.
2. **Coût MP trop faible par rapport aux réserves.**
   - Marine : pool 4 MP / coût 3 = 1,3 utilisations (déjà bridée par la MP).
   - Alphonse : pool 10 MP / coût 4 = 2,5 utilisations (peut chaîner T3-T3-T1-T3).
   - Laurent : pool 18 MP / coût 5 = 3,6 utilisations — pire délinquant.
3. **T1 = bouton de désespoir.** Aucune raison de l'utiliser tant que MP > 0.
   **T2 = T3 dégradé.** Utilisé uniquement quand on n'a pas assez de MP pour T3.
4. **HP ennemis trop basses.** La plupart des adversaires mouraient en 1-2 T3 —
   le cooldown n'aurait aucun effet si l'ennemi est déjà mort.
5. **Level-up restaure la MP entièrement.** Neutralise toute pression de
   ressources accumulée entre les pièces.

### Solution — simple, visible, immédiatement compréhensible

**Règle principale : T3 entre en recharge pour 2 tours ennemis après chaque utilisation.**

Concrètement : après avoir utilisé T3, le joueur doit effectuer au moins 1
action non-T3 (T1 ou T2) avant de pouvoir le relancer. T3 est grisé et affiché
`🔒 Recharge : 2` en attendant. Aucun système complexe, aucune jauge à lire.

**Règle secondaire : T1 récupère 1 MP à chaque utilisation.**

Ce qui était une action de désespoir devient un outil de gestion : pendant la
fenêtre de recharge T3, le joueur _veut_ appuyer sur T1 pour recharger sa MP
en vue du prochain T3. Rythme intentionnel : T3 → T1(+MP) → T1(+MP) → T3.

**Règle tertiaire : T2 légèrement buffé** (×1.5 → ×1.6 pour Alphonse et Laurent)
pour en faire un vrai choix tactique pendant la recharge, pas juste un bouton
de transit vers le prochain T3.

---

### Constantes centralisées — `src/game/balance.ts`

| Constante | Avant | Après | Ce que ça pilote |
|---|---|---|---|
| `T3_COOLDOWN` | *(absent)* | **`2`** | Tours ennemis de verrouillage post-T3. |
| `T1_MP_GAIN` | *(absent)* | **`1`** | MP récupérée à chaque usage de T1. |
| `MAIN_BOSS_REFERENCE` atk | `12` | **`11`** | ATK boss de référence (−1 pour compenser les tours plus nombreux). |
| `BOSS_ROOMS_NEEDED` | `15` | *inchangé* | |
| `XP_PER_LEVEL_BASE` | `12` | *inchangé* | |
| `STAT_GAIN_PER_LEVEL` | `{atk:1, mag:1, hp:3}` | *inchangé* | |
| `ORZAG_POWER_MULT` | `2` | *inchangé* | |

---

### Attaques — `src/data/attacks.ts`

| Attaque | Tier | Avant | Après | Commentaire |
|---|---|---|---|---|
| `impact` (Marine T1) | 1 | power 1.0 · cost 0 | +`mpGain 1` | Donne 1 MP en utilisant — utile pendant la recharge T3. |
| `charme` (Alphonse T1) | 1 | power 1.0 · cost 0 | +`mpGain 1` | Idem. |
| `apnée` (Laurent T1) | 1 | power 1.0 · cost 0 | +`mpGain 1` | Idem. |
| `choc` (Marine T2) | 2 | power 1.5 · cost 2 | *inchangé* | Marine est bridée par la MP, pas besoin de buff T2. |
| `baratin` (Alphonse T2) | 2 | power **1.5** · cost 2 | power **1.6** | +7 % de dégâts ; T2 devient un vrai choix. |
| `figuier_étrangleur` (Laurent T2) | 2 | power **1.5** · cost 2 | power **1.6** | Idem. |
| `pression` (Marine T3) | 3 | power 2.0 · cost **3** · pas de CD | cost **4** · `cooldown 2` | Coût = pool entier à L1 ; 1 seul T3 par fenêtre forcée. |
| `techno_boom_boom` (Alphonse T3) | 3 | power 2.0 · cost **4** · pas de CD | cost **6** · `cooldown 2` | 60 % du pool à L1 ; 2 T3 max depuis la pleine MP. |
| `décommissionnement` (Laurent T3) | 3 | power **2.2** · cost **5** · pas de CD | power **2.0** · cost **7** · `cooldown 2` | Toujours le plus fort, mais bridé. −0.2 power + −2 MP par rapport à avant. |

**Diagramme de rythme (Laurent vs boss, L6) :**

```
Tour joueur 1 : T3 — 30 dégâts → boss 70→40. CD=2. MP 30→23.
Tour ennemi 1 : boss attaque −11 → joueur 32→21 HP. CD→1.
Tour joueur 2 : T2 — 25 dégâts → boss 40→15. (T3 grisé, CD=1.)
Tour ennemi 2 : boss attaque −11 → joueur 21→10 HP. CD→0.
Tour joueur 3 : T3 — 30 dégâts → boss 15→0. VICTOIRE !
```

*Résultat : 3 actions joueur, 2 attaques ennemies reçues. Le joueur finit à
10 HP — serré, mais gagnable. T3 utilisé 2 fois, T2 une fois. Zéro spam.*

---

### Ennemis — `src/data/enemies.ts`

HP augmentées pour que les combats durent assez longtemps pour que le cooldown
soit pertinent. Sans ces bumps, les adversaires mouraient encore en 1 T3 et la
recharge n'entrait jamais en jeu.

| Ennemi | HP avant | HP après | Différence |
|---|---|---|---|
| `client_hesitant` (easy) | 9 | **12** | +3 |
| `client_sceptique` (easy) | 11 | **15** | +4 |
| `client_exigeant` (normal) | 16 | **21** | +5 |
| `client_anxieux` (normal) | 13 | **17** | +4 |
| `client_chronophage` (normal) | 20 | **26** | +6 |
| `client_fantome` (hard) | 22 | **28** | +6 |
| `client_zen` (hard) | 24 | **30** | +6 |
| `client_blinde` (normal, armure) | 38 | **44** | +6 (armure inchangée −4) |
| `client_moteur` (normal, buff) | 16 | **20** | +4 |
| `client_demoraliseur` (normal, debuff ATK) | 15 | **19** | +4 |
| `client_brouilleur` (normal, debuff MAG) | 14 | **18** | +4 |
| `client_vampirique` (hard, drain) | 22 | **27** | +5 |
| `client_lunatique` (hard, alternate) | 20 | **25** | +5 |
| **`client_legendaire` (boss)** | ATK **12**/MAG 11/HP 70 | ATK **11**/MAG 11/HP 70 | ATK −1 ; HP inchangé. |
| **`orzag_coeur_pierre`** | ATK 24/MAG 22/HP 140 (dérivé) | ATK **22**/MAG 22/HP 140 | Auto-suivi via `ORZAG_POWER_MULT = 2`. |

**Pourquoi baisser l'ATK du boss de 12 à 11 ?**
Le cooldown force des tours "T1/T2" entre les T3, donc le boss attaque plus de
fois par combat qu'avant. Sans compensation, le boss devenait trop létal —
worst-case 2-shot à L6 passait de 28 à 28 (inchangé mathématiquement car
c'est ceil(12×1.1)=14, mais avec plus d'attaques subies, la probabilité de
mourir monte). Avec ATK 11 : worst-case 2-shot = 2 × ceil(11×1.1) = **26**.
Laurent à L6 a 29 HP — il tient.

---

## Passe précédente — « 15 pièces »

### Règle de progression — découverte de pièces

> Le joueur doit découvrir **15 pièces distinctes** avant que la porte
> suivante ne le mène à `boss_room`. La salle de départ compte comme #1.

- Pas un gate de niveau — purement de l'exploration.
- Le backtracking ne fait **pas** avancer le compteur : seules les salles
  encore jamais vues incrémentent `visitedRooms`.
- Logique dans `addDiscoveredRoom(rooms, id)` (`src/game/store.ts`).

### Constantes (passe 15 pièces)

| Constante | Avant | Après |
|---|---|---|
| `BOSS_ROOMS_NEEDED` | *(10, hard-codé × 2 fichiers)* | **`15`** central |
| `XP_PER_LEVEL_BASE` | `10` | **`12`** |
| `MAIN_BOSS_REFERENCE` | `11/10/60` | **`12/11/70`** |

### Ennemis (passe 15 pièces)

HP +1/+2 sur tous les réguliers. Boss 12/11/70. Orzag 24/22/140.

---

## Tests — `src/game/balance.test.ts`

**33 tests** au total après la passe anti-spam T3 (+8 nouveaux) :

- `T3_COOLDOWN === 2` (pinné — tout changement = décision délibérée).
- `T1_MP_GAIN === 1` (pinné).
- Tous les T3 ont `cooldown = T3_COOLDOWN`.
- Tous les T1 ont `mpGain = T1_MP_GAIN`.
- T3 coûte plus que T2 pour chaque héros.
- T2 coûte plus que T1 (T1 toujours gratuit).
- T2 power > T1 power (T2 vaut qu'on dépense de la MP pendant le CD).
- Marine T3 cost ≤ son maxMP de base (peut le lancer au moins une fois à L1).

---

## Flux d'un run — comment ça se tient maintenant

1. **L1 → L3** en zones I / II (salles 1–6, ~15–20 combats) : 60-120 XP.
   T3 utilisé une fois par combat (cool-down force 1-2 T1 entre). Les ennemis
   easy/normal survivent maintenant 2-3 tours → le combat ressemble à un
   vrai duel même tôt.
2. **L3 → L5** en zone III (salles 7–11) : les ennemis `hard` (HP 28-30,
   capacités spéciales) forcent la variation T1/T2/T3. La MP de Laurent
   commence à se raréfier.
3. **L5 → L6** en zone IV (salles 12–15) : pression maximale. L'optimum
   tactique devient `T3 → T2 → T3` (T2 buffé à ×1.6 est un vrai choix).
4. **Boss Administration** (L6 recommandé) : ATK 11 / MAG 11 / HP 70.
   Le cooldown force 1 T2 entre chaque T3 — combat en 3-5 tours selon la
   gestion MP. +60 XP → L7.
5. **Victoire normale** ou **Orzag** (secret, 100 % des rencontres résolues) :
   ATK 22 / MAG 22 / HP 140. Demande un L7 complet et une MP gérée avec soin.

---

## Où tuner quoi — aide-mémoire

| Je veux… | Je change… |
|---|---|
| Assouplir/durcir la recharge T3 | **`T3_COOLDOWN`** dans `balance.ts` (2 → 1 = plus doux ; 2 → 3 = plus punitif). |
| Changer l'utilité de T1 comme outil de recharge MP | **`T1_MP_GAIN`** dans `balance.ts`. Mettre à 0 pour revenir à l'ancien T1. |
| Rendre le run plus long / plus court | **`BOSS_ROOMS_NEEDED`** dans `balance.ts`. |
| Rendre les levels plus rapides / plus lents | `XP_PER_LEVEL_BASE` dans `balance.ts`. |
| Changer la force du level-up | `STAT_GAIN_PER_LEVEL` dans `balance.ts`. |
| Rendre les énigmes/pièges plus durs | `DIFFICULTY_THRESHOLDS` dans `balance.ts`. |
| Changer la force d'Orzag relativement au boss | `ORZAG_POWER_MULT` dans `balance.ts`. |
| Re-tuner le boss principal | `ENEMIES.client_legendaire` dans `data/enemies.ts`. Mettre à jour `MAIN_BOSS_REFERENCE` en miroir (le test `balance.test.ts` te le rappellera). |
| Ajuster la puissance d'une attaque | `power` dans `data/attacks.ts`. ±0.2 = perceptible ; ±0.5 = souvent trop. |
| Ajuster le coût d'une attaque | `cost` dans `data/attacks.ts`. T3 doit toujours rester > T2 > 0 (assertions couvertes par tests). |
| Changer la HP d'un ennemi | `stats.hp` dans `data/enemies.ts`. Vise ≥ 2 tours de combat pour que le cooldown soit pertinent. |
| Ajuster dégâts d'un trap ou soin d'un event | `data/traps.ts` / `data/events.ts` — mettre à jour le label UI du choix. |

---

## Playtests — points à surveiller (passe anti-spam T3)

- **Rythme T3→T1→T3 est-il clair ?** Le joueur doit voir intuitivement que
  presser T1 pendant la recharge récupère 1 MP et prépare le prochain T3.
  Si ce n'est pas intuitif, envisager un message d'aide ou un tooltip explicite.
- **T2 est-il utilisé ?** Avec ×1.6, Alphonse T2 et Laurent T2 font ~20 %
  de plus qu'avant. Observer si les joueurs T3→T2→T3 ou T3→T1→T1→T3 — les
  deux sont valides, T2 doit sembler un vrai choix.
- **Marine survit-elle au boss sans trop souffrir ?** Marine T3 coûte 4 MP
  (= toute sa réserve de base). Elle a les plus longues fenêtres de recharge
  MP — observer si elle se retrouve coincée à 0 MP trop longtemps face au boss.
  Si oui : baisser `pression.cost` à 3 ou monter `marine.stats.mag` à 3.
- **Orzag est-il encore accessible après la passe ?** ATK 22 / MAG 22 / HP 140,
  T3 bridé → le combat prend ~8-10 actions. Observer si c'est jouable à L7 ou
  s'il faut baisser `ORZAG_POWER_MULT` à 1.8.
- **Les ennemis easy deviennent-ils ennuyeux ?** HP 12-15 sur `client_hesitant`
  / `client_sceptique` rend les premiers combats un peu plus longs. Si le pacing
  zone I semble lourd, baisser HP easy de 2.
- **Client Lunatique + cooldown T3 = combo trop punitif ?** L'alternance
  passif/burst du Lunatique forçait déjà la prudence. Avec le cooldown T3,
  si le burst arrive exactement quand T3 est en recharge, ça peut être trop
  sévère. Observer et envisager de baisser `client_lunatique.stats.atk` de 7 à 6.
