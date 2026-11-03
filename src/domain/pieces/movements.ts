/**
 * Movement rules of each piece, written as data.
 * A direction is named from the point of view of the side that owns the piece:
 * "forward" is toward the opponent.
 */

export type Direction =
    | "forward"
    | "backward"
    | "left"
    | "right"
    | "forwardLeft"
    | "forwardRight"
    | "backwardLeft"
    | "backwardRight"
    | "special";

export type MoveOption =
    | "move"
    | "capture"
    | "firstPawnMove"
    | "whiteKingsideCastle"
    | "whiteQueensideCastle"
    | "blackKingsideCastle"
    | "blackQueensideCastle";

export interface Movement {
    readonly direction: Exclude<Direction, "special">;
    readonly options: readonly MoveOption[];
}

/** Offsets of the knight's L-shaped jumps (row, column). */
export const KNIGHT_JUMPS: readonly (readonly [number, number])[] = [
    [2, 1],
    [2, -1],
    [-2, 1],
    [-2, -1],
    [1, 2],
    [1, -2],
    [-1, 2],
    [-1, -2],
];

const orthogonal: Movement[] = [
    { direction: "forward", options: ["move", "capture"] },
    { direction: "backward", options: ["move", "capture"] },
    { direction: "left", options: ["move", "capture"] },
    { direction: "right", options: ["move", "capture"] },
];

const diagonal: Movement[] = [
    { direction: "forwardLeft", options: ["move", "capture"] },
    { direction: "forwardRight", options: ["move", "capture"] },
    { direction: "backwardLeft", options: ["move", "capture"] },
    { direction: "backwardRight", options: ["move", "capture"] },
];

export const KING_MOVEMENTS: Movement[] = [
    { direction: "forward", options: ["move", "capture"] },
    { direction: "backward", options: ["move", "capture"] },
    { direction: "left", options: ["move", "capture", "blackKingsideCastle", "whiteQueensideCastle"] },
    { direction: "right", options: ["move", "capture", "whiteKingsideCastle", "blackQueensideCastle"] },
    ...diagonal,
];

export const QUEEN_MOVEMENTS: Movement[] = [...orthogonal, ...diagonal];
export const ROOK_MOVEMENTS: Movement[] = orthogonal;
export const BISHOP_MOVEMENTS: Movement[] = diagonal;

export const PAWN_MOVEMENTS: Movement[] = [
    { direction: "forward", options: ["move", "firstPawnMove"] },
    { direction: "forwardLeft", options: ["capture"] },
    { direction: "forwardRight", options: ["capture"] },
];
