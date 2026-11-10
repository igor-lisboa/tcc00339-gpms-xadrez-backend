import type { Board } from "../board/Board";
import { castlingRight } from "../moves/castling";
import { sameSquare } from "../moves/rawMoves";
import { PieceNames } from "../pieces/pieceNames";
import type { Game } from "./Game";

/** Fifty moves by each side: 100 plies without a capture or a pawn move (FIDE 9.3). */
export const FIFTY_MOVE_PLIES = 100;
/** Seventy-five moves by each side: 150 plies, after which the game is drawn (FIDE 9.6.2). */
export const SEVENTY_FIVE_MOVE_PLIES = 150;

/**
 * What makes two positions "the same" besides the pieces on their squares (FIDE 9.2.2):
 * the side to move, the castling rights of both sides, and an en passant capture that can really be played.
 * The game must be refreshed first, because the en passant part reads the legal moves.
 */
export const repetitionContext = (game: Game): string => contextOf(game, game.board, game.currentSideId, enPassantPart(game));

const contextOf = (game: Game, board: Board, sideToMove: number, enPassant: string): string => {
    const rights = game
        .sides()
        .flatMap((side) => [false, true].map((queenside) => (castlingRight(board, side.id, game.white.id, queenside) ? "1" : "0")))
        .join("");
    return `${sideToMove}|${rights}|${enPassant}`;
};

const enPassantPart = (game: Game): string => {
    const target = game.enPassant;
    if (target === null) {
        return "-";
    }
    const playable = game
        .legalMovesOf(game.currentSideId)
        .some((move) => move.pieceType === PieceNames.Pawn && sameSquare(move.to, target.captureSquare));
    return playable ? target.captureSquare.name : "-";
};

/** Records the position on the board, as it now stands with the side on turn. */
export const recordPosition = (game: Game): number => game.board.recordPosition(repetitionContext(game));

/** How many times the position on the board, with the side on turn, has appeared. */
export const timesPositionAppeared = (game: Game): number => game.board.repetitionsOf(repetitionContext(game));

/**
 * How many times a position has already appeared, given the board after a move that is not a pawn move
 * (`board` is a copy carrying the game's history) and the side that would then be on turn.
 * After a move that is not a pawn move there is no en passant right.
 */
export const timesAppearedBefore = (game: Game, board: Board, sideToMove: number): number =>
    board.repetitionsOf(contextOf(game, board, sideToMove, "-"));
