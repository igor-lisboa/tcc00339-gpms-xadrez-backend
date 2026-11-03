---
name: translate-to-english
description: Rename a Portuguese identifier, file, route, field, comment or message to English in a file, using docs/glossary.md. Use during the migration, one module at a time.
---

# Translate to English

1. Open `docs/glossary.md`. If a word is missing, add it first (pt-br, English, note).
2. Rename the file and its folder if it is in Portuguese. Update imports in the same step.
3. Rename identifiers (variables, functions, classes, fields) and translate comments and messages.
4. Routes and JSON fields: rename in the new layer only. The legacy adapter maps the old names back.
5. Do not change the behaviour in the same commit as a rename. If a bug is found, record it and fix it separately.
6. Run `npm run typecheck && npm run lint && npm test`.
7. Grep the touched files for common pt-br words from the glossary; zero hits expected outside `src/http/legacy/`.
