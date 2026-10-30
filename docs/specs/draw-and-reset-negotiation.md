# Draw and reset negotiation

## Purpose
One side offers a draw or a reset; the other side accepts or declines.

## Rules
- **Draw offer:** only the side on turn can offer. `PUT /jogos/:id/empate/propoe` (with header `lado`). The other side receives a pending action `responderPropostaEmpate`. Only one draw offer can be open at a time.
- While a draw offer is open, the side on turn cannot move (pending action).
- **Answer a draw offer:** `POST /jogos/:id/empate/responde` with `resposta`. Accepting ends the game as type 5 "Empate: Comum acordo". Declining clears the offer, so a new one can be made. With nothing offered: "Nenhum empate foi proposto".
- **Reset offer:** only on a finished game (otherwise "Não é possível resetar um jogo que não foi finalizado"). `PUT /jogos/:id/reset/propoe`. The other side receives `responderPropostaReset`. Only one reset offer can be open at a time.
- **Answer a reset offer:** `POST /jogos/:id/reset/responde`. Accepting restarts the game (same as `PUT /reset`). Declining clears the offer. With nothing offered: "Nenhum reset foi proposto".
- An answer from a side that does not hold the pending action is refused.

## Tests
- `endings-draws-and-reset.test.ts`: all tests in "characterization: draw offers" and "characterization: reset".

## Known deviations
- `empatePropostoPeloLadoId` holds the side id as given by the header, so it is the string `"0"`, not the number 0.
- The 50-move check happens inside the offer (see [draw-conditions.md](draw-conditions.md)): the game is finished and the offer is still sent.
- Offering a draw after the 50-move limit: the game finishes as a draw first and then the offer is still stored and sent. Test is `it.todo`.
