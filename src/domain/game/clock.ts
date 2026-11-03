import { GameEnding } from "../../shared/constants";
import type { Game } from "./Game";
import { Turn } from "./Turn";

/** Starts a new turn for the side on the move, unless the game has already ended. */
export const startTurn = (game: Game): void => {
    checkClocks(game);
    if (game.ending === null) {
        game.turns.push(new Turn(game.currentSideId));
    }
};

/** Remaining time of each side. A side that runs out on its own turn loses the game. */
export const checkClocks = (game: Game): void => {
    checkClock(game, game.white.id);
    checkClock(game, game.black.id);
};

const checkClock = (game: Game, sideId: number): void => {
    const spent = game.turns
        .filter((turn) => turn.sideId === sideId)
        .reduce((total, turn) => total + turn.elapsedMs(), 0);
    const remaining = game.timeLimitMs - spent;
    if (remaining <= 0 && game.currentSideId === sideId && game.timeLimitMs !== -1) {
        game.finish(GameEnding.InsufficientMaterial);
    }
    game.sideById(sideId).remainingMs = remaining;
};
