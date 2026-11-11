# Turn clock

## Purpose
Each turn can have a time limit. The game tracks the time each side has left.

## Rules
- The game's time limit is `tempoTotalPorLadoEmMilisegundos`: the time per side for the whole game, in milliseconds. -1 (the default) means no limit. It is not a limit per turn; a side's time is spent across all its turns together. Its deprecated name `tempoDeTurnoEmMilisegundos` carries the same value.
- Each side's remaining time is the limit minus the time it has used across all its turns. The current turn counts up to "now".
- `GET /jogos/:id/simples` returns `ladoBrancoTempoMilisegundosRestante` and `ladoPretoTempoMilisegundosRestante`.
- A turn starts when a move passes the turn, or when both sides are seated.
- If the side on turn runs out of time, the game is judged (FIDE 6.9):
  - the opponent could checkmate by some series of legal moves: the opponent wins. Type 0 "Vitória: Branco" when Black ran out, type 1 "Vitória: Preto" when White ran out. The pieces of the side that ran out count, because they could block their own king: king and knight wins against king and rook, but not against king and queen. The full "can mate" test is in [draw-conditions.md](draw-conditions.md).
  - the opponent could never mate (for example a bare king, or a lone bishop against a bare king or king and rook): a draw, type 8 "Empate: Tempo esgotado sem material".
- When a game ends, for any reason, the turn that is running is closed. Both clocks then stay at their final values: a `GET` after the ending returns the same remaining time as before.
- The remaining time shown for a side that ran out is 0, never negative.
- Each side's clock is also given in ms as `ladoBrancoTempoMilisegundosRestante` (time left) and `ladoBrancoTempoMilisegundosGasto` (time used), and the `ladoPreto...` pair, on the game (`GET /jogos/:id`, `POST /jogos`), the summary (`GET /jogos/:id/simples`), and the `jogadaRealizada` and `jogoFinalizado` events. Time left is null when the game has no limit; time used is always given. Left and used are read at one instant, so for a limited game they add up to the limit.
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

## Changed in the FIDE endings fix
- Before: a timeout looked only at the opponent's own pieces, so king and knight against a side with a rook was a draw, and king and two knights was always a draw. A side that had offered a draw could not move until the opponent answered, so it could lose on time while waiting.
- Now: the pieces of the side that ran out count too (FIDE 6.9), and a draw offer never stops a move. Tests: `tests/unit/domain/endings.test.ts` (describes "timeout (FIDE 6.9)" and "draw offers (FIDE 9.1.2)").

## Changed in the ending reasons fix
- Before: a win on time looked the same as a checkmate (type 0 or 1), so a client could not say why a side won.
- Now: the game carries `motivoFinalizacao`; a timeout sets it to `tempoEsgotado`, for the win and for the draw of type 8. See [game-lifecycle.md](game-lifecycle.md).
- `tempoDeTurnoEmMilisegundos` is the time each side has for the whole game, not a limit per turn. The name is kept for the frontend.

## Changed in the clock fields
- Before: the time left was only inside the side objects and the summary. For a game with no limit it was a negative number (-1 minus the time used), which a client could show by mistake. The time used was not exposed at all, and the move and end events did not carry any clock.
- Now: the four clock fields above, on the game, the summary and the `jogadaRealizada` and `jogoFinalizado` events. For a game with no limit the time left is null, and the side objects' `tempoMilisegundosRestante` is null too.
- Tests: `tests/unit/domain/clock.test.ts`; `catalog-and-lifecycle.test.ts` ("GET /jogos/:id, its summary and POST /jogos report each side's clock"); `realtime-events.test.ts` ("tells the other side the clock of each side after a move", "sends the clocks with the ending").

## Naming the time field
Decided: option 2 of the options below. `tempoTotalPorLadoEmMilisegundos` is sent next to `tempoDeTurnoEmMilisegundos` on the game and on the summary, with the same value, and `POST /jogos` accepts either name. When both are sent, `tempoDeTurnoEmMilisegundos` wins unless it is null. The old name is deprecated and will be removed in a future major version, once the frontend has moved.

The options that were considered:
1. Keep the name and the description (current; no breaking change).
2. Add `tempoTotalPorLadoEmMilisegundos` next to the old field, with the same value, and mark the old one as deprecated. Not breaking; the frontend moves when it is ready.
3. Rename the field outright. Breaking: `POST /jogos`, `GET /jogos/:id` and `GET /jogos/:id/simples` change shape, so the frontend must change in the same release.

Option 2 was chosen, so the frontend can move at its own pace. Option 3 is not planned.
