/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// No `base` override — Vercel (and the local dev server) serve the site from
// `/`, which makes `import.meta.env.BASE_URL === '/'`. The code keeps using
// `${BASE_URL}assets/...` for portability : if we ever redeploy under a
// subpath, just set `base: '/subpath/'` here and nothing else has to change.
export default defineConfig({
  plugins: [react()],
  server: { port: 5190, host: true, strictPort: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
