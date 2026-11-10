---
name: release-check
description: Run the pre-release checklist for the xadrez API (install, typecheck, lint, names, agent copies, tests with coverage, spec traceability, OpenAPI, Procfile). Use before asking for a merge into main.
---

# Release check

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run check:names`
5. `npm run check:agents` (the per-tool copies of the skills and agents are up to date with `.agents/`)
6. `npm run test:coverage`. It must pass: known deviations stay as `it.todo`. The coverage gate counts `src/domain` only (thresholds in `vitest.config.ts`).
7. Spec traceability: the test names listed in `docs/specs/*.md` exist in `tests/`.
8. OpenAPI: `npm run docs:openapi` leaves `src/http/docs/openapi.json` unchanged (`git diff` shows no change to it after the run).
9. `Procfile` still reads `web: npm start`. The AI runs in the API process (`AI_ENABLED`), so there is no worker process.
10. Report the results. Newman is not installed, so the Postman collection (`Xadrez.postman_collection.json`) is not replayed here; say so in the report. Do not commit, push or open a PR unless the user asks.
