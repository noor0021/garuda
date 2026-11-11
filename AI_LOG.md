# AI log · Garuda Shabd

How AI was used to build Garuda Shabd, what it got wrong, and how the work was checked. The full step-by-step record, written as each step finished, is in [docs/ai-log-steps.md](docs/ai-log-steps.md).

## Tools and what each was used for

| Tool | Used for |
|---|---|
| Claude (chat) | Planning before any code: scope, the design spec and the step plan, saved as [`PLAN.md`](PLAN.md). |
| Claude Code (Anthropic) | Writing the code, dataset, tests and docs step by step from `PLAN.md`, committing after each step. The session ran Claude Fable 5.2 at the start and Claude Opus 5.5 later; each commit's `Co-Authored-By` line names the model. |
| Sanscript, Fuse.js, GSAP | Libraries: Devanagari → IAST (validator only), fuzzy matching, animation. |
| Vitest, oxlint, `tsc` | Tests, lint and strict type checks, in `npm run check` and CI. |
| Playwright driving local Chrome | Interaction checks, offline tests, frame-by-frame motion sampling, screenshots, and rendering the icons and OG image. Run locally; not a project dependency. |
| Lighthouse 12.6.1, `curl`, GitHub CLI | Performance/accessibility audits, checking the Wiktionary API and its CORS headers, watching CI. |

## Key prompts (summarised)

1. **Step 0:** read `PLAN.md` and save the project rules in `CLAUDE.md` (build from scratch, strict TypeScript, check before every commit, log every step, never state an unmeasured number, ask when the plan is unclear).
2. **"Read the plan, start executing step by step, commit and push as you finish each step."** Later: **"You may make multiple commits with comments"**, so each step became several small, separately verified commits.
3. Noor pasted the judging criteria (quality of output; thinking and method, with AI output *checked and improved*; specificity to Garuda). That shaped the work: measure rather than assume, log what went wrong, and make the product Garuda's (its readers' typing habits, its vocabulary, an editor workflow).
4. Steps 1–9 of `PLAN.md`: scaffold, dataset + validator, search engine, design system, screens, motion, production hardening, Wiktionary, docs.
5. **Added after Step 9:** "a settings button with all the settings, a landing page with GSAP animation that redirects to home, and make the UI organised and clean." Built as a Settings panel, a once-per-visit intro, and a cleanup pass ([Step 10](docs/ai-log-steps.md#step-10-added-by-noor-after-step-9-settings-an-opening-intro-and-a-cleanup-pass-started-835-pm)).
6. **Letterpress pass (10:50 PM, 25-minute timebox):** Noor pointed out that AI-built submissions converge on one look (warm paper, serif, teal, pills, soft shadows) and asked for an identity built on Devanagari's own structure: a vermilion-on-white palette, the shirorekha as the layout's rule, a guided tour ported from his own MediCord project, an akshara breakdown and a preview morph, each with a cut-off time and the rule "if it is not passing by its cut-off, discard it". Shipped: the palette and shirorekha, the tour. Cut at their cut-offs: akshara breakdown, preview morph ([Step 11](docs/ai-log-steps.md)).
7. **Logo redesign (10-minute timebox):** a new mark built on the shirorekha, original geometry, SVG paths only, two variants rendered at 16, 32 and 192 px before choosing ([Step 12](docs/ai-log-steps.md)).

## What was rejected or corrected, and why

| # | What the AI first produced or assumed | What was wrong | What was done |
|---|---|---|---|
| 1 | Sanscript's IAST, used as is | Tested first: ढ़ came out as raw Devanagari inside the Latin, and chandrabindu as `~` | `toIast()` adds the nukta, chandrabindu and anusvara rules; it reproduces all 10 of Garuda's starter transliterations |
| 2 | The plan's marigold `#C27A12` for chip text | 3.2:1 on the background, below AA | Kept for the star (non-text); `--mark-ink` for text (5.6:1). All 32 pairs are checked by `npm run contrast` in CI |
| 3 | Words whose natural spelling is an English word (मन *man*, दिन *din*, रात *rat*) | Breaks the plan's rule; English readers typing *man* want "man" | Dropped; the validator now rejects such spellings |
| 4 | A mutation test for validator check 3b | It could never fail: listed spellings always match exactly | Found the real failure mode (a spelling equal to another word's IAST); check 4 now rejects it |
| 5 | "Did you mean" suggestions | `xyzq` suggested शिक्षक (the `x→ks` rule) | Suggestions must share the first sound and be close to the best score |
| 6 | The list behind an open word kept in a React ref | Lint flagged it; reloading `/w/gyan` also lost the way back | Moved into `history.state`; Back, close and reload now agree |
| 7 | GSAP `from()` animations | Frame sampling showed the **top result stuck invisible**, and a one-frame flash on every search | `fromTo()` with explicit end values and `lazy: false`; re-sampled |
| 8 | The sheet's swipe and slide-in | Grabbing it mid-slide made the two fight over the transform | Grabbing now finishes the slide |
| 9 | Numbered meanings | Not numbered, twice: a CSS reset won on specificity, then won again over the first fix | `ol.entry-meanings`; checked with computed styles |
| 10 | First production build | Lighthouse mobile Performance **79** (FCP 3.8 s) | Prerendered shell, hydration, inlined CSS, one font weight fewer, bundle after first paint: **95–96**. One change made it worse (87) and was diagnosed, not reverted blindly |
| 11 | Plan: `autoUpdate` *and* a Refresh toast | They contradict: autoUpdate reloads by itself | Prompt mode, so the toast works as specified |
| 12 | Offline support | Airplane mode straight after a first visit failed until a reload | `clientsClaim`; re-tested |
| 13 | Two numbers in this log (fonts "343 kB", "324 spellings") | Not measured, against the project rule | Measured (382 kB, 322) and corrected, with the correction noted where they appear |
| 14 | Plan: prefix search needs ≥ 2 characters, but `श` must return prefix results | Conflict inside the plan | One Devanagari letter is a full akshara, so the minimum applies to Latin only; both tests pass |
| 15 | "A landing page that redirects to home", read literally | A splash route on every open slows a tool used many times a day, and Back would land on it | An intro overlay: once per visit, never on shared links, skippable, can be switched off; its शब्द is prerendered so Lighthouse stays at 95–96 |
| 16 | The intro's first browser test | It never started: the browser blocked the changed inline script under a stale CSP hash (the local server had read the old `vercel.json`) | Restarted with the current config; the deploy-config test keeps the real hash in sync |
| 17 | The first palette-and-rule pass | Screenshots at 375 and 1280 px still showed rounded corners on the tabs, rows, letters and settings choices | Corners squared in a follow-up before the commit |
| 18 | The tour as first written | `npm run check` failed with 5 lint errors: a ref written during render, state set synchronously inside effects, and click/key handlers on the `<dialog>` itself | The ref is updated in a layout effect, the reset moved into the close handler, and tap-to-advance moved to an inner layer; 443 tests pass |
| 19 | The tour's Esc key on desktop | The browser run passed at 375 px and failed at 1280 px: Esc on the entry step left `dharam` in the search box, because the app's own "Esc closes the entry" handler also ran and its Back landed after the tour's reset | The app's handler stands down while the tour is open; the 1280 px run was repeated and passes |
| 20 | The plan for this pass (four items in 25 minutes) | The work was split across two Claude Code sessions and one browser run hung for about three minutes with no output | Akshara breakdown and preview morph were cut at their cut-offs, as the brief required, and listed in the README's "What I'd build next" |
| 21 | The logo, two variants | B (bar plus a straight stroke) reads as a Latin "T" at every size | A (bar plus a stroke that sweeps into a wing-tip) was chosen: at 16 px it still reads as a letterform hanging from a headline |

## How data, facts and code were checked

- **Dataset:** the validator (IAST, uniqueness, spelling rules, examples, part of speech, and "each spelling finds its own word first") runs in every check and CI run. 14 mutation tests plant one mistake each and confirm the validator names it. Claude re-read every new entry for gender and verb agreement before generating the file.
- **Noor's manual spot-check** of 15 random entries (ids 31, 32, 33, 50, 51, 57, 63, 77, 81, 93, 118, 121, 123, 125, 129): see the TODO below.
- **Code:** 443 Vitest tests (every search case from the plan, one chip per tier, routes, Wiktionary with a mocked `fetch`, the CSP hash), strict TypeScript, oxlint, and CI on every push.
- **In a real browser:** 24 Playwright interaction checks, 16 intro and settings checks, offline and first-visit tests, motion sampled frame by frame, all with zero console errors; screenshots at 375/390 px and 1280 px in both themes, reviewed by eye.
- **Facts:** the Wiktionary API's shape and CORS were checked with `curl` before building on them; every number in the README was measured (search time, sizes, Lighthouse), and the Lighthouse runs are labelled as local.
- **Letterpress pass:** the contrast script passes every pair in both themes (for example vermilion on white 6.90:1, dark body text 17.10:1, the lowest text pair 5.66:1). The tour was driven in Chrome against the production build at 375 px and 1280 px: every step's card and HUD on screen and not overlapping, the tour on top of the entry sheet, no auto-start once seen, none on `/w/dharm`, and Esc restoring the home page with focus in the search box.
- **The mark** is two SVG paths typed by hand from the brief's geometry (a rectangle and one curve). No image of Garuda Prakashan's logo or of any other brand was opened or traced while making it. That is a statement about how it was made, not a similarity search: Noor should compare it with Garuda Prakashan's real logo by eye.
- **Phone testing on a real device:** see the TODO below.

## Noor's own notes (to be written by Noor, in his own words)

- TODO (Noor): spot-check of the 15 entries above: what you checked, what you changed and why.
- TODO (Noor): testing on your own phone (search in Hindi, Roman and English, saving, dark mode, offline, install): what felt off and what was changed.
- TODO (Noor): your own review of the letterpress pass, the tour and the new mark (what you checked on the live site, what you would change).
- TODO (Noor): any AI output you rejected or rewrote yourself, and how you decided.
