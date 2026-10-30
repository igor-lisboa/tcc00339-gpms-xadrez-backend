# AI

Behaviour: [specs/ai-opponent.md](specs/ai-opponent.md). Code today: `src/services/JogoService.js` (`executaJogadasIa`, lines about 165 to 250) and the worker `ia.js`.

## How a move is chosen
1. Start from the legal moves of the side on turn.
2. Apply filters in order; a filter that would leave no move is skipped:
   threatened piece, safe destination, capture, approach the opponent's king (or pawn moves).
3. Pick one remaining move at random.

No look-ahead and no evaluation are used today.

## Running the worker
`npm run ia` starts `ia.js`. It connects to the server at `APP_URL` with the identifier `I.A.`, reacts to socket events, and calls the HTTP endpoints in [api/endpoints.md](api/endpoints.md).

## Target
The filters become small functions in `src/domain/ai/filters/`, the pipeline lives in `aiMoveSelector.ts`, and the worker moves to `src/ai/`. See [skills/add-ai-filter](../.claude/skills/add-ai-filter/SKILL.md).
