# Assets — OPEN SPACE DUNGEON

## Fichiers héros

| Fichier | Chemin public | Clé Phaser |
|---|---|---|
| MARINE.png | `/assets/characters/MARINE.png` | `hero_marine` |
| ALPHONSE.png | `/assets/characters/ALPHONSE.png` | `hero_alphonse` |
| LAURENT.png | `/assets/characters/LAURENT.png` | `hero_laurent` |

Source de vérité pour les URLs : `src/game/assets.ts` (`HERO_PORTRAITS`).

---

## Usages

### 1. Écran titre — sélection du héros
**Composant :** `HeroCard` → `src/components/HeroCard.tsx`  
**Rendu :** Portrait dans un carré `aspect-ratio: 1/1`, `object-fit: contain` sur fond noir.  
**Taille affichée :** ~200 × 200 px selon la résolution.

### 2. HUD — puce héros
**Composant :** `Hud` → `src/components/Hud.tsx` (`.hud-hero-chip`)  
**Rendu :** Miniature 28 × 28 px, `object-fit: contain`.  
Visible en permanence pendant l'exploration.

### 3. Party panel — strip de l'équipe
**Composant :** `PartyPanel` → `src/components/PartyPanel.tsx`  
**Rendu :** 3 vignettes 44 × 44 px en bas à gauche du canvas. Le héros actif est mis en valeur (opacité 100 %, bordure couleur classe). Les deux autres sont atténués (55 %).  
Visible uniquement en phase `dungeon`.

### 4. Combat — portrait joueur
**Composant :** `CombatOverlay` → `src/components/CombatOverlay.tsx` (`.combat-portrait`)  
**Rendu :** Portrait dans un panneau flexible, hauteur max 180 px, `object-fit: contain`.  
Visible pendant les combats.

### 5. Curseur de déplacement (canvas Phaser)
**Scene :** `BootScene.preload()` — charge les PNG avec les clés `hero_marine`, `hero_alphonse`, `hero_laurent`.  
**Rendu :** `DungeonScene` crée un `Phaser.GameObjects.Image` avec `.setDisplaySize(60, 60)`.  
Si le PNG échoue au chargement, `BootScene.create()` génère une silhouette colorée de remplacement (même clé, via `makeTile`) — la garde `if (scene.textures.exists(key)) return` empêche l'écrasement du PNG chargé.

---

## Rendu pixel-art

`image-rendering: pixelated` est appliqué globalement à tous les `<img>` et `<canvas>` dans `src/styles/global.css`.  
Phaser tourne avec `pixelArt: true`, `antialias: false`, `roundPixels: true`.

---

## Contraintes connues

- **Pas de fond transparent.** Les PNG contiennent un fond (dalle isométrique). Aucune suppression de fond n'est appliquée.
- **Pas de découpe.** Les personnages ne sont pas des sprites isolés ; ils sont affichés entiers en `object-fit: contain`.
- **Taille source élevée.** Les PNG sont des illustrations pleine résolution (~5 Mo). Aucun redimensionnement n'est effectué par le build Vite.
- **Fallback automatique.** `HeroPortrait` (`src/components/HeroPortrait.tsx`) bascule sur un placeholder lettre + couleur de classe si le fichier est absent ou cassé (`onError`).

---

## Remplacer un asset

### Même format (illustration)
Remplacer le fichier dans `public/assets/characters/` en conservant le nom exact (`MARINE.png`, `ALPHONSE.png`, `LAURENT.png`). Aucune autre modification nécessaire.

### Passer à des sprites détourés (PNG transparent)
1. Déposer les nouveaux fichiers dans `public/assets/characters/` (mêmes noms).
2. Retirer `image-rendering: pixelated` de `global.css` si les sprites sont en haute résolution et doivent être lissés.
3. Ajuster `object-fit` dans `.hero-portrait img`, `.party-thumb img`, `.combat-portrait img` selon les proportions du nouveau visuel.
4. Dans `DungeonScene`, ajuster `.setDisplaySize(60, 60)` si le sprite a des proportions différentes.

### Passer à des spritesheets animées
1. Charger la spritesheet dans `BootScene.preload()` via `this.load.spritesheet(...)`.
2. Remplacer `this.add.image(...)` par `this.add.sprite(...)` dans `DungeonScene.create()`.
3. Créer les animations via `this.anims.create(...)`.
4. Les composants React (`HeroPortrait`, `PartyPanel`, etc.) continuent d'utiliser le PNG statique pour les portraits UI — charger un PNG séparé ou extraire la première frame.
