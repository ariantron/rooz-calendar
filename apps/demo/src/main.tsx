import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Playground } from './playground';
import './playground.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className="mx-auto min-h-dvh w-full max-w-6xl bg-background p-6 text-foreground">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Rooz Calendar — Playground</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every view, both calendar systems, RTL and digit shaping. The grid is generated natively in whichever
          system is selected.
        </p>
      </header>
      <Playground />
    </main>
  </StrictMode>,
);
