# Turn clock

## Purpose
Each turn can have a time limit. The game tracks the time each side has left.

## Rules
- The game's time limit is `tempoDeTurnoEmMilisegundos`. -1 (the default) means no limit.
- Each side's remaining time is the limit minus the time it has used across all its turns. The current turn counts up to "now".
- `GET /jogos/:id/simples` returns `ladoBrancoTempoMilisegundosRestante` and `ladoPretoTempoMilisegundosRestante`.
- A turn starts when a move passes the turn, or when both sides are seated.
- If the side on turn runs out of time, the game is judged (FIDE 6.9):
  - the opponent has mating material (a rook, queen, pawn, two bishops, a bishop and a knight, etc. — see the material rule in [draw-conditions.md](draw-conditions.md)): the opponent wins. Type 0 "Vitória: Branco" when Black ran out, type 1 "Vitória: Preto" when White ran out.
  - the opponent cannot mate (bare king, king and one minor piece, king and two knights): a draw, type 8 "Empate: Tempo esgotado sem material".
- When a game ends, for any reason, the turn that is running is closed. Both clocks then stay at their final values: a `GET` after the ending returns the same remaining time as before.
- The remaining time shown for a side that ran out is 0, never negative.
- A read (`GET`) shows a timeout that has already happened. The ending is saved and announced by the next change to that game, before the change is applied.

## Tests
- `moves-and-special-moves.test.ts`: "reports the remaining time of each side once a time limit is set"
- `tests/unit/application/persistence.test.ts`: reads do not announce the ending; the next change does, once.
- `tests/unit/domain/rules.test.ts` (describe "clock"): a time out with a rook on the other side is a loss for that side; a time out against a bare king, or against king and one minor piece, is a draw; the remaining time is 0 after a time out; the clocks do not change after the game ends.
- `endings-draws-and-reset.test.ts`: "a time out is a win for the opponent when the opponent has a rook", "a time out is a draw when the opponent holds only a king", "the clocks stop when the game ends".

## Known deviations
- The timestamp of a turn uses the server clock only; a restart resets all clocks because state is in memory.
- A `GET` can finish a game on timeout, and the response shows it. Kept for compatibility.
- A timeout is detected when the game is next read or changed, so the turn of the side that ran out ends at that moment, not at its exact deadline. Its remaining time is 0 either way.

## Changed in the TypeScript port
- The `gameFinished` event for a timeout is published by the next change to the game (move, seat, offer, reset, promotion), not by the `GET` that noticed it. The game in memory is the same either way.

## Changed in the timeout fix
- Before: a timeout always finished the game as type 3 "Empate: Insuficiência material"; the clocks kept running after any ending and went negative.
- Now: see the rules above. Type 8 "Empate: Tempo esgotado sem material" is new; the OpenAPI entry "Tempo esgotado: o tempo de um jogador acabou" was removed because no ending used it.
