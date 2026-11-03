import type { Board } from "../board/Board";
import type { Square } from "../board/SquareLookup";
import type { PieceName } from "../pieces/pieceNames";
import type { Piece } from "../pieces/Piece";
import type { EnPassantTarget } from "./candidateMoves";
import { rawMovesOf, sameSquare, type PieceWithMoves, type RawMove } from "./rawMoves";

/** A move a side can play now, with the opponent pieces that could capture on its target square. */
export interface PossibleMove {
    readonly from: Square;
    readonly to: Square;
    readonly moveName: string | null;
    readonly capturedPiece: Piece | null;
    readonly attackers: RawMove[];
    readonly pieceType: PieceName;
    readonly pieceValue: number;
    /** True when an opponent piece can capture on the target square. */
    readonly isCapturable: boolean;
    /** True when the move takes an opponent piece. */
    readonly isCapture: boolean;
}

/**
 * Possible moves of one side. A move is dropped when its target square is attacked
 * and the piece may not enter attacked squares (the king).
 */
export const possibleMovesOfSide = (
    own: PieceWithMoves[],
    opponent: PieceWithMoves[],
    board: Board,
    enPassant: EnPassantTarget | null
): PossibleMove[] => {
    const ownMoves = rawMovesOf(own, board, enPassant, false);
    const opponentThreats = rawMovesOf(opponent, board, enPassant, true);

    const result: PossibleMove[] = [];
    for (const move of ownMoves) {
        const attackers = opponentThreats.filter((threat) => sameSquare(threat.to, move.to) && threat.canCapture);
        const isCapturable = attackers.length > 0;

        if (isCapturable && !move.mayEnterAttackedSquare) {
            continue;
        }

        result.push({
            from: move.from,
            to: move.to,
            moveName: move.moveName,
            capturedPiece: move.capturedPiece,
            attackers,
            pieceType: move.pieceType,
            pieceValue: move.pieceValue,
            isCapturable,
            isCapture: move.capturedPiece !== null,
        });
    }
    return result;
};
