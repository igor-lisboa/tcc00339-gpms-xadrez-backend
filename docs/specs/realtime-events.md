# Real-time events (socket.io)

## Purpose
Tell players and the AI worker when something changed, without polling.

## Connecting
A client connects with the query `jogador`. For a player it is `"<gameId>-<sideId>"`, for example `"0-1"`. The AI worker uses `"I.A."`. The server keeps a list of connected `{socketId, identificador}`.

## Events
| Event | Sent to | Payload |
|---|---|---|
| `jogoCriado` | everyone | none |
| `jogoResetado` | both sides of the game and the AI | none |
| `jogoFinalizado` | both sides and the AI | `{ jogoFinalizacao }` (the finishing text) |
| `adversarioEntrou` | the opponent of the side that joined (and the AI if it is an AI side) | none |
| `forcaIa` | the AI worker | none |
| `jogadaRealizada` | the opponent of the mover (and the AI if it is an AI side) | `{ jogadaRealizada, chequeLadoAtual, promocaoPara }` |
| `empateProposto` | the opponent | `{ jogoId, ladoId }` |
| `empatePropostoResposta` | the proposer (when declined) | `{ jogoId, ladoId }` |
| `resetProposto` | the opponent | `{ jogoId, ladoId }` |
| `resetPropostoResposta` | the proposer | the answer (boolean) |
| `responderPropostaEmpate`, `responderPropostaReset`, `promocaoPeao` | the side that must answer | the requested action's data |

The last row is one event per pending action; the event name is the action name.

## Tests
- `realtime-events.test.ts`: "tells the other side about a move...", "tells the opponent about a draw offer...", "notifies the AI worker when the game it plays in is created", "asks the AI worker to run when /ia is called"

## Known deviations
- On disconnect, the wrong entry is removed: `indexOf` is called with a new object literal, which never matches, so `splice(-1, 1)` removes the last connected player. Covered by a todo until the fix.
- `resetPropostoResposta` and `empatePropostoResposta` send different payload shapes (a raw value and an object).
- Events are sent through a global `EventEmitter`. Target: an `EventPublisher` port.
