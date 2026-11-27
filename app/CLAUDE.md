@AGENTS.md

## Guardrails

- Before saying done, run `npm run check` (lint, typecheck and build) in `app/` and show the output.
- After every edit to a `.ts`, `.tsx`, `.js` or `.mjs` file in `app/`, a hook runs `npm run lint`; fix what it reports before moving on.
- Never read `.env` files and never run `rm -rf`: both are blocked in `.claude/settings.json`. Never commit `.env*`.
