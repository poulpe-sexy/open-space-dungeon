import { useState } from 'react';
import { audio, useAudioSnapshot } from '../game/audio';

/**
 * Compact audio settings panel embedded in the HUD.
 * Click the chip to open/close the popover with volume sliders + mute toggle.
 * Preferences are persisted automatically via AudioManager → localStorage.
 */
export function AudioPanel() {
  const [open, setOpen] = useState(false);
  const { muted, musicVol, sfxVol } = useAudioSnapshot();

  const toggle = () => {
    audio.playSfx('ui-click');
    setOpen((o) => !o);
  };

  return (
    <div className="audio-panel">
      <button
        type="button"
        className={`hud-chip audio-chip${muted ? ' audio-muted' : ''}`}
        onClick={toggle}
        title="Réglages audio"
        aria-expanded={open}
      >
        {muted ? 'SFX OFF' : 'SFX ON'}
      </button>

      {open && (
        <div className="audio-popover" role="dialog" aria-label="Réglages audio">
          <div className="audio-row">
            <label htmlFor="vol-mus">MUS</label>
            <input
              id="vol-mus"
              type="range"
              min="0" max="1" step="0.05"
              value={musicVol}
              onChange={(e) => audio.setMusicVol(Number(e.target.value))}
            />
            <span className="audio-val">{Math.round(musicVol * 100)}</span>
          </div>

          <div className="audio-row">
            <label htmlFor="vol-sfx">SFX</label>
            <input
              id="vol-sfx"
              type="range"
              min="0" max="1" step="0.05"
              value={sfxVol}
              onChange={(e) => audio.setSfxVol(Number(e.target.value))}
            />
            <span className="audio-val">{Math.round(sfxVol * 100)}</span>
          </div>

          <button
            type="button"
            className="audio-mute-btn"
            onClick={() => audio.toggleMute()}
          >
            {muted ? 'ACTIVER LE SON' : 'COUPER LE SON'}
          </button>
        </div>
      )}
    </div>
  );
}
