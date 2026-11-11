import type { GameTypeInfo, PlayerTypeInfo } from "../catalog";
import { EndingReason, GameEnding } from "../../shared/constants";
import { canEverMate } from "../rules/material";
import type { Game } from "./Game";
import type { Side } from "./Side";
import { startTurn } from "./clock";

/** Game-type setup: the AI X AI type seats an AI on both sides. */
export const applyGameType = (game: Game, gameType: GameTypeInfo): void => {
    game.gameType = gameType;
    if (gameType.id === 2) {
        const ai = game.catalog.playerTypes.find((type) => type.id === 1);
        if (ai !== undefined) {
            seatPlayer(game, game.white.id, ai);
            seatPlayer(game, game.black.id, ai);
        }
    }
};

/**
 * FIDE 5.1.2: the side that resigns loses, unless the opponent could not checkmate by any series of legal
 * moves; then the game is a draw. With the other seat empty there is nobody to win.
 */
const resign = (game: Game, side: Side): void => {
    const opponent = game.opponentOf(side.id);
    if (opponent.playerType === null) {
        game.finish(GameEnding.Resignation);
        return;
    }
    game.refresh();
    if (canEverMate(opponent.pieces, side.pieces)) {
        game.finish(GameEnding.Resignation, opponent.id);
    } else {
        game.finish(GameEnding.InsufficientMaterial, null, EndingReason.Resignation);
    }
};

/** Seats a player on a side. Passing null removes the player and resigns the game. */
export const seatPlayer = (game: Game, sideId: number, playerType: PlayerTypeInfo | null): Side => {
    const side = game.sideById(sideId);
    if (playerType === null) {
        side.removeType();
        resign(game, side);
        return side;
    }

    side.defineType(playerType);

    // a human against the computer: the computer takes the other side
    if (game.gameType.id === 1 && playerType.id === 0) {
        const ai = game.catalog.playerTypes.find((type) => type.id === 1);
        if (ai !== undefined) {
            seatPlayer(game, game.opponentOf(sideId).id, ai);
        }
    }

    if (game.white.playerType !== null && game.black.playerType !== null && game.turns.length === 0) {
        startTurn(game);
    }
    return side;
};
