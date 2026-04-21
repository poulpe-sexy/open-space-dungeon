import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { HERO_PORTRAITS, probeAsset } from './game/assets';
import { store } from './game/store';
import { initAudioRouting } from './game/audio';
import { reportGameDataIntegrity } from './game/dataIntegrity';
import './styles/global.css';

initAudioRouting();

if (import.meta.env.DEV) {
  // 1) Static data sanity checks (unknown attack/enemy/event IDs, dangling
  //    exits, mis-placed entry tiles…). Never throws — just logs.
  reportGameDataIntegrity();

  // 2) Probe hero PNGs — warn in the console if any portrait is missing from
  //    /public/assets/characters. The in-game UI falls back to initials, so a
  //    missing file does NOT crash the app — this just surfaces the issue.
  Object.entries(HERO_PORTRAITS).forEach(async ([id, url]) => {
    if (!(await probeAsset(url))) {
      console.warn(`[assets] missing PNG for ${id}: ${url}`);
    }
  });

  // 3) Expose the store for manual inspection from devtools.
  (window as unknown as { __store: typeof store }).__store = store;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
