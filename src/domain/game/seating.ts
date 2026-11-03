import type { GameTypeInfo, PlayerTypeInfo } from "../catalog";
import { GameEnding } from "../../shared/constants";
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

/** Seats a player on a side. Passing null removes the player and resigns the game. */
export const seatPlayer = (game: Game, sideId: number, playerType: PlayerTypeInfo | null): Side => {
    const side = game.sideById(sideId);
    if (playerType === null) {
        side.removeType();
        game.finish(GameEnding.Resignation);
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
