import type { Piece } from "../pieces/Piece";
import type { Square } from "../board/SquareLookup";

/** A move that was actually played. Castling also produces a record for the rook, nested in specialMoves. */
export interface MoveRecord {
    readonly identifier: number;
    readonly from: Square;
    readonly to: Square;
    readonly capturedPiece: Piece | null;
    readonly moveName: string | null;
    readonly specialMoves: MoveRecord[];
    readonly momentMs: number;
}

export const createMoveRecord = (
    identifier: number,
    from: Square,
    to: Square,
    capturedPiece: Piece | null = null,
    moveName: string | null = null,
    specialMoves: MoveRecord[] = []
): MoveRecord => ({
    identifier,
    from,
    to,
    capturedPiece,
    moveName,
    specialMoves,
    momentMs: Date.now(),
});
