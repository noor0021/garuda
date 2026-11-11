# Project rules for Claude Code

`PLAN.md` is the spec for this project. Read it before working.

- Build from scratch to PLAN.md. Do not copy code, data or text from any other repository.
- TypeScript strict. No `any` without a comment explaining why.
- Before every commit, run `npm run check` and `npm run build`. Never commit with failures.
- Commit at the end of each step with a clear conventional message (feat:, fix:, test:, docs:, chore:).
  Git author: Noor <noor0021@users.noreply.github.com>.
- After each step, append to AI_LOG.md: what you were asked, what you produced, what you got wrong or changed and why, and how it was verified. Keep it factual and specific.
- Never state a number (bundle size, speed, Lighthouse score) in docs unless you measured it.
- If a requirement in PLAN.md is unclear or impossible, stop and ask me rather than guessing.
