# Real-time events (socket.io)

## Purpose
Tell players and the AI player when something changed, without polling.

## Connecting
A client connects with the query `jogador`. For a player it is `"<gameId>-<sideId>"`, for example `"0-1"`. The AI player uses `"I.A."`. The server keeps a list of connected `{socketId, identificador}`.

## Events
| Event | Sent to | Payload |
|---|---|---|
| `jogoCriado` | everyone | none |
| `jogoResetado` | both sides of the game and the AI | none |
| `jogoFinalizado` | both sides and the AI | `{ jogoFinalizacao, motivoFinalizacao, ladoIdVencedor, ladoIdDesistente, ladoBrancoTempoMilisegundosRestante, ladoBrancoTempoMilisegundosGasto, ladoPretoTempoMilisegundosRestante, ladoPretoTempoMilisegundosGasto }` (the finishing text, why the game ended, the side that won or null, the side that resigned or null, and the clocks as they stopped) |
| `adversarioEntrou` | the opponent of the side that joined (and the AI if it is an AI side) | none |
| `forcaIa` | the AI player | none |
| `jogadaRealizada` | the opponent of the mover (and the AI if it is an AI side) | `{ jogadaRealizada, chequeLadoAtual, promocaoPara, empateReivindicavel, ladoBrancoTempoMilisegundosRestante, ladoBrancoTempoMilisegundosGasto, ladoPretoTempoMilisegundosRestante, ladoPretoTempoMilisegundosGasto }` (`empateReivindicavel`: the receiver, now on turn, could claim a draw; the clocks are in ms, read when the event is sent) |
| `empateProposto` | the opponent | `{ jogoId, ladoId }` |
| `empatePropostoResposta` | the proposer, when the offer is declined by an answer or by the opponent's move | none |
| `resetProposto` | the opponent | `{ jogoId, ladoId }` |
| `resetPropostoResposta` | the proposer | the answer (boolean) |
| `responderPropostaEmpate`, `responderPropostaReset`, `promocaoPeao` | the side that must answer | the requested action's data |

The last row is one event per pending action; the event name is the action name.

The full contract (every event, its recipients, its payload, when it is sent and what the AI player does with it) is in `docs/api/openapi.yaml` under `x-socket-events`. That file is what the frontend reads; this table is the behaviour spec.

## Tests
- `realtime-events.test.ts`: "tells the other side about a move...", "tells the opponent about a draw offer...", "tells the proposer the offer was declined when the opponent moves instead of answering", "sends the ending and the winning side when a game finishes", "notifies the AI player when the game it plays in is created", "asks the AI player to run when /ia is called"

## Known deviations
- Fixed in the TypeScript port: a disconnect removes the player that left (test: "keeps the other players connected when one of them disconnects").
- `resetPropostoResposta` sends the answer as a raw boolean; `empatePropostoResposta` sends no payload (it is only sent for a decline).
- Events are published through the `EventPublisher` port and sent by `SocketHub` (see decision 0006).
- A request that is still pending (`responderPropostaEmpate`, `responderPropostaReset`, `promocaoPeao`) is sent again each time the game is saved while it waits, so it can arrive more than once. The documented contract says so; it is not yet a one-time notice.
