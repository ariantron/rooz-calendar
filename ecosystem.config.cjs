/**
 * PM2 process definition for the development server.
 *
 * Previously this process was registered ad hoc, which meant its working
 * directory and the pnpm path lived only in PM2's dump file. Keeping it here
 * makes the dev server reproducible: `pm2 start ecosystem.config.cjs`.
 *
 * Host and port come from `apps/web/vite.config.ts` (0.0.0.0:5174, strict), so
 * there is one place that decides where the site is served.
 */
const { dirname, join } = require('node:path');
const { existsSync } = require('node:fs');

// pnpm ships next to the node binary PM2 itself is running under, so this
// survives an fnm node upgrade in a way a hardcoded version path would not.
const bundledPnpm = join(dirname(process.execPath), '..', 'lib', 'node_modules', 'pnpm', 'bin', 'pnpm.cjs');
const usingBundled = existsSync(bundledPnpm);

module.exports = {
  apps: [
    {
      name: 'calendar-dev',
      cwd: join(__dirname, 'apps/web'),
      script: usingBundled ? bundledPnpm : 'pnpm',
      args: 'run dev',
      interpreter: usingBundled ? undefined : 'none',
      autorestart: true,
      watch: false,
      env: { NODE_ENV: 'development' },
    },
  ],
};
