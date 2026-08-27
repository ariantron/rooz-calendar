import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router';
import { routes } from './routes';
import './styles.css';

/**
 * `basename` mirrors Vite's `base`, so the same build works at the domain root
 * and under a GitHub Pages project path without a second configuration knob.
 */
const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
