# OPEN SPACE DUNGEON

Mini RPG web solo, corporate-fantasy, exploration screen-par-screen, DA 16 bits.
Inspiré des vieux Ultima. Run cible : 20-30 min.

## Stack

- **Vite** — dev server + bundler
- **TypeScript strict**
- **React 18** — shell UI, écrans title/victoire/défaite, overlays combat / événements / pièges / énigmes
- **Phaser 3** — grille d’exploration, mouvement tile-by-tile, markers d’encounter
- **CSS** simple (variables + modules inline, pas de framework)
- Pas de backend. Sauvegarde `localStorage` optionnelle, non activée dans le MVP.

## Lancer le projet

```bash
cd "DUNGEON GAME"
npm install
npm run dev        # http://localhost:5190
npm run build      # build prod
npm run preview    # sert le build
```

## Structure

```
DUNGEON GAME/
├── public/assets/characters/       # MARINE.png / ALPHONSE.png / LAURENT.png
├── docs/
│   ├── assets.md                   # décisions sur les visuels héros
│   └── progress.md                 # TODO + checklist MVP
├── src/
│   ├── App.tsx                     # routeur de phases (title → dungeon → combat/event/trap/puzzle → end)
│   ├── main.tsx                    # entrée React, probe d'assets en DEV
│   ├── data/                       # 100% déclaratif, zéro logique
│   │   ├── types.ts
│   │   ├── heroes.ts               # 3 héros (Choc / Classe / Sage)
│   │   ├── attacks.ts              # catalogue d'attaques, référencé par id
│   │   ├── enemies.ts              # ennemis (inc. boss Liche RH)
│   │   ├── events.ts               # événements "classiques" (café, poster…)
│   │   ├── traps.ts                # pièges (mêmes choix-effet que events)
│   │   ├── puzzles.ts              # énigmes (une bonne réponse, pénalité sinon)
│   │   └── screens.ts              # grilles + exits + encounters, un objet par écran
│   ├── game/
│   │   ├── assets.ts               # SEUL endroit où l'on écrit un chemin d'asset
│   │   ├── createGame.ts           # config Phaser (pixelArt, antialias off, FIT)
│   │   ├── bus.ts                  # event bus typé Phaser ↔ React
│   │   ├── store.ts                # state global (useSyncExternalStore, sans dep)
│   │   └── scenes/
│   │       ├── BootScene.ts        # génère textures procédurales (tiles + hero placeholders + markers)
│   │       └── DungeonScene.ts     # rendu grille, input clavier, transitions, markers d'encounter
│   ├── components/
│   │   ├── TitleScreen.tsx         # intro + hero select (portraits PNG plein format)
│   │   ├── PhaserGame.tsx          # monte / démonte l'instance Phaser
│   │   ├── Hud.tsx                 # chips PV/MP/écran + ruban d'aide
│   │   ├── CombatOverlay.tsx       # combat tour par tour (React)
│   │   ├── EventOverlay.tsx        # event / trap / puzzle (format unifié EventDef)
│   │   ├── EndScreen.tsx           # victoire / défaite
│   │   ├── HeroPortrait.tsx        # <img> PNG + fallback initiale/tint
│   │   └── DebugPanel.tsx          # panneau debug (bascule avec `)
│   ├── styles/global.css           # design tokens + layouts
│   └── vite-env.d.ts
├── index.html                      # racine Vite
├── vite.config.ts                  # port 5190, strictPort
└── tsconfig.json                   # TS strict
```

## Architecture — pourquoi Phaser **et** React

- **Phaser** possède UNIQUEMENT la grille : mouvement, collisions, transitions
  d’écran, pulsation des markers. Pas d’UI, pas de menus.
- **React** possède tout le reste : title, hero select, HUD, combat, événements,
  pièges, énigmes, écrans de fin. Conséquence directe : les portraits PNG des
  héros et les visuels narratifs restent nets via `<img>`, sans passer par une
  texture Phaser.
- Les deux communiquent via un `store` minimal (signaux globaux) + un `bus`
  d’événements typés dans `src/game/`. Quand le joueur marche sur un marker,
  la scène set `phase: 'combat'|'event'|'trap'|'puzzle'` → l’overlay React
  correspondant s’affiche. Quand l’overlay finit, il set `phase: 'dungeon'` et
  émet `bus.emit('resume')` → la scène rafraîchit les markers.

## Configuration pixel-art

- Phaser : `pixelArt: true`, `antialias: false`, `roundPixels: true`,
  `Scale.FIT + CENTER_BOTH` (voir [createGame.ts](src/game/createGame.ts)).
- CSS global : `image-rendering: pixelated` appliqué à toutes les `img` et
  `canvas`. Donc un PNG 16 bits déposé brut s’affiche en nearest-neighbor.

## Assets héros

Les 3 PNG officiels vont dans :

- `public/assets/characters/MARINE.png`   — Choc (frontline)
- `public/assets/characters/ALPHONSE.png` — Classe (polyvalent)
- `public/assets/characters/LAURENT.png`  — Sage (mage / contrôle)

Les chemins vivent dans un seul fichier : [`src/game/assets.ts`](src/game/assets.ts).
Les composants qui les rendent (`HeroPortrait`) ont un fallback automatique
(lettre initiale + tint de classe) si le PNG manque. En DEV, la console log
quels PNG sont absents au démarrage.

Détail complet dans [`docs/assets.md`](docs/assets.md) — notamment pourquoi on
garde des placeholders procéduraux pour les sprites de navigation tant que les
PNG ne sont pas détourés.

## Ajouter du contenu

Tout est déclaratif — aucune nouvelle ligne de code nécessaire pour :

| Ajouter…         | Où éditer                              |
|------------------|----------------------------------------|
| un écran         | `src/data/screens.ts` (objet `ScreenDef` : tiles, exits, encounters) |
| un ennemi        | `src/data/enemies.ts` + référencé dans un encounter |
| une attaque      | `src/data/attacks.ts` + ajouter l’id dans `hero.attackIds` |
| un événement     | `src/data/events.ts` + encounter `kind: 'event'` |
| un piège         | `src/data/traps.ts` + encounter `kind: 'trap'` |
| une énigme       | `src/data/puzzles.ts` + encounter `kind: 'puzzle'` |
| un boss          | ennemi classique + `isBossScreen: true` sur son écran |

Le boss final est déjà en place : `hr_lich` dans `boss_room`.

## Contrôles

- **← ↑ ↓ →** ou **WASD** : déplacement
- Marcher sur un cercle **rouge** → combat
- Marcher sur un cercle **bleu** → événement
- Marcher sur un triangle **jaune** → piège
- Marcher sur un losange **violet** → énigme
- **`** (backtick) : montre / cache le panneau de debug

## Debug panel

Bascule avec backtick. Affiche en live : phase, écran courant, héros, PV/MP,
nombre d’ennemis vaincus, événements résolus, encounter en cours.

## État MVP

Jouable de bout en bout : titre → hero select (avec les 3 PNG) → 4 écrans →
~5 combats + event / trap / puzzle → boss → victoire/défaite.

Checklist détaillée : [`docs/progress.md`](docs/progress.md).
