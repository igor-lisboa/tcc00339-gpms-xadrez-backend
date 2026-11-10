# Draw and reset negotiation

## Purpose
One side offers a draw or a reset; the other side accepts or declines.

## Rules
- **Draw offer** (FIDE 9.1.2): either side may offer while the game runs. `PUT /jogos/:id/empate/propoe` (with header `lado`). The other side receives a pending action `responderPropostaEmpate` and the socket event `empateProposto`. Only one draw offer can be open at a time ("Já tem um empate proposto pelo lado ..."). An unknown side is refused ("O lado desejado não existe") and the game is unchanged.
- **Claim:** when the side on turn offers and a threefold or 50-move claim is valid, the game ends as that draw instead, and no offer is sent. See [draw-conditions.md](draw-conditions.md). The claim is checked before the "offer already open" rule.
- **Claim with an intended move:** the body may carry `{ origem, destino }`. A valid claim ends the game without playing the move. A claim that is not valid plays the move and then leaves the offer; if the opponent had an open offer, the move declines it first. The answer's `data` is `{ reivindicado, jogadaRealizada }` (the move, or null).
- An open draw offer does not stop anyone from moving. The proposer may move and the offer stands.
- **Declined by moving:** when the other side plays a move instead of answering, the offer is declined: `empatePropostoPeloLadoId` becomes null, the pending action is removed, and the proposer receives `empatePropostoResposta`.
- **The offer lapses** when the game ends in any other way (for example a timeout): the offer and its pending action are cleared.
- **Answer a draw offer:** `POST /jogos/:id/empate/responde` with `resposta`. Accepting ends the game as type 5 "Empate: Comum acordo". Declining clears the offer, so a new one can be made, and tells the proposer. With nothing offered (or after the offer was declined by a move or lapsed): "Nenhum empate foi proposto".
- **Reset offer:** only on a finished game (otherwise "Não é possível resetar um jogo que não foi finalizado"). `PUT /jogos/:id/reset/propoe`. The other side receives `responderPropostaReset`. Only one reset offer can be open at a time. An unknown side is refused ("O lado desejado não existe") and the game is unchanged.
- **Answer a reset offer:** `POST /jogos/:id/reset/responde`. Accepting restarts the game (same as `PUT /reset`). Declining clears the offer. With nothing offered: "Nenhum reset foi proposto".
- An answer from a side that does not hold the pending action is refused.

## Tests
- `endings-draws-and-reset.test.ts`: all tests in "characterization: draw offers" and "characterization: reset".
- `tests/unit/domain/endings.test.ts` (describes "draw offers (FIDE 9.1.2)" and "reset offers").
- `realtime-events.test.ts`: "tells the proposer the offer was declined when the opponent moves instead of answering".
- `tests/unit/domain/drawClaims.test.ts`; `tests/unit/ai/inProcessAi.test.ts`: "does not answer a draw offer that is no longer open"

## Known deviations
- None known.

## Changed in the TypeScript port
- `empatePropostoPeloLadoId` is the side id as a number (`0`). It used to be the raw header string (`"0"`). This is a change in the JSON type; the frontend should be checked.
- A draw offer on a finished game is refused with "Esse jogo já foi finalizado" (status 500). Before, it was stored and sent.

## Changed in the FIDE endings fix
- Before: only the side on turn could offer ("Aguarde sua vez para propor um empate"), and while the offer was open that side could not move ("Tem ações solicitadas a serem executadas"), so its clock ran while the opponent waited. An offer after the 50-move limit ended the game and was still stored and sent. A reset offer from an unknown side stored that side and blocked every later reset offer.
- Now: see the rules above. The message "Aguarde sua vez para propor um empate" is gone; "Empate reivindicado com sucesso!" is new.
- Then: the answer's `data` was null, and the AI could try to answer an offer its own move had already declined, logging an error. Now the answer carries `{ reivindicado, jogadaRealizada }`, and the AI answers only an offer that is still open for its side.
