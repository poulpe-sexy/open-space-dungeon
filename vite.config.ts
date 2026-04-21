/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path for GitHub Pages. The site is served from
// https://<user>.github.io/<repo>/ so every absolute asset URL must be
// prefixed with the repo name. Keep this in sync with the repo name —
// if you rename the repo on GitHub, update this constant and the deploy
// workflow.
const BASE = '/open-space-dungeon/';

export default defineConfig({
  base: BASE,
  plugins: [react()],
  server: { port: 5190, host: true, strictPort: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
