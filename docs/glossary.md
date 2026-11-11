# Glossary: pt-br → English

Status: **Phase 1 complete for names used by the API.** Lookup data values are translated in Phase 3, with the data. Before using a new word in code, add it here first.

## Domain terms

| pt-br (today) | English (target) | Notes |
|---|---|---|
| Jogo | Game | |
| Tabuleiro | Board | |
| Casa | Square | Names like `E4` stay as they are |
| Peca / Peça | Piece | |
| Lado | Side | `ladoId` becomes `sideId` |
| Branco / Preto | White / Black | Ids 0 and 1 |
| Jogador | Player | |
| Humano / I.A. | Human / AI | Player types, ids 0 and 1 |
| Turno | Turn | |
| Jogada | Move | |
| Jogada possível | Possible move | |
| Jogada realizada | Performed move | |
| Ação solicitada | Requested action | |
| Rei | King | |
| Rainha | Queen | |
| Torre | Rook | |
| Bispo | Bishop | |
| Cavalo | Knight | |
| Peão | Pawn | |
| Roque menor / maior | Kingside / queenside castling | |
| Promoção do peão | Pawn promotion | |
| En passant | En passant | Already English in the data |
| Cheque | Check | |
| Xeque-mate | Checkmate | |
| Afogamento / Rei afogado | Stalemate | |
| Empate | Draw | |
| Desistência | Resignation | |
| Finalizado | Finished | |
| Proposta de reset / empate | Reset / draw offer | |
| Tempo de turno | Turn time limit | `tempoDeTurnoEmMilisegundos` becomes `turnTimeLimitMs` |

## Identifiers in code (examples)

| Today | Target |
|---|---|
| `JogoService` | `GameService` (split into use-cases) |
| `JogoController` | `GameController` |
| `src/models/Jogo.js` | `src/domain/game/Game.ts` |
| `TabelaEquivalencia` | `SquareLookup` |
| `TipoPecaService` | `PieceTypeService` (or removed, see plan) |

## Routes and fields

The routes and JSON fields will be renamed in the refactor. The legacy adapter keeps the old names alive until the frontend migrates. Full mapping: Phase 1.

| Today | Target |
|---|---|
| `/jogos` | `/games` |
| `/pecas` | `/pieces` |
| `/possiveis-jogadas` | `/possible-moves` |
| `/jogadores` | `/players` |
| `/tipos-de-peca` | `/piece-types` |
| `/lados-do-jogo` | `/sides` |
| `/tabela-equivalencia` | `/square-lookup` |
| `/tipos-de-finalizacao` | `/ending-types` |
| `/enumeracoes` | `/enums` |
| `/ia` | `/ai` |
| header `lado` | header `side` |

## Socket events

| Today | Target |
|---|---|
| `jogoCriado` | `gameCreated` |
| `jogadaRealizada` | `moveMade` |
| `jogoFinalizado` | `gameFinished` |
| `adversarioEntrou` | `opponentJoined` |
| `empateProposto` | `drawOffered` |
| `empatePropostoResposta` | `drawOfferAnswered` |
| `resetProposto` | `resetOffered` |
| `resetPropostoResposta` | `resetOfferAnswered` |
| `promocaoPeao` | `pawnPromotion` |
| `forcaIa` | `forceAi` |
| `jogoResetado` | `gameReset` |
| `acoesSolicitadas` | `actionsRequested` |

## JSON fields (game, side, move, piece)

These are the response fields the API returns today. The legacy adapter keeps the old names until the frontend migrates.

| Today | Target | Where |
|---|---|---|
| `id` | `id` | game |
| `ladoBranco` / `ladoPreto` | `whiteSide` / `blackSide` | game |
| `tabuleiro` | `board` | game |
| `turnos` | `turns` | game |
| `tempoDeTurnoEmMilisegundos` | `turnTimeLimitMs` | game |
| `ladoIdAtual` | `currentSideId` | game |
| `enPassantCasaCaptura` | `enPassantSquare` | game |
| `finalizado` | `ending` | game |
| `ladoIdVencedor` | `winnerSideId` | game, summary, event payload |
| `acoesSolicitadas` | `requestedActions` | game |
| `casaPeaoPromocao` | `promotionSquare` | game |
| `empatePropostoPeloLadoId` | `drawOfferedBySideId` | game |
| `resetPropostoPeloLadoId` | `resetOfferedBySideId` | game |
| `chequeLadoAtual` | `currentSideInCheck` | game |
| `tipoJogo` | `gameType` | game |
| `lado` (name, e.g. "Branco") | `name` | side |
| `cabecaPraBaixo` | `headDown` | side |
| `jogadasRealizadas` | `performedMoves` | side, piece |
| `tipo` (player type on a side) | `playerType` | side |
| `tempoMilisegundosRestante` | `remainingMs` | side |
| `possiveisJogadas` | `legalMoves` | side |
| `pecas` | `pieces` | side |
| `casaOrigem` / `casaDestino` | `fromSquare` / `toSquare` | move |
| `nome` (move name, e.g. "Roque Menor") | `moveName` | move |
| `captura` / `capturavel` | `isCapture` / `isCapturable` | move |
| `pecaCaptura` | `capturedPiece` | move |
| `peca` (piece type name) | `pieceType` | move |
| `pecaValor` / `valor` | `pieceValue` | move, piece |
| `pecaAmeacadaNaPosicaoAtual` | `pieceThreatenedOnSquare` | AI move |
| `ladosIdDeslogados` | `sidesWithoutPlayer` | summary |
| `jogadaRealizada` | `performedMove` | event payload |
| `chequeLadoAtual` | `currentSideInCheck` | event payload |
| `promocaoPara` | `promotedTo` | event payload |
| `jogoFinalizacao` | `endingText` | event payload |
| `motivoFinalizacao` | `endingReason` | game, summary, event payload |

Lookup values (data in `database.json`) still use the Portuguese strings for now: piece names (`Rei`, `Rainha`, …), side names (`Branco`, `Preto`), player types (`Humano`, `I.A.`), finishing texts. They are translated with the data in Phase 3. Until then, `npm run check:names` allows these lines with the marker `names-check:ignore`.
