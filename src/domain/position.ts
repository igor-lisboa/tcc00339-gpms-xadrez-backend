import type { Board } from "./board/Board";
import type { EnPassantTarget, MoveRules } from "./moves/candidateMoves";

/** Facts about the two sides that the rules need: which one is White and which way each one moves. */
export interface Geometry {
    readonly whiteSideId: number;
    readonly blackSideId: number;
    readonly headsDown: (sideId: number) => boolean;
}

/** Everything the rules read to decide what is possible: the board, the en passant right, and the geometry. */
export interface Position {
    readonly board: Board;
    readonly enPassant: EnPassantTarget | null;
    readonly geometry: Geometry;
}

export const opponentOf = (geometry: Geometry, sideId: number): number =>
    sideId === geometry.whiteSideId ? geometry.blackSideId : geometry.whiteSideId;

/**
 * Move-generation rules for a position. Castling is off unless the caller provides a rule for it,
 * which avoids recursion when only attacks are being checked.
 */
export const movesRulesFor = (
    position: Position,
    castlingAllowed: (sideId: number, queenside: boolean) => boolean = () => false
): MoveRules => ({
    board: position.board,
    enPassant: position.enPassant,
    whiteSideId: position.geometry.whiteSideId,
    headsDown: position.geometry.headsDown,
    castlingAllowed,
});
