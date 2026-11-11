# AI log · Garuda Shabd

How AI was used to build Garuda Shabd, what it got wrong, and how the work was checked. The record written as each step finished, and the full table of 23 corrections, are in [docs/ai-log-steps.md](docs/ai-log-steps.md).

## 1. Tools used, and for which part of the work

| Tool | Part of the work |
|---|---|
| Claude (chat) | Planning before any code: scope, the design spec and the step plan, saved as [`PLAN.md`](PLAN.md). |
| Claude Code (models: Claude Opus 5.5 and Claude Fable 5.2) | The code, the 119 new dictionary entries, the tests and the docs, one step of the plan at a time. Each commit's `Co-Authored-By` line names the model that wrote it. |
| Sanscript, Fuse.js, GSAP | Libraries: Devanagari → IAST (in the validator only), fuzzy matching, animation. |
| Vitest, oxlint, `tsc`, GitHub Actions | Tests, lint and strict type checks before every commit and on every push. |
| Playwright driving local Chrome, Lighthouse 12.6.1, `curl` | Checking the AI's work in a real browser: interactions, offline, frame timings, screenshots, audits and the Wiktionary API. Also used to render the icons and the share image. |

## 2. Key prompts

Summarised, in order. Words in quotes are the prompt as typed.

1. **Rules first.** Read `PLAN.md` and save the project rules in `CLAUDE.md`: build from scratch, strict TypeScript, run the checks before every commit, log every step, never state a number that was not measured, ask when the plan is unclear.
2. **"Read the plan, start executing step by step, commit and push as you finish each step."** Steps 1–9: scaffold, dataset and validator, search engine, design system, screens, motion, production hardening, Wiktionary, docs.
3. **The judging criteria, pasted in** (quality; thinking and method, with AI output checked and improved; specificity to Garuda). This is why the work measures instead of assuming and logs what went wrong.
4. **"A settings button with all the settings, a landing page with GSAP animation that redirects to home, and make the UI organised and clean."**
5. **The letterpress pass** (10:50 PM, 25 minutes, a cut-off per item): AI-built submissions converge on one look, so rebuild the identity on Devanagari's own structure: vermilion on white, the shirorekha as the layout's rule, a guided tour ported from my MediCord project, an akshara breakdown, a preview morph. "If an item isn't done and passing by its cut-off, discard it."
6. **A new mark** on the shirorekha: original geometry, SVG paths only, two variants rendered at 16, 32 and 192 px before choosing.
7. **After using the result:** I could not see the intro or find the tour; "make sure the spacing is proper", "I don't want buffers", "make sure the speaker works". Each was answered by a test in a real browser, and two of them found real faults (rows 10 and 11 below).

## 3. What was rejected or corrected in the AI's output, and why

| # | What the AI first produced | What was wrong, and how it was caught | What was done |
|---|---|---|---|
| 1 | Sanscript's IAST, used as is | Tested before use: ढ़ came out as raw Devanagari and chandrabindu as `~` | A `toIast()` helper adds the missing rules and reproduces all 10 of Garuda's starter transliterations |
| 2 | Entries whose Roman spelling is an English word (मन *man*, दिन *din*) | A reader typing *man* wants "man" | Dropped; the validator now rejects such spellings |
| 3 | "Did you mean" suggestions | `xyzq` suggested शिक्षक | A suggestion must share the first sound and score close to the best match |
| 4 | GSAP `from()` animations | Sampling frames showed the top result stuck invisible | `fromTo()` with explicit end values; sampled again |
| 5 | The first production build | Lighthouse mobile Performance was 79 | Prerendered shell, inlined CSS, bundle after first paint: 95–96 |
| 6 | Two numbers in this log (fonts "343 kB", "324 spellings") | Neither had been measured, against the project rule | Measured (382 kB, 322) and corrected where they appear |
| 7 | "A landing page that redirects to home", built literally | A splash on every open slows a tool people use many times a day | An intro overlay: once per visit, never on a shared word link, skippable, can be switched off |
| 8 | The whole first design (warm paper, serif, teal, pills, soft shadows) | I recognised it as the look AI gives every submission | Redesigned around Devanagari. Of two logo variants, the one that read as a Latin "T" was rejected |
| 9 | The guided tour | The check failed on 5 lint errors; then the browser run passed at 375 px but failed at 1280 px, where Esc left the demo search on screen | Both fixed and the run repeated before the commit |
| 10 | The new mark inside the intro | I reported not seeing the intro. Replaying a first visit showed it plays, but the wing was drawn above the bar; nobody had looked at the intro after the logo changed | Animation origin fixed; captured again and checked by eye |
| 11 | The Listen button | It cancelled and spoke in the same instant, which browsers can answer by dropping the word | Rewritten; in Chrome one tap gives `start` then `end`, and three fast taps speak the last word in full |
| 12 | Scope: the akshara breakdown and the preview morph | Not started when their cut-offs passed | Left out, not shipped unchecked; listed in the README under "What I'd build next" |

## 4. How facts, sources and code were checked

- **Sources.** The 10 starter entries are Garuda's, kept verbatim. The 119 new entries were drafted by Claude under the project rule of copying nothing from any other source. Wiktionary senses are fetched live and shown in a separate, labelled section with a link (CC BY-SA); they are never stored in the dataset. The API's response shape and CORS headers were checked with `curl` before building on them.
- **Data.** A validator checks every entry (IAST, uniqueness, spelling rules, examples, part of speech, and "each spelling finds its own word first") on every commit. 14 mutation tests plant one mistake each and confirm the validator names it. My own spot-check of 15 entries is in the notes below.
- **Code.** 443 unit tests, strict TypeScript, lint and CI on every push. Nothing was committed with a failing check.
- **In a real browser.** Playwright against the production build at 375 px and 1280 px in both themes: interactions, offline, a true first visit (intro, then tour), screenshots reviewed by eye, frame timings (typing `dharam`: no frame over 9 ms), and the Listen button's speech events. A contrast script checks every text pair for WCAG AA.
- **Numbers.** Every number in the README was measured locally, and the Lighthouse runs are labelled as local.
- **Not checked by the AI.** A real phone; Hindi voices on Android and iOS; and whether the new mark resembles Garuda Prakashan's logo. The mark is two SVG paths typed by hand and no logo was opened while making it, but no similarity search was run.

## Noor's own notes

- TODO (Noor): spot-check of 15 entries (ids 31, 32, 33, 50, 51, 57, 63, 77, 81, 93, 118, 121, 123, 125, 129): what you checked, what you changed and why.
- TODO (Noor): testing on your own phone: what felt off and what was changed.
- TODO (Noor): your review of the letterpress pass, the tour and the new mark on the live site.
- TODO (Noor): any AI output you rejected or rewrote yourself, and how you decided.
- TODO (Noor, optional): share link to the planning chat with Claude.
