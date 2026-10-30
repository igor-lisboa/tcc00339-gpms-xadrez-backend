---
name: add-socket-event
description: Add or change a socket.io event sent to players or the AI worker. Use when a client needs a new notification.
---

# Add a socket event

1. Read `docs/events.md` and `docs/specs/realtime-events.md`.
2. Name the event in English using `docs/glossary.md` (the glossary has the target names; the legacy name is kept by the adapter until the frontend migrates).
3. Add the payload type in `src/application/ports/EventPublisher.ts` (the port) and implement it in `src/infrastructure/socket/`.
4. Decide the recipients using the connected players list, the same way the existing events do: the side's identifier `"<gameId>-<sideId>"` and `"I.A."` for AI sides.
5. Tests: one integration test with `socket.io-client` that checks the recipient gets the event and the other side does not.
6. Update `docs/events.md` and `docs/specs/realtime-events.md`.
7. If the event is part of the legacy contract, add it to the adapter map too (`src/http/legacy/`).
8. Run `npm run typecheck && npm run lint && npm test`.
