import { DomainError } from "../DomainError";
import { GameEnding } from "../../shared/constants";
import { executeMove } from "../moves/executeMove";
import { createMoveRecord } from "../moves/MoveRecord";
import { sameSquare } from "../moves/rawMoves";
import { PieceNames } from "../pieces/pieceNames";
import type { Game } from "./Game";
import { FIFTY_MOVE_PLIES, timesAppearedBefore, timesPositionAppeared } from "./repetition";

/** A move the claimant writes down instead of playing it (FIDE 9.2.1.1 and 9.3.1). Square names, e.g. "E2". */
export interface IntendedMove {
    readonly from: string;
    readonly to: string;
}

/** The draw the side on turn may claim for the position on the board (FIDE 9.2.1.2 and 9.3.2), if any. */
export const claimOnBoard = (game: Game): GameEnding | null => {
    if (timesPositionAppeared(game) >= 3) {
        return GameEnding.ThreefoldRepetition;
    }
    if (game.board.halfMoveClock >= FIFTY_MOVE_PLIES) {
        return GameEnding.FiftyMoveRule;
    }
    return null;
};

/** Whether the side on turn could claim a draw right now for the position on the board, so a client can offer the claim. */
export const canClaimDraw = (game: Game): boolean => game.ending === null && claimOnBoard(game) !== null;

/**
 * The draw the side on turn may claim for the position its intended move would make, if any.
 * The move must be legal. It is tried on a copy of the board; the game does not change.
 * A pawn move or a capture can never make either claim: it makes a new position and restarts the 50-move count.
 */
export const claimWithMove = (game: Game, sideId: number, intended: IntendedMove): GameEnding | null => {
    const from = game.squares.fromName(intended.from);
    const to = game.squares.fromName(intended.to);
    const move = game.legalMovesOf(sideId).find((option) => sameSquare(option.from, from) && sameSquare(option.to, to));
    if (move === undefined) {
        throw new DomainError("A casa de destino da jogada escolhida não pode ser realizada pela peça escolhida");
    }
    if (move.pieceType === PieceNames.Pawn || move.isCapture) {
        return null;
    }

    const trial = game.board.clone();
    const executed = executeMove(trial, from, to, move.moveName, game.enPassant);
    // mark the moved pieces on the copy, so a first king or rook move loses its castling right as it would in play
    const record = createMoveRecord(game.turns.length, from, to, null, move.moveName, []);
    trial.pieceAt(to)?.recordMove(record);
    executed.castlingRook?.piece.recordMove(record);
    if (timesAppearedBefore(game, trial, game.opponentOf(sideId).id) >= 2) {
        return GameEnding.ThreefoldRepetition;
    }
    if (game.board.halfMoveClock + 1 >= FIFTY_MOVE_PLIES) {
        return GameEnding.FiftyMoveRule;
    }
    return null;
};
