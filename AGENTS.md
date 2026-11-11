# CLAUDE.md — xadrez-backend

Backend of a chess game: Express REST API + socket.io real-time events + an AI player that runs inside the API process.
The code is TypeScript (strict). The refactor plan and its status are in `docs/refactor-plan.md`.

## Commands

| Task | Command |
|---|---|
| Run the API | `npm start` (`node --import tsx src/main.ts`) |
| Run the API in watch mode | `npm run dev` |
| Tests | `npm test` (Vitest) |
| Tests in watch mode | `npm run test:watch` |
| Single test file | `npx vitest run tests/unit/domain/rules.test.ts` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Names check (no Portuguese identifiers in migrated code) | `npm run check:names` |
| Regenerate the API description (after editing docs/api/openapi.yaml) | `npm run docs:openapi` |
| Format | `npm run format` |

Copy `.env.example` to `.env` before running. Node 22 or newer. Settings are read and validated once in `src/config/env.ts`; a bad value stops the app at startup. Logs go through `src/shared/logger.ts` (pino, JSON lines, level from `LOG_LEVEL`).

## Layout

```
src/
  main.ts                  composition root: builds the parts and starts the server
  config/env.ts            validated environment (zod)
  shared/                  constants (ids of sides, player types, endings), errors, logger, server error handler
  domain/                  chess rules and game state. No I/O, no Express, no socket.io.
    board/                 Board (grid, repetitions, 50-move counter), SquareLookup, start position
    pieces/                piece types and their movement data
    moves/                 candidate moves, raw moves, possible moves, executing a move, legality (king safety)
    rules/                 material rules
    game/                  Game (state and checks) and one file per action: playMove, promotePawn,
                           drawOffers, resetOffers, Side, Turn, RequestedAction
    ai/                    AI move choice (pure filters and a random pick)
  application/             use-cases: queries, commands, offers, AI; GameService is the entry point for HTTP
    ports/                 GameRepository and EventPublisher interfaces
  infrastructure/          in-memory repository, socket.io hub, catalogue loaded from database.json
  http/                    Express app, routes (one file per area), presenters (the API's JSON shapes), error mapping
  ai/inProcessAi.ts        the AI player, running inside the API process (switch: AI_ENABLED)
database.json              static lookup data only (sides, piece types, endings, squares)
tests/unit/                unit tests for domain and shared code
tests/characterization/    black-box tests of the API and socket events (start the real server)
docs/                      architecture, specs of implemented behaviour, API, events, decisions
```

## Rules for working in this repo

**Dependencies point inward.** `domain` imports nothing from `application`, `infrastructure` or `http` (it may use `shared/constants` and `shared/errors`-free types). `application` imports `domain` and its own ports. `infrastructure` and `http` implement or call `application`. Only `main.ts` creates the parts.

**Wire format.** The API keeps its current route paths, JSON field names, socket event names, the `lado` header and the Portuguese messages. The domain uses English names; the presenters in `src/http/presenters/` and the route files map to the wire names. Those folders are the only places allowed to use the Portuguese wire names; `npm run check:names` enforces it.

**Language.** Identifiers, comments and new code use English. Portuguese stays in string literals that are part of the API contract, and in lookup data until it is renamed. A line that must keep a legacy name ends with `// names-check:ignore (reason)`.

**Size and style.** One responsibility per file. Keep files under 150 lines. Prefer small functions and plain objects. No `global`, no module-level mutable state outside `main.ts`. Use `===`. Errors the rules raise are `DomainError` (its message is shown to the client); unexpected errors are not caught silently.

**Changing behaviour.** A behaviour change is made in its own step: update the test, update the spec in `docs/specs/`, and note it in the spec's "Known deviations" or "Changed in the TypeScript port" section. Known bugs stay as `it.todo` until they are fixed; then the todo becomes a real test.

**Tests.** Every change ships with tests. Rules are tested on the domain directly (board builder in `tests/characterization/helpers/game.ts`). Do not weaken a test to make it pass.

**Git.** Only the user commits or pushes. Read-only git commands are fine.

## Gotchas

- Game state lives in memory. A restart or a Heroku dyno recycle loses all games.
- A game id is its index in the repository.
- The `lado` header arrives as a string and is converted to a number at the HTTP edge; a missing header becomes `NaN`, which matches no side.
- A GET can end a game when its clock runs out; `loadGame` saves that change.
- Types 0 and 1 are used for a checkmate and for a win on time; `motivoFinalizacao` on the game tells them apart.
- The socket identifiers `"<gameId>-<sideId>"` and `"I.A."` are the contract with the frontend; the AI player answers to `"I.A."` inside the API process.

## Pointers

- Architecture and flows: `docs/architecture.md`
- Naming map: `docs/glossary.md`
- What the system does today: `docs/specs/`
- Decisions: `docs/decisions/`

## Skills and agents for each tool

Skills and subagents are written once, in `.agents/`:

- `.agents/skills/<name>/SKILL.md`: skills. Codex reads them from here. Claude Code reads the copies in `.claude/skills/`, and GitHub Copilot reads the copies in `.github/skills/`.
- `.agents/agents/<name>.md`: subagents, with tools named `read`, `search`, `edit` and `execute`. The copies are `.claude/agents/<name>.md` (Claude Code), `.github/agents/<name>.agent.md` (GitHub Copilot) and `.codex/agents/<name>.toml` (Codex).
- Do not edit the copies. After a change in `.agents/`, run `npm run sync:agents`. `npm run check:agents` fails when a copy is out of date, and CI runs it.
- `CLAUDE.md` imports this file for Claude Code. `.github/copilot-instructions.md` points here for GitHub Copilot.
- `.claude/settings.json` holds Claude Code permissions only. It is not generated.
