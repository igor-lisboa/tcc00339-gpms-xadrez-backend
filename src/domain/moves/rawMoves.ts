import type { Board } from "../board/Board";
import type { Square } from "../board/SquareLookup";
import type { Direction } from "../pieces/movements";
import type { PieceName } from "../pieces/pieceNames";
import type { Piece } from "../pieces/Piece";
import { PieceNames } from "../pieces/pieceNames";
import { candidateMovesFrom, type CandidateMove, type EnPassantTarget, type MoveRules } from "./candidateMoves";

/** A piece with its candidate moves already worked out. */
export interface PieceWithMoves {
    readonly square: Square;
    readonly piece: Piece;
    readonly candidates: CandidateMove[];
}

/** A move that is physically possible for a piece, before the king-safety rule. */
export interface RawMove {
    readonly sideId: number;
    readonly from: Square;
    readonly to: Square;
    readonly moveName: string | null;
    readonly mayEnterAttackedSquare: boolean;
    readonly capturedPiece: Piece | null;
    readonly canCapture: boolean;
    readonly canMove: boolean;
    readonly pieceType: PieceName;
    readonly pieceValue: number;
}

export const sameSquare = (a: Square, b: Square): boolean => a.linha === b.linha && a.coluna === b.coluna;

/** Works out the candidate moves of every piece of one side. */
export const piecesOfSide = (board: Board, sideId: number, rules: MoveRules): PieceWithMoves[] =>
    board
        .occupiedSquares()
        .filter(({ piece }) => piece.sideId === sideId)
        .map(({ square, piece }) => ({ square, piece, candidates: candidateMovesFrom(rules, square, piece) }));

/**
 * Walks each piece's candidate moves in order and stops at blockers.
 * With threatsOnly = true, empty squares are kept even when the move cannot move there:
 * that is how a pawn's diagonal "attacks" an empty square.
 */
export const rawMovesOf = (
    pieces: PieceWithMoves[],
    board: Board,
    enPassant: EnPassantTarget | null,
    threatsOnly: boolean
): RawMove[] => {
    const result: RawMove[] = [];

    for (const entry of pieces) {
        for (const group of groupByDirection(entry.candidates)) {
            for (const candidate of [...group].sort((a, b) => a.steps - b.steps)) {
                let target = board.pieceAt(candidate.to);

                if (enPassant !== null && target === null && entry.piece.type === PieceNames.Pawn && sameSquare(enPassant.captureSquare, candidate.to)) {
                    target = board.pieceAt(enPassant.pawnSquare);
                }

                const ownPiece = target !== null && target.sideId === entry.piece.sideId;
                const isSpecial = candidate.direction === "special";

                if (ownPiece && !isSpecial) {
                    break;
                }
                if (!ownPiece && !candidate.canCapture && target !== null) {
                    break;
                }

                const blockedByEnemyNoCapture = target !== null && !candidate.canCapture;
                const blockedNoMove = target === null && !candidate.canMove;

                if (!blockedByEnemyNoCapture && (!blockedNoMove || threatsOnly) && !ownPiece) {
                    result.push({
                        sideId: entry.piece.sideId,
                        from: entry.square,
                        to: candidate.to,
                        moveName: candidate.moveName,
                        mayEnterAttackedSquare: candidate.mayEnterAttackedSquare,
                        capturedPiece: target,
                        canCapture: candidate.canCapture,
                        canMove: candidate.canMove,
                        pieceType: entry.piece.type,
                        pieceValue: entry.piece.value,
                    });
                    if (target !== null && !isSpecial) {
                        break;
                    }
                }
            }
        }
    }

    return result;
};

/** Candidates grouped by direction, keeping the order in which each direction first appears. */
const groupByDirection = (candidates: CandidateMove[]): CandidateMove[][] => {
    const groups = new Map<Direction, CandidateMove[]>();
    for (const candidate of candidates) {
        const group = groups.get(candidate.direction) ?? [];
        group.push(candidate);
        groups.set(candidate.direction, group);
    }
    return [...groups.values()];
};
