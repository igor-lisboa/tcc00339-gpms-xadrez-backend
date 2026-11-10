import { GameEnding } from "../../shared/constants";
import { canEverMate } from "../rules/material";
import type { Game } from "./Game";
import { Turn } from "./Turn";

/** Starts a new turn for the side on the move, unless the game has already ended. */
export const startTurn = (game: Game): void => {
    checkClocks(game);
    if (game.ending === null) {
        game.turns.push(new Turn(game.currentSideId));
    }
};

/** Remaining time of each side. A side that runs out on its own turn loses the game, or draws if the other side could never mate. */
export const checkClocks = (game: Game): void => {
    checkClock(game, game.white.id);
    checkClock(game, game.black.id);
};

const checkClock = (game: Game, sideId: number): void => {
    const spent = game.turns
        .filter((turn) => turn.sideId === sideId)
        .reduce((total, turn) => total + turn.elapsedMs(), 0);
    const remaining = game.timeLimitMs - spent;
    const limited = game.timeLimitMs !== -1;
    if (remaining <= 0 && game.currentSideId === sideId && limited) {
        judgeTimeout(game, sideId);
    }
    game.sideById(sideId).remainingMs = limited ? Math.max(remaining, 0) : remaining;
};

/**
 * FIDE 6.9: running out of time loses, unless the opponent could not checkmate by any series of legal moves,
 * which is a draw. The pieces of the side that ran out count too: they could block their own king.
 */
const judgeTimeout = (game: Game, sideId: number): void => {
    game.refresh();
    const opponent = game.opponentOf(sideId);
    if (canEverMate(opponent.pieces, game.sideById(sideId).pieces)) {
        game.finish(sideId === game.white.id ? GameEnding.BlackWins : GameEnding.WhiteWins);
    } else {
        game.finish(GameEnding.TimeoutDraw);
    }
};
