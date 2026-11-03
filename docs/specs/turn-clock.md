# Turn clock

## Purpose
Each turn can have a time limit. The game tracks the time each side has left.

## Rules
- The game's time limit is `tempoDeTurnoEmMilisegundos`. -1 (the default) means no limit.
- Each side's remaining time is the limit minus the time it has used across all its turns. The current turn counts up to "now".
- `GET /jogos/:id/simples` returns `ladoBrancoTempoMilisegundosRestante` and `ladoPretoTempoMilisegundosRestante`.
- A turn starts when a move passes the turn, or when both sides are seated.
- If the side on turn runs out of time, the game finishes.
- A read (`GET`) shows a timeout that has already happened. The ending is saved and announced by the next change to that game, before the change is applied.

## Tests
- `moves-and-special-moves.test.ts`: "reports the remaining time of each side once a time limit is set"
- `tests/unit/application/persistence.test.ts`: reads do not announce the ending; the next change does, once.

## Known deviations
- A timeout finishes the game with type 3 "Empate: Insuficiência material". The reason is wrong. Target: a separate timeout type.
- A `GET` can finish a game on timeout, and the response shows it. Kept for compatibility.
- The timestamp of a turn uses the server clock only; a restart resets all clocks because state is in memory.

## Changed in the TypeScript port
- The `gameFinished` event for a timeout is published by the next change to the game (move, seat, offer, reset, promotion), not by the `GET` that noticed it. The game in memory is the same either way.
