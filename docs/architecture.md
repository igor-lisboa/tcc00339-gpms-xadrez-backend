# Architecture

## Layers

```
            HTTP (Express)                 socket.io                AI worker (ai/worker.ts)
            http/routes, presenters         infrastructure/socket    talks to the API over HTTP + socket
                    |                              ^                          |
                    v                              | DomainEvent              |
            application/GameService  ----------+---+                          |
            (queries, commands, offers, AI)        |                          |
                    |                              |                          |
                    v                              |                          |
            domain/  (Game, Board, rules, moves, AI choice)                   |
                    ^                                                         |
                    |                                                         |
            infrastructure/persistence (InMemoryGameRepository)   <-----------+
            infrastructure/data (catalogue from database.json)
```

Only `src/main.ts` creates the parts and wires them together.

**Dependency rule.** `domain` imports nothing from the other layers. `application` depends on `domain` and on its own ports (`GameRepository`, `EventPublisher`). `infrastructure` and `http` depend on `application`.

## A request, end to end

1. Express calls a route in `http/routes/` with the parsed input (`lado` header, params, body).
2. The route calls one method of `GameService`.
3. The use-case in `application/` loads the game (`loadGame`), refreshes its derived state, and calls a domain action (for example `playMove`).
4. The domain checks the rules, changes the game, and returns the result or throws a `DomainError`.
5. `saveGame` stores the game and publishes the events the change produced (pending requests, endings).
6. The route turns the result into the API's JSON with a presenter (`http/presenters/`) and the envelope `{ message, data, success }`.
7. A `DomainError` becomes HTTP 500 with the envelope; other errors go to the generic handler.

## Events

The domain never sends messages. The application publishes `GameEvent`s through the `EventPublisher` port. `infrastructure/socket/SocketHub` implements the port: it knows which socket belongs to which player, and emits the socket.io events the frontend already listens to (see `docs/events.md`).

## The domain in a few lines

- `Board` holds the grid, the fifty-move counter and the repeated positions.
- `candidateMoves` lists what a piece could do from its square (steps, castling, en passant, promotion names).
- `rawMoves` walks those moves and stops at blockers; `possibleMoves` marks the moves an opponent can capture.
- `legality` keeps the moves after which the own king is not attacked. It plays each move on a copy of the board.
- `Game` holds the sides, the turns, the offers, the promotion and the ending. Each action (`playMove`, `promotePawn`, `offerDraw`, ...) is a function in its own file.

## Decisions

See `docs/decisions/`. The wire format is kept as it is ([0005](decisions/0005-keep-wire-format.md)); the domain uses English ([0003](decisions/0003-english-naming.md)).
