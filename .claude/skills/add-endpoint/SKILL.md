---
name: add-endpoint
description: Add a new HTTP endpoint to the xadrez API following the layers (route, zod schema, controller, use-case, tests, docs). Use when the user asks for a new route or a new action on a game.
---

# Add an endpoint

1. Read `CLAUDE.md` and `docs/guides/adding-an-endpoint.md`.
2. Decide the English route and names using `docs/glossary.md`. Add any new word to the glossary first.
3. Write the zod schema for params, query, headers and body in `src/http/schemas/`.
4. Write the use-case in `src/application/<UseCase>.ts` (one class or function per file). Inject ports; do not import Express.
5. Write the thin controller in `src/http/controllers/`. It parses input with the schema, calls the use-case, and returns the envelope `{ message, data, success }`.
6. Mount the route in its resource router under `src/http/routes/`.
7. Tests: unit test for the use-case with in-memory fakes; one supertest case for the route (success, validation error, domain refusal).
8. Update `docs/api/endpoints.md` and the matching file in `docs/specs/`.
9. Run `npm run typecheck && npm run lint && npm test`. All must pass.
