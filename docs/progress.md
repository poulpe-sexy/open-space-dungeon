# Progress — OPEN SPACE DUNGEON

## Checklist MVP

### Socle technique
- [x] Scaffold Vite + TS strict + React + Phaser 3
- [x] Config Phaser pixel-art (pixelArt, antialias off, roundPixels)
- [x] CSS `image-rendering: pixelated` global
- [x] Module centralisé d’assets (`src/game/assets.ts`)
- [x] Store global sans dépendance (`useSyncExternalStore`)
- [x] Event bus typé Phaser ↔ React

### Contenu jouable
- [x] 3 héros (Marine / Alphonse / Laurent) avec classes Choc / Classe / Sage
- [x] Portraits PNG officiels intégrés sur title + combat
- [x] Fallback automatique si PNG manquant
- [x] 4 écrans connectés (lobby / corridor / break room / boss)
- [x] Combat tour par tour (React overlay, log, PV/MP, attaques typées)
- [x] Événements à choix (café, mémo, poster)
- [x] Boss final (Liche RH) + écrans Victoire / Défaite

### Extensions d’architecture (prête mais contenu minimal)
- [x] Type `EncounterKind = combat | event | trap | puzzle`
- [x] `traps.ts` + 1 piège placé dans `corridor`
- [x] `puzzles.ts` + 1 énigme placée dans `break_room`
- [x] Markers dédiés (triangle jaune = trap, losange violet = puzzle)
- [x] Debug panel (bascule avec `)

## Next (post-MVP, à faire seulement si utile)

- [ ] Tester en session réelle : durée run ≈ 20-30 min ?
- [ ] Ajouter 2-3 pièges et énigmes supplémentaires
- [ ] Sauvegarde localStorage (run en cours + stats finales)
- [ ] Petite musique / SFX via Phaser audio
- [ ] Idle animation 2 frames sur les sprites de nav
- [ ] Item / équipement trouvable en event
- [ ] Traduction EN / i18n minimale

## Bugs / polish à surveiller

- Resize Phaser (FIT) sur écran < 960×640 à vérifier
- Focus clavier sur les boutons de combat (accessibilité)
- Empêcher double-trigger d’une encounter si on spam les touches rapidement
