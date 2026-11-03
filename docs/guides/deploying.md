# Deploying

## What runs
`Procfile` declares one process:

```
web: npm start      # node --import tsx src/main.ts (the API, socket.io and the AI player)
```

The AI player runs inside the API process (`AI_ENABLED`, default `true`). It starts with the API and stops with it, so there is no second process to deploy.

The app runs TypeScript directly through `tsx`, so `tsx` is a runtime dependency (in `dependencies`, not `devDependencies`). If it were a dev dependency, a platform that prunes dev dependencies after the build would remove it and `npm start` would fail.

## Where it can run
The API needs a process that stays up: socket.io keeps connections open, games live in memory, and the AI player runs in the background. The host must keep one instance running. A serverless platform (where each request runs in a short-lived function) cannot do that.

## Vercel (HTTP API only)
The repository has a Vercel setup: `vercel.json` rewrites every path to the function in `api/index.ts`, which is the same Express app as `src/main.ts`. Deploy with the Vercel CLI from the project folder: `npx vercel` for a preview, `npx vercel --prod` for production.

What works on Vercel:
- every HTTP route in the Swagger UI at `/docs`, with the same envelope and messages.

What does not:
- **Real-time events.** socket.io is not served, so no `jogadaRealizada`, `empateProposto` or other socket events are sent (`DiscardingEventPublisher`).
- **Games last only while the instance is warm.** Each instance has its own memory, so a game can be missing on the next request.
- **The AI does not play in the background.** The AI player is not started on Vercel; `POST /jogos/ia/executa` still plays the AI turns when it is called.

A full deployment (socket events, games that persist, the AI running on its own) needs a host that keeps one process running, and state in a database. See the Procfile path above.

## Requirements
- Node 22 or newer (`engines` in `package.json`; CI uses 22).
- Environment variables, copied from `.env.example`:

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | 3333 | Port of the API |
| `AI_ENABLED` | `true` | Runs the AI player inside the API process; `false` turns it off |
| `APP_WAIT_MS` | 3000 | How long the AI waits before it acts |
| `LOG_LEVEL` | `info` | pino level: fatal, error, warn, info, debug, trace, silent |

A bad value stops the app at startup with a message that names the variable (`src/config/env.ts`).

## Before you deploy
1. `npm run typecheck`, `npm run lint`, `npm run check:names`, `npm test`. The `release-check` skill runs the full list.
2. Remember that games live in memory. A restart or a dyno recycle loses every game (see [decisions/0002-in-memory-repository.md](../decisions/0002-in-memory-repository.md)).
3. Run only one instance. Two instances would hold two separate sets of games.

## After you deploy
- The API answers `GET /` with the welcome message, and `GET /docs` shows the Swagger UI.
- Start an AI-vs-AI game with `POST /jogos` and `{"tipoJogo": 2}`. Its moves should appear within a few seconds without any other request.
