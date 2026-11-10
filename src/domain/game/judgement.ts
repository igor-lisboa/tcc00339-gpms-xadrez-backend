import { GameEnding } from "../../shared/constants";
import { isBlockedPawnDeadPosition } from "../rules/blockedPawns";
import { isDeadPosition } from "../rules/material";
import type { Game } from "./Game";
import { checkClocks, startTurn } from "./clock";
import { SEVENTY_FIVE_MOVE_PLIES, recordPosition } from "./repetition";

/**
 * Sets whose turn it is, starting a new turn if the side changed, and judges the position for that side.
 * Checkmate and stalemate come first: a move that mates wins even if it also leaves little material (FIDE 5.1.1).
 */
export const defineCurrentSide = (game: Game, sideId: number): void => {
    game.currentSideId = sideId;
    const last = game.turns.at(-1);
    if (last !== undefined && last.sideId !== sideId) {
        last.end();
        startTurn(game);
    }
    game.refresh();
    judgeSide(game, sideId);
    if (isDeadPosition(game.white.pieces, game.black.pieces)) {
        game.finish(GameEnding.InsufficientMaterial);
    }
    if (isBlockedPawnDeadPosition(game.position())) {
        game.finish(GameEnding.DeadPosition);
    }
};

/** Recomputes the check flag and the clocks, as a read of the game needs. */
export const refreshForRead = (game: Game): void => {
    game.refresh();
    game.currentInCheck = game.isKingAttacked(game.currentSideId);
    checkClocks(game);
};

/**
 * After a move is complete and the turn has passed: records the position and applies the draws
 * that need no claim (FIDE 9.6). A checkmate found by defineCurrentSide has already ended the game.
 */
export const judgeAfterMove = (game: Game): void => {
    const appeared = recordPosition(game);
    if (appeared >= 5) {
        game.finish(GameEnding.FivefoldRepetition);
    }
    if (game.board.halfMoveClock >= SEVENTY_FIVE_MOVE_PLIES) {
        game.finish(GameEnding.SeventyFiveMoveRule);
    }
};

/** Checkmate or stalemate for the side on the move. */
const judgeSide = (game: Game, sideId: number): void => {
    game.currentInCheck = game.isKingAttacked(sideId);
    if (game.legalMovesOf(sideId).length > 0) {
        return;
    }
    if (!game.currentInCheck) {
        game.finish(GameEnding.Stalemate);
    } else {
        game.finish(sideId === game.white.id ? GameEnding.BlackWins : GameEnding.WhiteWins);
    }
};
