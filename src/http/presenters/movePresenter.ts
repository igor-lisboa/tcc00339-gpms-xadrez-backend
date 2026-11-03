import type { Square } from "../../domain/board/SquareLookup";
import type { MoveRecord } from "../../domain/moves/MoveRecord";
import type { Piece } from "../../domain/pieces/Piece";

export const squareWire = (square: Square) => ({ casa: square.name, linha: square.linha, coluna: square.coluna });

export const pieceWire = (piece: Piece): Record<string, unknown> => ({
    jogadasRealizadas: piece.performedMoves.map(sideMoveWire),
    ladoId: piece.sideId,
    tipo: piece.type,
    passosHabilitados: piece.definition.steps,
    valor: piece.value,
});

/** A move that was played, as the API returns it. */
export const sideMoveWire = (move: MoveRecord): Record<string, unknown> => ({
    identificador: move.identifier,
    casaOrigem: squareWire(move.from),
    casaDestino: squareWire(move.to),
    pecaCapturada: move.capturedPiece === null ? null : pieceWire(move.capturedPiece),
    nomeJogada: move.moveName,
    movimentosEspeciaisExecutados: move.specialMoves.map(sideMoveWire),
    momento: move.momentMs,
});
