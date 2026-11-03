---
name: update-docs
description: Bring docs (specs, API, events, architecture, ADRs, README) back in line with a code change. Use after any change to behaviour, routes, events or structure.
---

# Update docs

1. Look at the diff (`git diff`, read-only).
2. For each changed behaviour, update the matching `docs/specs/*.md`: rules, tests list, known deviations.
3. Routes changed: update `docs/api/endpoints.md` and the glossary.
4. Socket events changed: update `docs/events.md`.
5. A structural decision: add an ADR in `docs/decisions/` (next number, short: context, decision, consequences).
6. Names: any new English word goes into `docs/glossary.md`.
7. Keep `CLAUDE.md` current if commands or rules changed.
8. Do not write docs that describe planned behaviour as if it exists. Mark target behaviour as "target".
