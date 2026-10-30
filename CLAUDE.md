# CLAUDE.md — xadrez-backend

Backend of a chess game: Express REST API + socket.io real-time events + an AI worker (`ia.js`).
Currently JavaScript (CommonJS). The refactor to TypeScript is in progress; see `docs/refactor-plan.md`.

## Commands

| Task | Command |
|---|---|
| Run in dev | `npm run dev` (nodemon) |
| Run in production mode | `npm start` |
| Run the AI worker | `npm run ia` (needs the server running; `APP_URL` in `.env`) |
| Tests | `npm test` (Vitest) |
| Tests in watch mode | `npm run test:watch` |
| Single test file | `npx vitest run tests/characterization/ai-endpoints.test.ts` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Names check (no Portuguese in migrated code) | `npm run check:names` |
| Format | `npm run format` |

Copy `.env.example` to `.env` before running. Node 22 or newer. Settings are read and validated once in `src/config/env.ts`; a bad value stops the app at startup. Logs go through `src/shared/logger.ts` (pino, JSON lines, level from `LOG_LEVEL`).

## Layout (current)

- `index.js` — web process: Express + socket.io bootstrap, socket event routing.
- `ia.js` — AI worker process, talks to the API over HTTP and socket.io.
- `src/routes.js` — all HTTP routes. `src/controllers/` thin handlers; `src/services/` orchestration.
- `src/models/` — domain: `Jogo` (game), `Tabuleiro` (board), pieces, value objects.
- `src/database.json` — lookup tables plus the in-memory game list (`jogos`), mutated at runtime.
- `tests/characterization/` — black-box tests that pin the current HTTP and socket behaviour.
- `docs/` — architecture, specs of implemented behaviour, guides, decisions.

## Rules for working in this repo

**Language.** All identifiers, file names, comments, log and error messages use English in new and migrated code. Portuguese is only allowed in data that the API must keep until the frontend migrates (see the legacy adapter in `docs/decisions/0004-legacy-adapter.md`). The pt-br → English map is in `docs/glossary.md`.

**Architecture (target).** Dependencies point inward: `http` and `infrastructure` depend on `application`, which depends on `domain`. The `domain` folder has no I/O, no Express, no socket.io, and no reads of `database.json`. Use-cases live one per file in `application/`. Controllers stay thin: parse input, call one use-case, return the envelope.

**Size and style.** One responsibility per file. Aim for under 100 lines; treat 150 as the hard limit. Prefer simple functions and plain objects over clever abstractions. Constructor injection, no DI framework. No `global`, no module-level mutable state outside the composition root.

**TypeScript.** `strict` on. No `any` in production code. Use `===`. Throw `AppError` subclasses, never strings. Do not swallow exceptions; if a catch is needed, it must rethrow or turn the error into a typed result.

**Tests.** Every behaviour change ships with a test. Domain rules are tested as pure functions with the board builder helper, not through HTTP. Do not weaken or delete a test to make it pass. Characterization tests describe what the code does today; when a known bug is fixed, update its spec and turn its `it.todo` into a real test.

**Docs.** A change to behaviour updates the matching file in `docs/specs/` and, if the API changes, `docs/api/`. Architecture decisions go to `docs/decisions/` as a short ADR.

**Git.** Work on a branch from `develop`. Small PRs. Commit messages in English. Do not commit or push unless the user asks.

## Gotchas

- Game state lives in memory. A restart or a Heroku dyno recycle loses all games.
- A game id is its index in `db.jogos`.
- `lado` (side) arrives as a string header; the code mostly compares loosely. The refactor normalises this to a numeric `LadoId`.
- GET `/jogos/:id` can change state: it may finish a game when time runs out. Keep this in mind when reading code.
- Socket events are the contract with the frontend and with `ia.js`. Do not rename them without the adapter.
- `index.js` cannot be imported in tests without starting the server; the characterization helpers spawn it as a child process.

## Pointers

- Architecture and flows: `docs/architecture.md`
- Naming map: `docs/glossary.md`
- What the system does today: `docs/specs/`
- Known deviations: listed at the bottom of each spec file
