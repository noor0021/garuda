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
