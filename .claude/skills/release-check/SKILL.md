---
name: release-check
description: Run the full pre-release checklist for the xadrez API (build, lint, tests with coverage, spec traceability, API replay, Procfile). Use before asking for a merge into main.
---

# Release check

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm test` (must pass; known deviations stay as `it.todo`)
5. Coverage gate: 100% of `src/domain`, 90% overall.
6. Spec traceability: every test name in `docs/specs/*.md` exists in `tests/`.
7. Start the server and replay the Postman collection (`Xadrez.postman_collection.json`); report any status or envelope change.
8. `Procfile` still starts `web` and `worker` with the right entry points.
9. Report the results. Do not commit, push or open a PR unless the user asks.
