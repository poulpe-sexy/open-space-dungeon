import { useSyncExternalStore } from 'react';
import { store } from './store';
import { SCREENS } from '../data/screens';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type MusicKey = 'exploration' | 'combat' | 'boss' | 'title';

export type SfxKey =
  | 'hit-light'
  | 'hit-medium'
  | 'hit-heavy'
  | 'success'
  | 'fail'
  | 'door'
  | 'key-item'
  | 'ui-click'
  | 'level-up';

// ---------------------------------------------------------------------------
// Asset paths
// ---------------------------------------------------------------------------

// Prefix paths with BASE_URL so they resolve under GitHub Pages subpath.
const B = import.meta.env.BASE_URL;

const MUSIC_SRC: Record<MusicKey, string> = {
  exploration: `${B}assets/audio/music/exploration-dungeon.mp3`,
  combat:      `${B}assets/audio/music/combat.mp3`,
  boss:        '',  // always procedural — no audio file
  title:       '',  // always procedural — no audio file
};

const SFX_SRC: Record<SfxKey, string> = {
  'hit-light':  `${B}assets/audio/sfx/hit-light.mp3`,
  'hit-medium': `${B}assets/audio/sfx/hit-medium.mp3`,
  'hit-heavy':  `${B}assets/audio/sfx/hit-heavy.mp3`,
  'success':    `${B}assets/audio/sfx/success.mp3`,
  'fail':       `${B}assets/audio/sfx/fail.mp3`,
  'door':       `${B}assets/audio/sfx/door.mp3`,
  'key-item':   `${B}assets/audio/sfx/key-item.mp3`,
  'ui-click':   `${B}assets/audio/sfx/ui-click.mp3`,
  'level-up':   `${B}assets/audio/sfx/level-up.mp3`,
};

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'osd-audio-prefs';
const DEFAULTS = { musicVol: 0.5, sfxVol: 0.7, muted: false };

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

// ---------------------------------------------------------------------------
// Shared AudioContext (lazy)
// ---------------------------------------------------------------------------

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  return _ctx;
}

// ---------------------------------------------------------------------------
// File probe cache  (url → available)
// ---------------------------------------------------------------------------

const fileCache = new Map<string, boolean>();

function probeFile(url: string): Promise<boolean> {
  if (fileCache.has(url)) return Promise.resolve(fileCache.get(url)!);
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      fileCache.set(url, ok);
      resolve(ok);
    };
    const timer = setTimeout(() => done(false), 600);
    const el = new Audio();
    el.addEventListener('canplaythrough', () => { clearTimeout(timer); done(true); }, { once: true });
    el.addEventListener('error',          () => { clearTimeout(timer); done(false); }, { once: true });
    el.src = url;
    el.load();
  });
}

// ---------------------------------------------------------------------------
// Procedural SFX generators
// ---------------------------------------------------------------------------

const PROC_SFX: Record<SfxKey, (ctx: AudioContext, vol: number) => void> = {
  'hit-light': (ctx, vol) => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    g.gain.setValueAtTime(vol * 0.4, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.15);
  },
  'hit-medium': (ctx, vol) => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.18);
    g.gain.setValueAtTime(vol * 0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.22);
  },
  'hit-heavy': (ctx, vol) => {
    const t = ctx.currentTime;
    const n = Math.floor(ctx.sampleRate * 0.3);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type = 'lowpass';
    flt.frequency.setValueAtTime(900, t);
    flt.frequency.exponentialRampToValueAtTime(100, t + 0.3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.7, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    src.connect(flt); flt.connect(g); g.connect(ctx.destination);
    src.start(t); src.stop(t + 0.35);
  },
  'success': (ctx, vol) => {
    [440, 523, 659].forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.12;
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * 0.5, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.22);
    });
  },
  'fail': (ctx, vol) => {
    [329, 261, 220].forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.16;
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol * 0.4, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.26);
    });
  },
  'door': (ctx, vol) => {
    [220, 164].forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.1;
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol * 0.3, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.32);
    });
  },
  'key-item': (ctx, vol) => {
    [440, 523, 659, 880].forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.08;
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * 0.45, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.18);
    });
  },
  'ui-click': (ctx, vol) => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = 'square'; osc.frequency.setValueAtTime(600, t);
    g.gain.setValueAtTime(vol * 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.08);
  },
  // Triumphant 8-bit fanfare : C5 E5 G5 C6 E6 — ascending major arpeggio
  // with a final octave kicker. Slight square-wave grit to feel arcade-y.
  'level-up': (ctx, vol) => {
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    const stepDur = 0.09;
    notes.forEach((freq, i) => {
      const t = ctx.currentTime + i * stepDur;
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * 0.45, t + 0.015);
      // Hold longer on the final "sparkle" note.
      const sustain = i === notes.length - 1 ? 0.30 : stepDur * 0.9;
      g.gain.setValueAtTime(vol * 0.45, t + sustain * 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + sustain);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + sustain + 0.02);
    });
    // Soft triangle harmonic underneath for body.
    const baseT = ctx.currentTime;
    const pad = ctx.createOscillator(); const pg = ctx.createGain();
    pad.type = 'triangle';
    pad.frequency.setValueAtTime(261.63, baseT); // C4
    pg.gain.setValueAtTime(0, baseT);
    pg.gain.linearRampToValueAtTime(vol * 0.18, baseT + 0.05);
    pg.gain.exponentialRampToValueAtTime(0.0001, baseT + 0.65);
    pad.connect(pg); pg.connect(ctx.destination);
    pad.start(baseT); pad.stop(baseT + 0.7);
  },
};

// ---------------------------------------------------------------------------
// Procedural music player  (scheduler pattern: 50ms tick, 150ms lookahead)
// ---------------------------------------------------------------------------

type PatternStep = { freq: number; noteDur: number } | null;

// Am pentatonic: A3 C4 D4 E4 G4 — sparse, 58 BPM quarter notes
const EXPL_PATTERN: PatternStep[] = [
  { freq: 220,    noteDur: 0.80 },
  null,
  { freq: 261.63, noteDur: 0.65 },
  null,
  { freq: 293.66, noteDur: 0.60 },
  null,
  { freq: 329.63, noteDur: 0.80 },
  null,
  null,
  { freq: 392.00, noteDur: 0.90 },
  null,
  null,
];

// ── Combat theme — D minor, 95 BPM, 2 voices ────────────────────────────────
//
// Voice 1 (triangle, lead) : phrase de 16 croches avec silences.
//   Contour descendant/suspensif — tension sans panique.
// Voice 2 (square, basse)  : pédale de quarts D2/A2/F2/A2, ancrage harmonique.
//
// Choix stylistiques :
//   - triangle  → timbre rond, beaucoup moins agressif que sawtooth
//   - 95 BPM    → énergique mais pas frénétique (vs 118 BPM)
//   - silences  → respiration, le joueur "lit" la musique comme une intention
//   - basse grave → l'oreille comprend le danger sans être agressée

const COMBAT_STEP = 60 / 95 / 2; // croche à 95 BPM ≈ 0.316 s

// Voice 1 — Mélodie (triangle) : Dm  Gm  C  Dm
const COMBAT_MELODY: PatternStep[] = [
  { freq: 293.66, noteDur: 0.50 }, // D4  — tonique, ancre
  null,
  { freq: 349.23, noteDur: 0.25 }, // F4
  { freq: 440.00, noteDur: 0.32 }, // A4
  { freq: 392.00, noteDur: 0.25 }, // G4
  { freq: 349.23, noteDur: 0.25 }, // F4
  { freq: 293.66, noteDur: 0.50 }, // D4  — retour
  null,
  { freq: 261.63, noteDur: 0.38 }, // C4
  null,
  { freq: 329.63, noteDur: 0.25 }, // E4
  { freq: 440.00, noteDur: 0.32 }, // A4
  { freq: 392.00, noteDur: 0.25 }, // G4
  { freq: 349.23, noteDur: 0.25 }, // F4
  { freq: 329.63, noteDur: 0.50 }, // E4  — suspension
  null,
];

// Voice 2 — Basse (square, grave) : quarts D2 A2 F2 A2
const COMBAT_BASS: PatternStep[] = [
  { freq:  73.42, noteDur: 0.55 }, // D2
  null,
  { freq:  73.42, noteDur: 0.45 }, // D2
  null,
  { freq: 110.00, noteDur: 0.55 }, // A2
  null,
  { freq: 130.81, noteDur: 0.50 }, // C3
  null,
  { freq:  73.42, noteDur: 0.55 }, // D2
  null,
  { freq: 110.00, noteDur: 0.45 }, // A2
  null,
  { freq:  87.31, noteDur: 0.55 }, // F2
  null,
  { freq: 110.00, noteDur: 0.50 }, // A2
  null,
];

// ── Title theme — sombre 8-bit, D minor, 85 BPM, 3 voices ───────────────────
// Progression i–VI–III–V : Dm → Bb → F → A (cadence ouverte qui boucle en Dm).
// La dominante A majeure (C# sensible) crée la tension "couloir administratif".

const TITLE_STEP = 60 / 85 / 2; // eighth note ≈ 0.353 s

// Voice 1 — Melody (triangle wave, mournful descending contour, mid-high)
const TITLE_MELODY: PatternStep[] = [
  // Bar 1 — Dm
  { freq: 587.33, noteDur: 0.70 }, // D5 (held)
  null,
  { freq: 698.46, noteDur: 0.35 }, // F5
  { freq: 880.00, noteDur: 0.35 }, // A5
  // Bar 2 — Bb
  { freq: 783.99, noteDur: 0.35 }, // G5
  { freq: 698.46, noteDur: 0.35 }, // F5
  { freq: 587.33, noteDur: 0.70 }, // D5 (held)
  null,
  // Bar 3 — F
  { freq: 659.25, noteDur: 0.35 }, // E5
  { freq: 698.46, noteDur: 0.35 }, // F5
  { freq: 880.00, noteDur: 0.70 }, // A5 (held)
  null,
  // Bar 4 — A (half cadence, C# leading tone)
  { freq: 659.25, noteDur: 0.35 }, // E5
  { freq: 587.33, noteDur: 0.35 }, // D5 (suspended 4th)
  { freq: 554.37, noteDur: 0.35 }, // C#5 (leading tone)
  null,                            // silence — breath before loop
];

// Voice 2 — Bass (triangle wave, sustained whole-bar pedals in low register)
const TITLE_BASS: PatternStep[] = [
  { freq: 73.42,  noteDur: 1.40 }, // D2 (Dm root)
  null, null, null,
  { freq: 116.54, noteDur: 1.40 }, // Bb2 (Bb root)
  null, null, null,
  { freq: 87.31,  noteDur: 1.40 }, // F2  (F root)
  null, null, null,
  { freq: 110.00, noteDur: 1.40 }, // A2  (A root, dominant)
  null, null, null,
];

// Voice 3 — Chord arpeggios (square wave, low gain, distant heartbeat)
const TITLE_ARPEGGIO: PatternStep[] = [
  // Dm — D F A F
  { freq: 293.66, noteDur: 0.28 }, // D4
  { freq: 349.23, noteDur: 0.28 }, // F4
  { freq: 440.00, noteDur: 0.28 }, // A4
  { freq: 349.23, noteDur: 0.28 }, // F4
  // Bb — Bb D F D
  { freq: 233.08, noteDur: 0.28 }, // Bb3
  { freq: 293.66, noteDur: 0.28 }, // D4
  { freq: 349.23, noteDur: 0.28 }, // F4
  { freq: 293.66, noteDur: 0.28 }, // D4
  // F — F A C A
  { freq: 174.61, noteDur: 0.28 }, // F3
  { freq: 220.00, noteDur: 0.28 }, // A3
  { freq: 261.63, noteDur: 0.28 }, // C4
  { freq: 220.00, noteDur: 0.28 }, // A3
  // A — A C# E C# (major triad, picardy tension)
  { freq: 220.00, noteDur: 0.28 }, // A3
  { freq: 277.18, noteDur: 0.28 }, // C#4
  { freq: 329.63, noteDur: 0.28 }, // E4
  { freq: 277.18, noteDur: 0.28 }, // C#4
];

// ── Boss theme — D mineur, 112 BPM, 3 voix ──────────────────────────────────
//
// Un cran au-dessus du combat normal : plus rapide (112 vs 95 BPM), plus dense
// (3 voix vs 2), mélodie square grave et assertive, ostinato triangle incessant.
//
// Voice 1 (square, lead)    : phrase de 16 croches — ouverture D5 forte,
//                             descente Bb4 (degré ♭7, note sombre), montée E5.
// Voice 2 (square, basse)   : noires D2/A2/G2/A2, pulsation menaçante.
// Voice 3 (triangle, pad)   : ostinato F4-A4 en croches, tension continue.

const BOSS_STEP = 60 / 112 / 2; // croche à 112 BPM ≈ 0.268 s

// Voice 1 — Lead dramatique (square)
const BOSS_MELODY: PatternStep[] = [
  { freq: 587.33, noteDur: 0.50 }, // D5  — frappe d'ouverture
  null,
  { freq: 698.46, noteDur: 0.24 }, // F5
  { freq: 659.25, noteDur: 0.24 }, // E5
  { freq: 587.33, noteDur: 0.24 }, // D5
  { freq: 523.25, noteDur: 0.24 }, // C5
  { freq: 466.16, noteDur: 0.42 }, // Bb4 — note sombre (♭VII)
  null,
  { freq: 440.00, noteDur: 0.40 }, // A4  — dominante
  null,
  { freq: 523.25, noteDur: 0.24 }, // C5
  { freq: 587.33, noteDur: 0.24 }, // D5
  { freq: 659.25, noteDur: 0.40 }, // E5  — tension
  { freq: 587.33, noteDur: 0.24 }, // D5
  null,
  null,
];

// Voice 2 — Basse pulsée (square, grave)
const BOSS_BASS: PatternStep[] = [
  { freq:  73.42, noteDur: 0.55 }, // D2
  null,
  { freq:  73.42, noteDur: 0.45 }, // D2
  null,
  { freq: 110.00, noteDur: 0.55 }, // A2
  null,
  { freq: 130.81, noteDur: 0.55 }, // C3
  null,
  { freq:  73.42, noteDur: 0.55 }, // D2
  null,
  { freq: 110.00, noteDur: 0.45 }, // A2
  null,
  { freq:  98.00, noteDur: 0.55 }, // G2
  null,
  { freq: 110.00, noteDur: 0.55 }, // A2 — demi-cadence
  null,
];

// Voice 3 — Ostinato (triangle, discret) : F4-A4 incessant, moteur rythmique
const BOSS_COUNTER: PatternStep[] = [
  { freq: 349.23, noteDur: 0.22 }, // F4
  { freq: 440.00, noteDur: 0.22 }, // A4
  { freq: 349.23, noteDur: 0.22 }, // F4
  { freq: 440.00, noteDur: 0.22 }, // A4
  { freq: 329.63, noteDur: 0.22 }, // E4
  { freq: 440.00, noteDur: 0.22 }, // A4
  { freq: 329.63, noteDur: 0.22 }, // E4
  { freq: 440.00, noteDur: 0.22 }, // A4
  { freq: 349.23, noteDur: 0.22 }, // F4
  { freq: 440.00, noteDur: 0.22 }, // A4
  { freq: 523.25, noteDur: 0.22 }, // C5
  { freq: 440.00, noteDur: 0.22 }, // A4
  { freq: 392.00, noteDur: 0.22 }, // G4
  { freq: 440.00, noteDur: 0.22 }, // A4
  { freq: 392.00, noteDur: 0.22 }, // G4
  null,
];

interface IMusicPlayer { setVol(v: number): void; stop(): void; }

// =============================================================================
// BossMusicPlayer — 3 voix, D mineur, 112 BPM
// =============================================================================

class BossMusicPlayer implements IMusicPlayer {
  private ctx:    AudioContext;
  private master: GainNode;
  private timers: ReturnType<typeof setInterval>[] = [];
  private nextT:  number[] = [];
  private steps:  number[] = [];
  private dead = false;

  private static VOICES = [
    { pattern: BOSS_MELODY,   waveform: 'square'   as OscillatorType, gain: 0.22 },
    { pattern: BOSS_BASS,     waveform: 'square'   as OscillatorType, gain: 0.14 },
    { pattern: BOSS_COUNTER,  waveform: 'triangle' as OscillatorType, gain: 0.08 },
  ];

  constructor(ctx: AudioContext, vol: number) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.setValueAtTime(0, ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(vol, ctx.currentTime + 1.0);
    this.master.connect(ctx.destination);

    for (let i = 0; i < BossMusicPlayer.VOICES.length; i++) {
      this.nextT.push(ctx.currentTime + 0.05);
      this.steps.push(0);
      const vi = i;
      this.tick(vi);
      this.timers.push(setInterval(() => this.tick(vi), 50));
    }
  }

  private tick(v: number) {
    if (this.dead) return;
    const voice = BossMusicPlayer.VOICES[v];
    while (this.nextT[v] < this.ctx.currentTime + 0.15) {
      const s = voice.pattern[this.steps[v] % voice.pattern.length];
      if (s) {
        const osc = this.ctx.createOscillator();
        const g   = this.ctx.createGain();
        osc.type = voice.waveform;
        osc.frequency.setValueAtTime(s.freq, this.nextT[v]);
        g.gain.setValueAtTime(0, this.nextT[v]);
        g.gain.linearRampToValueAtTime(voice.gain, this.nextT[v] + 0.012);
        g.gain.setValueAtTime(voice.gain, this.nextT[v] + s.noteDur * 0.75);
        g.gain.exponentialRampToValueAtTime(0.0001, this.nextT[v] + s.noteDur);
        osc.connect(g); g.connect(this.master);
        osc.start(this.nextT[v]);
        osc.stop(this.nextT[v] + s.noteDur + 0.02);
      }
      this.nextT[v] += BOSS_STEP;
      this.steps[v]++;
    }
  }

  setVol(v: number) {
    if (this.dead) return;
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  stop() {
    this.dead = true;
    this.timers.forEach((t) => clearInterval(t));
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
    setTimeout(() => { try { this.master.disconnect(); } catch { /* ignore */ } }, 2500);
  }
}

// =============================================================================
// CombatMusicPlayer — 2 voix, D mineur, 95 BPM
// =============================================================================

class CombatMusicPlayer implements IMusicPlayer {
  private ctx:    AudioContext;
  private master: GainNode;
  private timers: ReturnType<typeof setInterval>[] = [];
  private nextT:  number[] = [];
  private steps:  number[] = [];
  private dead = false;

  private static VOICES = [
    { pattern: COMBAT_MELODY, waveform: 'triangle' as OscillatorType, gain: 0.22 },
    { pattern: COMBAT_BASS,   waveform: 'square'   as OscillatorType, gain: 0.14 },
  ];

  constructor(ctx: AudioContext, vol: number) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.setValueAtTime(0, ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.8);
    this.master.connect(ctx.destination);

    for (let i = 0; i < CombatMusicPlayer.VOICES.length; i++) {
      this.nextT.push(ctx.currentTime + 0.05);
      this.steps.push(0);
      const vi = i;
      this.tick(vi);
      this.timers.push(setInterval(() => this.tick(vi), 50));
    }
  }

  private tick(v: number) {
    if (this.dead) return;
    const voice = CombatMusicPlayer.VOICES[v];
    while (this.nextT[v] < this.ctx.currentTime + 0.15) {
      const s = voice.pattern[this.steps[v] % voice.pattern.length];
      if (s) {
        const osc = this.ctx.createOscillator();
        const g   = this.ctx.createGain();
        osc.type = voice.waveform;
        osc.frequency.setValueAtTime(s.freq, this.nextT[v]);
        g.gain.setValueAtTime(0, this.nextT[v]);
        g.gain.linearRampToValueAtTime(voice.gain, this.nextT[v] + 0.015);
        g.gain.setValueAtTime(voice.gain, this.nextT[v] + s.noteDur * 0.75);
        g.gain.exponentialRampToValueAtTime(0.0001, this.nextT[v] + s.noteDur);
        osc.connect(g); g.connect(this.master);
        osc.start(this.nextT[v]);
        osc.stop(this.nextT[v] + s.noteDur + 0.02);
      }
      this.nextT[v] += COMBAT_STEP;
      this.steps[v]++;
    }
  }

  setVol(v: number) {
    if (this.dead) return;
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  stop() {
    this.dead = true;
    this.timers.forEach((t) => clearInterval(t));
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
    setTimeout(() => { try { this.master.disconnect(); } catch { /* ignore */ } }, 2500);
  }
}

class TitleMusicPlayer implements IMusicPlayer {
  private ctx:    AudioContext;
  private master: GainNode;
  private timers: ReturnType<typeof setInterval>[] = [];
  private nextT:  number[] = [];
  private steps:  number[] = [];
  private dead = false;

  private static VOICES = [
    // Triangle lead = mélodie plaintive et ronde, moins "8-bit joyeux".
    { pattern: TITLE_MELODY,   waveform: 'triangle' as OscillatorType, gain: 0.18 },
    // Basse triangle grave, forte présence mais sans agressivité.
    { pattern: TITLE_BASS,     waveform: 'triangle' as OscillatorType, gain: 0.24 },
    // Arpège square très en retrait : battement distant, presque subliminal.
    { pattern: TITLE_ARPEGGIO, waveform: 'square'   as OscillatorType, gain: 0.06 },
  ];

  constructor(ctx: AudioContext, vol: number) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.setValueAtTime(0, ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(vol, ctx.currentTime + 1.0);
    this.master.connect(ctx.destination);

    for (let i = 0; i < TitleMusicPlayer.VOICES.length; i++) {
      this.nextT.push(ctx.currentTime + 0.05);
      this.steps.push(0);
      const vi = i;
      this.tick(vi);
      this.timers.push(setInterval(() => this.tick(vi), 50));
    }
  }

  private tick(v: number) {
    if (this.dead) return;
    const voice = TitleMusicPlayer.VOICES[v];
    while (this.nextT[v] < this.ctx.currentTime + 0.15) {
      const s = voice.pattern[this.steps[v] % voice.pattern.length];
      if (s) {
        const osc = this.ctx.createOscillator();
        const g   = this.ctx.createGain();
        osc.type = voice.waveform;
        osc.frequency.setValueAtTime(s.freq, this.nextT[v]);
        g.gain.setValueAtTime(0, this.nextT[v]);
        g.gain.linearRampToValueAtTime(voice.gain, this.nextT[v] + 0.01);
        g.gain.setValueAtTime(voice.gain, this.nextT[v] + s.noteDur * 0.72);
        g.gain.exponentialRampToValueAtTime(0.0001, this.nextT[v] + s.noteDur);
        osc.connect(g); g.connect(this.master);
        osc.start(this.nextT[v]);
        osc.stop(this.nextT[v] + s.noteDur + 0.02);
      }
      this.nextT[v] += TITLE_STEP;
      this.steps[v]++;
    }
  }

  setVol(v: number) {
    if (this.dead) return;
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  stop() {
    this.dead = true;
    this.timers.forEach((t) => clearInterval(t));
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
    setTimeout(() => { try { this.master.disconnect(); } catch { /* ignore */ } }, 2500);
  }
}

// =============================================================================

class MusicPlayer {
  private ctx: AudioContext;
  private master: GainNode;
  private drone:     OscillatorNode | null = null;
  private droneGain: GainNode       | null = null;
  private timer:     ReturnType<typeof setInterval> | null = null;
  private nextTime = 0;
  private step     = 0;
  private readonly pattern:  PatternStep[];
  private readonly stepDur:  number;
  private readonly waveform: OscillatorType;
  private readonly noteGain: number;
  private dead = false;

  constructor(ctx: AudioContext, _key: MusicKey, vol: number) {
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.setValueAtTime(0, ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.8);
    this.master.connect(ctx.destination);

    // MusicPlayer is exploration-only; combat is handled by CombatMusicPlayer.
    this.pattern  = EXPL_PATTERN;
    this.stepDur  = 60 / 58;        // quarter note @ 58 BPM ≈ 1.034 s
    this.waveform = 'triangle';
    this.noteGain = 0.65;
    this.startDrone();

    this.nextTime = ctx.currentTime + 0.05;
    this.schedule();
    this.timer = setInterval(() => this.schedule(), 50);
  }

  private startDrone() {
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, this.ctx.currentTime); // A2
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.22, this.ctx.currentTime + 1.5);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(this.ctx.currentTime);
    this.drone     = osc;
    this.droneGain = gain;
  }

  private schedule() {
    if (this.dead) return;
    const lookahead = 0.15;
    while (this.nextTime < this.ctx.currentTime + lookahead) {
      const s = this.pattern[this.step % this.pattern.length];
      if (s) this.playNote(s.freq, s.noteDur, this.nextTime);
      this.nextTime += this.stepDur;
      this.step++;
    }
  }

  private playNote(freq: number, dur: number, t: number) {
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = this.waveform;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(this.noteGain, t + 0.015);
    gain.gain.setValueAtTime(this.noteGain, t + dur * 0.75);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  setVol(v: number) {
    if (this.dead) return;
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  stop() {
    this.dead = true;
    if (this.timer !== null) clearInterval(this.timer);
    this.droneGain?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    this.drone?.stop(this.ctx.currentTime + 1.2);
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    setTimeout(() => { try { this.master.disconnect(); } catch { /* ignore */ } }, 2500);
  }
}

// ---------------------------------------------------------------------------
// AudioManager
// ---------------------------------------------------------------------------

class AudioManager {
  private _musicVol: number;
  private _sfxVol:   number;
  private _muted:    boolean;

  private currentMusicKey: MusicKey              | null = null;
  private pendingMusicKey: MusicKey              | null = null;
  private musicPlayer:     IMusicPlayer          | null = null;
  private musicFileEl:     HTMLAudioElement       | null = null;

  private sfxPool   = new Map<SfxKey, HTMLAudioElement[]>();
  private listeners = new Set<() => void>();

  constructor() {
    const prefs    = loadPrefs();
    this._musicVol = prefs.musicVol;
    this._sfxVol   = prefs.sfxVol;
    this._muted    = prefs.muted;

    const unlock = () => {
      const ctx = getCtx();
      void ctx.resume().then(() => {
        // Probe all SFX files in background so subsequent calls can use real assets.
        Object.values(SFX_SRC).forEach((url) => {
          if (!fileCache.has(url)) void probeFile(url);
        });
        if (this.pendingMusicKey) {
          const key = this.pendingMusicKey;
          this.pendingMusicKey = null;
          this.playMusic(key);
        }
      });
    };
    window.addEventListener('pointerdown', unlock, { capture: true, once: true });
    window.addEventListener('keydown',     unlock, { capture: true, once: true });
  }

  // ---- Music ----------------------------------------------------------------

  playMusic(key: MusicKey) {
    if (this.currentMusicKey === key) return;
    this.stopMusicInternal();
    this.currentMusicKey = key;

    const ctx = getCtx();
    if (ctx.state === 'suspended') {
      this.pendingMusicKey = key;
      this.currentMusicKey = null;
      return;
    }

    const vol = this._muted ? 0 : this._musicVol;

    // Title theme: always procedural, 3-voice chiptune, no file fallback.
    if (key === 'title') {
      this.musicPlayer = new TitleMusicPlayer(ctx, vol);
      return;
    }

    // Combat: 2-voice procedural, no file fallback.
    if (key === 'combat') {
      this.musicPlayer = new CombatMusicPlayer(ctx, vol);
      return;
    }

    // Boss: 3-voice procedural, no file fallback.
    if (key === 'boss') {
      this.musicPlayer = new BossMusicPlayer(ctx, vol);
      return;
    }

    this.musicPlayer = new MusicPlayer(ctx, key, vol);

    // Probe file in background; swap to real asset if found.
    void probeFile(MUSIC_SRC[key]).then((ok) => {
      if (!ok || this.currentMusicKey !== key) return;
      this.musicPlayer?.stop();
      this.musicPlayer = null;
      const el  = new Audio(MUSIC_SRC[key]);
      el.loop   = true;
      el.volume = this._muted ? 0 : this._musicVol;
      this.musicFileEl = el;
      el.play().catch(() => { /* silent */ });
    });
  }

  stopMusic() {
    this.stopMusicInternal();
    this.currentMusicKey = null;
  }

  private stopMusicInternal() {
    this.musicPlayer?.stop();
    this.musicPlayer = null;
    if (this.musicFileEl) {
      this.musicFileEl.pause();
      this.musicFileEl.currentTime = 0;
      this.musicFileEl = null;
    }
  }

  // ---- SFX ------------------------------------------------------------------

  playSfx(key: SfxKey) {
    if (this._muted) return;
    const url = SFX_SRC[key];

    if (fileCache.get(url) === true) {
      this.playSfxFile(key, url);
      return;
    }
    // Fire probe so future calls may use the real file.
    if (!fileCache.has(url)) void probeFile(url);

    const ctx = getCtx();
    if (ctx.state !== 'running') return;
    PROC_SFX[key](ctx, this._sfxVol);
  }

  private playSfxFile(key: SfxKey, url: string) {
    let pool = this.sfxPool.get(key);
    if (!pool) { pool = []; this.sfxPool.set(key, pool); }
    let el = pool.find((e) => e.paused || e.ended);
    if (!el) {
      el = new Audio(url);
      el.addEventListener('error', () => {
        fileCache.set(url, false);
        if (import.meta.env.DEV) console.warn(`[audio] sfx error: ${url}`);
      });
      pool.push(el);
    }
    el.volume      = this._sfxVol;
    el.currentTime = 0;
    el.play().catch(() => { /* silent */ });
  }

  // ---- Volume / mute --------------------------------------------------------

  get musicVol() { return this._musicVol; }

  setMusicVol(v: number) {
    this._musicVol = Math.max(0, Math.min(1, v));
    const eff = this._muted ? 0 : this._musicVol;
    this.musicPlayer?.setVol(eff);
    if (this.musicFileEl) this.musicFileEl.volume = eff;
    this.savePrefs(); this.notify();
  }

  get sfxVol() { return this._sfxVol; }

  setSfxVol(v: number) {
    this._sfxVol = Math.max(0, Math.min(1, v));
    this.savePrefs(); this.notify();
  }

  get muted() { return this._muted; }

  setMuted(v: boolean) {
    this._muted = v;
    const eff = v ? 0 : this._musicVol;
    this.musicPlayer?.setVol(eff);
    if (this.musicFileEl) this.musicFileEl.volume = eff;
    this.savePrefs(); this.notify();
  }

  toggleMute() { this.setMuted(!this._muted); }

  // ---- Reactivity -----------------------------------------------------------

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() { this.listeners.forEach((fn) => fn()); }

  // ---- Persistence ----------------------------------------------------------

  private savePrefs() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ musicVol: this._musicVol, sfxVol: this._sfxVol, muted: this._muted }),
      );
    } catch { /* ignore */ }
  }
}

export const audio = new AudioManager();

// ---------------------------------------------------------------------------
// Music routing — phase → track
// ---------------------------------------------------------------------------

export function initAudioRouting() {
  // Use a composite key so boss combat ('combat:boss') and regular combat
  // ('combat') are treated as distinct transitions by the dedup guard.
  let lastKey = '';

  const route = () => {
    const state = store.get();
    const isBoss =
      state.phase === 'combat' &&
      !!state.pending?.screenId &&
      (SCREENS[state.pending.screenId]?.isBossScreen ?? false);
    const key = state.phase + (isBoss ? ':boss' : '');
    if (key === lastKey) return;
    lastKey = key;

    switch (state.phase) {
      case 'title':
        audio.playMusic('title');
        break;
      case 'dungeon':
      case 'event':
      case 'trap':
      case 'puzzle':
        audio.playMusic('exploration');
        break;
      case 'combat':
        audio.playMusic(isBoss ? 'boss' : 'combat');
        break;
      case 'victory':
      case 'defeat':
        audio.stopMusic();
        break;
    }
  };

  // Seed with the current phase so the initial 'title' state kicks off title
  // music (queued as pendingMusicKey until the first user gesture unlocks the
  // AudioContext — browser autoplay policy).
  route();
  store.subscribe(route);
}

// ---------------------------------------------------------------------------
// React hook — stable snapshot for useSyncExternalStore
// ---------------------------------------------------------------------------

type AudioSnapshot = { musicVol: number; sfxVol: number; muted: boolean };
let _snap: AudioSnapshot = { musicVol: 0.5, sfxVol: 0.7, muted: false };

const getSnapshot = (): AudioSnapshot => {
  const next = { musicVol: audio.musicVol, sfxVol: audio.sfxVol, muted: audio.muted };
  if (
    next.musicVol === _snap.musicVol &&
    next.sfxVol   === _snap.sfxVol   &&
    next.muted    === _snap.muted
  ) return _snap;
  _snap = next;
  return _snap;
};

export const useAudioSnapshot = () =>
  useSyncExternalStore((fn) => audio.subscribe(fn), getSnapshot);
