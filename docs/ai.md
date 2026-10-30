# AI

Behaviour: [specs/ai-opponent.md](specs/ai-opponent.md). Code: the choice rules in `src/domain/ai/chooseAiMove.ts`, the use-cases in `src/application/aiCommands.ts`, the endpoints in `src/http/routes/aiRoutes.ts`, and the worker in `src/ai/worker.ts`.

## How a move is chosen
1. Start from the legal moves of the side on turn.
2. Apply filters in order; a filter that would leave no move is skipped:
   threatened piece, safe destination, capture, approach the opponent's king (or pawn moves).
3. Pick one remaining move at random.

No look-ahead and no evaluation are used today.

## Running the worker
`npm run ia` starts `src/ai/worker.ts`. It connects to the server at `APP_URL` with the identifier `I.A.`, reacts to socket events, and calls the HTTP endpoints in [api/endpoints.md](api/endpoints.md).

## Target
The filter rules are the four entries of `narrowAiOptions`. A new rule is added there and tested in `tests/unit/domain/board-and-ai.test.ts`. See [skills/add-ai-filter](../.claude/skills/add-ai-filter/SKILL.md).
