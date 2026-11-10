import type { Board } from "../board/Board";
import type { MoveOption } from "../pieces/movements";
import { PieceNames } from "../pieces/pieceNames";

/** The movement option that marks a castling wing for a given side. */
export const castleOption = (whiteSideId: number, sideId: number, queenside: boolean): MoveOption => {
    const side = sideId === whiteSideId ? "white" : "black";
    return `${side}${queenside ? "Queenside" : "Kingside"}Castle` as MoveOption;
};

const homeRow = (sideId: number, whiteSideId: number): number => (sideId === whiteSideId ? 7 : 0);

/**
 * The lasting right to castle on one wing (FIDE 3.8.2.1): the king and that rook are on their
 * home squares and have never moved. A blocked path or a check does not take the right away.
 */
export const castlingRight = (board: Board, sideId: number, whiteSideId: number, queenside: boolean): boolean => {
    const row = homeRow(sideId, whiteSideId);
    const king = board.pieceAt(board.lookup.fromPosition(row, 4));
    const rook = board.pieceAt(board.lookup.fromPosition(row, queenside ? 0 : 7));
    return (
        king !== null &&
        king.type === PieceNames.King &&
        !king.hasMoved() &&
        rook !== null &&
        rook.type === PieceNames.Rook &&
        rook.sideId === sideId &&
        !rook.hasMoved()
    );
};

/** Whether a castle is physically possible for the king on its home square: the right to castle and an empty path. */
export const castlingPathClear = (board: Board, sideId: number, whiteSideId: number, queenside: boolean): boolean => {
    const row = homeRow(sideId, whiteSideId);
    const pathColumns = queenside ? [1, 2, 3] : [5, 6];
    const pathEmpty = pathColumns.every((column) => board.pieceAt(board.lookup.fromPosition(row, column)) === null);
    return castlingRight(board, sideId, whiteSideId, queenside) && pathEmpty;
};
