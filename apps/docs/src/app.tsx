import { useEffect, useState } from 'react';
import { cx } from './lib/cx';
import { ApiPage } from './pages/api';
import { DemoPage } from './pages/demo';
import { LandingPage } from './pages/landing';

const ROUTES = [
  { id: '', label: 'Overview' },
  { id: 'demo', label: 'Demo' },
  { id: 'api', label: 'API' },
] as const;

function currentRoute(): string {
  return window.location.hash.replace(/^#\/?/, '');
}

/** Hash routing: three pages, no router dependency, works on static hosting. */
function useHashRoute(): [string, (next: string) => void] {
  const [route, setRoute] = useState(currentRoute);
  useEffect(() => {
    const onChange = () => setRoute(currentRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const navigate = (next: string) => {
    window.location.hash = next ? `/${next}` : '/';
    window.scrollTo({ top: 0 });
  };
  return [route, navigate];
}

function useDarkMode(): [boolean, () => void] {
  const [dark, setDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  );
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  return [dark, () => setDark((value) => !value)];
}

export function App() {
  const [route, navigate] = useHashRoute();
  const [dark, toggleDark] = useDarkMode();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-5">
          <button
            type="button"
            onClick={() => navigate('')}
            className="flex items-baseline gap-2 text-sm font-semibold tracking-tight"
          >
            Rooz Calendar
            <span className="font-mono text-[0.6875rem] font-normal text-muted-foreground">v0.1.0</span>
          </button>
          <nav className="flex items-center gap-1">
            {ROUTES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={cx(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  route === item.id
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={toggleDark}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="ms-auto rounded-md border border-input px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {dark ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-20">
        {route === '' ? <LandingPage onNavigate={navigate} /> : null}
        {route === 'demo' ? <DemoPage /> : null}
        {route === 'api' ? <ApiPage /> : null}
        {route !== '' && route !== 'demo' && route !== 'api' ? (
          <div className="py-24 text-center">
            <p className="text-sm text-muted-foreground">Nothing here.</p>
            <button
              type="button"
              onClick={() => navigate('')}
              className="mt-3 text-sm font-medium underline underline-offset-4"
            >
              Back to the overview
            </button>
          </div>
        ) : null}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-muted-foreground">
          <span>MIT licensed. Jalali conversion by jalali-moment.</span>
          <span className="font-mono">@rooz/calendar-core · @rooz/calendar-ui</span>
        </div>
      </footer>
    </div>
  );
}
