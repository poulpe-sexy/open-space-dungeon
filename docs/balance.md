# Balance — OPEN SPACE DUNGEON

Ce document explique le pourquoi des chiffres. Les valeurs, elles, vivent
dans **un seul endroit** : `src/game/balance.ts`. Tout le reste du code
importe depuis ce module — pour re-tuner le jeu, éditer ce fichier suffit
presque toujours.

---

## Passe d’équilibrage actuelle — « 15 pièces »

Diagnostic playtest : **le jeu était trop facile**. Trois causes principales :

1. **Run trop court** — 10 pièces avant le boss. Le joueur arrivait à
   l’Administration à L5-L6 avec les ressources encore pleines, peu de
   pression HP/MP cumulée, un run bouclé en ~8-10 minutes sans tension.
2. **Événements soignants trop généreux** — `coffee_machine`, `pep_talk`,
   `ascenseur_priorites`, `powerpoint_interdit` rendaient +3 à +6 HP / +1 à
   +4 MP sur des choix sans risque. Sur 10 pièces ça suffisait pour
   neutraliser l’attrition.
3. **Pièges et ennemis réguliers sous-calibrés** — les traps rognaient
   lentement (−2 à −5 HP) et les ennemis mid-tier avaient une réserve de
   PV étroite (8-22 HP), donc peu de MP consommée par combat. Sur un run
   court, la tension ne se déclenchait jamais.

### Règle de progression — désormais basée sur la **découverte de pièces**

> Le joueur doit découvrir **15 pièces distinctes** avant que la porte
> suivante ne le mène systématiquement à `boss_room`. La salle de départ
> compte comme la première découverte.

- Ce n’est **pas** un gate de niveau — purement de l’exploration.
- Le backtracking ne fait **pas** avancer le compteur : seules les salles
  encore jamais vues incrémentent `visitedRooms`.
- La logique de dédoublonnage vit dans `addDiscoveredRoom(rooms, id)`
  (`src/game/store.ts`) et est couverte par `balance.test.ts` (5 tests).
- Si le joueur entre **naturellement** dans `boss_room` via `ceo_corridor`
  avant le seuil, le combat boss démarre quand même — pas de blocage.

### Constantes centralisées — `src/game/balance.ts`

| Constante | Avant | Après | Ce que ça pilote |
|---|---|---|---|
| `BOSS_ROOMS_NEEDED` | (10, hard-codé) | **`15`** | Nb de salles distinctes avant le boss forcé. |
| `XP_PER_LEVEL_BASE` | `10` | **`12`** | XP pour passer L → L+1 (linéaire : `L × base`). |
| `MAIN_BOSS_REFERENCE` | `11/10/60` | **`12/11/70`** | Stats de référence du boss principal. |
| `STAT_GAIN_PER_LEVEL` | `{atk:1, mag:1, hp:3}` | _inchangé_ | Gain de stats à chaque level-up. |
| `DIFFICULTY_THRESHOLDS` | `easy:4 normal:6 hard:9 boss:12` | _inchangé_ | Cibles d6 pour traps/puzzles/events. |
| `ORZAG_POWER_MULT` | `2` | _inchangé_ | Multiplicateur Orzag ↔ boss principal. |

**Conséquence XP curve (base 12) :**
- Cost to L5 = `12+24+36+48` = **120 XP**
- Cost to L6 = **180 XP**
- Cost to L7 = 252 XP

Sur 15 pièces (~35-45 combats × rewardXp moyen ~9 = ~300 XP + boss 60),
le joueur arrive à L6-L7 au boss — la courbe de puissance est désormais
**alignée** avec les stats boss 12/11/70 et le combat redevient un
vrai duel.

### Ennemis — `src/data/enemies.ts`

Tous les ennemis réguliers prennent **+1 ou +2 HP** (~10 % de bulk), et
`client_anxieux` gagne **+1 ATK**. Rewards XP inchangés.

| Ennemi | Avant (ATK/MAG/HP) | Après | Commentaire |
|---|---|---|---|
| `client_hesitant` (easy) | 3/1/8 | 3/1/**9** | Tutoriel, juste un peu plus de mâche. |
| `client_sceptique` (easy) | 4/2/10 | 4/2/**11** | |
| `client_exigeant` (normal) | 6/3/14 | 6/3/**16** | |
| `client_anxieux` (normal) | 3/6/12 | **4**/6/**13** | Passe de "punching bag" à "prend 2-3 tours". |
| `client_chronophage` (normal) | 5/4/18 | 5/4/**20** | |
| `client_fantome` (hard) | 7/5/20 | 7/5/**22** | |
| `client_zen` (hard) | 4/8/22 | 4/8/**24** | |
| **`client_legendaire` (boss)** | **11/10/60** | **12/11/70** | +1 ATK / +1 MAG / +10 HP. Combat plus long, plus serré, survivable à L6. |
| **`orzag_coeur_pierre`** | 22/20/120 (dérivé) | **24/22/140** (dérivé) | Auto-suivi via `ORZAG_POWER_MULT = 2`. |

### Pièges — `src/data/traps.ts`

Dégâts HP de la branche forcée **+1 HP** partout, coût MP de la branche
sûre **+1 MP** sur `cable_snare`. Les traps mordent désormais un peu plus
fort, ce qui rend les runs "je fonce sans MP" plus coûteux.

| Trap | Branche rapide | Avant | Après |
|---|---|---|---|
| `cable_snare` | Foncer | −3 PV | **−4 PV** |
| `cable_snare` | Démêler | −1 MP | **−2 MP** |
| `floor_shock` | Avancer | −5 PV | **−6 PV** |
| `reunion_infinie` | Forcer la porte | −4 PV | **−5 PV** |
| `tunnel_validation` | Signer | −3 PV | **−4 PV** |
| `comite_plantes` | Passer en force | −3 PV | **−4 PV** |

### Événements — `src/data/events.ts`

Les soins gratuits ont été **rabotés** pour restaurer la tension sur un run
long. Les branches risquées / flavor-only ne bougent pas.

| Event / choix | Avant | Après |
|---|---|---|
| `coffee_machine` expresso | +4 MP | **+3 MP** |
| `coffee_machine` déca | +6 PV | **+4 PV** |
| `pep_talk` respirer à fond | +5 PV, +1 MP | **+3 PV**, +1 MP |
| `powerpoint_interdit` fermer sans lire | +2 PV | **+1 PV** |
| `ascenseur_priorites` URGENT | +3 PV | **+2 PV** |

### Attaques — `src/data/attacks.ts`

Aucun changement cette passe. Les kits issus de la passe précédente
(Marine physical-only, Alphonse magic-only mid, Laurent magic-only deep)
restent pertinents : la pression vient des ennemis et de la durée, pas du
kit héros.

### Héros — `src/data/heroes.ts`

Inchangés : Marine 8/2/20, Alphonse 5/5/17, Laurent 2/9/14. Les nouveaux
HP cibles à L6 (Marine 35, Alphonse 32, Laurent 29) encaissent tous un
2-shot worst-case du boss (28 dégâts) sans coin-flip d’initiative.

---

## Tests — `src/game/balance.test.ts`

**25 tests** au total, **+8 nouveaux** sur cette passe :

- `BOSS_ROOMS_NEEDED === 15` (valeur centrale pinnée).
- `BOSS_ROOMS_NEEDED` dans `[10, 20]` (bornes de sanité).
- `addDiscoveredRoom` : append simple.
- `addDiscoveredRoom` : identité préservée si la salle est déjà connue
  (important pour la memoisation React).
- `addDiscoveredRoom` : liste vide.
- Simulation : 15 ajouts distincts produisent bien une liste de 15.
- Chemin avec revisites répétées : la longueur finale = nombre de salles
  uniques, pas nombre de pas.
- Nouvelle assertion XP : un run 15-pièces (~3 combats/type d’ennemi)
  bank bien les 180 XP de L6.
- Ajustement du 2-shot boss : le test passe de L5 à L6 (niveau attendu
  avec le nouveau seuil).

Les 97 autres tests passaient déjà et restent verts.

**Total suite : 101 tests verts.**

---

## Flux d’un run — comment ça se tient maintenant

1. **L1 → L3** en zones I / II (salles 1–6, ~15–20 combats) : 60-120 XP,
   quelques traps, un peu de HP perdue mais les healing events tamponnent.
2. **L3 → L5** en zone III (salles 7–11, ~10-15 combats additionnels) :
   les ennemis `hard` font mal, la MP commence à se raréfier chez Laurent.
   ~200 XP cumulés.
3. **L5 → L6** en zone IV (salles 12–15) : pression maximale avant la
   porte boss. Le joueur arrive typiquement à 60-80 % HP / 50-70 % MP.
4. **Boss Administration** (L6 recommandé) : 70 HP à gratter, ATK 12
   (worst-case 14 dmg / hit). Trois classes peuvent le poser en 3-5
   tours selon la gestion MP. +60 XP → typiquement L7.
5. **Victoire normale** ou **Orzag** (secret) si 100 % des rencontres
   visitées ont été résolues. Orzag = 24/22/140, demande un L7 propre.

---

## Où tuner quoi — aide-mémoire

| Je veux… | Je change… |
|---|---|
| Rendre le run plus long / plus court | **`BOSS_ROOMS_NEEDED`** dans `balance.ts`. |
| Rendre les levels plus rapides / plus lents | `XP_PER_LEVEL_BASE` dans `balance.ts`. |
| Changer la force du level-up | `STAT_GAIN_PER_LEVEL` dans `balance.ts`. |
| Rendre les énigmes/pièges plus durs | `DIFFICULTY_THRESHOLDS` dans `balance.ts`. |
| Changer la force d’Orzag relativement au boss | `ORZAG_POWER_MULT` dans `balance.ts`. |
| Re-tuner le boss principal | `ENEMIES.client_legendaire` dans `data/enemies.ts`. Mettre à jour `MAIN_BOSS_REFERENCE` en miroir (le test `balance.test.ts` te le rappellera). |
| Ajuster une attaque | `power` / `cost` dans `data/attacks.ts`. Changer un `power` de ±0.2 est perceptible ; ±0.5 est en général trop. |
| Ajuster les HP d’un héros | `stats.hp` dans `data/heroes.ts`. |
| Ajuster dégâts d’un trap ou soin d’un event | `data/traps.ts` / `data/events.ts` — ne pas oublier de mettre à jour le label UI du choix. |

---

## Comment tester rapidement la progression 15 salles

Le chemin le plus court pour valider le boss gate :

1. `npm run dev` et lancer une run.
2. Ouvrir la DevTools console et exécuter :
   ```js
   // Force 14 salles "découvertes" pour que la prochaine porte déclenche
   // la redirection vers boss_room. On garde `currentScreenId` sur la salle
   // de départ et on triche juste sur la longueur de visitedRooms.
   const s = window.__store ?? null; // si exposé en dev ; sinon via React DevTools.
   ```
   Si le store n’est pas exposé globalement, utiliser React DevTools →
   sélectionner `<Hud>` → inspecter `visitedRooms` sur le hook, ou bien
   simplement **jouer** : 15 salles se parcourent en ~4-5 min.
3. Vérifier le chip HUD : il affiche `🏢 0/15` au début, passe à `🏢 14/15`
   après avoir ouvert 14 portes vers des salles nouvelles, et devient
   `💀 15/15` dès que la 15ᵉ est atteinte (tooltip « la prochaine porte
   mène au bureau de l’Administration »).
4. Prendre une porte vers une salle encore jamais vue → la redirection
   force l’entrée dans `boss_room`.
5. Tests unitaires : `npx vitest run src/game/balance.test.ts` doit
   afficher **25 tests passed**, dont les 5 nouveaux sur `addDiscoveredRoom`
   et les 2 sur `BOSS_ROOMS_NEEDED`.

---

## Playtests — points à surveiller

Éléments qu’il vaut la peine d’observer en run réel :

- **Pacing zone I avec Laurent.** 14 HP en zone I reste serré. Avec +1 HP
  cumulé sur les mobs easy, il peut y avoir deux tours de combat de plus
  par fight — surveiller si ça crée un mur pour les joueurs Sage early.
- **Marine MP.** MAG 2 → 4 MP de base. Avec les traps qui coûtent désormais
  −2 MP sur la branche sûre (vs −1), Marine peut se retrouver sèche très
  tôt. Surveillance : envisager `stats.mag` → 3 pour Marine si la MP runs
  out trop tôt.
- **Fréquence de rooms sans combat.** Le guaranteed-combat-per-room est
  toujours là ; avec 15 pièces, la chance d’avoir une room "100 % traps"
  reste à ~5 %. Regarder si des runs se terminent avec 10+ traps cumulés
  → dans ce cas, baisser `DOOR_GUARD_CHANCE` dans `generateEncounters.ts`.
- **L7 avant Orzag.** Orzag est désormais 24/22/140. À L7 (Marine HP 38,
  Alphonse HP 35, Laurent HP 32), worst-case 2-shot = 2 × ceil(24 × 1.1)
  = 54 → **tout le monde meurt en 2 hits**. C’est volontaire — Orzag est
  censé demander du soin / esquive / kit maîtrisé. Si les playtests
  montrent que c’est injouable, baisser `ORZAG_POWER_MULT` à 1.8.
- **Économie MP zone IV.** Sur un run complet 15 pièces, Laurent utilisant
  `decommissionnement` (5 MP) toutes les 2-3 salles peut finir la zone IV
  avec 2 MP. Surveiller si ça pousse trop vers les events MP-boost.

---

## Design rule

> Tous les nombres qui façonnent la difficulté, le rythme ou la courbe de
> puissance vivent dans `src/game/balance.ts`. Un changement d’équilibrage
> devrait presque toujours se résumer à éditer ce seul fichier.
