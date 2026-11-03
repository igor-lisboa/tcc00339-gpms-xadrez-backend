# Error handling

## Purpose
How the API reports success and failure, so clients can rely on one shape.

## Envelope
Every JSON response has `{ message, data, success }`.
- Success: `success: true`, `message` in Portuguese describing the result, `data` with the result (or `null`).
- Failure: `success: false`, `data: null`, `message` with the error text.

## Rules
- Domain refusals (wrong turn, illegal move, finished game, unknown game) are returned with HTTP status **500**. There are no 400, 404 or 409 statuses today.
- The `message` is the string that the domain threw. Messages are not translated and not coded.
- A body that is not valid JSON is rejected by Express before any handler runs: status 400 with an HTML error page, not the envelope.
- An unknown route is answered by Express's default 404 HTML page, not by the envelope.
- A request with no body is treated as an empty object: `POST /jogos` with no body creates a default game and returns 200.

## Tests
- Every characterization file asserts the message of its refusals; see `catalog-and-lifecycle.test.ts`: "GET /jogos/:id with an unknown id...".

## Known deviations
- Every failure is 500. Target: 400 for bad input, 404 for an unknown game, 409 for a rule conflict, with the same envelope.
- Refused rules are `DomainError`s whose message is the text above. Status codes are still 500 for all of them.
- Errors are logged through the shared logger (`src/shared/logger.ts`, pino).

## Changed in the TypeScript port
- An unexpected error (not a refused rule) is answered with the message "Internal server error" and status 500. Before, a non-string error produced an empty object as its message.
- Refused rules are unchanged: status 500 with the rule's message.
