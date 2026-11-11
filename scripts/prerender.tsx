// Build step, after `vite build`:
// 1. Renders the app shell (header, search bar, tabs, the top of Home) into dist/index.html, so
//    the first paint does not wait for JavaScript. The client hydrates it (src/main.tsx).
// 2. Inlines the stylesheet (18 kB, 4 kB gzipped), the page's only render-blocking request.
// 3. Replaces the entry <script type="module"> with /boot.js, which loads it after the first paint.
import { readFileSync, writeFileSync } from 'node:fs';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { App } from '../src/App.tsx';
import { ErrorBoundary } from '../src/components/ErrorBoundary.tsx';

const file = 'dist/index.html';
let html = readFileSync(file, 'utf8');

const marker = '<div id="root"></div>';
if (!html.includes(marker)) throw new Error(`${file} has no empty #root; was it already prerendered?`);
// Same tree as src/main.tsx (UpdateToast renders nothing until an update exists).
const shell = renderToString(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
html = html.replace(marker, `<div id="root">${shell}</div>`);

const link = /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/.exec(html);
if (!link?.[1]) throw new Error(`${file}: stylesheet link not found`);
const css = readFileSync(`dist${link[1]}`, 'utf8');
html = html.replace(link[0], `<style>${css}</style>`);

const entry = /<script type="module" crossorigin src="(\/assets\/index-[^"]+\.js)"><\/script>/.exec(html);
if (!entry?.[1]) throw new Error(`${file}: entry script not found`);
html = html.replace(entry[0], `<meta name="app-entry" content="${entry[1]}">\n    <script src="/boot.js" defer></script>`);

writeFileSync(file, html);
console.log(`prerendered ${(shell.length / 1024).toFixed(1)} kB of HTML and inlined ${(css.length / 1024).toFixed(1)} kB of CSS into ${file}`);
