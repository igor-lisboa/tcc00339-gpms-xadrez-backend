---
name: add-endpoint
description: Add a new HTTP endpoint to the xadrez API following the layers (route, zod schema, controller, use-case, tests, docs). Use when the user asks for a new route or a new action on a game.
---

# Add an endpoint

1. Read `CLAUDE.md` and `docs/guides/adding-an-endpoint.md`.
2. Decide the English route and names using `docs/glossary.md`. Add any new word to the glossary first.
3. Write the zod schema for params, query, headers and body in `src/http/schemas/`.
4. Add a function for the use-case in `src/application/gameQueries.ts` or `gameCommands.ts` (or `offerCommands.ts` / `aiCommands.ts`). Load the game with `loadGame`, call the domain, save with `saveGame`. Expose it on `GameService`.
5. Add the route in the matching file under `src/http/routes/`. It reads the input, calls one `GameService` method, maps the result with a presenter in `src/http/presenters/`, and returns the envelope with `success(...)` from `src/http/envelope.ts`.
7. Tests: unit test for the use-case with in-memory fakes; one supertest case for the route (success, validation error, domain refusal).
8. Update `docs/api/openapi.yaml`, run `npm run docs:openapi`, and update the matching file in `docs/specs/`.
9. Run `npm run typecheck && npm run lint && npm test`. All must pass.
