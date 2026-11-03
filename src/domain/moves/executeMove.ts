import type { Board } from "../board/Board";
import type { Square } from "../board/SquareLookup";
import type { Piece } from "../pieces/Piece";
import { MoveNames, PieceNames } from "../pieces/pieceNames";
import type { EnPassantTarget } from "./candidateMoves";
import { sameSquare } from "./rawMoves";

export interface ExecutedMove {
    /** The piece removed by the move: the one on the target square, or the pawn taken en passant. */
    readonly capturedPiece: Piece | null;
    /** The rook that moved during castling, if any. */
    readonly castlingRook: { readonly piece: Piece; readonly from: Square; readonly to: Square } | null;
}

/**
 * Plays a move on the board: moves the piece, removes an en passant pawn, and moves the rook when castling.
 * It changes the board it is given, so callers pass a clone when they only want to test a move.
 * It does not record history, promote, or change the turn; the game does that.
 */
export const executeMove = (
    board: Board,
    from: Square,
    to: Square,
    moveName: string | null,
    enPassant: EnPassantTarget | null
): ExecutedMove => {
    const mover = board.pieceAt(from);
    if (mover === null) {
        throw new Error("executeMove called without a piece on the origin square");
    }

    let capturedPiece = board.pieceAt(to);

    board.place(from, null);
    board.place(to, mover);

    if (enPassant !== null && mover.type === PieceNames.Pawn && sameSquare(to, enPassant.captureSquare)) {
        const pawn = board.pieceAt(enPassant.pawnSquare);
        if (pawn !== null) {
            capturedPiece = pawn;
            board.place(enPassant.pawnSquare, null);
        }
    }

    const castlingRook = moveName === MoveNames.KingsideCastle || moveName === MoveNames.QueensideCastle
        ? moveCastlingRook(board, mover, from, moveName === MoveNames.QueensideCastle)
        : null;

    return { capturedPiece, castlingRook };
};

const moveCastlingRook = (
    board: Board,
    king: Piece,
    kingFrom: Square,
    queenside: boolean
): ExecutedMove["castlingRook"] => {
    const row = kingFrom.linha;
    const lookup = board.lookup;
    const rookFrom = lookup.fromPosition(row, queenside ? 0 : 7);
    const rookTo = lookup.fromPosition(row, queenside ? 3 : 5);

    const rook = board.pieceAt(rookFrom);
    if (rook === null || rook.type !== PieceNames.Rook || rook.sideId !== king.sideId || rook.hasMoved()) {
        return null;
    }

    board.place(rookFrom, null);
    board.place(rookTo, rook);
    return { piece: rook, from: rookFrom, to: rookTo };
};
