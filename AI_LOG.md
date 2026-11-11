# AI log · Garuda Shabd

How AI was used to build this project, what it got wrong, and how the output was checked. Updated after every step, not written from memory at the end.

## Planning

Planning, scope, the design spec and the step plan (`PLAN.md`) were done in a Claude conversation before any code was written. The plan was then pasted into Claude Code and saved as `PLAN.md`, and Claude Code executed it step by step.

## Step 0–1: Project rules, scaffold, CI (started 7:17 PM)

- **Asked:** save the plan, create `CLAUDE.md` with the project rules, scaffold Vite + React + strict TypeScript, add CI and a Vercel SPA rewrite, and push.
- **Produced:** `PLAN.md`, `CLAUDE.md`, a hand-written scaffold (no `create-vite` template, so there was no template content to remove), the folder structure from the plan, npm scripts (`dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `validate`, `check`), `.github/workflows/ci.yml` (Node 22), `vercel.json`, and a minimal page.
- **Changed from the plan, and why:**
  - The plan names the repo `noor0021/garuda-shabd`. That repo does not exist; the local remote already pointed at the empty public repo `noor0021/garuda`, so that is where the code is pushed.
  - Added `tsx` as a dev dependency (not in the plan's install list) to run `scripts/validate-data.ts` on Node 22 in CI.
  - Added `@vitejs/plugin-react` and the React/Node type packages, which the plan's install list left implicit.
- **Verified:** `npm run check` and `npm run build` pass locally; CI result on GitHub checked after the push.

### CI fix after the first push

- **What went wrong:** the first CI run failed in 10 s at `npm ci`. The lockfile, written by npm 11 on macOS, was missing optional `@emnapi/*` entries that npm 10 (Node 22 on CI) requires.
- **Fix:** deleted `node_modules` and the lockfile, reinstalled, and confirmed with `npx npm@10 ci --dry-run` before pushing. Also stopped tracking `tsconfig.tsbuildinfo`, which the first commit had picked up by mistake.

## Step 2: Dataset + validator

- **Asked:** the 10 starter entries verbatim plus about 100 new ones (PLAN.md C2), a validator (C3), a mutation test of the validator, and 15 random entries printed for Noor to spot-check.
- **Produced:**
  - `public/data/entries.json`: 129 entries (10 starter + 119 new): 83 nouns (52 m., 31 f.), 21 verbs, 18 adjectives, 7 adverbs. One entry per line so an editor's change is a one-line diff.
  - `src/lib/types.ts` (types + the shape check the app also uses at load), `src/lib/indic.ts` (Devanagari normalisation), `src/lib/iast.ts` (IAST helper), `src/lib/varnamala.ts` (letter order).
  - `scripts/validate-core.ts` + `scripts/validate-data.ts` (checks 1, 2, 3a, 4, 5, 6, 7; check 3b is wired as a hook that Step 3 fills in) and `scripts/iast.ts` (`npm run iast -- शब्द` prints the IAST an editor should paste).
  - `tests/validator.test.ts`: the mutation test, kept as 14 permanent tests rather than a one-off demo.
- **How the words were chosen:** everyday vocabulary first (पानी, किताब, परिवार, करना, अच्छा), plus the words Garuda's readers meet in its books (धर्म, ज्ञान, श्रद्धा, ऋषि, आत्मा, संस्कृति), plus deliberate search stress-tests: ज्ञ (ज्ञान, विज्ञान), क्ष (क्षमा, क्षेत्र, लक्ष्य), ऋ after a consonant (हृदय), ष at the start (षड्यंत्र), ड़/ढ़ (सड़क, पढ़ना, ढूँढ़ना), nukta letters (ज़िंदगी, सफ़ेद, तेज़), chandrabindu (गाँव, हँसी) and anusvara before each consonant class (जंगल, चंचल, झंडा, मंदिर, संबंध, संस्कृति).
- **Decisions and things changed from the plan:**
  - *IAST was generated, not typed.* The `transliteration` of the 119 new entries was produced by `toIast()` and the validator checks against the same function, so check 2 guards against later hand-edits rather than proving the helper right. The independent evidence that the helper is right is that it reproduces all 10 of Garuda's starter transliterations exactly, including the anusvara rule (शांति → śānti).
  - *Sanscript does not handle Hindi nukta letters or chandrabindu.* Tested before trusting it: ढ़ came out as raw Devanagari inside the Latin string and ँ came out as `~`. `toIast()` fixes both. ड़ is written r̤ (Sanscript's own output) rather than ISO 15919's ṛ, because in IAST ṛ already means ऋ.
  - *The IAST helper lives in `iast.ts`, not `indic.ts` as the plan says.* Sanscript is about 190 kB of scheme tables; keeping it in its own file means the browser bundle never imports it.
  - *खाना is entered as the verb "to eat".* Headwords must be unique, so the noun sense ("food") is covered by भोजन instead.
  - *Words dropped while drafting because their natural spelling is an English word* (PLAN.md C2): मन (man), दिन (din), रात (rat), शाम (sham), रंग (rang), हाथ (hath), लोग (log), पिता (pita), पेड़ (per), बनाना (banana), सुंदर's "sunder". The validator now enforces this with a list of common English words, an addition to C3.
  - *Two more validator rules than C3 lists:* 2–4 spellings per entry, and examples must end in । ? or !.
  - *More entries than "about 100":* ओढ़ना and औरत were added at the end because the first summary showed no words under ओ and औ. ङ, ञ and ण stay empty: no Hindi word starts with them, and the browse grid greys them out.
- **Failures found by the validator:** none on the first run. The checks that could fail (IAST, example contains headword, collisions) were either generated or written with the rule in mind, so the validator's value here is the mutation test below and every future edit.
- **Verified:**
  - `npm run validate` passes on 129 entries.
  - Mutation test: 14 planted mistakes (wrong IAST, anusvara left as ṃ, duplicate id, duplicate headword, example without the headword, uppercase spelling, diacritic in a spelling, pos not in the list, noun without gender, spelling shared by two entries, English-word spelling, empty meanings, missing field, single spelling) are each caught with the expected message, and a single planted mistake produces exactly one error.
  - Claude re-read every new entry for gender and for verb agreement in the example. Two examples were rewritten before the file was generated because the infinitive would have had to agree with a feminine object ("मुझे अपनी चाबी ढूँढ़नी है", "मुझे नए जूते खरीदने हैं"), which would have broken the "headword appears exactly" rule.
- **TODO (Noor):** spot-check of the 15 printed entries (ids 31, 32, 33, 50, 51, 57, 63, 77, 81, 93, 118, 121, 123, 125, 129): what you changed and why, in your own words.

## Step 3: Search engine + tests

- **Asked:** the search engine from PLAN.md C4 (script detection, normalisation, sound key, index, 5 tiers, chips, tier-5 suppression, ranking, live preview), every C5 test case, validator checks 3b and 4, and a timing measurement.
- **Produced:** `src/lib/sound-key.ts`, `src/lib/search.ts` (uses the 19 kB `fuse.js/basic` build, which has the fuzzy search and drops the extended query syntax we don't use), `tests/search.test.ts`, `tests/sound-key.test.ts`, `tests/varnamala.test.ts`, `scripts/bench-search.ts` (`npm run bench`). Validator check 3b now runs the real search engine.
- **Measured** (`npm run bench`, Node 25.2.1 on the development Mac, 129 entries, 1,000 runs × 20 mixed queries): **average search 35.9 µs (0.036 ms)**, slowest query types are the fuzzy ones (`प्रकास` 154 µs, `prakesh` 136 µs); index build 3.4 ms once at load. The 2 ms budget is met with a wide margin, so no caching or worker is needed.
- **Decisions where the plan was unclear or conflicted:**
  - *C4 says tier 4 needs a query of ≥ 2 characters, but C5 requires `श` to return prefix results.* A single Devanagari letter is a full akshara and a meaningful query (the browse grid is built on it), so the 2-character minimum applies to Latin input only. For Latin, a sound-key prefix also needs ≥ 2 letters, otherwise `sh` (key `s`) would pull in every स word.
  - *Tier 1 compares the de-accented query*, so `dharmā` and `śānti` are exact matches.
- **Additions to the plan, each with a test:**
  - `x → ks` in the sound key (people type लक्ष्मी as "laxmi").
  - Devanagari "sounds like" (tier 2) through a looser Devanagari key: half-nasal vs anusvara (शान्ति = शांति), short/long i and u (शांती), and ड़/ढ़ typed without the nukta (पढना = पढ़ना). Hindi typists switch between these all the time, and the plan only covered Latin for tier 2.
  - Devanagari fuzzy (tier 5) over that key, so `प्रकास` finds प्रकाश.
  - English matches whole meanings too ("to eat", "right now"), and filler words (to, a, the, of…) are not searchable on their own, otherwise `to` would match every verb at tier 3. English word prefixes (≥ 3 letters) count for tier 4, so `wat` shows पानी (water) while the user is still typing.
- **What I got wrong first:** the first mutation test for check 3b planted a near-spelling on another word and expected search to rank it elsewhere. It could never fail: every listed spelling is an exact (tier 1) match for its own entry, so it always wins. Working out why showed the real way 3b can break: a spelling that equals *another* entry's de-accented IAST makes two tier-1 hits, which are then sorted by वर्णमाला. Check 4 now rejects that case directly (tested with "kapara" on किताब vs कपड़ा = kapar̤a), and 3b is tested with a planted wrong search result.
- **Known limits, left as they are:** `ladka` shows लड़की as "starts with" because the dataset has no लड़का; plural or inflected forms (`kitaabein`) find nothing. Both are dataset coverage, not engine bugs.
- **Verified:** `npm run check` green, 399 tests: all C5 cases, one chip per tier (Latin and Devanagari), 13 sound-key pairs, वर्णमाला sorting, and every one of the 324 listed spellings returning its own entry first.

## Steps 4–5: Design system, app shell, router and screens

- **Asked:** tokens for both themes with a contrast check, a no-flash theme toggle, self-hosted fonts, an own History API router with every route in C6, the phone and desktop layouts, the error boundary and data-load error (Step 4); then every screen and interaction rule in C7 (Step 5).
- **Produced:** `src/styles/tokens.css` + `scripts/contrast.ts` (`npm run contrast`, now part of `npm run check`, so CI fails if a colour change breaks AA), `src/lib/routes.ts` (routes as data, unit-tested), `src/lib/router.ts`, theme/storage/user-data/hooks modules, and the UI: header, search bar, Search | Saved switch, result rows with chips, entry view, bottom sheet, Home (try-chips, recents, word of the day, वर्णमाला grid), Results with "Did you mean", No results, Saved, Browse letter, 404, data-load error, error boundary, offline banner.
- **Contrast, measured, and what changed in the palette:** every pair in the plan passes AA, *but* the plan's marigold `#C27A12` measures only 3.20:1 on `--bg` and 3.45:1 on `--surface`, so it cannot carry text. It is kept for the saved star (non-text, needs 3:1), and two tokens were added: `--mark-ink` `#8A5208` for chip and highlight text (5.61:1 on the chip background, 6.38:1 on white) and `--mark-soft` for chip backgrounds. The plan's `--line` (1.22:1) is fine for decorative hairlines but not for the search input's border, which needs 3:1, so `--line-strong` was added (3.70:1 light, 3.04:1 dark). Also added `--accent-soft` and `--on-accent`. All 32 pairs are listed by `npm run contrast`.
- **Decisions:**
  - *The bottom sheet is a native `<dialog>` opened with `showModal()`*, not a div with a hand-written focus trap. The browser then makes the page behind it inert, keeps focus inside, and turns Esc into a `cancel` event, which the app routes through the router so the URL and the sheet never disagree.
  - *The list behind an open entry lives in `history.state`*, not in component state. The first version kept it in a React ref; the linter flagged reading refs during render, and moving it into history state also fixed a real gap: after a reload of `/w/gyan`, Back and close now return to the search it was opened from.
  - *Closing a deep-linked entry goes home* instead of `history.back()` leaving the site.
  - *Desktop previews the top result* in the right pane while typing, so the two-pane layout is never empty during a search; Enter or a click opens it properly (URL changes).
  - *Added beyond the plan:* a word of the day (deterministic per date, no server), "Try" chips on Home that show off the spelling tolerance (dharam, शान्ति, peace, vruksh, gyan), a saved-count badge, and "noun · masculine/feminine" in the POS pill instead of "noun (m.)". On the no-results screen, a looser fuzzy pass offers up to three suggestions; it must share the query's first sound, because without that rule `xyzq` suggested शिक्षक (x → ks).
  - *Lint rule `jsx-a11y/prefer-tag-over-role` turned off:* it asks for `<search>` instead of `<form role="search">`. `<search>` only shipped in browsers in late 2023, while `role="search"` is what the plan asks for and works everywhere.
- **Bugs found by checking, then fixed:** meanings were not numbered (a CSS reset removed list markers from every classed list); a focus ring was drawn round the headword when it received focus programmatically; the reserved preview line left a gap above "No results" and above fuzzy-only results.
- **Verified:**
  - Screenshots at 375 px and 1280 px in light and dark: home, results, fuzzy results, no results, entry sheet, letter, 404, desktop results and saved.
  - A Playwright script against the dev server with zero console errors or warnings. Its 23 checks: results on the same keystroke, Enter opens the top result and blurs the input, focus moves into the sheet, Back / swipe / Esc close it, the save star, "Also spelled" chips, a trailing space surviving typing, Esc clearing, recents, saved words surviving a reload, a deep-linked entry closing to home, unknown slugs giving the 404, everything working with `localStorage` throwing, `/` focusing search, desktop Enter and Esc, the theme surviving a reload before paint, `theme-color` following the theme, and no control under 40 px.
  - The first run of that script reported two failures. Both were the script's fault (it checked before the dictionary had loaded, and in one case clicked the theme toggle behind an open modal, which the modal correctly blocked), not the app's.

## Step 6: Motion

- **Asked:** the GSAP animations in the C7 motion table, cleanup so nothing leaks on route changes, none at all under reduced motion, and proof that motion never delays results.
- **Produced:** `src/lib/motion.ts` and its wiring: result rows fade + rise 8 px with a 30 ms stagger (first 10, and only rows that were not already showing, so typing `dhar` → `dharm` does not re-animate the same row), live-preview fade 0.15 s, sheet slide-up (`power3.out`, 0.35 s) with the scrim fading in, save-star pop with a marigold ring (0.3 s). The theme colour transition is CSS (Step 4). GSAP is a separate 27.4 kB (gzip) chunk, fetched only after the dictionary has loaded, so it never competes with first paint. Every tween runs inside a `gsap.context` that is reverted on unmount.
- **What went wrong, found by measuring rather than eyeballing:**
  1. *The first result row stayed invisible.* Sampling each row's opacity frame by frame in Chrome showed row 1 stuck at 0 while the others were at 1. React StrictMode runs effects twice in development; the first `gsap.from()` was reverted mid-flight, and the second recorded opacity 0 as its *end* value. This is exactly the "motion hides results" failure the plan warns about. Every tween is now `fromTo()` with explicit end values, which cannot end hidden.
  2. *A one-frame flash on every search.* GSAP's default lazy rendering held back each tween's start state until its next tick, so rows painted fully visible, vanished, then faded in. Fixed with `lazy: false`.
  3. *A drag could fight the slide-in.* Grabbing the sheet before it settled left GSAP and the swipe both writing the transform. Touching the grip now finishes the slide at once. (The interaction test found this because it measured the grip mid-slide.)
  4. The CSS snap-back transition on the sheet would have smoothed every GSAP frame; it now applies only while the sheet snaps back after a short drag.
- **Verified (headless Chrome, frame-by-frame sampling):**
  - Rows exist in the DOM synchronously after the input event (9 rows for `sh`) whether motion is on or off.
  - With motion, rows start at opacity 0 in the first frame and settle to 1 with inline styles cleared.
  - Under `prefers-reduced-motion: reduce`, no row, sheet or star ever gets an inline animation style.
  - The interaction suite, now 24 checks including "grabbing mid-slide finishes the slide", passes with zero console errors or warnings.
