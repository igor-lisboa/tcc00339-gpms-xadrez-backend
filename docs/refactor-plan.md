# Refactor plan: xadrez-backend → TypeScript, SOLID, small files, fully tested

## Context
~3,300 lines of CommonJS JS, zero tests, no lint/CI. State lives in memory (`database.json`, `db.jogos`). Main problems found in the scan:
- `src/models/Jogo.js` (1177 lines) is a god class: state, persistence, socket events, move generation, rules, timers, draw/reset negotiation.
- `JogoService.js` (370) mixes orchestration with the AI heuristic; `index.js` (333) mixes bootstrap, socket server and 11 copy-pasted emitter handlers; `JogoController.js` (361) repeats one try/catch ~32 times.
- `global.universalEmitter` is used implicitly, so the domain can't be unit-tested.
- Errors are thrown as strings and every failure returns 500. There is no input validation, auth, or real logger. Loose `==` is used everywhere (`ladoId` is sometimes `"0"`, sometimes `0`).
- Real bugs: socket disconnect removes the wrong player (`indexOf` on an object literal → `splice(-1)`); `verbose` is always true; log timestamp is frozen at startup; GETs have side effects (`encontra` can finalize on timeout); timeout is labelled "Insuficiência material"; `propoeEmpate` continues after finalizing; `GET /ia` mutates.
- Performance: every legality check does `JSON.stringify/parse` of the whole board plus history.

Goal: a codebase a junior dev can maintain: TypeScript only, one responsibility per file (target < 100 lines, hard cap ~150), simple patterns, 100% of logic covered by tests.

## Decisions (defaults — say so if you want different)
- **Everything pt-br becomes English**: file names, folders, classes, methods, variables, constants, comments, log/error messages, route paths, JSON field names, socket event names, header/query names, lookup data values in `database.json`, README and Postman collection. See the glossary section below.
- **Public API compatibility:** new English routes/fields/events are the primary contract. Because the existing frontend and `ia` worker speak pt-br, keep a thin, clearly-marked **legacy adapter** (`src/http/legacy/`: old route aliases + pt-br field/event mapping) that is removed once the frontend migrates. The JSON envelope `{message,data,success}` stays. Status codes become correct (400/404/409 instead of always 500).
- **Keep in-memory storage**, but behind a `GameRepository` interface (easy to swap for a DB later). No DB added now.
- **Tooling:** TypeScript strict, Express 4 → keep (upgrade to 4.21), `zod` for validation, `pino` for logging, `vitest` (or Jest) + `supertest` for tests, ESLint + Prettier, `tsx` for dev, GitHub Actions CI. Plain constructor-injection, no DI framework.
- **AI behaviour unchanged** at first (same filter chain), just extracted into small named functions.

## pt-br → English glossary (applied during the move, never as a separate "rename pass")
Jogo→Game, Tabuleiro→Board, Casa→Square, Peca→Piece, Lado→Side, Branco/Preto→White/Black, Jogador→Player, Turno→Turn, Jogada→Move, PossivelJogada→PossibleMove, MovimentoRealizado→PerformedMove, AcaoSolicitada→RequestedAction, Peão/Pawn, Torre→Rook, Cavalo→Knight, Bispo→Bishop, Rainha→Queen, Rei→King, Roque→Castling, Promoção→Promotion, Empate→Draw, Reset→Reset, Cheque→Check, Xeque-mate→Checkmate, Afogamento→Stalemate, Finalizado→Finished, TabelaEquivalencia→SquareLookup, Tipos de jogo/jogador/peça→GameType/PlayerType/PieceType, Controller/Service names follow (`GameController`, …).
Routes: `/jogos`→`/games`, `/pecas`→`/pieces`, `/possiveis-jogadas`→`/possible-moves`, `/jogadores`→`/players`, `/tipos-de-peca`→`/piece-types`, `/lados-do-jogo`→`/game-sides`, `/tabela-equivalencia`→`/square-lookup`, `/ia`→`/ai`, etc. Socket events (`jogadaRealizada`→`moveMade`, `jogoCriado`→`gameCreated`, `empateProposto`→`drawOffered`, …) and the `lado` header → `side`. The full table is produced in Phase 1 and checked into `docs/glossary.md` so naming stays consistent.
Single-glossary rule: if a pt-br word has no entry, add it to the glossary first, then use it.

## Target structure
(All names below are the English ones; the earlier `Jogo`/`Peca` mentions in the scan are the old names.)
```
src/
  main.ts                    # composition root: wires everything, starts server
  config/env.ts              # zod-validated env (PORT, APP_URL, LOG_LEVEL, APP_WAIT_MS)
  domain/
    types.ts constants.ts    # enums: LadoId, TipoJogo, TipoFinalizacao (no magic numbers)
    board/ Board.ts Square.ts coordinates.ts snapshot.ts
    pieces/ Piece.ts Pawn.ts Knight.ts Bishop.ts Rook.ts Queen.ts King.ts pieceFactory.ts
    moves/ candidateMoves.ts slidingMoves.ts pawnMoves.ts castlingMoves.ts enPassant.ts
           legalMoves.ts (uses make/unmake or clone, no JSON round-trip) attackMap.ts
    rules/ checkDetector.ts checkmate.ts stalemate.ts insufficientMaterial.ts
           fiftyMoveRule.ts threefoldRepetition.ts
    game/ Game.ts (state only) turnClock.ts promotion.ts drawOffer.ts resetOffer.ts
    ai/ aiMoveSelector.ts filters/ (threatened.ts safeDestination.ts capture.ts closerToKing.ts)
  application/                # use-cases, one class/file each
    CreateGame.ts GetGame.ts ListGames.ts MovePiece.ts ListPossibleMoves.ts
    AddPlayer.ts RemovePlayer.ts PromotePawn.ts OfferDraw.ts RespondDraw.ts
    OfferReset.ts RespondReset.ts RunAiTurns.ts PromoteAiPawn.ts
    ports/ GameRepository.ts EventPublisher.ts Clock.ts Random.ts   # interfaces (DIP)
  infrastructure/
    InMemoryGameRepository.ts
    SocketEventPublisher.ts   # replaces global.universalEmitter + the 11 handlers
    socket/ socketServer.ts connectedPlayers.ts (fixes disconnect bug)
    data/ lookups.ts (+ typed JSON): lados, tiposPeca, tiposJogo, tabelaEquivalencia
  http/
    app.ts routes/*.routes.ts (one file per resource) controllers/*.ts (thin)
    middleware/ errorHandler.ts notFound.ts validate.ts requestLogger.ts
    schemas/*.ts (zod)       asyncHandler.ts
  shared/ errors.ts (AppError, NotFoundError, ValidationError, ConflictError) logger.ts
ia/ worker.ts (+ small modules: apiClient.ts, handlers.ts)   # ia.js port
tests/ mirrors src/ (unit), tests/http (supertest), tests/fixtures (board builders)
```

## Documentation, specs and Claude tooling (deliverables, built alongside the phases)

### `docs/` folder
```
docs/
  README.md               # index of all docs
  architecture.md         # layers, dependency rule (domain ← application ← infrastructure/http), diagram, request & socket-event flows
  glossary.md             # pt-br → English map (Phase 1) + chess terms
  api/ openapi.yaml + endpoints.md   # generated from zod schemas where possible
  events.md               # socket events: name, direction, payload, who receives
  domain/ rules.md        # chess rules as implemented (castling, en passant, promotion, check/mate, stalemate, 50-move, threefold, insufficient material, timeouts, draw/reset negotiation)
  ai.md                   # AI filter pipeline, how to add a filter, how the worker runs
  guides/ adding-an-endpoint.md  adding-a-rule.md  adding-an-ai-filter.md  testing.md  deploying.md  troubleshooting.md
  decisions/ 0001-typescript.md 0002-in-memory-repository.md 0003-english-naming.md 0004-legacy-adapter.md   # ADRs
  specs/ (see below)
```
### Root `README.md`
Short and practical: what the project is, requirements, quick start (`npm i`, `.env`, `npm run dev`, `npm test`), scripts table, env vars table, folder map (one line each), API/events overview with links into `docs/`, how to run the AI worker, deploy notes (Heroku Procfile), contributing (branch flow `develop` → `main`, commit style, PR checklist).

### Specs of what is implemented (`docs/specs/`)
Written from the current behaviour (Phase 0, before refactoring), one file per capability, each with: purpose, rules, request/response or event examples, edge cases, and a **test-traceability table** linking each rule to the test that proves it. Plain Given/When/Then so a junior can read them and so they double as test names.
`game-lifecycle.md`, `board-and-pieces.md`, `move-generation.md`, `special-moves.md`, `check-checkmate-stalemate.md`, `draw-conditions.md`, `draw-and-reset-negotiation.md`, `pawn-promotion.md`, `turn-clock.md`, `players-and-sides.md`, `ai-opponent.md`, `realtime-events.md`, `error-handling.md`. Known bugs are listed in a "Known deviations" section and flip to normal rules when fixed. A CI script fails if a spec references a missing test.

### `CLAUDE.md` (project root, created in Phase 0 and kept current)
Concise (< ~150 lines), with:
- Project summary and stack (TypeScript strict, Express, socket.io, zod, pino, vitest).
- Commands: build, dev, test, single test, lint, format, coverage, run AI worker.
- Architecture rules: dependency direction; domain has no I/O or imports from outer layers; use-cases one per file; controllers thin; ports in `application/ports`.
- Conventions: English only (see `docs/glossary.md`), files < 150 lines, one responsibility per file, no `any`, `===` only, throw `AppError` subclasses (never strings), no `global`, no swallowed exceptions, constructor injection, no new dependency without asking.
- Testing rules: every change ships with tests; board-builder helper; TDD for rules; coverage gates; never weaken a test to pass.
- Workflow: branch from `develop`, small PRs, update the matching spec/doc in the same PR, Conventional-ish commit messages in English.
- Pointers: `@docs/architecture.md`, `@docs/glossary.md`, `@docs/specs/`.
- "Gotchas": the legacy adapter, in-memory state lost on restart, GET side effects policy.

### Claude Code skills (`.claude/skills/<name>/SKILL.md`) — nice to have for maintenance
- `add-endpoint` — scaffold route + zod schema + controller + use-case + tests + OpenAPI/spec update following the guide.
- `add-chess-rule` — spec first, failing board-builder test, rule as pure function in `domain/rules`, wire it, update `docs/specs`.
- `add-ai-filter` — new filter file + unit test + pipeline registration + `docs/ai.md`.
- `add-socket-event` — event type, publisher method, `docs/events.md`, test with socket.io-client.
- `translate-to-english` — apply the glossary to a file (used during the migration), then the grep check.
- `write-tests` — conventions for unit/integration tests and the board-builder helper.
- `update-docs` — keep specs/README/OpenAPI/ADRs in sync with the diff.
- `release-check` — build, lint, tests+coverage, spec-traceability check, Postman replay, Procfile sanity.

### Claude Code subagents (`.claude/agents/<name>.md`)
- `chess-rules-reviewer` — reviews domain changes against `docs/domain/rules.md` and specs (read-only).
- `architecture-guard` — checks the dependency rule, file size, SOLID and naming/glossary violations on a diff (read-only).
- `test-writer` — writes missing tests and reports coverage gaps for a given module.
- `docs-keeper` — detects code/docs/spec drift and proposes edits.
- `migration-worker` — ports one legacy JS module to TS + English per the glossary and characterization tests (used in parallel during Phases 2–5).

### Automation (`.claude/settings.json`)
Shared allowlist for `npm run build/lint/test`; hooks: Prettier+ESLint on edited TS files; `tsc --noEmit` and affected tests on stop. Plus `.github/` PR template with the checklist (tests, docs/spec updated, glossary respected) and optional Claude PR-review workflow.

## Phases (each ends green: build + lint + tests; one PR per phase into `develop`)

**0. Safety net first (before moving code)**
- Add TS tooling alongside JS (`allowJs`), vitest, ESLint, Prettier, CI.
- Create initial `CLAUDE.md`, the `docs/` skeleton, and the specs of current behaviour (`docs/specs/*`), plus `.claude/` skills, agents and settings (they are used for the remaining phases).
- Write *characterization tests* against the current behaviour via supertest (create game, legal moves from the initial position, castling, en passant, promotion, check/mate, stalemate, 50-move, threefold, draw/reset flow, AI endpoints). Needs a stub for `global.universalEmitter` in test setup. Known bugs get `it.todo`/expected-fix tests rather than being pinned.
- Perft-style move-count tests for the initial and a few known positions to guard the move generator during the rewrite.

**1. Foundations**
- `shared/errors.ts` + `errorHandler` middleware; zod `env`; pino logger (fixes `verbose` and frozen `now`).
- Write `docs/glossary.md` (pt-br → English for files, identifiers, routes, JSON fields, socket events, lookup values); add an ESLint/CI grep check that fails on pt-br identifiers and comments from the glossary.
- Typed lookups (`lookups.ts`, English values) replacing direct `database.json` mutation; stop mutating shared data in `TipoJogoService`.
- Enums/constants for magic ids; strict `===` and numeric `LadoId` everywhere.

**2. Domain split (the core of the work)**
- Port pieces, board, coordinates (replace linear `find` with a computed map) to TS.
- Extract move generation, then legality filter; replace JSON snapshot/revert with make/unmake or a cheap board clone (also kills the swallowed-exception-as-control-flow in `encontraCasasVizinhas` / `filtraPossiveisJogadasPraNaoPorReiEmCheque`).
- Extract rules (check/mate/stalemate/insufficient material/50-move/threefold) as pure functions; `verificaReiLadoCheque` split into a query and the decision.
- Extract `Game` state, `TurnClock`, promotion and the draw/reset offers (merge the mirrored propose/respond pairs into one `Offer` abstraction).
- Domain no longer imports services, `database.json`, or the emitter; it returns results/events.

**3. Application + infrastructure**
- Ports (`GameRepository`, `EventPublisher`, `Clock`, `Random`) and one use-case per file replacing `JogoService`.
- `InMemoryGameRepository` (stores `Game`s, not shallow copies; stop returning `db.jogos` raw from `lista`).
- `SocketEventPublisher` + one `notify(targets, event, payload)` helper replaces the 11 handlers; fix disconnect bug.
- Timeout/finalization moves into an explicit use-case step so GETs are side-effect free (or documented if behaviour must stay).

**4. HTTP layer**
- Split `routes.js` into per-resource routers; thin controllers using `asyncHandler`; zod schemas for params/body/query/headers (`lado`, `tabuleiroSuperSimplificado` parsed safely).
- Correct status codes; 404 handler; request logging. Convert `GET /ia` to `POST` while keeping the old GET as a deprecated alias.
- Optional (ask): a lightweight shared secret for `/jogos/ia*` and tightened CORS.

**5. AI**
- Port `executaJogadasIa` into `ai/` as named filters in a pipeline (each tested separately); port `ia.js` worker to TS with safe error handling (`error.response?.data`), remove the bogus `uncaughtException` socket listener.
- Leave a clear hook for a future evaluation function using `valor`.

**6. Finish**
- Delete all `.js`, set `allowJs:false`, `strict: true`, no `any` rule enforced in lint.
- Update `package.json` (scripts: `dev`, `build`, `start`, `test`, `lint`, `ia`; `engines` node ≥ 20; Procfile → `node dist/main.js`), refresh deps (axios, dotenv, socket.io).
- Docs: final root README, complete `docs/` (architecture, API/OpenAPI, events, guides, ADRs), specs updated with the fixed bugs and traceability check green, English Postman collection, `CLAUDE.md` refreshed.
- Coverage gate in CI (target ≥ 90% lines overall, 100% on `domain/`).

## Testing strategy
- Unit: every piece, every rule, each AI filter, each use-case (with in-memory fakes of the ports), env/validation, error mapping.
- Board-building test helper (`boardFrom("rnbqkbnr/...")` FEN-like) so tests stay readable for juniors.
- Integration: supertest per route; socket.io-client test for event delivery, player connect/disconnect.
- Regression tests for each bug listed in Context.
- Performance smoke: legal-move generation for a mid-game position under a set threshold.

## Verification
- `npm run build && npm run lint && npm test -- --coverage` all green; CI runs the same.
- Run old (pre-refactor tag) and new server side by side and replay the Postman collection against both (old collection → legacy adapter, new English collection → primary routes); diff the JSON responses (only status codes of error cases and translated messages should differ).
- `grep` the repo for pt-br words from the glossary (file names included) → zero hits.
- Play a full human-vs-AI and AI-vs-AI game with the frontend and the worker running; confirm socket events (move, promotion, draw/reset prompts, finish) arrive.
- Check `find src -name '*.ts' | xargs wc -l` — no file above ~150 lines; no `.js` left.

## Risks
- Move-generation rewrite is the riskiest part → Phase 0 characterization/perft tests are mandatory before Phase 2.
- Behaviour that quirks depend on (string `ladoId`, en passant by object identity) must be normalised deliberately and covered by tests.
- Frontend coupling: renaming routes/fields/events breaks the current frontend and `ia` worker → the legacy adapter keeps pt-br working until the frontend migrates; the replay-diff verification runs against the adapter.
- Characterization tests (Phase 0) are written against the old pt-br API, then ported to English with the adapter tests proving equivalence.
