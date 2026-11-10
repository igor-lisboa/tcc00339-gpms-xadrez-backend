import type { Square } from "../board/SquareLookup";
import type { Piece } from "../pieces/Piece";
import { PieceNames } from "../pieces/pieceNames";

/** A piece and the square it stands on. The colour of a bishop's square matters to the rules below. */
export interface PlacedPiece {
    readonly square: Square;
    readonly piece: Piece;
}

const squareColour = (square: Square): number => (square.linha + square.coluna) % 2;

const others = (pieces: readonly PlacedPiece[]): PlacedPiece[] => pieces.filter(({ piece }) => piece.type !== PieceNames.King);

const countOf = (pieces: readonly PlacedPiece[], type: string): number => pieces.filter(({ piece }) => piece.type === type).length;

const bishopColours = (pieces: readonly PlacedPiece[]): Set<number> =>
    new Set(pieces.filter(({ piece }) => piece.type === PieceNames.Bishop).map(({ square }) => squareColour(square)));

/**
 * Whether `attacker` could checkmate `defender` by some series of legal moves, even with the defender's help
 * (FIDE 5.2.2 and 6.9). The defender's pieces count: they can block the squares around their own king.
 * - A bare king never mates.
 * - A pawn, a rook or a queen can always mate (a pawn can promote).
 * - A knight with a bishop, two knights, or bishops on both colours can mate a bare king.
 * - A single knight mates only if the defender has a piece other than a queen to block with.
 * - Bishops all on one colour mate only if the defender has a pawn, a knight, or a bishop on the other colour.
 */
export const canEverMate = (attacker: readonly PlacedPiece[], defender: readonly PlacedPiece[]): boolean => {
    const own = others(attacker);
    if (own.length === 0) {
        return false;
    }
    if (own.some(({ piece }) => piece.type === PieceNames.Pawn || piece.type === PieceNames.Rook || piece.type === PieceNames.Queen)) {
        return true;
    }
    const knights = countOf(own, PieceNames.Knight);
    const colours = bishopColours(own);
    if (knights >= 2 || (knights >= 1 && colours.size > 0) || colours.size > 1) {
        return true;
    }
    const helpers = others(defender);
    if (knights === 1) {
        return helpers.some(({ piece }) => piece.type !== PieceNames.Queen);
    }
    const [bishopColour] = [...colours];
    return helpers.some(
        ({ piece, square }) =>
            piece.type === PieceNames.Pawn ||
            piece.type === PieceNames.Knight ||
            (piece.type === PieceNames.Bishop && squareColour(square) !== bishopColour)
    );
};

/**
 * A dead position (FIDE 5.2.2) judged by material: neither side could ever checkmate.
 * For example king against king, king and one minor piece against a bare king,
 * or kings with bishops that all stand on squares of one colour.
 */
export const isDeadPosition = (white: readonly PlacedPiece[], black: readonly PlacedPiece[]): boolean =>
    !canEverMate(white, black) && !canEverMate(black, white);
