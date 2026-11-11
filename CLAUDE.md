# Project rules for Claude Code

`PLAN.md` is the spec for this project. Read it before working.

- Build from scratch to PLAN.md. Do not copy code, data or text from any other repository.
- TypeScript strict. No `any` without a comment explaining why.
- Before every commit, run `npm run check` and `npm run build`. Never commit with failures.
- Commit at the end of each step with a clear conventional message (feat:, fix:, test:, docs:, chore:).
  Git author: Noor <noor0021@users.noreply.github.com>.
- After each step, append to docs/ai-log-steps.md: what you were asked, what you produced, what you got wrong or changed and why, and how it was verified. Keep it factual and specific. Keep the summary in AI_LOG.md (1–2 pages) up to date.
- Never state a number (bundle size, speed, Lighthouse score) in docs unless you measured it.
- If a requirement in PLAN.md is unclear or impossible, stop and ask me rather than guessing.

## Project state (updated 11 Nov 2026, 11:12 PM, after Step 12)

A handoff note so a new session can pick up without re-reading everything. The detailed record of
each step is in `docs/ai-log-steps.md`; the summary is in `AI_LOG.md`.

### Done (all committed, pushed to `main`, CI green)

- PLAN.md Steps 0–9: scaffold; dataset (129 entries) + validator; 5-tier search engine; design
  system; screens (Home, Results, Saved, Letter, word sheet/panel); GSAP motion; production
  hardening (prerendered shell, PWA in prompt mode, CSP, offline); Wiktionary fallback; docs
  (README, CONTRIBUTING, AI_LOG).
- Step 10 (asked by Noor after Step 9): Settings panel behind the header's gear button (theme,
  text size, animations, intro on/off, listen speed, clear recents/saved, about + replay intro);
  a GSAP opening intro shown as an overlay once per session on `/` only (never on deep links,
  skippable, CSS fallback when motion is off); a layout cleanup pass.
- Step 11 (letterpress pass, 10:50 PM): vermilion-on-white / chalk-on-slate palette with the layout
  hung from a 3px shirorekha rule; a guided spotlight tour (`src/components/Tour.tsx`,
  `src/lib/tour.ts`) ported from Noor's MediCord project, first visit to `/` only, `?` replays it.
  Cut at their cut-offs and listed in the README's "What I'd build next": the akshara breakdown and
  the Roman→Devanagari preview morph.
- Step 12: new shirorekha mark (`public/logo.svg`, `GarudaMark.tsx`) and a regenerated icon set,
  `favicon.ico` and `og-image.png`.
- Measured (local): 443 tests pass (the other numbers here were measured at Step 10, before the
  redesign); search average 34.8 µs; app JS 92.3 kB gz, GSAP 27.1 kB gz
  lazy-loaded; Lighthouse mobile Performance 95–96 (one 83 outlier run), Accessibility, Best
  Practices and SEO 100.

### Deviations from PLAN.md (each logged with its reason in docs/ai-log-steps.md)

- PWA uses prompt mode, not `autoUpdate`, so the "New version · Refresh" toast can work.
- One Devanagari letter counts as a prefix query (the 2-character minimum applies to Latin only).
- `--mark-ink` token added for marigold text that passes AA contrast.
- `clientsClaim` added so offline works straight after the first visit.
- `public/boot.js` loads the bundle after first paint.
- Wiktionary lookup waits 400 ms after typing stops.
- The "landing page" is an intro overlay, not a separate redirecting route.

### How things work here

- `npm run check` = typecheck + lint + test + validate + contrast. `npm run build` also prerenders
  the shell into `index.html`.
- `vercel.json` holds a CSP with the sha256 of the inline script in `index.html`. If that script
  changes, update the hash; `tests/deploy-config.test.ts` fails when they drift.
- User data (saved, recent, settings, theme, introSeen) lives only in localStorage
  (`src/lib/storage.ts`). The only network call besides the app itself is the labelled
  Wiktionary lookup.
- Browser checks (Playwright, local Chrome) were run from a scratch folder, not from this repo.

### Still to do (Noor, by hand, before 11:30 PM Wed 11 Nov 2026)

1. Deploy on Vercel: import `noor0021/garuda`, framework Vite. Then replace the live-URL TODOs in
   `README.md` and `drive/README.md` (the Drive link is also a TODO there).
2. Test on a real phone: search in Hindi, Roman and English, save, dark mode, offline, install,
   intro and settings.
3. Write the three "Noor's own notes" TODOs in `AI_LOG.md` (15-entry spot-check, phone testing,
   rejected output) in your own words, then copy `AI_LOG.md` into `drive/` again.
4. Drive folder "Noor_Dictionary App" (README, AI_LOG, entries.json from `drive/`), shared as
   anyone-with-link.
5. Check every link in an incognito window, then submit the Google Form.
