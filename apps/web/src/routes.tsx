import type { RouteObject } from 'react-router';
import { RootLayout } from './root-layout';
import { DemoPage } from './pages/demo';
import { DocsPage } from './pages/docs';
import { HomePage } from './pages/home';
import { NotFoundPage } from './pages/not-found';

/**
 * Three sections behind one shell.
 *
 * The docs page keeps its in-page anchors (`#styles`, `#components`,
 * `#exports`) rather than splitting into child routes — the content is one
 * continuous reference, and anchors keep existing links working.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'demo', element: <DemoPage /> },
      { path: 'docs', element: <DocsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
