# 0006: The domain returns results and the application publishes events; presenters shape the JSON

Status: accepted

**Context.** The legacy domain (`Jogo.js`) saved itself, wrote into the database, and emitted socket events through a global object. That made the rules impossible to test without the server.

**Decision.**
- The domain changes the `Game` and returns results. It has no I/O.
- Use-cases in `application/` load a game, call one domain action, save it, and publish `GameEvent`s through the `EventPublisher` port.
- `infrastructure/socket/SocketHub` decides who receives each event, using the same recipient rules as before.
- Presenters in `src/http/presenters/` turn domain objects into the JSON the API has always returned.

**Consequences.** Rules are unit-tested without HTTP or sockets. The events and the JSON shape are the contract to keep stable. Changing a presenter changes the API, so the characterization tests guard it.
