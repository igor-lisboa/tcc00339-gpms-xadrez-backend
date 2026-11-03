# Testing

## Commands
| Task | Command |
|---|---|
| All tests | `npm test` |
| Watch mode | `npm run test:watch` |
| One file | `npx vitest run tests/unit/domain/rules.test.ts` |
| Types | `npm run typecheck` |
| Lint | `npm run lint` |
| Portuguese identifiers in migrated code | `npm run check:names` |

CI (`.github/workflows/ci.yml`) runs typecheck, lint, names check and tests on every pull request.

## Two layers
- **Unit tests** (`tests/unit/`). They test the domain directly, with no server and no sockets. Use the helpers in `tests/unit/domain/helpers.ts`:
  - `gameWith(placements)` builds a game with the pieces you name, both sides seated by humans, White to move.
  - `play(game, [[sideId, from, to], ...])` plays moves.
  - `movesFrom(game, sideId, square)` lists the moves a piece can make.

  Placements look like `{ E1: "Rei-0", H1: "Torre-0" }`: the square, then the piece name and the side id.
- **Characterization tests** (`tests/characterization/`). They start the real server with `startServer` from `helpers/server.ts`, call it over HTTP with `createApiClient` from `helpers/api.ts`, and check socket events. The helpers in `helpers/game.ts` create games, seat players, make moves and build boards (`boardWith`).

Each characterization file boots its own server, so `vitest.config.ts` runs the files one at a time (`fileParallelism: false`).

## Conventions
- Test names read as Given/When/Then, and they match the rules in `docs/specs/`.
- Every change ships with tests. A rule is tested on the domain first; the API behaviour is tested in the characterization suite.
- A known bug is an `it.todo`, not a failing test. When it is fixed, the todo becomes a real test.
- Never weaken a test to make it pass.

## Coverage
There is no coverage gate yet. The plan asks for one (see `docs/refactor-plan.md`); it needs a coverage package that the project does not have yet.
