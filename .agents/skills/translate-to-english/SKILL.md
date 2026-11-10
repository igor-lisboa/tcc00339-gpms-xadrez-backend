---
name: translate-to-english
description: Rename a remaining Portuguese identifier, file, comment or message to English, using docs/glossary.md. The port to English is done; use this for the names still in Portuguese (for example the lookup data, which is renamed separately).
---

# Translate to English

1. Open `docs/glossary.md`. If a word is missing, add it first (pt-br, English, note).
2. Check first whether the name is part of the API contract. Route paths, JSON field names, socket event names, the `lado` header and the Portuguese messages are the wire format (AGENTS.md). They change only in a behaviour change with its own tests and spec, not in a rename.
3. Rename the file and its folder if it is in Portuguese and is not wire format. Update imports in the same step.
4. Rename identifiers (variables, functions, classes, fields) and translate comments. Wire names are allowed only in `src/http/presenters/` and the route files.
5. Do not change the behaviour in the same change as a rename. If a bug is found, record it and fix it separately.
6. Run `npm run typecheck && npm run lint && npm run check:names && npm test`.
7. `npm run check:names` must pass. A line that must keep a Portuguese name ends with `// names-check:ignore (reason)`.
