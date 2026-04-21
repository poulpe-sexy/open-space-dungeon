# Audio — OPEN SPACE DUNGEON

## Structure des fichiers

```
public/assets/audio/
  music/
    exploration-dungeon.mp3   # boucle pendant l'exploration
    combat.mp3                # boucle pendant les combats
  sfx/
    hit-light.mp3             # attaque tier 1 / coup ennemi
    hit-medium.mp3            # attaque tier 2
    hit-heavy.mp3             # attaque tier 3
    success.mp3               # victoire combat / choix positif
    fail.mp3                  # défaite / choix négatif
    door.mp3                  # transition entre salles
    key-item.mp3              # récupération d'objet-clef
    ui-click.mp3              # boutons / choix neutre
```

Tous les fichiers sont **optionnels** : si un fichier est absent, l'`AudioManager`
log un warning en DEV et continue silencieusement. Le jeu ne crashe pas.

---

## Implémentation

### `src/game/audio.ts` — AudioManager

Singleton exporté `audio`. Responsabilités :

| Méthode | Description |
|---|---|
| `playMusic(key)` | Démarre la musique, évite les doublons, gère l'autoplay bloqué |
| `stopMusic()` | Arrête et remet à zéro |
| `playSfx(key)` | Joue un son depuis un pool d'éléments (overlapping possible) |
| `setMusicVol(v)` | Volume musique 0–1, persisté |
| `setSfxVol(v)` | Volume SFX 0–1, persisté |
| `toggleMute()` | Mute/unmute global |

Les préférences (volume + mute) sont persistées dans `localStorage` sous la clé `osd-audio-prefs`.

### Routing musique (phase → piste)

`initAudioRouting()` est appelé une seule fois dans `main.tsx`.
Il souscrit au store Zustand et switche la musique selon la phase :

| Phase | Musique |
|---|---|
| `title`, `dungeon`, `event`, `trap`, `puzzle` | `exploration-dungeon.mp3` |
| `combat` | `combat.mp3` |
| `victory`, `defeat` | silence (stopMusic) |

### Restriction autoplay navigateur

Les navigateurs bloquent l'autoplay avant la première interaction.
L'`AudioManager` attrape le rejet de `audio.play()` et met la piste en attente (`pendingMusicKey`).
Un listener `pointerdown`/`keydown` (capture, once) démarre la musique en attente dès la première interaction.

### SFX dans le combat

`CombatOverlay.tsx` joue :
- `hit-light / hit-medium / hit-heavy` selon `atk.tier` (1/2/3) quand le héros attaque
- `hit-light` quand l'ennemi attaque
- `success` quand l'ennemi est vaincu
- `fail` quand le héros tombe à 0 PV

`EventOverlay.tsx` joue :
- `key-item` si le choix donne un objet-clef
- `fail` si le choix inflige des dégâts / coûte des MP
- `success` si le choix soigne / restore des MP
- `ui-click` sinon

`DungeonScene.ts` joue :
- `door` avant chaque transition de salle
- `key-item` quand un objet-clef est octroyé automatiquement à l'entrée d'une salle

---

## UI audio

`AudioPanel` est un composant React intégré dans le HUD (chip "SFX ON / SFX OFF").
Cliquer dessus ouvre un popover avec :
- Slider musique (MUS)
- Slider SFX
- Bouton COUPER / ACTIVER LE SON

L'état est synchronisé avec l'`AudioManager` via `useAudioSnapshot()` (useSyncExternalStore).

---

## Ajouter une nouvelle musique

1. Déposer le `.mp3` dans `public/assets/audio/music/`.
2. Ajouter la clé dans `MusicKey` et `MUSIC_SRC` dans `src/game/audio.ts`.
3. Appeler `audio.playMusic('ma-cle')` au moment voulu.

## Ajouter un nouveau SFX

1. Déposer le `.mp3` dans `public/assets/audio/sfx/`.
2. Ajouter la clé dans `SfxKey` et `SFX_SRC` dans `src/game/audio.ts`.
3. Appeler `audio.playSfx('ma-cle')` là où c'est pertinent.

---

## Recommandations format

- **MP3 128kbps** pour musiques, **MP3 96kbps** pour SFX (compromis taille/qualité)
- Musiques en boucle : s'assurer que le point de boucle est propre (silence court en fin de fichier si nécessaire)
- SFX courts : < 2 secondes idéalement
- Nommage en minuscules avec tirets (`hit-heavy.mp3`, pas `HitHeavy.mp3`)

---

## Tester

```bash
npm run dev
# ouvrir http://localhost:5190
# jouer une partie, les console.warn indiquent les fichiers manquants
# ex: [audio] sfx not found: /assets/audio/sfx/hit-light.mp3
```

Pour tester rapidement avec de vrais sons, des assets libres de droits :
- **musiques** : [opengameart.org](https://opengameart.org) (filtrer RPG / ambient)
- **SFX** : [freesound.org](https://freesound.org) ou [jsfxr](https://sfxr.me) (génération procédurale 8-bit)
