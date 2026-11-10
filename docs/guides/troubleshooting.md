# Troubleshooting

## The app does not start
- **"Invalid environment configuration: ..."** The message names the variable and the problem. Fix the value in `.env` (see [deploying.md](deploying.md) for the list).
- **Port already in use.** Change `PORT` in `.env`.

## The AI does not move
- Check that `AI_ENABLED` is not `false`. The AI runs only in the API process, so it stops when the API stops; start the API again.
- The log line "AI turn failed" or "AI answer ... failed" carries the refusal message of the game.

## A game ended without a move
- A `GET` can end a game when its clock runs out, and the change is saved (see [specs/turn-clock.md](../specs/turn-clock.md)). The ending is a win for the opponent if the opponent has mating material, and type 8 "Empate: Tempo esgotado sem material" otherwise.

## A move is refused with status 500
- Every refused rule is a 500 today, with the rule's message in the body (see [specs/error-handling.md](../specs/error-handling.md)). An unexpected error is 500, with the message "Internal server error", and it is logged in full.

## The `lado` header is ignored or the wrong side plays
- The header must be the side id as a number (`0` or `1`). A missing header becomes `NaN`, which matches no side, so the request is refused.

## Games disappear
- Games live in memory. A restart or a dyno recycle clears them.

## `npm run check:names` fails
- A Portuguese identifier is in code outside the presenters and routes. Rename it to English (see [glossary.md](../glossary.md)), or, if the name is part of the wire protocol, add `// names-check:ignore (reason)` at the end of the line.
