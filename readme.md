# xadrez-backend

Backend of a chess game: an Express REST API, socket.io real-time events and an AI player that runs inside the API process. The code is TypeScript (strict). Game state lives in memory.

Start with [docs/README.md](docs/README.md) for the full index. The refactor plan and its status are in [docs/refactor-plan.md](docs/refactor-plan.md).

## Requirements
- Node 22 or newer
- npm

## Quick start
```bash
cp .env.example .env
npm install
npm run dev     # API in watch mode
npm test        # tests
```

## Scripts
| Script | What it does |
|---|---|
| `npm start` | Runs the API (`node --import tsx src/main.ts`) |
| `npm run dev` | Runs the API in watch mode |
| `npm test` | Runs the tests (Vitest) |
| `npm run test:watch` | Runs the tests in watch mode |
| `npm run typecheck` | TypeScript check, no output |
| `npm run lint` | ESLint |
| `npm run check:names` | Fails on Portuguese identifiers in migrated code |
| `npm run format` | Prettier |
| `npm run docs:openapi` | Regenerates the served API description from `docs/api/openapi.yaml` |

## Environment
| Variable | Default | Meaning |
|---|---|---|
| `PORT` | 3333 | Port of the API |
| `AI_ENABLED` | `true` | Runs the AI player inside the API process |
| `APP_WAIT_MS` | 3000 | Wait before the AI acts |
| `LOG_LEVEL` | `info` | Log level (pino) |

Values are validated once at startup in `src/config/env.ts`.

## Folder map
```
src/
  main.ts          composition root: builds the parts and starts the server
  config/          validated environment
  shared/          constants, errors, logger, error handler
  domain/          chess rules and game state (no I/O)
  application/     use-cases; GameService is the entry point for HTTP
  infrastructure/  in-memory repository, socket.io hub, catalogue
  http/            Express app, routes, presenters (the JSON shapes), error mapping
  ai/inProcessAi.ts the AI player, inside the API process
tests/
  unit/            domain and shared code
  characterization/ the API and socket events, against the real server
docs/              specs, API, events, rules, AI, guides, decisions
```

## API and events
- Interactive docs (Swagger UI): `GET /docs` on a running API, for example http://localhost:3333/docs. The raw description is at `GET /openapi.json`. "Try it out" calls the host the page came from.
- The description is written in [docs/api/openapi.yaml](docs/api/openapi.yaml). After editing it, run `npm run docs:openapi` to regenerate `src/http/docs/openapi.json`, which the API serves. A test fails if the description and the routes disagree.
- Socket events: [docs/events.md](docs/events.md)
- What the system does today: [docs/specs/](docs/specs/)

Route paths, JSON fields, socket event names and the `lado` header keep their Portuguese names. The code is in English. See [docs/decisions/0005-keep-wire-format.md](docs/decisions/0005-keep-wire-format.md).

## The AI player
The AI runs inside the API process, so it starts with the API and stops with it. It plays when a game changes or when it is asked to run. See [docs/ai.md](docs/ai.md).

## Deploying
The `Procfile` runs `web: npm start`; the AI runs inside that process. Read [docs/guides/deploying.md](docs/guides/deploying.md) first: games live in memory, and `tsx` must stay a runtime dependency.

## Guides
- [Adding an endpoint](docs/guides/adding-an-endpoint.md)
- [Adding or changing a rule](docs/guides/adding-a-rule.md)
- [Adding an AI filter](docs/guides/adding-an-ai-filter.md)
- [Testing](docs/guides/testing.md)
- [Deploying](docs/guides/deploying.md)
- [Troubleshooting](docs/guides/troubleshooting.md)

## Contributing
- Run `npm run typecheck`, `npm run lint`, `npm run check:names` and `npm test` before a pull request. CI runs the same checks.
- Every change ships with tests, and updates the matching spec in `docs/specs/`.
- Names, comments and new code are in English. See [docs/glossary.md](docs/glossary.md).
