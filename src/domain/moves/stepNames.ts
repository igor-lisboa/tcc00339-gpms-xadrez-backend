import type { Square } from "../board/SquareLookup";
import type { Direction, MoveOption } from "../pieces/movements";
import { MoveNames, PieceNames } from "../pieces/pieceNames";
import type { Piece } from "../pieces/Piece";
import type { MoveRules } from "./candidateMoves";

/** Names a step: en passant, the pawn's double step, promotion, castling. Later rules win, as in the legacy code. */
export const nameOfStep = (
    rules: MoveRules,
    piece: Piece,
    to: Square,
    steps: number,
    direction: Direction,
    options: readonly MoveOption[]
): string | null => {
    let name: string | null = null;

    if (piece.type === PieceNames.Pawn) {
        if (rules.enPassant !== null && rules.enPassant.captureSquare.name === to.name) {
            name = MoveNames.EnPassant;
        }
        if (options.includes("firstPawnMove") && steps === 2) {
            name = MoveNames.PawnFirstMove;
        }
        const lastRow = piece.sideId !== rules.whiteSideId ? 7 : 0;
        if (to.linha === lastRow) {
            name = MoveNames.PawnPromotion;
        }
    }

    if (piece.type === PieceNames.King && steps === 2) {
        const white = piece.sideId === rules.whiteSideId;
        const kingsideOpen = options.includes("whiteKingsideCastle") || options.includes("blackKingsideCastle");
        const queensideOpen = options.includes("whiteQueensideCastle") || options.includes("blackQueensideCastle");
        if (kingsideOpen && direction === (white ? "right" : "left")) {
            name = MoveNames.KingsideCastle;
        }
        if (queensideOpen && direction === (white ? "left" : "right")) {
            name = MoveNames.QueensideCastle;
        }
    }

    return name;
};
