import { NavLink, Outlet, ScrollRestoration } from 'react-router';
import { cx } from './lib/cx';
import { useTheme } from './lib/use-theme';

const NAV = [
  { to: '/', label: 'Overview', end: true },
  { to: '/demo', label: 'Demo', end: false },
  { to: '/docs', label: 'Docs', end: false },
] as const;

/** Header, footer and theme control, wrapped around whichever page is active. */
export function RootLayout() {
  // The same store the playground's Theme control writes to, so the two agree.
  const { resolved, setTheme } = useTheme();
  const dark = resolved === 'dark';

  return (
    <div className="min-h-dvh">
      {/* Restores scroll between pages and honours in-page `#anchor` links. */}
      <ScrollRestoration />

      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-5">
          <NavLink to="/" className="flex items-baseline gap-2 text-sm font-semibold tracking-tight">
            Rooz Calendar
            <span className="font-mono text-[0.6875rem] font-normal text-muted-foreground">v0.1.0</span>
          </NavLink>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cx(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setTheme(dark ? 'light' : 'dark')}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="ms-auto rounded-md border border-input px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {dark ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-20">
        <Outlet />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-muted-foreground">
          <span>MIT licensed. Jalali conversion by jalali-moment.</span>
          <span className="font-mono">@rooz-calendar/core · @rooz-calendar/ui</span>
        </div>
      </footer>
    </div>
  );
}
