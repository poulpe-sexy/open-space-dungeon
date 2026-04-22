# QA — OPEN SPACE DUNGEON

Checklist de vérification manuelle avant chaque release. Le run doit pouvoir
être bouclé de l’écran titre à la fin (victoire ou défaite) sans crash, sans
état incohérent et sans ralentissement sur un laptop moyen.

À compléter avec `npm run build` (doit être vert, sans warning TypeScript) et
`npm test` (65+ tests doivent passer).

---

## 1. Démarrage

- [ ] `npm run dev` démarre sans erreur console.
- [ ] En mode DEV, on voit dans la console :
  - `[data-integrity] ok` (ou aucun `error:` — seuls des `warn:` tolérés).
  - Aucun `[assets] missing PNG for …` (les 3 portraits héros sont présents).
- [ ] L’écran titre s’affiche en moins de 1 s.
- [ ] Le `<title>` du navigateur est correct.

## 2. Sélection du héros

- [ ] Les 3 portraits (Marine, Alphonse, Laurent) se chargent sans être flous.
- [ ] Si un PNG est volontairement renommé (test du fallback), une **initiale
      teintée** apparaît à la place — sans crash.
- [ ] Clic sur un portrait → lance la run, jingle `success`.

## 3. Dungeon / déplacement

- [ ] ZQSD / WASD / flèches déplacent le joueur, sans sortir de la grille.
- [ ] Un mur (`td-wall`) bloque le mouvement.
- [ ] Un meuble décoratif (`td-decor`) bloque le mouvement sans déclencher
      d’encounter.
- [ ] Marcher sur une tuile porte (tile `2`) :
  - [ ] Si aucun encounter de la salle n’est résolu → toast
        « ⚠ Résolvez au moins une rencontre… », la porte ne s’ouvre pas.
  - [ ] Si un key item est requis et pas possédé → toast « 🔒 Porte
        verrouillée — il faut « X » pour passer ».
  - [ ] Sinon → transition vers la salle suivante avec SFX `door`.
- [ ] Entrer dans une salle qui accorde un key item (`grantsKeyItem`) montre
      un toast « ✦ Objet obtenu : … » et ajoute l’item dans le HUD.

## 4. Rencontres

- [ ] **Combat** : l’overlay s’ouvre, le héros attaque, l’ennemi riposte.
  - [ ] Si MP insuffisants, le bouton est désactivé.
  - [ ] Gagner octroie de l’XP ; au franchissement d’un palier, le banner
        « ✦ NIVEAU X ! » s’affiche et PV/MP repassent au max.
  - [ ] Un gros reward (ex. boss) peut déclencher **plusieurs** level-ups
        en un seul kill (voir `leveling.test.ts`).
- [ ] **Événement** : les choix sont lisibles, le reward (HP/MP/keyItem)
      s’applique sans dépasser les plafonds.
- [ ] **Piège / Puzzle** : le héros recommandé est mis en avant, la
      résolution dépense un coût correct.

## 5. Boss

- [ ] Après avoir visité `BOSS_ROOMS_NEEDED` salles distinctes (15 par défaut),
      la prochaine porte mène **systématiquement** à `boss_room` (la 16ᵉ salle).
      La constante vit dans `src/game/balance.ts` — ajuster là si ce seuil
      change à nouveau.
- [ ] Le boss (Client Légendaire) est combatif, pas d’auto-combat parasite.
- [ ] Victoire sur le boss → écran `victory`, la run se termine proprement.

## 6. Défaite / redémarrage

- [ ] PV à 0 → écran `defeat` avec jingle `fail`.
- [ ] « Rejouer » remet le joueur sur l’écran titre, le store est reset, les
      key items et encounters résolus sont vides.

## 7. Audio

- [ ] Musique du titre au démarrage, transition vers musique d’exploration
      au lancement de la run, musique de combat pendant les combats.
- [ ] Boutons Mute SFX / Mute Music coupent la bonne piste.
- [ ] Sliders de volume prennent effet en temps réel.
- [ ] Premier geste utilisateur débloque l’AudioContext (autoplay policy).

## 8. HUD

- [ ] Portrait héros + classe + PV + MP + niveau/XP + key items + compteur de
      salles (x/`BOSS_ROOMS_NEEDED`, 15 par défaut) visibles.
- [ ] Une fois `BOSS_ROOMS_NEEDED` salles visitées, l’emoji change de 🏢 en 💀,
      et la tooltip mentionne « prochaine porte → Administration ».

## 9. Visuels pixel-art & HiDPI

- [ ] Sur écran Retina / HiDPI, aucun smoothing sur :
  - [ ] Sprites de tuiles (combat / event / trap / puzzle / boss / door).
  - [ ] Portraits héros (`image-rendering: pixelated`).
  - [ ] Décor (barils, plantes, etc.).
- [ ] Scanlines visibles en léger overlay sur le stage.
- [ ] La couleur de bord du wrapper change selon la zone (`--zone-color`).

## 10. Accessibilité / ergonomie

- [ ] Bouton « ? » (Help) ouvre/ferme l’overlay Comment jouer.
- [ ] `Escape` ne casse rien pendant un overlay de combat / événement.
- [ ] Le focus clavier reste visible sur les boutons d’action.
- [ ] Toast de blocage / flavor disparaît seul après quelques secondes.

## 11. Tests automatisés

- [ ] `npm test` → **65 passed** (resolution 43, leveling 7, store 7,
      generateEncounters 6, dataIntegrity 2).
- [ ] `npm run build` → pas d’erreur TypeScript, bundle < 300 kB brut.

---

## Points connus (restants)

Ces items ne bloquent pas un run mais sont documentés pour référence :

1. **`SLICE_SCREENS` / `ScreenView.tsx`** — legacy. Toujours dans le bundle
   mais plus jamais rendu par la boucle principale (remplacé par
   `TileDungeon`). Suppression = gros refactor, non urgente.
2. **Pas de sauvegarde / load** — volontaire (roguelike court, 1 run = 10 à
   20 minutes). À n’ajouter que si un mode « campagne » arrive.
3. **Flavor lines répétitives** — pool limité dans `roomFlavors.ts`.
   S’ajouter par zone pour plus de variété.
4. **Pas de mobile-first** — le keyboard est requis. Un contrôleur tactile
   existe dans l’arborescence mais n’est pas branché (cf. `TouchPad.tsx`
   s’il revient).
5. **Musiques procédurales** — grains / transitions encore un peu abruptes
   à la bascule exploration↔combat. Acceptable mais perfectible.
6. **Pas de logs d’erreur persistés** — toutes les protections runtime
   (`dataIntegrity`, guards `SCREENS[id]?`) dégradent proprement mais
   n’envoient rien à un backend — non pertinent pour un jeu purement client.
