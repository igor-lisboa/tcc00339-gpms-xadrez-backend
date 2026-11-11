# Socket events

The full table, with recipients and payloads, is in [specs/realtime-events.md](specs/realtime-events.md). The payloads and the moment each event is sent are also documented in `docs/api/openapi.yaml` under `x-socket-events`. The current implementation is in `index.js`. Target names are in [glossary](glossary.md).

Connect with the query `jogador`: `"<gameId>-<sideId>"` for a player, `"I.A."` for the AI player.

Events emitted today: `jogoCriado`, `jogoResetado`, `jogoFinalizado`, `adversarioEntrou`, `forcaIa`, `jogadaRealizada`, `empateProposto`, `empatePropostoResposta`, `resetProposto`, `resetPropostoResposta`, and one event per pending action (`responderPropostaEmpate`, `responderPropostaReset`, `promocaoPeao`).
