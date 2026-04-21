# Character assets

Dépose ici les PNG officiels des trois héros :

- `MARINE.png`   — classe **Choc**    (frontline)
- `ALPHONSE.png` — classe **Classe**  (polyvalent)
- `LAURENT.png`  — classe **Sage**    (mage / contrôle)

Ces visuels sont utilisés :
- en **portraits** sur l'écran titre / hero select (React `<img>`)
- en **visuels de combat** (portrait de gauche dans `CombatOverlay`)

Pour la **navigation in-game** (sprites de déplacement sur la grille Phaser),
on garde des placeholders générés (voir `src/game/scenes/BootScene.ts`) tant
que les PNG ne sont pas détourés proprement — cf. `docs/assets.md`.

Rendu : `image-rendering: pixelated` est forcé globalement, donc tout PNG
16 bits déposé ici sera affiché en nearest-neighbor sans lissage.
