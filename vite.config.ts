import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * The public URL, for canonical, Open Graph and the sitemap. On Vercel the production domain is
 * provided at build time, so no URL is hard-coded or guessed. SITE_URL overrides it.
 */
const siteUrl = (
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:4173')
).replace(/\/$/, '');

/** Fills %SITE_URL% in index.html and writes sitemap.xml with one URL per dictionary word. */
function seo(): Plugin {
  return {
    name: 'garuda-shabd-seo',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl),
    generateBundle() {
      const { entries } = JSON.parse(readFileSync('public/data/entries.json', 'utf8')) as { entries: { romanised: string[] }[] };
      const urls = ['/', '/saved', ...entries.map((e) => `/w/${e.romanised[0]}`)];
      const body = urls.map((u) => `  <url><loc>${siteUrl}${u}</loc></url>`).join('\n');
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
      });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n` });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    seo(),
    VitePWA({
      // "prompt", not "autoUpdate": autoUpdate reloads the page by itself, possibly mid-search.
      // Prompt mode lets the app show "New version available · Refresh" and the user choose.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Garuda Shabd · Hindi–English dictionary',
        short_name: 'Shabd',
        description: "Garuda Prakashan's Hindi–English dictionary. Any spelling works: Devanagari, romanised Hindi or English.",
        lang: 'en',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#FFFFFF',
        background_color: '#FFFFFF',
        categories: ['education', 'books', 'reference'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell, the dictionary and the font subsets the app uses (Latin, Latin-ext for IAST,
        // Devanagari). Other subsets (Cyrillic, Greek…) are never requested, so not precached.
        globPatterns: ['**/*.{js,css,html,svg,webmanifest}', 'data/entries.json', 'icons/*.png', 'assets/*-{latin,latin-ext,devanagari}-*.woff2'],
        globIgnores: ['**/og-image.png'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        // Take control of the page on the very first visit, so airplane mode works straight after
        // the first load (no reload needed). Updates still wait for the user's Refresh.
        clientsClaim: true,
      },
    }),
  ],
  build: {
    target: 'es2022',
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
