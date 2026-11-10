import type { Game } from "../../domain/game/Game";
import type { RequestedAction } from "../../domain/game/RequestedAction";
import type { Piece } from "../../domain/pieces/Piece";
import type { EndingInfo } from "../../domain/catalog";
import { canClaimDraw } from "../../domain/game/drawClaims";
import { pieceWire, sideMoveWire, squareWire } from "./movePresenter";
import { sideWire, turnWire } from "./sidePresenter";

/**
 * The JSON shapes of a whole game and of its summary. The domain uses English names;
 * these functions keep the names the frontend expects.
 */

export const requestedActionWire = (action: RequestedAction) => ({
    acao: action.acao,
    ladoId: action.ladoId,
    data: action.data,
});

export const endingWire = (ending: EndingInfo | null) => (ending === null ? null : { id: ending.id, tipo: ending.tipo });

/** The full game, as GET /jogos/:id has always returned it. */
export const gameWire = (game: Game) => ({
    id: game.id,
    ladoBranco: sideWire(game.white),
    ladoPreto: sideWire(game.black),
    tabuleiro: boardWire(game),
    turnos: game.turns.map(turnWire),
    tempoDeTurnoEmMilisegundos: game.timeLimitMs,
    ladoIdAtual: game.currentSideId,
    enPassantCasaCaptura: game.enPassant === null
        ? null
        : { casaCaptura: squareWire(game.enPassant.captureSquare), casaPeao: squareWire(game.enPassant.pawnSquare) },
    finalizado: endingWire(game.ending),
    ladoIdVencedor: game.winnerSideId,
    acoesSolicitadas: game.requestedActions.map(requestedActionWire),
    casaPeaoPromocao: game.promotion === null
        ? null
        : { casaPeao: squareWire(game.promotion.pawnSquare), jogadaPromocao: sideMoveWire(game.promotion.move) },
    empatePropostoPeloLadoId: game.drawOfferedBy,
    empateReivindicavel: canClaimDraw(game),
    resetPropostoPeloLadoId: game.resetOfferedBy,
    chequeLadoAtual: game.currentInCheck,
    tipoJogo: { id: game.gameType.id, integranteLadoTipo: game.gameType.integranteLadoTipo },
});

/** The summary view, as GET /jogos/:id/simples returns it. */
export const summaryWire = (game: Game, superSimplified: boolean) => ({
    id: game.id,
    ladoIdAtual: game.currentSideId,
    ladoBrancoTempoMilisegundosRestante: game.white.remainingMs,
    ladoPretoTempoMilisegundosRestante: game.black.remainingMs,
    tempoDeTurnoEmMilisegundos: game.timeLimitMs,
    chequeLadoAtual: game.currentInCheck,
    acoesSolicitadas: game.requestedActions.map(requestedActionWire),
    casaPeaoPromocao: game.promotion === null
        ? null
        : { casaPeao: squareWire(game.promotion.pawnSquare), jogadaPromocao: sideMoveWire(game.promotion.move) },
    empatePropostoPeloLadoId: game.drawOfferedBy,
    empateReivindicavel: canClaimDraw(game),
    resetPropostoPeloLadoId: game.resetOfferedBy,
    ladosIdDeslogados: game.sidesWithoutPlayer().map((side) => side.id),
    enPassantCasaCaptura: game.enPassant === null
        ? null
        : { casaCaptura: game.enPassant.captureSquare.name, casaPeao: game.enPassant.pawnSquare.name },
    finalizado: game.ending === null ? null : game.ending.tipo,
    ladoIdVencedor: game.winnerSideId,
    tipoJogo: game.gameType.integranteLadoTipo.map((type) => type.nome).join(" X "),
    tabuleiro: summaryBoardWire(game, superSimplified),
});

const summaryBoardWire = (game: Game, superSimplified: boolean) =>
    game.board.rows().map((row) =>
        row.map((piece) => {
            if (piece === null) {
                return null;
            }
            return superSimplified
                ? `${piece.type}-${piece.sideId}`
                : { tipo: piece.type, ladoId: piece.sideId, jogadasRealizadasLength: piece.performedMoves.length, valor: piece.value };
        })
    );

const boardWire = (game: Game) => ({
    casas: game.board.rows().map((row) => row.map((piece: Piece | null) => (piece === null ? null : pieceWire(piece)))),
    fotografiasTabuleiro: [],
    qtdTurnosSemCapturaOuMovimentoDePeao: game.board.halfMoveClock,
});
