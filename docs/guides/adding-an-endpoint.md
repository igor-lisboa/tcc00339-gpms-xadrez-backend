# Adding an endpoint

Use this when a client needs a new route or a new action on a game. The `add-endpoint` skill in `.claude/skills/` follows the same steps.

## Steps
1. **Rule first.** If the endpoint changes the game, the rule lives in `src/domain/` (see [adding-a-rule.md](adding-a-rule.md)). The domain has no I/O.
2. **Use-case.** Add a function to the file that matches the kind of work:
   - reads: `src/application/gameQueries.ts`
   - changes to a game: `src/application/gameCommands.ts`
   - offers (draw, reset): `src/application/offerCommands.ts`
   - AI: `src/application/aiCommands.ts`

   Load the game with `loadGame` and save it with `saveGame` from `src/application/persistence.ts`. Then expose the function as a method on `GameService` (`src/application/GameService.ts`), the entry point for HTTP.
3. **Route.** Add the route in the matching file under `src/http/routes/` (`gameRoutes.ts`, `aiRoutes.ts`, `catalogRoutes.ts`). Read the side from the `lado` header with `sideIdFromHeader`, and answer with `success(message, data)` from `src/http/envelope.ts`.
   - Route order matters. Declare `/jogos/ia...` before `/jogos/:jogoId`.
4. **Presenter.** If the JSON shape is new, add a function to `src/http/presenters/`. Presenters are the only place (together with the routes) that may use the Portuguese wire names.
5. **Tests.** Add a characterization test under `tests/characterization/` that starts the real server with `startServer` and calls it with `createApiClient`. See [testing.md](testing.md).
6. **Docs.** Update `docs/api/openapi.yaml` and run `npm run docs:openapi`; update the matching spec in `docs/specs/`, and the spec's "Changed in the TypeScript port" section if the behaviour differs from before.
7. **Checks.** Run `npm run typecheck`, `npm run lint`, `npm run check:names` and `npm test`.

## Wire names
The route paths, JSON field names and the `lado` header keep their Portuguese names (see [decisions/0005-keep-wire-format.md](../decisions/0005-keep-wire-format.md)). Code outside the presenters and routes uses English names. A line that must keep a legacy name ends with `// names-check:ignore (reason)`.

## Errors
Throw `DomainError` for a refused rule; its message is shown to the client. Status is 500 for every refused rule today (see [specs/error-handling.md](../specs/error-handling.md)). Do not catch errors silently.
