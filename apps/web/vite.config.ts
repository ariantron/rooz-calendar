import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Serve the SPA for unknown paths on static hosts.
 *
 * The site uses real paths (`/demo`, `/docs`) rather than hash routes, so a
 * cold load or a refresh on `/docs` asks the host for a file that does not
 * exist. GitHub Pages serves `404.html` in that case, and an exact copy of
 * `index.html` lets the router take over from there.
 */
function spaFallback(): Plugin {
  return {
    name: 'rooz-spa-fallback',
    apply: 'build',
    closeBundle() {
      const index = resolve(__dirname, 'dist/index.html');
      if (existsSync(index)) copyFileSync(index, resolve(__dirname, 'dist/404.html'));
    },
  };
}

/**
 * Hostnames Vite answers to. The dev server rejects requests whose `Host`
 * header it does not recognise (a DNS-rebinding guard). Localhost is trusted
 * by default; the public domain the site is proxied under is not, so it has to
 * be named here.
 */
const allowedHosts = ['calendar.tech0.ir'];

export default defineConfig({
  plugins: [react(), tailwindcss(), spaFallback()],
  /**
   * Absolute base — a relative one would break path routing, since `/docs`
   * would resolve assets against `/docs/`. Set `VITE_BASE=/repo-name/` when
   * deploying to a GitHub Pages project path; the router reads the same value
   * back through `import.meta.env.BASE_URL`.
   */
  base: process.env.VITE_BASE ?? '/',
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
    allowedHosts,
  },
  preview: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
    allowedHosts,
  },
});
