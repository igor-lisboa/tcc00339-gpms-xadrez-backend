# AI opponent

## Purpose
An AI plays one or both sides of a game. The move choice lives on the server; the AI player runs inside the API process and asks the service to play.

## Rules
- AI games are those with `tipoJogo` 1 or 2 that are not finished.
- `GET /jogos/ia` lists those games with their AI sides and the legal moves of each.
- `POST /jogos/ia/executa` plays one move for the side on turn in every AI game. It returns `{jogadasExecutadas, jogadasErros}`.
- `POST /jogos/ia` plays the moves given in `jogadas` (`{jogoId, ladoId, casaOrigem, casaDestino}`). Moves that fail are returned in `jogadasErros` with the message, and the AI player is asked to run again.
- Move choice, applied as filters in order. A filter is skipped if it would leave no move:
  1. keep moves of a piece that the opponent attacks on its current square;
  2. keep moves to squares the opponent does not attack;
  3. keep captures;
  4. keep moves that reduce the distance to the opponent's king, and all pawn moves.
  Then one move is picked at random.
- The AI answers draw and reset offers and promotions with random choices.
- `GET /ia` asks the AI player to run.

## Tests
- `ai-endpoints.test.ts`: all tests in "characterization: AI endpoints".

## Known deviations
- No look-ahead and no material evaluation: the "value" field of a piece is computed and not used by the AI.
- The "threatened" filter does not check whether the attacked piece is defended.
- Move generation runs twice per AI side in each call, and each run uses the full board copy.

## Changed in the TypeScript port
- The AI is no longer a separate worker process. It runs inside the API process (`AI_ENABLED`, default true) and stops with it. Before, `npm run ia` connected to the API as `I.A.` and called its HTTP endpoints. The socket events it reacts to and the endpoints are unchanged.
- `jogadasErros[].jogadaSolicitada` echoes the request with numeric `jogoId` and `ladoId` (before: the raw values from the body).
- The move choice is the same filter chain, now a pure function in `src/domain/ai/chooseAiMove.ts`.
