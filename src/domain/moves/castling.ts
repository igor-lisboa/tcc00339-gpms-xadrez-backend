import type { Board } from "../board/Board";
import type { MoveOption } from "../pieces/movements";
import { PieceNames } from "../pieces/pieceNames";

/** The movement option that marks a castling wing for a given side. */
export const castleOption = (whiteSideId: number, sideId: number, queenside: boolean): MoveOption => {
    const side = sideId === whiteSideId ? "white" : "black";
    return `${side}${queenside ? "Queenside" : "Kingside"}Castle` as MoveOption;
};

/** Whether a castle is physically possible for the king on its home square: rook unmoved, path empty, king unmoved. */
export const castlingPathClear = (board: Board, sideId: number, whiteSideId: number, queenside: boolean): boolean => {
    const row = sideId === whiteSideId ? 7 : 0;
    const rookColumn = queenside ? 0 : 7;
    const pathColumns = queenside ? [1, 2, 3] : [5, 6];
    const lookup = board.lookup;

    const king = board.pieceAt(lookup.fromPosition(row, 4));
    const rook = board.pieceAt(lookup.fromPosition(row, rookColumn));

    const pathEmpty = pathColumns.every((column) => board.pieceAt(lookup.fromPosition(row, column)) === null);
    return (
        king !== null &&
        king.type === PieceNames.King &&
        !king.hasMoved() &&
        rook !== null &&
        rook.type === PieceNames.Rook &&
        rook.sideId === sideId &&
        !rook.hasMoved() &&
        pathEmpty
    );
};
