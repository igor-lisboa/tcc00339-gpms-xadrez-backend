import type { Piece } from "../pieces/Piece";
import { PieceNames } from "../pieces/pieceNames";

const isMinorPiece = (type: string): boolean => type === PieceNames.Bishop || type === PieceNames.Knight;

/**
 * Whether a side can still give checkmate, judged by its pieces other than the king.
 * It cannot with nothing else, with one bishop or one knight, or with two knights.
 * Every other combination counts as enough (same-colour bishops are not detected).
 */
const canMate = (others: readonly string[]): boolean => {
    if (others.length === 0) {
        return false;
    }
    if (others.length === 1) {
        return !isMinorPiece(others[0]);
    }
    if (others.length === 2) {
        return !others.every((type) => type === PieceNames.Knight);
    }
    return true;
};

/**
 * Whether a side still has enough material to give checkmate.
 * A bare king, a king with one bishop or knight, and a king with two knights do not.
 */
export const hasMinimumMaterial = (pieces: readonly Piece[]): boolean =>
    canMate(pieces.filter((piece) => piece.type !== PieceNames.King).map((piece) => piece.type));

/** Neither side can give checkmate: a draw by insufficient material. */
export const isInsufficientMaterial = (whitePieces: readonly Piece[], blackPieces: readonly Piece[]): boolean =>
    !hasMinimumMaterial(whitePieces) && !hasMinimumMaterial(blackPieces);
