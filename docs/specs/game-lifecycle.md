# Game lifecycle

## Purpose
Create, read, list, reset and resign games. A game id is its position in the in-memory list.

## Rules
- **Create:** `POST /jogos` with `tipoJogo` (0 Human X Human, 1 Human X AI, 2 AI X AI), optional `tempoDeTurnoEmMilisegundos` (default -1, meaning no limit), optional `tabuleiroCasas` (custom board), optional `ladoId`. A new game has no players and starts with White to move.
- **List:** `GET /jogos` returns every game, including finished ones.
- **Read:** `GET /jogos/:id` returns the full game. An unknown id gives 500 with "Jogo não encontrado".
- **Summary:** `GET /jogos/:id/simples` returns id, side to move, remaining time per side, check flag, pending actions, promotion square, draw and reset offers, sides without players, en passant square, finishing type, the type label ("Humano X Humano" and so on) and the board.
  - `tabuleiroSuperSimplificado=true` returns the board as `"Tipo-ladoId"` strings. Any other value (including `1`) returns the verbose board. See known deviations.
- **Reset:** `PUT /jogos/:id/reset` starts the same id again from the start position with no players and no turns. It does not check whether the game is finished.
- **Resign:** `DELETE /jogos/:id/jogadores/:ladoId` removes the side's player and finishes the game with type 7 ("Desistência: Um jogador deixou a partida").

## Tests
- `catalog-and-lifecycle.test.ts`: "POST /jogos creates a game...", "GET /jogos/:id returns the full game state", "GET /jogos/:id/simples...", "DELETE ... resigns...", "GET /jogos/:id with an unknown id..."
- `endings-draws-and-reset.test.ts`: "PUT /reset restarts the same game id..."

## Known deviations
- `?tabuleiroSuperSimplificado=1` is ignored: `JSON.parse("1")` is the number 1, which is not a boolean, so it falls back to false. Target: accept `1`/`0` and `true`/`false`.
- A game with a time limit can be finished by a plain GET (see [turn-clock.md](turn-clock.md)).
