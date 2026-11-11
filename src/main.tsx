import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
// Self-hosted fonts (no CDN, so they work offline and under a strict CSP). unicode-range in each
// @font-face means a browser only downloads the subsets a page actually uses.
import '@fontsource/noto-serif-devanagari/devanagari-600.css';
import '@fontsource/noto-sans-devanagari/devanagari-400.css';
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/inter/wght-italic.css';
import './styles/tokens.css';
import './styles/app.css';
import { App } from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { UpdateToast } from './components/UpdateToast.tsx';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root is missing from index.html');

const app = (
  <StrictMode>
    <ErrorBoundary>
      <App />
      <UpdateToast />
    </ErrorBoundary>
  </StrictMode>
);

// In production #root holds the shell prerendered at build time (scripts/prerender.tsx).
// Hydrating keeps those DOM nodes, so the first paint is also the final one. The dev server
// serves an empty #root, so it renders from scratch.
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
