import { KING_MOVEMENTS, KNIGHT_JUMPS, PAWN_MOVEMENTS, BISHOP_MOVEMENTS, QUEEN_MOVEMENTS, ROOK_MOVEMENTS, type Movement } from "./movements";
import { PieceNames, type PieceName } from "./pieceNames";
import type { MoveRecord } from "../moves/MoveRecord";

/** Fixed rules of a piece type. */
export interface PieceDefinition {
    readonly movements: readonly Movement[];
    /** How many squares a piece may walk in one direction. */
    readonly steps: number;
    readonly value: number;
    /** Knight-style jumps relative to the current square; empty for sliding pieces. */
    readonly jumps: readonly (readonly [number, number])[];
}

const sliding = (movements: readonly Movement[], value: number): PieceDefinition => ({
    movements,
    steps: 8,
    value,
    jumps: [],
});

export const PIECE_DEFINITIONS: Record<PieceName, PieceDefinition> = {
    [PieceNames.King]: { movements: KING_MOVEMENTS, steps: 1, value: 10, jumps: [] },
    [PieceNames.Queen]: sliding(QUEEN_MOVEMENTS, 9),
    [PieceNames.Rook]: sliding(ROOK_MOVEMENTS, 5),
    [PieceNames.Bishop]: sliding(BISHOP_MOVEMENTS, 3),
    [PieceNames.Knight]: { movements: [], steps: 1, value: 3, jumps: KNIGHT_JUMPS },
    [PieceNames.Pawn]: { movements: PAWN_MOVEMENTS, steps: 1, value: 1, jumps: [] },
};

/** A piece on the board. It keeps the moves it has made, because castling and the double step depend on it. */
export class Piece {
    readonly performedMoves: MoveRecord[];

    constructor(
        readonly sideId: number,
        readonly type: PieceName,
        performedMoves: MoveRecord[] = []
    ) {
        this.performedMoves = performedMoves;
    }

    get definition(): PieceDefinition {
        return PIECE_DEFINITIONS[this.type];
    }

    get value(): number {
        return this.definition.value;
    }

    hasMoved(): boolean {
        return this.performedMoves.length > 0;
    }

    recordMove(move: MoveRecord): void {
        this.performedMoves.push(move);
    }

    clone(): Piece {
        return new Piece(this.sideId, this.type, [...this.performedMoves]);
    }
}
