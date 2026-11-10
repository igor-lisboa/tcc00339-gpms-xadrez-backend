import type { OccupiedSquare } from "../board/Board";
import type { Square } from "../board/SquareLookup";
import { PieceNames } from "../pieces/pieceNames";
import type { Position } from "../position";

const KING_STEPS: readonly (readonly [number, number])[] = [
    [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1],
];

const keyOf = (square: Square): string => `${square.linha},${square.coluna}`;

/**
 * A dead position (FIDE 5.2.2) made by blocked pawns: only kings and pawns are left, no pawn can ever move
 * or capture, and no king can ever reach an enemy pawn it could take. Then the pawns never move again,
 * a king never steps onto a square a pawn attacks, and kings cannot check each other, so no check and no
 * checkmate can ever happen. The answer is "dead" only when that is certain; any doubt says "not dead".
 */
export const isBlockedPawnDeadPosition = (position: Position): boolean => {
    const pieces = position.board.occupiedSquares();
    const pawns = pieces.filter(({ piece }) => piece.type === PieceNames.Pawn);
    if (position.enPassant !== null || pawns.length === 0 || pieces.some(({ piece }) => piece.type !== PieceNames.Pawn && piece.type !== PieceNames.King)) {
        return false;
    }
    if (!pawns.every((pawn) => isFrozen(position, pawn))) {
        return false;
    }
    const kings = pieces.filter(({ piece }) => piece.type === PieceNames.King);
    return kings.every((king) => !canEverCapture(position, king, pawns));
};

/** The squares ahead of a pawn: straight on, and the two diagonals it attacks. */
const aheadOf = (position: Position, pawn: OccupiedSquare): { front: Square | null; attacks: Square[] } => {
    const row = pawn.square.linha + (position.geometry.headsDown(pawn.piece.sideId) ? -1 : 1);
    const lookup = position.board.lookup;
    const attacks = [-1, 1]
        .map((step) => lookup.tryFromPosition(row, pawn.square.coluna + step))
        .filter((square): square is Square => square !== null);
    return { front: lookup.tryFromPosition(row, pawn.square.coluna), attacks };
};

/** A pawn is frozen when a pawn stands right in front of it and no enemy piece stands where it could capture. */
const isFrozen = (position: Position, pawn: OccupiedSquare): boolean => {
    const { front, attacks } = aheadOf(position, pawn);
    const blocker = front === null ? null : position.board.pieceAt(front);
    if (blocker === null || blocker.type !== PieceNames.Pawn) {
        return false;
    }
    return attacks.every((square) => {
        const target = position.board.pieceAt(square);
        return target === null || target.sideId === pawn.piece.sideId;
    });
};

/**
 * Walks every square the king could ever reach: never through its own pawns, never onto a square an enemy
 * pawn attacks. The other king is treated as able to step aside. Reaching an enemy pawn means it can be taken.
 */
const canEverCapture = (position: Position, king: OccupiedSquare, pawns: readonly OccupiedSquare[]): boolean => {
    const attacked = new Set(
        pawns.filter(({ piece }) => piece.sideId !== king.piece.sideId).flatMap((pawn) => aheadOf(position, pawn).attacks.map(keyOf))
    );
    if (attacked.has(keyOf(king.square))) {
        return true;
    }
    const seen = new Set([keyOf(king.square)]);
    const queue: Square[] = [king.square];
    for (let square = queue.shift(); square !== undefined; square = queue.shift()) {
        for (const [rowStep, columnStep] of KING_STEPS) {
            const next = position.board.lookup.tryFromPosition(square.linha + rowStep, square.coluna + columnStep);
            if (next === null || seen.has(keyOf(next)) || attacked.has(keyOf(next))) {
                continue;
            }
            seen.add(keyOf(next));
            const occupant = position.board.pieceAt(next);
            if (occupant !== null && occupant.type === PieceNames.Pawn) {
                if (occupant.sideId !== king.piece.sideId) {
                    return true;
                }
                continue;
            }
            queue.push(next);
        }
    }
    return false;
};
