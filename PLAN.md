# Garuda Shabd — Execution Plan + Claude Code Steps

**Project:** Garuda Shabd (शब्द), a production-ready Hindi–English dictionary PWA for Garuda Prakashan (Track 3: Dictionary App)
**Owner:** Noor (GitHub: noor0021)
**Hard deadline:** form submitted by **11:30 PM, Wed 11 Nov 2026** (official cut-off 11:59 PM)
**Rule:** this repo is built from scratch. Do not copy code, data or text from any other applicant's repo.

---

## Part A: Timeline (6:57 PM → 11:30 PM)

| # | Time | Phase | Done when | Who |
|---|---|---|---|---|
| 0 | 7:00–7:15 | Setup: repo, scaffold, CI, Vercel connected | Blank app live on a Vercel URL | Noor + Claude Code |
| 1 | 7:15–7:55 | Dataset (10 starter + ~100 new) + validator | `npm run validate` passes; Noor spot-checked 15 entries | Claude Code, then Noor reviews |
| 2 | 7:55–8:45 | Search engine + tests | ~20 search tests green | Claude Code |
| 3 | 8:45–10:00 | UI: all screens, both themes, motion | Every screen works on a phone, light + dark | Claude Code, Noor tests on phone |
| 4 | 10:00–10:30 | Production hardening: PWA, SEO, headers, a11y, Lighthouse | Lighthouse mobile ≥95 in all 4 categories | Claude Code |
| 5 | 10:30–10:50 | **Go/no-go at 10:30:** Wiktionary fallback | Built properly, or moved to "What I'd build next" | Claude Code |
| 6 | 10:50–11:15 | Docs: README, CONTRIBUTING, AI log, Drive folder | Drive folder + repo complete and public | Claude Code + Noor |
| 7 | 11:15–11:30 | Final check in incognito + submit Google Form | Form submitted | Noor |
| — | 11:30–11:59 | Buffer only; no new features | — | — |

**Rules for the night**
- Commit at the end of every step (Part D). Commits after 11:59 PM don't count.
- If a phase runs over by more than 15 min, cut scope from Tier 2 polish, never from tests or docs.
- Keep `AI_LOG.md` updated after every step. Don't write it from memory at 11 PM.

---

## Part B: Noor's manual steps (Claude Code can't do these)

1. **7:00:** On GitHub, create a public, empty repo `noor0021/garuda-shabd` with no README, no license and no .gitignore.
2. **7:10:** After the first push, go to vercel.com → Add New → Project → import `garuda-shabd` → Framework: Vite → Deploy. Keep the URL.
3. **7:55:** Spot-check 15 random dataset entries: meaning, gender, and example sentence sound natural. Tell Claude Code what to fix. Note it in the AI log.
4. **10:00:** Open the Vercel URL on your own phone. Try search, saving, dark mode, offline (airplane mode after the first load) and installing the app.
5. **10:50:** Create a Google Drive folder named **`Noor_Dictionary App`** (use your full name as on the form). Upload `README.md`, `AI_LOG.md` and `entries.json` from `drive/`. Set sharing to **Anyone with the link can view**.
6. **11:15:** Open the repo, the live app and the Drive folder in an **incognito window** to confirm all three open without sign-in.
7. **11:20:** Submit the Google Form with the Drive link, GitHub link and live URL.

---

## Part C: Specs (Claude Code builds to these)

### C1. Stack
- React + TypeScript (strict) + Vite
- GSAP for motion (lazy-loaded where possible, respects `prefers-reduced-motion`)
- `@indic-transliteration/sanscript` for Devanagari → IAST (dataset validation + derived search keys)
- `fuse.js` for fuzzy matching
- `vite-plugin-pwa` for the service worker + manifest
- Vitest for tests, oxlint for lint
- Self-hosted fonts via `@fontsource`: Noto Serif Devanagari (headwords), Noto Sans Devanagari + Inter (UI). No Google Fonts CDN, so it works offline and under a strict CSP.
- No UI framework, no router library; a small router of our own.
- Hosting: Vercel. CI: GitHub Actions.

### C2. Data schema (`public/data/entries.json`, Garuda's format, unchanged)
```ts
type Entry = {
  id: number;
  headword: string;        // Devanagari
  transliteration: string; // IAST, letter-based (keeps schwa: śabda, karanā)
  romanised: string[];     // how people actually type it: shabd, shabda
  pos: string;             // "noun (m.)" | "noun (f.)" | "verb" | "adjective" | "adverb" | ...
  meanings: string[];      // English
  example: string;         // Hindi sentence containing the headword
};
```
The file is wrapped as `{ "version": "1.0.0", "entries": Entry[] }`. The app validates the shape at load and shows an error state if the file is broken.

**Starter entries (from Garuda's brief; use these verbatim as ids 1–10):**
```json
[
{"id":1,"headword":"शिक्षा","transliteration":"śikṣā","romanised":["shiksha","siksha","shiksa"],"pos":"noun (f.)","meanings":["education","learning"],"example":"शिक्षा हर बच्चे का अधिकार है।"},
{"id":2,"headword":"भाषा","transliteration":"bhāṣā","romanised":["bhasha","bhasa","bhaasha"],"pos":"noun (f.)","meanings":["language","speech"],"example":"हिंदी भारत की एक प्रमुख भाषा है।"},
{"id":3,"headword":"शब्द","transliteration":"śabda","romanised":["shabd","shabda","sabd"],"pos":"noun (m.)","meanings":["word","sound"],"example":"इस शब्द का अर्थ क्या है?"},
{"id":4,"headword":"प्रकाश","transliteration":"prakāśa","romanised":["prakash","prakaash","prakasha"],"pos":"noun (m.)","meanings":["light","brightness"],"example":"सूरज का प्रकाश कमरे में फैल गया।"},
{"id":5,"headword":"वृक्ष","transliteration":"vṛkṣa","romanised":["vriksh","vriksha","vruksh"],"pos":"noun (m.)","meanings":["tree"],"example":"आँगन में एक पुराना वृक्ष है।"},
{"id":6,"headword":"समय","transliteration":"samaya","romanised":["samay","samaya","samai"],"pos":"noun (m.)","meanings":["time","occasion"],"example":"समय का सही उपयोग करो।"},
{"id":7,"headword":"कर्म","transliteration":"karma","romanised":["karm","karma"],"pos":"noun (m.)","meanings":["action, deed","duty"],"example":"अच्छे कर्म का फल अच्छा होता है।"},
{"id":8,"headword":"शांति","transliteration":"śānti","romanised":["shanti","shaanti","santi"],"pos":"noun (f.)","meanings":["peace","calm"],"example":"गाँव में शांति का माहौल है।"},
{"id":9,"headword":"प्रेम","transliteration":"prema","romanised":["prem","prema"],"pos":"noun (m.)","meanings":["love","affection"],"example":"माँ का प्रेम निस्वार्थ होता है।"},
{"id":10,"headword":"सत्य","transliteration":"satya","romanised":["satya","saty"],"pos":"noun (m.)","meanings":["truth"],"example":"सत्य की हमेशा जीत होती है।"}
]
```

**New entries (ids 11+, about 100):**
- Everyday words a general Hindi–English user looks up. Mix: ~60 nouns, ~20 verbs (infinitive -ना), ~15 adjectives, ~5 adverbs. Not only spiritual vocabulary.
- Include some that stress-test search: ज्ञान (gyan/jnana), क्षमा (kshama/chhama), ऋषि (rishi), श्रद्धा (shraddha), विश्वास (vishwas/vishvas), संस्कृति (sanskriti), and words with ष/श/स, ड़/ढ़, ञ/ण, conjuncts and anusvara.
- 2–4 realistic `romanised` spellings each (how people really type in WhatsApp/Google). No invented or unpronounceable spellings, and no spelling that is a common English word (e.g. "wed", "mat").
- Example sentences: short, natural, everyday Hindi, and they must contain the headword exactly. For verbs use the infinitive form in the sentence (e.g. "मुझे पढ़ना पसंद है।").
- Gender for every noun as Hindi uses it (not Sanskrit), e.g. आत्मा (f.), अग्नि (f.).

### C3. Validator (`scripts/validate-data.ts`, runs in `npm run check` and in CI; the build fails on any error)
1. Shape: all fields present, correct types, unique ids, unique headwords, non-empty arrays.
2. IAST: equals Sanscript `devanagari→iast` output after normalising anusvara to the homorganic nasal before a consonant (ṃ+k/kh/g/gh→ṅ, c-group→ñ, ṭ-group→ṇ, t-group→n, p-group→m; otherwise ṃ) and chandrabindu to m̐.
3. Every romanised spelling is lowercase a–z only, and searching it returns its own entry as the **first** result.
4. No romanised spelling collides with another entry's spelling.
5. The example contains the headword.
6. `pos` is from the allowed list; nouns carry (m.) or (f.).
7. Prints a summary: entries, by POS, by first letter.

### C4. Search engine (`src/lib/`, pure TS, no DOM; same code runs in tests)
**Script detection:** any char in U+0900–U+097F → Devanagari query; else Latin.

**Devanagari normalisation:** NFC; remove ZWJ/ZWNJ; nukta letters → base letter (ज़→ज, फ़→फ, ड़ and ढ़ stay as they are); chandrabindu ँ → anusvara ं; trim the danda.

**Latin "sound key"**, applied identically to the query, every romanised spelling, and the de-accented IAST:
1. lowercase, NFD, strip combining marks (ś→s, ā→a, ṛ→r)
2. `chh`→`ch`, `sh`→`s`, `ksh`/`ks`→`ks`, `jn`/`gy`→`gy`, `w`→`v`, `z`→`j`, `q`→`k`, `ph`→`f` (and `f` stays `f`)
3. `ri`/`ru` after a consonant at word start (vriksh/vruksh) → `r`
4. `aa`→`a`, `ee`→`i`, `oo`→`u`; collapse any doubled letter
5. `m` before a consonant → `n`
6. drop one trailing `a` (shabda → shabd), but only if the key stays ≥3 letters

**Index:** one record per entry with `{ headwordNorm, spellings[], keys: Set<string>, englishWords: Set<string> }`, built once at load.

**Match tiers (ranking, best first) and the "why matched" chip each produces:**
| Tier | Rule | Chip |
|---|---|---|
| 1 | Devanagari query == headword, or Latin query == a listed spelling / de-accented IAST | `exact` |
| 2 | Latin sound key == an entry key | `sounds like: <spelling>` |
| 3 | Query is a whole English word in `meanings` | `English: <word>` |
| 4 | Prefix of headword / spelling / key (query ≥ 2 chars) | `starts with` |
| 5 | Fuzzy (Fuse.js over keys, threshold ≈0.3), only for queries ≥ 4 chars, keep only hits within 0.1 of the best score | `close to: <spelling>` |

- If any tier 1–3 hit exists, drop all tier-5 hits (no noise next to a correct answer).
- Ties: tier → score → headword in वर्णमाला order.
- Return at most 20 results with `{ entry, tier, reason }`.
- Must run in < 2 ms for 110 entries (measure it and put the real number in the README).

**Live preview:** for Latin input, show `query → <top headword>` when the top result is tier 1–2. Otherwise show nothing (never show a guessed transliteration that could be wrong).

**वर्णमाला order:** an explicit array (अ आ इ ई उ ऊ ऋ ए ऐ ओ औ क ख ग घ ङ च छ ज झ ञ ट ठ ड ढ ण त थ द ध न प फ ब भ म य र ल व श ष स ह क्ष त्र ज्ञ), used for browse and sorting. Conjunct initials क्ष/त्र/ज्ञ are grouped as their own letters.

### C5. Required search tests (Vitest, `tests/search.test.ts`)
`धर्म`→धर्म · `dharam`→धर्म · `dharm`→धर्म · `dharmā`→धर्म · `shanti`/`santi`/`shaanti`→शांति · `gyan`/`jnana`→ज्ञान · `vishwas`/`vishvas`→विश्वास · `prakesh`→प्रकाश (tier 5) · `vruksh`→वृक्ष · `peace`→शांति (tier 3) · `Shanti ` (caps + space)→शांति · `ram` must NOT return क्षमा · `xyzq` returns [] · `श`/`sh` returns prefix results only · every result for `dharam` has tier ≤2 · chip text is correct for one case in each tier · search over the full dataset < 2 ms average.

### C6. Routes
- `/` home · `/search?q=` results · `/w/:slug` entry (slug = first romanised spelling) · `/saved` · `/letter/:letter` browse · any other path → 404 page.
- History API router of our own (~50 lines). Vercel rewrite all paths → `/index.html`.
- Page `<title>` per route, e.g. `धर्म (dharma) · Garuda Shabd`.

### C7. Design system
**Concept:** ink on paper, like a well-printed dictionary. The Devanagari headword is the hero.

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#FAF6EE` | `#141312` |
| `--surface` | `#FFFFFF` | `#1E1C1A` |
| `--ink` | `#1C1A17` | `#ECE6DA` |
| `--ink-2` (secondary) | `#6B655C` | `#A39C90` |
| `--line` | `#E7E0D3` | `#2E2B27` |
| `--accent` (teal: tappable, focus) | `#0F6E6E` | `#5FBFB4` |
| `--mark` (marigold: chips, saved star, highlight) | `#C27A12` | `#E8A93A` |
| `--danger` | `#B3412E` | `#E07A66` |

- Verify every text/background pair is ≥ 4.5:1 (≥ 3:1 for large text and UI borders). Adjust the hex and note any change in the AI log.
- Theme: follows the system by default; a header toggle overrides it and the choice is saved. An inline script in `index.html` sets `data-theme` before paint (no flash). `meta theme-color` is set per theme.
- Type: headword Noto Serif Devanagari 48px (entry) / 26px (rows); IAST italic in `--accent`; UI Inter + Noto Sans Devanagari 16px; input ≥ 16px.
- Spacing on a 4px scale, radius 12px on cards/sheet, hairlines rather than shadows (one soft shadow on the sheet only).
- All Hindi text wrapped with `lang="hi"`.

**Layout**
- Phone: header (Garuda mark, "शब्द · Shabd", theme toggle) → sticky search bar → segmented control `Search | Saved` → content. The entry opens as a **bottom sheet** (swipe down / Esc / back closes it), and the URL changes to `/w/:slug`.
- Laptop (≥ 900px): two panes, results left (380px) and entry right. No fake phone frame.

**Screens**
1. **Home:** big search box (placeholder: `धर्म, dharam, peace…`), hint "Any spelling works — Hindi or English", recent search chips (max 6, clear button), वर्णमाला grid (empty letters greyed and disabled).
2. **Results:** live preview line; rows = headword · IAST · first meaning · chip on the right; tiers 1–4 first, then a "Did you mean" divider and tier-5 rows.
3. **Entry:** headword + 🔊 Listen + ☆ Save; IAST; POS pill; numbered meanings; example quote with the headword highlighted in `--mark`; "Also spelled" chips (tap = search); previous/next in वर्णमाला order.
4. **No results:** "हमें 'x' नहीं मिला · We couldn't find 'x'", close suggestions only if any exist, tips. Wiktionary section here if built (C9).
5. **Saved:** same rows, remove button, empty state "Tap ☆ on any word to save it here."
6. **Browse letter:** words for that letter in order.
7. **404**, **error boundary** ("Something went wrong · Reload"), **data load error**, and an **offline banner** ("Offline · all words still available").

**Interaction rules:** search runs on every keystroke (no debounce needed at this size); Enter opens the top result and blurs the input (closes the phone keyboard); Esc clears; `/` focuses search on desktop; tap targets ≥ 44px; visible 2px teal focus ring; results area keeps a min-height (no layout jump). Listen uses `speechSynthesis` with a `hi-IN` voice; if no Hindi voice exists the button is hidden, not broken. Storage access is wrapped in try/catch and the app works with storage blocked.

**Motion (GSAP; everything off under `prefers-reduced-motion`)**
| Moment | Animation | Duration |
|---|---|---|
| Results render | rows fade + rise 8px, 30ms stagger (first 10 rows only) | 0.25s |
| Live preview | cross-fade | 0.15s |
| Entry sheet | slide up, `power3.out`, scrim fades in | 0.35s |
| Save star | scale pop + marigold ring | 0.3s |
| Theme switch | CSS colour transition | 0.3s |
Motion must never delay showing results.

### C8. Production requirements
- `vite-plugin-pwa`: manifest (name, short_name "Shabd", theme/background colours, icons 192/512 + maskable + apple-touch-icon, made from an original SVG Garuda-wing mark), precache the app shell + fonts + `entries.json`, `registerType: 'autoUpdate'` with a "New version available · Refresh" toast.
- `vercel.json`: SPA rewrite; headers: `Content-Security-Policy` (default-src 'self'; connect-src 'self' https://en.wiktionary.org; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' plus the sha256 hash of the inline theme script), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy` minimal; long cache for `/assets/*`.
- SEO: meta description, canonical, Open Graph + Twitter tags, `og-image.png` (1200×630, original design), `robots.txt`.
- React error boundary at the root; zero console errors/warnings in the prod build.
- GitHub Actions `ci.yml`: Node 22, `npm ci`, `npm run check` (typecheck + lint + test + validate), `npm run build`.
- Scripts: `dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `validate`, `check`.
- Lighthouse (mobile) ≥ 95 in Performance, Accessibility, Best Practices, SEO. Record the real scores in the README.

### C9. Stretch: Wiktionary fallback (only if Phase 5 starts on time)
- Only for **Devanagari** queries with zero local results.
- First confirm that `https://en.wiktionary.org/api/rest_v1/page/definition/<word>` works and allows CORS (curl it). If it doesn't, stop and move the feature to "What I'd build next".
- `AbortController` timeout 4s; read only the `hi` language section; strip all HTML to plain text (never `dangerouslySetInnerHTML`); max 3 definitions; cache per word in `sessionStorage`.
- Clearly labelled: "Not in Garuda's dictionary yet · from Wiktionary (CC BY-SA)" with a link to the source page. Never mixed into the main results.
- When offline or on error: show nothing extra, just the normal no-results state.
- Tests with a mocked fetch: success, timeout, 404, no `hi` section.

---

## Part D: Steps for Claude Code

**How to use this:** put this file at the repo root as `PLAN.md`. Start Claude Code in the repo and paste the prompts one at a time. Don't move on until the step's "Done when" is true. Every step ends with a commit.

### Step 0: Project rules (paste first, once)
```
Read PLAN.md fully. It is the spec for this project. Then create CLAUDE.md at the repo root with these rules, and follow them for the rest of the session:

- Build from scratch to PLAN.md. Do not copy code, data or text from any other repository.
- TypeScript strict. No `any` without a comment explaining why.
- Before every commit, run `npm run check` and `npm run build`. Never commit with failures.
- Commit at the end of each step with a clear conventional message (feat:, fix:, test:, docs:, chore:).
  Git author: Noor <noor0021@users.noreply.github.com>.
- After each step, append to AI_LOG.md: what you were asked, what you produced, what you got wrong or changed and why, and how it was verified. Keep it factual and specific.
- Never state a number (bundle size, speed, Lighthouse score) in docs unless you measured it.
- If a requirement in PLAN.md is unclear or impossible, stop and ask me rather than guessing.
```

### Step 1: Scaffold + CI + first deploy (7:00)
```
Step 1 of PLAN.md.
- Scaffold Vite + React + TypeScript (strict) in this repo. Install: gsap, fuse.js, @indic-transliteration/sanscript, @fontsource/noto-serif-devanagari, @fontsource/noto-sans-devanagari, @fontsource-variable/inter; dev: vitest, vite-plugin-pwa, oxlint.
- Remove all template content. Folder structure: src/lib (pure logic), src/components, src/screens, src/styles, scripts, tests, public/data.
- Add the npm scripts from PLAN.md C8 (check = typecheck + lint + test + validate). Placeholder validate/test that pass for now.
- Add .github/workflows/ci.yml and vercel.json (SPA rewrite only for now).
- A minimal page that says "Garuda Shabd" so we can confirm the Vercel deploy.
- .gitignore, a README stub, and AI_LOG.md with a header and a "Planning" section that says: planning, scope, design spec and this step plan were done in a Claude conversation before coding.
- git init, set remote to https://github.com/noor0021/garuda-shabd.git, commit "chore: scaffold React + TS + Vite app with CI", push to main.
Done when: CI is green on GitHub and Noor confirms the Vercel URL loads.
```

### Step 2: Dataset + validator (7:15)
```
Step 2 of PLAN.md (sections C2 and C3).
- Create public/data/entries.json as { version, entries } with the 10 starter entries verbatim, then about 100 new entries following every rule in C2.
- Create src/lib/types.ts (Entry, Dataset) and src/lib/indic.ts with the Devanagari normalisation and the IAST helper (Sanscript + the anusvara/chandrabindu normalisation from C3).
- Create scripts/validate-data.ts implementing all checks in C3 except check 3 (needs the search engine; add a TODO that Step 3 fills in). Wire it into npm run validate.
- Run it and fix every failure in the DATA, not by loosening the validator. List what you fixed.
- Mutation-test the validator: temporarily inject one error of each type (bad IAST, duplicate id, example missing the headword, uppercase spelling, wrong pos) and show that each is caught, then revert.
- Print 15 random entries in a readable table so Noor can spot-check meanings, gender and example sentences.
- Commit "feat: add 110-entry dataset and data validator".
Done when: validate passes, mutation test shown, and the table is printed for Noor.
```
**Noor:** review the 15 entries now and tell Claude Code what to fix. Log your corrections in the AI log in your own words.

### Step 3: Search engine + tests (7:55)
```
Step 3 of PLAN.md (sections C4 and C5).
- Implement src/lib/sound-key.ts, src/lib/varnamala.ts, src/lib/search.ts exactly as specified: script detection, normalisation, sound key, index, 5 tiers, chip reasons, tier-5 suppression, ranking, live-preview helper. Pure functions, no DOM.
- Write tests/search.test.ts covering every case in C5, plus unit tests for the sound key (10 input→key pairs) and वर्णमाला sorting.
- Fill in validator check 3 (every romanised spelling returns its own entry first) and check 4 (no collisions).
- Measure average search time over the full dataset (1,000 runs of 20 mixed queries) and print it.
- If any C5 case cannot pass without breaking another, stop and explain the conflict to me with options. Do not silently drop a test.
- Commit "feat: phonetic search engine with tiered ranking and tests".
Done when: npm run check is green with all C5 cases, and the timing is printed.
```

### Step 4: Design system + app shell (8:45)
```
Step 4 of PLAN.md (C6 and C7: tokens, theme, layout, router).
- src/styles/tokens.css with every token for light and dark; check the contrast of every text/background pair with a small script and print the ratios; fix any below AA.
- Inline no-flash theme script in index.html; theme toggle in the header (system / light / dark, saved, with a try/catch around storage); theme-color meta updates.
- Self-hosted fonts via @fontsource (subsets: latin, latin-ext, devanagari) with font-display: swap.
- A small history router with all routes in C6, per-route document.title, and a 404 screen.
- App shell: header, sticky search bar, Search | Saved segmented control, phone layout, and the two-pane layout at ≥900px.
- Root error boundary and the data-load error state. Load and shape-check entries.json once.
- Commit "feat: design tokens, light/dark theme, app shell and router".
Done when: I can switch themes with no flash, every route renders, and the layout is right at 375px and 1280px.
```

### Step 5: Screens (9:05)
```
Step 5 of PLAN.md (C7 screens 1–7 and interaction rules).
- Build Home, Results (live preview + chips + "Did you mean" divider), Entry (bottom sheet on phone / right pane on desktop, Listen, Save, example highlight, Also-spelled chips, prev/next), No results, Saved, Browse letter, Offline banner.
- Implement every interaction rule in C7: Enter opens the top result and blurs; Esc clears or closes the sheet; "/" focuses search; swipe down closes the sheet; back button closes the sheet; 44px targets; focus ring; no layout jump; speechSynthesis hi-IN with the button hidden if there is no Hindi voice; recents (max 6) and saved in storage with try/catch.
- Semantic HTML: the search is a form with role="search", the results a list, the sheet a dialog with focus trap and aria-modal; lang="hi" on all Hindi text.
- Commit after the screens work: "feat: search, results, entry, saved, browse and empty states".
Done when: every screen and state works by keyboard and touch in both themes. Give me a checklist of the states to click through.
```

### Step 6: Motion (9:40)
```
Step 6 of PLAN.md (C7 motion table).
- Add the GSAP animations from the table: results stagger (first 10 rows), live-preview cross-fade, sheet slide-up with scrim, save-star pop, theme colour transition.
- Use gsap.context / useLayoutEffect cleanup so nothing leaks on route changes. Under prefers-reduced-motion, no animation at all.
- Confirm that results still render on the same keystroke (animation never delays content).
- Commit "feat: GSAP motion with reduced-motion support".
Done when: the animations work, reduced motion turns them all off, and there are no console warnings.
```
**Noor (10:00):** test the live Vercel URL on your phone (Part B, step 4). Send Claude Code anything that feels off.

### Step 7: Production hardening (10:00)
```
Step 7 of PLAN.md (C8).
- PWA: manifest, original SVG Garuda-wing icon exported to 192/512/maskable/apple-touch PNGs, precache shell + fonts + entries.json, autoUpdate with a "New version available · Refresh" toast. Verify offline: build, preview, go offline, reload, search still works.
- vercel.json: the full header set and CSP from C8 (compute the sha256 for the inline theme script); long cache on /assets/*.
- SEO: meta description, canonical, OG/Twitter tags, original og-image.png 1200×630, robots.txt.
- Zero console errors/warnings in `npm run preview`.
- Run Lighthouse (mobile) on the preview build and fix issues until all four scores are ≥95. Record the real scores and the gzipped bundle size.
- Fix any issues Noor reported from phone testing.
- Commit "chore: PWA, security headers, SEO and Lighthouse fixes".
Done when: offline works, Lighthouse ≥95 ×4 (real numbers shown), and CI is green.
```

### Step 8: Go/no-go, Wiktionary fallback (10:30)
```
It is now [TIME]. Step 8 of PLAN.md (C9).
If it is later than 10:35 PM, or any earlier step is unfinished, SKIP this step: add "Wiktionary fallback for words not yet in Garuda's dictionary" to the README's "What I'd build next", and go to Step 9.
Otherwise:
- First curl the Wiktionary endpoint for 'पानी' and show me the response shape and CORS headers. If it doesn't work, skip as above.
- Implement C9 exactly: Devanagari-only, 4s timeout, hi section only, plain text only, max 3 definitions, sessionStorage cache, clear labelling + source link, silent on error/offline. Mocked-fetch tests for success, timeout, 404 and no-hi-section.
- Commit "feat: labelled Wiktionary fallback for words not in the dataset".
Done when: it works live for a real word not in the dataset, and the tests pass.
```

### Step 9: Docs + Drive package (10:50)
```
Step 9 of PLAN.md.
- README.md (repo): what it is (2 lines), live URL, screenshots (light + dark, phone + desktop; capture them), features, how to run, scripts, how search works (sound key + 5 tiers, with a real example walked through), data format + how to add a word, quality gates (tests, validator, CI), measured numbers (search time, bundle size, Lighthouse), trade-offs (library vs hand-written transliteration; no framework router; local-first data; PWA vs native; no accounts), and What I'd build next (Garuda editor workflow from missed searches, lookup API, browser extension, recorded pronunciations, etymology, Android TWA, and Wiktionary if skipped). Be specific to Garuda.
- CONTRIBUTING.md: how an editor adds or edits a word and runs `npm run validate`.
- Finish AI_LOG.md, one to two pages: tools and what each was used for; key prompts (summarised); a table of what was rejected or corrected and why; how data, facts and code were checked (validator, mutation test, Noor's manual spot-check, tests, Lighthouse, phone testing). Leave clearly marked TODO lines where Noor must add his own corrections in his own words.
- Create a drive/ folder (git-ignored) containing: README.md (5–10 lines: what I built, what each file is, live/GitHub/Drive links), AI_LOG.md (copy), entries.json (copy).
- Commit "docs: README, contributing guide and AI log". Push.
Done when: the README renders correctly on GitHub and drive/ is ready for Noor to upload.
```
**Noor (11:00–11:30):** fill in the AI log TODOs in your own words, commit, then do Part B steps 5–7 and **submit by 11:30**.

---

## Part E: Final checklist (before submitting)
- [ ] Live Vercel URL opens in incognito; search works in Hindi, Roman and English
- [ ] Works offline after the first load; installs on a phone
- [ ] Light and dark mode both correct; no console errors
- [ ] GitHub repo public; CI green; README complete with real numbers
- [ ] Last commit before 11:59 PM
- [ ] Drive folder `Noor_Dictionary App` with README, AI_LOG, entries.json; "Anyone with the link can view"
- [ ] AI log honest and specific, including the planning conversation and your own corrections
- [ ] Google Form submitted with Drive, GitHub and live links
