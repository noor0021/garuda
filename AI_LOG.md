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

## How data, facts and code were checked

- **Dataset:** the validator (IAST, uniqueness, spelling rules, examples, part of speech, and "each spelling finds its own word first") runs in every check and CI run. 14 mutation tests plant one mistake each and confirm the validator names it. Claude re-read every new entry for gender and verb agreement before generating the file.
- **Noor's manual spot-check** of 15 random entries (ids 31, 32, 33, 50, 51, 57, 63, 77, 81, 93, 118, 121, 123, 125, 129): see the TODO below.
- **Code:** 431 Vitest tests (every search case from the plan, one chip per tier, routes, Wiktionary with a mocked `fetch`, the CSP hash), strict TypeScript, oxlint, and CI on every push.
- **In a real browser:** 24 Playwright interaction checks, offline and first-visit tests, motion sampled frame by frame, all with zero console errors; screenshots at 375/390 px and 1280 px in both themes, reviewed by eye.
- **Facts:** the Wiktionary API's shape and CORS were checked with `curl` before building on them; every number in the README was measured (search time, sizes, Lighthouse), and the Lighthouse runs are labelled as local.
- **Phone testing on a real device:** see the TODO below.

## Noor's own notes (to be written by Noor, in his own words)

- TODO (Noor): spot-check of the 15 entries above: what you checked, what you changed and why.
- TODO (Noor): testing on your own phone (search in Hindi, Roman and English, saving, dark mode, offline, install): what felt off and what was changed.
- TODO (Noor): any AI output you rejected or rewrote yourself, and how you decided.
