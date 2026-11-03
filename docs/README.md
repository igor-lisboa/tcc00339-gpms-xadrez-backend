# Documentation index

Start with the root `README.md` for setup. Everything else is here.

| Folder / file | What it is |
|---|---|
| [architecture.md](architecture.md) | Layers, dependency rule, request and event flows |
| [refactor-plan.md](refactor-plan.md) | The approved plan for the TypeScript refactor, phase by phase |
| [glossary.md](glossary.md) | pt-br → English naming map (files, identifiers, routes, fields, events) |
| [specs/](specs/) | What the system does today, rule by rule, with the tests that prove it |
| [domain/rules.md](domain/rules.md) | Chess rules as implemented, with known deviations |
| [api/openapi.yaml](api/openapi.yaml) | the API: every endpoint, its parameters and responses. Served at /docs (Swagger UI) and /openapi.json |
| [events.md](events.md) | Socket.io events: name, direction, payload |
| [ai.md](ai.md) | How the AI picks moves and how it runs inside the API |
| [guides/](guides/) | How-to notes for common changes |
| [decisions/](decisions/) | Architecture decision records (ADRs) |

## Specs

| Spec | Covers |
|---|---|
| [game-lifecycle.md](specs/game-lifecycle.md) | create, read, list, reset, resign, summary view |
| [players-and-sides.md](specs/players-and-sides.md) | seating players, AI seats, sides without a player |
| [board-and-pieces.md](specs/board-and-pieces.md) | start position, board notation, piece lists |
| [move-generation.md](specs/move-generation.md) | which moves are offered and which are legal |
| [special-moves.md](specs/special-moves.md) | castling, en passant, the double pawn step |
| [pawn-promotion.md](specs/pawn-promotion.md) | promotion request and choice |
| [check-checkmate-stalemate.md](specs/check-checkmate-stalemate.md) | check, checkmate, stalemate |
| [draw-conditions.md](specs/draw-conditions.md) | 50-move rule, threefold repetition, insufficient material |
| [draw-and-reset-negotiation.md](specs/draw-and-reset-negotiation.md) | offering and answering draws and resets |
| [turn-clock.md](specs/turn-clock.md) | turns, time limits, remaining time |
| [ai-opponent.md](specs/ai-opponent.md) | AI endpoints and move choice |
| [realtime-events.md](specs/realtime-events.md) | socket.io events and their recipients |
| [error-handling.md](specs/error-handling.md) | error envelope, status codes, messages |
