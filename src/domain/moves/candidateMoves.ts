import type { Board } from "../board/Board";
import type { Square, SquareLookup } from "../board/SquareLookup";
import type { Direction, MoveOption } from "../pieces/movements";
import { MoveNames, PieceNames } from "../pieces/pieceNames";
import type { Piece } from "../pieces/Piece";
import { castleOption } from "./castling";
import { nameOfStep } from "./stepNames";

/** What the move generator needs to know about the position. */
export interface MoveRules {
    readonly board: Board;
    readonly enPassant: EnPassantTarget | null;
    readonly whiteSideId: number;
    readonly headsDown: (sideId: number) => boolean;
    /** Whether the side may castle on the given wing. Castling is only offered when this says yes. */
    readonly castlingAllowed: (sideId: number, queenside: boolean) => boolean;
}

/** The square a pawn may capture onto right after an opponent's double step, and the pawn it would take. */
export interface EnPassantTarget {
    readonly captureSquare: Square;
    readonly pawnSquare: Square;
}

/** A move a piece could make from its square, before the rules of check are applied. */
export interface CandidateMove {
    readonly to: Square;
    readonly moveName: string | null;
    readonly direction: Direction;
    readonly canMove: boolean;
    readonly canCapture: boolean;
    /** False for the king: it may never step onto a square the opponent attacks. */
    readonly mayEnterAttackedSquare: boolean;
    /** How many squares away from the origin (0 for knight jumps). */
    readonly steps: number;
}

type Offset = readonly [number, number];

/** Row and column change for each direction, from the point of view of a side whose head points down (White). */
const OFFSETS: Record<Exclude<Direction, "special">, (headDown: boolean) => Offset> = {
    forward: (down) => (down ? [-1, 0] : [1, 0]),
    backward: (down) => (down ? [1, 0] : [-1, 0]),
    left: (down) => (down ? [0, -1] : [0, 1]),
    right: (down) => (down ? [0, 1] : [0, -1]),
    forwardLeft: (down) => (down ? [-1, -1] : [1, 1]),
    forwardRight: (down) => (down ? [-1, 1] : [1, -1]),
    backwardLeft: (down) => (down ? [1, -1] : [-1, 1]),
    backwardRight: (down) => (down ? [1, 1] : [-1, -1]),
};

const stepFrom = (lookup: SquareLookup, square: Square, offset: Offset): Square | null =>
    lookup.tryFromPosition(square.linha + offset[0], square.coluna + offset[1]);

/** Every move a piece could make from `square`, ignoring whether it leaves its king in check. */
export const candidateMovesFrom = (rules: MoveRules, square: Square, piece: Piece): CandidateMove[] => {
    const moves: CandidateMove[] = [];

    for (const movement of piece.definition.movements) {
        const steps = stepsAllowed(rules, square, piece, movement.options);
        const offset = OFFSETS[movement.direction](rules.headsDown(piece.sideId));

        let current = square;
        for (let count = 1; count <= steps; count++) {
            const next = stepFrom(rules.board.lookup, current, offset);
            if (next === null) {
                break;
            }
            moves.push({
                to: next,
                moveName: nameOfStep(rules, piece, next, count, movement.direction, movement.options),
                direction: movement.direction,
                canMove: movement.options.includes("move"),
                canCapture: movement.options.includes("capture"),
                mayEnterAttackedSquare: piece.type !== PieceNames.King,
                steps: count,
            });
            current = next;
        }
    }

    for (const [linhaDelta, colunaDelta] of piece.definition.jumps) {
        const to = rules.board.lookup.tryFromPosition(square.linha + linhaDelta, square.coluna + colunaDelta);
        if (to !== null) {
            moves.push({
                to,
                moveName: MoveNames.Knight,
                direction: "special",
                canMove: true,
                canCapture: true,
                mayEnterAttackedSquare: piece.type !== PieceNames.King,
                steps: 0,
            });
        }
    }

    return moves;
};

/** Normal steps, plus one extra for a pawn's double step and one for each castling wing still open. */
const stepsAllowed = (rules: MoveRules, square: Square, piece: Piece, options: readonly MoveOption[]): number => {
    let steps = piece.definition.steps;

    if (options.includes("firstPawnMove") && canDoubleStep(rules.board, square)) {
        steps += 1;
    }

    if (piece.type === PieceNames.King && isHome(square, piece.sideId, rules.whiteSideId)) {
        if (options.includes(castleOption(rules.whiteSideId, piece.sideId, false))) {
            steps += rules.castlingAllowed(piece.sideId, false) ? 1 : 0;
        }
        if (options.includes(castleOption(rules.whiteSideId, piece.sideId, true))) {
            steps += rules.castlingAllowed(piece.sideId, true) ? 1 : 0;
        }
    }

    return steps;
};

const canDoubleStep = (board: Board, square: Square): boolean => {
    const pawn = board.pieceAt(square);
    return pawn !== null && pawn.type === PieceNames.Pawn && !pawn.hasMoved();
};

const isHome = (square: Square, sideId: number, whiteSideId: number): boolean => {
    const homeRow = sideId === whiteSideId ? 7 : 0;
    return square.linha === homeRow && square.coluna === 4;
};

