# Game lifecycle

## Purpose
Create, read, list, reset and resign games. A game id is its position in the in-memory list.

## Rules
- **Create:** `POST /jogos` with `tipoJogo` (0 Human X Human, 1 Human X AI, 2 AI X AI), optional `tempoTotalPorLadoEmMilisegundos` (the time per side for the whole game, default -1, meaning no limit; its deprecated name `tempoDeTurnoEmMilisegundos` is also accepted, see [turn-clock.md](turn-clock.md)), optional `tabuleiroCasas` (custom board), optional `ladoId`. A new game has no players and starts with White to move.
- **List:** `GET /jogos` returns every game, including finished ones.
- **Read:** `GET /jogos/:id` returns the full game. An unknown id gives 500 with "Jogo não encontrado".
- **Summary:** `GET /jogos/:id/simples` returns id, side to move, remaining time per side, check flag, pending actions, promotion square, draw and reset offers, whether the side on turn can claim a draw (`empateReivindicavel`), sides without players, en passant square, finishing type, the type label ("Humano X Humano" and so on) and the board.
  - `tabuleiroSuperSimplificado=true` returns the board as `"Tipo-ladoId"` strings. Any other value (including `1`) returns the verbose board. See known deviations.
- **Reset:** `PUT /jogos/:id/reset` starts the same id again from the start position with no players and no turns. It does not check whether the game is finished.
- **Resign:** `DELETE /jogos/:id/jogadores/:ladoId` with header `lado` equal to `ladoId` removes the side's player and finishes the game with type 7 ("Desistência: Um jogador deixou a partida"). The opponent wins when a player sits on its side (FIDE 5.1.2); with the other seat empty nobody wins. When the opponent could never checkmate, the game is a draw instead: type 3 "Empate: Insuficiência material" with `motivoFinalizacao` `desistencia`. Resigning a finished game does not change its result. A request whose `lado` header is missing or names the other side is refused with "Só é possível desistir pelo próprio lado" and the game is unchanged.
- **Winner:** `GET /jogos/:id` and `GET /jogos/:id/simples` return `ladoIdVencedor`: the side that won (checkmate, timeout, resignation), or null while the game runs. Every draw has a null winner, whatever its reason (repetition, fifty or seventy-five moves, insufficient material, stalemate, dead position, agreement, a timeout without material, a resignation that is a draw). The `jogoFinalizado` socket event carries it too.
- **Resigning side:** `ladoIdDesistente` on `GET /jogos/:id`, `GET /jogos/:id/simples` and the `jogoFinalizado` event is the side that resigned. It is set only by a resignation that ends the game, including the draw of type 3 that a resignation can cause, so the frontend reads it when `motivoFinalizacao` is `desistencia`. It is null for every other ending and while the game runs. A side that leaves a game that has already ended does not change it.
- **Endings list:** `GET /tipos-de-finalizacao` returns the twelve endings, each with `id`, `tipo` (the label), `categoria` (`vitoria`, `empate` or `desistencia`) and `ladoIdVencedor` (0 or 1 for the two wins, null otherwise; the winner of a resignation is on the game).
- **Enum values:** `GET /enumeracoes` returns the values the API can send for `acoesSolicitadas` (requested action names), `nomesJogada` (move names, with null for a plain move), `direcoes` (candidate move directions) and `motivosFinalizacao` (ending reasons). The lists come from the same constants the domain uses.

## Tests
- `catalog-and-lifecycle.test.ts`: "POST /jogos creates a game...", "GET /jogos/:id returns the full game state", "GET /jogos/:id/simples...", "DELETE ... resigns...", "GET /jogos/:id with an unknown id...", "GET /tipos-de-finalizacao lists the twelve endings...", "DELETE ... refuses to resign a side other than the one in the lado header", "GET /enumeracoes lists the requested actions..."
- `endings-draws-and-reset.test.ts`: "PUT /reset restarts the same game id...", "resigning finishes the game with the desistência result"
- `tests/unit/domain/endings.test.ts` (describes "resignation (FIDE 5.1.2)", "resigning side (ladoIdDesistente)" and "a draw never names a winner")
- `endings-draws-and-reset.test.ts`: "the resigning side is named on the game and its summary only for a resignation", "a checkmate names no resigning side", plus the winner and reason checks in each ending test
- `localized-messages.test.ts`: "the ending, its reason and the winner are never translated, whatever the language"
- `tests/unit/http/endingReasons.test.ts`: every reason the domain can record has a value of `motivosFinalizacao`
- `realtime-events.test.ts`: "sends the ending and the winning side when a game finishes", "sends the resigning side with a resignation that ends as a draw, and null for other endings"

## Known deviations
- `?tabuleiroSuperSimplificado=1` is ignored: `JSON.parse("1")` is the number 1, which is not a boolean, so it falls back to false. Target: accept `1`/`0` and `true`/`false`.
- A game with a time limit can be finished by a plain GET (see [turn-clock.md](turn-clock.md)).

## Changed in the FIDE endings fix
- Before: a resignation did not name the winner, so a client could not tell who won. Now the game, its summary and the `jogoFinalizado` event carry `ladoIdVencedor`. The endings list grew from nine to eleven (types 9 and 10, see [draw-conditions.md](draw-conditions.md)).
- Before: a reset did not record the start position for the repetition rules. Now every new game, reset included, records it.
- Before: the resign route did not check the `lado` header, so any client could resign either side. Now the header must name the side that resigns; the frontend must send it. The endings list grew to twelve (type 11 "Empate: Posição morta").

## Changed in the TypeScript port
- Seating a player with an unknown `tipoId` is refused with "Tipo de jogador inválido". Before, the side was silently resigned.
- A `tempoDeTurnoEmMilisegundos` of `null` is treated as no limit (-1), as is a missing value.

## Changed in the time field name
- Before: the time per side was only in `tempoDeTurnoEmMilisegundos`, whose name suggests a limit per turn. Now the game, the summary and `POST /jogos` also carry `tempoTotalPorLadoEmMilisegundos`, with the same value. The old name stays, marked deprecated. See [turn-clock.md](turn-clock.md).

## Changed in the winner and resigning side fix
- **Winner on draws.** The domain names a winner only for a win or a resignation: a caller that passes a winner for a draw is ignored. Before, this held only because of how the callers were written.
- **Resigning side.** New field `ladoIdDesistente` on the game, the summary and the `jogoFinalizado` payload. Before, a resignation that ended as a draw gave `motivoFinalizacao` `desistencia` and no winner, and the client could not tell who resigned.
- The socket payloads, including `ladoIdDesistente`, are documented in `docs/api/openapi.yaml` under `x-socket-events`.

## Changed in the ending reasons fix
- **Ending reason.** `GET /jogos/:id`, `GET /jogos/:id/simples` and the `jogoFinalizado` socket event carry `motivoFinalizacao`: why the game ended, or null while it runs. Values: `xequeMate`, `tempoEsgotado`, `desistencia`, `reiAfogado`, `comumAcordo`, `regra50Movimentos`, `regra75Movimentos`, `repeticao3Posicoes`, `repeticao5Posicoes`, `insuficienciaMaterial`, `posicaoMorta`. `GET /enumeracoes` lists them as `motivosFinalizacao`. Before, types 0 and 1 did not say whether the win was a checkmate or on time.
- **Resignation against a side that cannot mate** (FIDE 5.1.2). Before: the opponent always won. Now: when the opponent could never checkmate (the "can mate" test of [draw-conditions.md](draw-conditions.md)), the game ends as type 3 "Empate: Insuficiência material" with `motivoFinalizacao` `desistencia` and no winner.
- Tests: `tests/unit/domain/endings.test.ts` (describes "ending reason" and "resignation (FIDE 5.1.2)"), `endings-draws-and-reset.test.ts` ("resigning against a side that could never mate is a draw", "a running game has no ending reason", the timeout and checkmate cases), `catalog-and-lifecycle.test.ts` (`motivosFinalizacao`).
