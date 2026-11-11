import { EndingReason, GameEnding } from "../../shared/constants";
import { canEverMate } from "../rules/material";
import type { Game } from "./Game";
import { Turn } from "./Turn";

/** The time one side has used and has left. remainingMs is null when the game has no time limit. */
export interface SideClock {
    readonly spentMs: number;
    readonly remainingMs: number | null;
}

/** Both sides' clocks, read at one instant. */
export interface GameClocks {
    readonly white: SideClock;
    readonly black: SideClock;
}

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

/**
 * The time each side has used and has left, read at one instant. Both sides use the same instant, so while a
 * limit lasts, spentMs + remainingMs is the limit for each side.
 */
export const clocksOf = (game: Game, nowMs: number = Date.now()): GameClocks => ({
    white: sideClockOf(game, game.white.id, nowMs),
    black: sideClockOf(game, game.black.id, nowMs),
});

const sideClockOf = (game: Game, sideId: number, nowMs: number): SideClock => {
    const spentMs = game.turns
        .filter((turn) => turn.sideId === sideId)
        .reduce((total, turn) => total + turn.elapsedMs(nowMs), 0);
    const remainingMs = game.timeLimitMs === -1 ? null : Math.max(game.timeLimitMs - spentMs, 0);
    return { spentMs, remainingMs };
};

const checkClock = (game: Game, sideId: number): void => {
    const clock = sideClockOf(game, sideId, Date.now());
    // remaining 0 is the time being gone: the side on turn loses it
    if (clock.remainingMs === 0 && game.currentSideId === sideId) {
        judgeTimeout(game, sideId);
    }
    game.sideById(sideId).remainingMs = clock.remainingMs;
};

/**
 * FIDE 6.9: running out of time loses, unless the opponent could not checkmate by any series of legal moves,
 * which is a draw. The pieces of the side that ran out count too: they could block their own king.
 */
const judgeTimeout = (game: Game, sideId: number): void => {
    game.refresh();
    const opponent = game.opponentOf(sideId);
    if (canEverMate(opponent.pieces, game.sideById(sideId).pieces)) {
        game.finish(sideId === game.white.id ? GameEnding.BlackWins : GameEnding.WhiteWins, null, EndingReason.Timeout);
    } else {
        game.finish(GameEnding.TimeoutDraw);
    }
};
