# Architecture

## Today (JavaScript, before the refactor)

```
HTTP (Express)                 socket.io
   routes.js                      index.js (bootstrap, socket handlers, 11 emitter listeners)
      |                              ^
   controllers/  (try/catch x ~30)   | global.universalEmitter  (EventEmitter)
      |                              |
   services/JogoService.js  ---------+  also holds the AI move filter
      |
   models/Jogo.js  (game rules, persistence, event emission)
      |        \
   Tabuleiro.js  pieces/*.js
      |
   database.json  (lookup tables + in-memory `jogos` array)

ia.js (separate process): socket.io client + axios -> POST /jogos/ia/executa, etc.
```

Known structural problems: `Jogo.js` is a god class (about 1,200 lines); the domain emits transport events through a global; errors are plain strings; state is a shared mutable JSON object.

## Target (after the refactor)

```
src/
  main.ts                 composition root
  domain/                 pure chess rules and game state (no I/O)
  application/            one use-case per file; ports (interfaces) in application/ports
  infrastructure/         in-memory repository, socket.io publisher, lookup data loader
  http/                   Express routers, thin controllers, zod schemas, error middleware, legacy adapter
ia/                       AI worker (its own entry point)
```

**Dependency rule:** `domain` imports nothing from the other layers. `application` imports `domain` and its own ports. `infrastructure` and `http` implement or call `application`.

Flows (target):
- Move: HTTP → controller → `MovePiece` use-case → `Game` (domain) → repository save → `EventPublisher` → socket.io.
- AI turn: socket event or `POST /ai/run` → `RunAiTurns` → `ai/` filters → `MovePiece` for each chosen move.

See [refactor-plan.md](refactor-plan.md) for the phase order.
