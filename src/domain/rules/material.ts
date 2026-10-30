import type { Piece } from "../pieces/Piece";
import { PieceNames } from "../pieces/pieceNames";

/**
 * Whether a side still has enough material to give checkmate.
 * A side with fewer than two pieces, or with only a king and a minor piece, does not.
 */
export const hasMinimumMaterial = (pieces: readonly Piece[]): boolean => {
    const count = (type: string) => pieces.filter((piece) => piece.type === type).length;

    if (pieces.length < 2) {
        return false;
    }
    if (pieces.length === 2) {
        return pieces.some((piece) => piece.type === PieceNames.Queen || piece.type === PieceNames.Rook || piece.type === PieceNames.Pawn);
    }
    if (pieces.length === 3) {
        const bishops = count(PieceNames.Bishop);
        return bishops === 2 || (bishops > 0 && count(PieceNames.Knight) > 0);
    }
    return true;
};

/** Neither side can give checkmate: a draw by insufficient material. */
export const isInsufficientMaterial = (whitePieces: readonly Piece[], blackPieces: readonly Piece[]): boolean =>
    !hasMinimumMaterial(whitePieces) && !hasMinimumMaterial(blackPieces);
