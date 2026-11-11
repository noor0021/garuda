import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Self-hosted fonts (no CDN, so they work offline and under a strict CSP). unicode-range in each
// @font-face means a browser only downloads the subsets a page actually uses.
import '@fontsource/noto-serif-devanagari/devanagari-600.css';
import '@fontsource/noto-sans-devanagari/devanagari-400.css';
import '@fontsource/noto-sans-devanagari/devanagari-600.css';
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/inter/wght-italic.css';
import './styles/tokens.css';
import './styles/app.css';
import { App } from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root is missing from index.html');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
