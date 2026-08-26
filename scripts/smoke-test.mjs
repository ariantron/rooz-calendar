/**
 * Publish smoke test.
 *
 * Packs both libraries with `npm pack`, installs the tarballs into a throwaway
 * Vite app outside this workspace, builds it and renders it in a headless
 * browser. A green monorepo build is not evidence that the published artifact
 * works: this checks the `files` allowlist, the `exports` map, the generated
 * types and the shipped stylesheet as a consumer would receive them.
 *
 * Usage: node scripts/smoke-test.mjs [--keep]
 */
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const keep = process.argv.includes('--keep');
const PACKAGES = ['calendar-core', 'calendar-ui'];

const step = (message) => console.log(`\n→ ${message}`);
const ok = (message) => console.log(`  ✓ ${message}`);

function run(command, args, cwd, options = {}) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : 'pipe',
    env: options.env ?? process.env,
  });
}

/**
 * The environment a real consumer would install in.
 *
 * Running this script through `pnpm smoke` exports a pile of `npm_config_*`
 * variables that leak the workspace's package-manager settings into the
 * throwaway app — and npm rejects some of them outright. Strip them so the
 * consumer install is genuinely isolated, and so the result does not depend on
 * how this script was launched.
 */
const consumerEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !key.toLowerCase().startsWith('npm_')),
);

const failures = [];
function check(condition, message) {
  if (condition) ok(message);
  else {
    failures.push(message);
    console.log(`  ✗ ${message}`);
  }
}

/* ---------------------------------------------------------------- build */

step('Building packages');
run('pnpm', ['-r', '--filter', './packages/*', 'build'], repoRoot, { inherit: true });

/* ----------------------------------------------------------------- pack */

const work = mkdtempSync(join(tmpdir(), 'rooz-smoke-'));
const tarballs = {};

step(`Packing into ${work}`);
for (const name of PACKAGES) {
  const dir = join(repoRoot, 'packages', name);
  // npm has returned both an array and a name-keyed object across versions.
  const output = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', work], dir));
  const meta = Array.isArray(output) ? output[0] : Object.values(output)[0];
  tarballs[name] = join(work, meta.filename);
  ok(`${meta.name}@${meta.version} → ${meta.filename} (${meta.files.length} files, ${(meta.size / 1024).toFixed(0)} kB)`);

  const shipped = meta.files.map((file) => file.path);
  check(
    !shipped.some((file) => file.startsWith('src/')),
    `${meta.name} ships no source directory`,
  );
  check(
    !shipped.some((file) => file.includes('.test.') || file.endsWith('tsconfig.json') || file.endsWith('vite.config.ts')),
    `${meta.name} ships no tests or build config`,
  );
  check(shipped.includes('dist/index.d.ts'), `${meta.name} ships generated types`);
  check(
    !shipped.some((file) => file.endsWith('.d.ts.map')),
    `${meta.name} ships no declaration maps (their sources are not published)`,
  );
  check(shipped.includes('dist/index.js') && shipped.includes('dist/index.cjs'), `${meta.name} ships ESM and CJS`);
  check(shipped.includes('LICENSE'), `${meta.name} ships its licence`);
  check(shipped.includes('README.md'), `${meta.name} ships a README for its npm page`);
}

/* -------------------------------------------------- peer dep declaration */

step('Checking dependency declarations');
{
  // pnpm rewrites `workspace:` ranges when publishing through pnpm, but not for
  // `npm pack`, and never for peerDependencies. A leaked protocol makes the
  // package uninstallable for anyone using npm or yarn.
  for (const name of PACKAGES) {
    const manifest = readFileSync(join(repoRoot, 'packages', name, 'package.json'), 'utf8');
    const leaked = Object.entries(JSON.parse(manifest))
      .filter(([field]) => field.endsWith('ependencies') && field !== 'devDependencies')
      .flatMap(([field, values]) =>
        Object.entries(values ?? {})
          .filter(([, range]) => typeof range === 'string' && range.startsWith('workspace:'))
          .map(([dep]) => `${field}.${dep}`),
      );
    check(leaked.length === 0, `${name} declares no workspace: ranges outside devDependencies${leaked.length ? ` (found ${leaked.join(', ')})` : ''}`);
  }

  const uiPkg = JSON.parse(readFileSync(join(repoRoot, 'packages/calendar-ui/package.json'), 'utf8'));
  check(!!uiPkg.peerDependencies?.react, 'calendar-ui declares react as a peer dependency');
  check(!uiPkg.dependencies?.react, 'calendar-ui does not depend on react directly');
  check(!!uiPkg.peerDependencies?.['@rooz/calendar-core'], 'calendar-ui declares calendar-core as a peer dependency');

  const corePkg = JSON.parse(readFileSync(join(repoRoot, 'packages/calendar-core/package.json'), 'utf8'));
  check(!corePkg.peerDependencies, 'calendar-core has no peer dependencies of its own');
  check(!!corePkg.dependencies?.['jalali-moment'], 'calendar-core depends on jalali-moment');
}

/* ------------------------------------------------------- consumer app */

const app = join(work, 'consumer');
mkdirSync(join(app, 'src'), { recursive: true });

step('Creating a throwaway consumer app');
writeFileSync(
  join(app, 'package.json'),
  `${JSON.stringify(
    {
      name: 'rooz-smoke-consumer',
      private: true,
      version: '1.0.0',
      type: 'module',
      scripts: { build: 'vite build' },
      dependencies: {
        '@rooz/calendar-core': `file:${tarballs['calendar-core']}`,
        '@rooz/calendar-ui': `file:${tarballs['calendar-ui']}`,
        react: '^19.0.0',
        'react-dom': '^19.0.0',
      },
      devDependencies: {
        '@types/react': '^19.0.8',
        '@types/react-dom': '^19.0.3',
        '@vitejs/plugin-react': '^4.3.4',
        typescript: '^5.7.3',
        vite: '^6.0.11',
      },
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  join(app, 'vite.config.js'),
  `import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
export default defineConfig({ plugins: [react()], base: './' });
`,
);

writeFileSync(
  join(app, 'index.html'),
  `<!doctype html><html><head><meta charset="utf-8"><title>smoke</title></head>
<body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>
`,
);

// Deliberately a plain non-Tailwind consumer: the shipped stylesheet has to
// carry every utility the components use, all by itself.
writeFileSync(
  join(app, 'src/main.jsx'),
  `import { buildMonthGrid, jalali } from '@rooz/calendar-core';
import { MonthView, WeekView, AgendaView } from '@rooz/calendar-ui';
import '@rooz/calendar-ui/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const today = new Date(2026, 7, 26);
const events = [
  { id: 'a', title: 'Linear Algebra', start: '2026-08-26T09:00:00', end: '2026-08-26T10:30:00' },
  { id: 'b', title: 'Field trip', start: '2026-08-27T00:00:00', end: '2026-08-30T00:00:00', allDay: true, variant: 'success' },
];

// Also exercise the core package on its own, the way a non-UI consumer would.
const grid = buildMonthGrid(1405, 6, { system: 'jalali', today });
window.__smoke = {
  title: grid.title,
  inMonth: grid.days.filter((day) => day.isCurrentMonth).length,
  firstKey: grid.days[0].key,
  todayJalali: jalali.format(today, 'yyyy/MM/dd', { locale: 'fa', numerals: 'latn' }),
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div style={{ padding: 16 }}>
      <div data-testid="month"><MonthView date={today} today={today} events={events} calendarSystem="jalali" locale="fa" /></div>
      <div data-testid="week"><WeekView date={today} today={today} events={events} calendarSystem="gregorian" locale="en" /></div>
      <div data-testid="agenda"><AgendaView date={today} today={today} events={events} calendarSystem="jalali" locale="fa" days={10} /></div>
    </div>
  </StrictMode>,
);
`,
);

// Type-level check: the published .d.ts has to be usable from TypeScript.
writeFileSync(
  join(app, 'src/types-check.ts'),
  `import type { CalendarEvent, DayCell, MonthGrid } from '@rooz/calendar-core';
import { buildMonthGrid, jalali, resolveCalendarSystem } from '@rooz/calendar-core';
import type { MonthViewProps } from '@rooz/calendar-ui';
import { MonthView } from '@rooz/calendar-ui';

const grid: MonthGrid = buildMonthGrid(1405, 1, { system: 'jalali' });
const cell: DayCell | undefined = grid.days[0];
const events: CalendarEvent[] = [{ id: 'a', title: 'A', start: new Date() }];
const props: MonthViewProps = { events, calendarSystem: resolveCalendarSystem('jalali'), locale: 'fa' };
export { grid, cell, props, MonthView, jalali };
`,
);

writeFileSync(
  join(app, 'tsconfig.json'),
  `${JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        lib: ['ES2020', 'DOM'],
        module: 'ESNext',
        moduleResolution: 'bundler',
        jsx: 'react-jsx',
        strict: true,
        noEmit: true,
        skipLibCheck: false,
      },
      include: ['src/types-check.ts'],
    },
    null,
    2,
  )}\n`,
);

step('Installing the tarballs with npm (no workspace links)');
run('npm', ['install', '--no-audit', '--no-fund', '--loglevel', 'error'], app, { inherit: true, env: consumerEnv });
ok('installed');

step('Type-checking against the published .d.ts');
try {
  run('npx', ['tsc', '-p', 'tsconfig.json'], app, { env: consumerEnv });
  ok('published types resolve and check');
} catch (error) {
  failures.push('published types failed to check');
  console.log(error.stdout ?? error.message);
}

step('Building the consumer app');
run('npx', ['vite', 'build'], app, { inherit: true, env: consumerEnv });

const cssFile = readdirSync(join(app, 'dist', 'assets')).find((file) => file.endsWith('.css'));
check(!!cssFile, 'consumer build emitted a stylesheet');
const css = cssFile ? readFileSync(join(app, 'dist', 'assets', cssFile), 'utf8') : '';
check(css.includes('.bg-primary'), 'shipped stylesheet carries the theme utilities');
check(!css.includes('box-sizing:border-box'), 'shipped stylesheet contains no Preflight reset');

/* --------------------------------------------------------- render check */

step('Rendering in a headless browser');
// Served over HTTP, not file:// — Chrome blocks ES module loads from file URLs,
// and the built app is module-based.
const server = createServer((request, response) => {
  const requested = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const filePath = join(app, 'dist', requested === '/' ? 'index.html' : requested);
  if (!existsSync(filePath)) {
    response.writeHead(404).end();
    return;
  }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
  const extension = filePath.slice(filePath.lastIndexOf('.'));
  response.writeHead(200, { 'content-type': types[extension] ?? 'application/octet-stream' });
  response.end(readFileSync(filePath));
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;

const { chromium } = await import('playwright-core');
const executablePath = process.env.CHROMIUM_PATH ?? '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
if (!existsSync(executablePath)) {
  console.log(`  ! no chromium at ${executablePath}; set CHROMIUM_PATH to run the render check`);
} else {
  const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const consoleErrors = [];
  page.on('pageerror', (error) => consoleErrors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('404')) consoleErrors.push(message.text());
  });
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="month"] [role="gridcell"]', { timeout: 15_000 }).catch(() => {});

  if (consoleErrors.length > 0) console.log(`  ! page errors: ${consoleErrors.join('; ')}`);
  const smoke = await page.evaluate(() => window.__smoke);
  check(smoke?.title === 'شهریور ۱۴۰۵', `core built a Jalali month grid titled "${smoke?.title}"`);
  check(smoke?.inMonth === 31, `Shahrivar 1405 has ${smoke?.inMonth} days`);
  check(smoke?.firstKey === '2026-08-22', `grid starts on ${smoke?.firstKey} (the Saturday before)`);
  check(smoke?.todayJalali === '1405/06/04', `2026-08-26 converts to ${smoke?.todayJalali}`);

  const monthCells = await page.locator('[data-testid="month"] [role="gridcell"]').count();
  check(monthCells === 35, `MonthView rendered ${monthCells} day cells`);
  check(
    (await page.locator('[data-testid="month"] > div').first().getAttribute('dir').catch(() => null)) === 'rtl',
    'Jalali MonthView renders right-to-left',
  );
  check((await page.locator('[data-testid="week"] [role="columnheader"]').count()) === 7, 'WeekView rendered 7 columns');
  check((await page.getByText('Linear Algebra').count()) > 0, 'events rendered');

  // Styles actually applied, not just present in the file.
  const background = await page
    .locator('[data-testid="month"] [aria-current="date"]')
    .first()
    .evaluate((node) => getComputedStyle(node).backgroundColor);
  check(background !== 'rgba(0, 0, 0, 0)' && background !== '', `today's marker is painted (${background})`);

  check(consoleErrors.length === 0, `no console errors${consoleErrors.length ? `: ${consoleErrors.join('; ')}` : ''}`);
  await browser.close();
}
server.close();

/* ---------------------------------------------------------------- done */

if (!keep) rmSync(work, { recursive: true, force: true });
else console.log(`\nkept: ${work}`);

console.log('');
if (failures.length > 0) {
  console.error(`smoke test FAILED (${failures.length}):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log('smoke test passed — the published artifacts install, type-check and render.');
