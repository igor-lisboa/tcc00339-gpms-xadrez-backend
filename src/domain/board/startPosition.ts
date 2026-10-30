import { Piece } from "../pieces/Piece";
import { PieceNames } from "../pieces/pieceNames";
import { Board, type Grid } from "./Board";
import type { SquareLookup } from "./SquareLookup";

/** The standard opening position. Black is on ranks 7 and 8 (rows 0 and 1), White on ranks 1 and 2. */
export const startingBoard = (lookup: SquareLookup, whiteSideId: number, blackSideId: number): Board => {
    const back = (sideId: number): Piece[] => [
        new Piece(sideId, PieceNames.Rook),
        new Piece(sideId, PieceNames.Knight),
        new Piece(sideId, PieceNames.Bishop),
        new Piece(sideId, PieceNames.Queen),
        new Piece(sideId, PieceNames.King),
        new Piece(sideId, PieceNames.Bishop),
        new Piece(sideId, PieceNames.Knight),
        new Piece(sideId, PieceNames.Rook),
    ];
    const pawns = (sideId: number): Piece[] => Array.from({ length: 8 }, () => new Piece(sideId, PieceNames.Pawn));

    const grid: Grid = Board.empty();
    grid[0] = back(blackSideId);
    grid[1] = pawns(blackSideId);
    grid[6] = pawns(whiteSideId);
    grid[7] = back(whiteSideId);

    return new Board(lookup, grid);
};
