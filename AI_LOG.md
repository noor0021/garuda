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
