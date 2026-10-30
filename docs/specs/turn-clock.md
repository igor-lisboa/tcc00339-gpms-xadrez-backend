# Turn clock

## Purpose
Each turn can have a time limit. The game tracks the time each side has left.

## Rules
- The game's time limit is `tempoDeTurnoEmMilisegundos`. -1 (the default) means no limit.
- Each side's remaining time is the limit minus the time it has used across all its turns. The current turn counts up to "now".
- `GET /jogos/:id/simples` returns `ladoBrancoTempoMilisegundosRestante` and `ladoPretoTempoMilisegundosRestante`.
- A turn starts when a move passes the turn, or when both sides are seated.
- If the side on turn runs out of time, the game finishes.

## Tests
- `moves-and-special-moves.test.ts`: "reports the remaining time of each side once a time limit is set"

## Known deviations
- A timeout finishes the game with type 3 "Empate: Insuficiência material". The reason is wrong. Target: a separate timeout type.
- The clock is checked inside read paths: every `GET /jogos/:id` can finish a game on timeout. Target: the clock is checked by an explicit use-case step, not by reads.
- The timestamp of a turn uses the server clock only; a restart resets all clocks because state is in memory.
