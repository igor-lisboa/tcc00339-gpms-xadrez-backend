import type { Game } from "../../domain/game/Game";
import type { Side } from "../../domain/game/Side";
import type { Turn } from "../../domain/game/Turn";
import type { RequestedAction } from "../../domain/game/RequestedAction";
import type { PossibleMove } from "../../domain/moves/possibleMoves";
import type { PieceWithMoves } from "../../domain/moves/rawMoves";
import type { Piece } from "../../domain/pieces/Piece";
import type { EndingInfo } from "../../domain/catalog";
import { pieceWire, sideMoveWire, squareWire } from "./movePresenter";

/**
 * The JSON shapes the API has always returned. The domain uses English names;
 * these functions keep the names the frontend expects.
 */

export const turnWire = (turn: Turn) => ({
    ladoId: turn.sideId,
    momentoInicio: turn.startedAtMs,
    momentoFim: turn.endedAtMs,
    totalMilisegundos: turn.totalMs,
});

export const sideWire = (side: Side) => ({
    id: side.id,
    lado: side.name,
    cabecaPraBaixo: side.headDown,
    jogadasRealizadas: side.performedMoves.map(sideMoveWire),
    tipo: side.playerType === null ? null : { id: side.playerType.id, nome: side.playerType.nome },
    tempoMilisegundosRestante: side.remainingMs,
    possiveisJogadas: side.possibleMoves.map(possibleMoveWire),
    pecas: side.pieces.map(pieceOnSquareWire),
});

export const possibleMoveWire = (move: PossibleMove) => ({
    casaOrigem: squareWire(move.from),
    casaDestino: squareWire(move.to),
    nome: move.moveName,
    peca: move.pieceType,
    pecaValor: move.pieceValue,
    pecaCaptura: move.capturedPiece === null ? null : pieceWire(move.capturedPiece),
    capturantes: move.attackers.map((attacker) => ({
        casaOrigem: squareWire(attacker.from),
        casaDestino: squareWire(attacker.to),
        nomeJogada: attacker.moveName,
        podeCapturavel: attacker.mayEnterAttackedSquare,
        pecaCaptura: attacker.capturedPiece === null ? null : pieceWire(attacker.capturedPiece),
        captura: attacker.canCapture,
        anda: attacker.canMove,
        peca: attacker.pieceType,
        pecaValor: attacker.pieceValue,
    })),
    capturavel: move.isCapturable,
    captura: move.isCapture,
});

export const pieceOnSquareWire = (entry: PieceWithMoves) => ({
    casa: entry.square.name,
    linha: entry.square.linha,
    coluna: entry.square.coluna,
    peca: pieceWire(entry.piece),
    movimentosPossiveis: entry.candidates.map((candidate) => ({
        casaDestino: squareWire(candidate.to),
        nomeJogada: candidate.moveName,
        direcao: legacyDirection(candidate.direction),
        anda: candidate.canMove,
        captura: candidate.canCapture,
        podeCapturavel: candidate.mayEnterAttackedSquare,
        casas: candidate.steps,
    })),
});

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
    acoesSolicitadas: game.requestedActions.map(requestedActionWire),
    casaPeaoPromocao: game.promotion === null
        ? null
        : { casaPeao: squareWire(game.promotion.pawnSquare), jogadaPromocao: sideMoveWire(game.promotion.move) },
    empatePropostoPeloLadoId: game.drawOfferedBy,
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
    resetPropostoPeloLadoId: game.resetOfferedBy,
    ladosIdDeslogados: game.sidesWithoutPlayer().map((side) => side.id),
    enPassantCasaCaptura: game.enPassant === null
        ? null
        : { casaCaptura: game.enPassant.captureSquare.name, casaPeao: game.enPassant.pawnSquare.name },
    finalizado: game.ending === null ? null : game.ending.tipo,
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

const DIRECTION_NAMES: Record<string, string> = {
    forward: "frente",
    backward: "tras",
    left: "esquerda",
    right: "direita",
    forwardLeft: "frenteEsquerda",
    forwardRight: "frenteDireita",
    backwardLeft: "trasEsquerda",
    backwardRight: "trasDireita",
    special: "especial",
};

const legacyDirection = (direction: string): string => DIRECTION_NAMES[direction];
