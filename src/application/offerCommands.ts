import { answerDraw, offerDraw } from "../domain/game/drawOffers";
import { answerReset, offerReset } from "../domain/game/resetOffers";
import { loadGameForChange, saveGame, type GameContext } from "./persistence";
import { resetGame } from "./gameCommands";

/** The side on turn proposes a draw. */
export const proposeDraw = (context: GameContext, gameId: number, sideId: number): void => {
    const game = loadGameForChange(context, gameId);
    const opponent = offerDraw(game, sideId);
    saveGame(context, game);
    context.events.publish({ type: "drawOffered", gameId, opponent });
};

/** The other side answers a draw. Accepting ends the game; declining is announced to the proposer. */
export const answerDrawOffer = (context: GameContext, gameId: number, sideId: number, accepted: boolean): void => {
    const game = loadGameForChange(context, gameId);
    const opponent = answerDraw(game, sideId, accepted);
    saveGame(context, game);
    if (!accepted) {
        context.events.publish({ type: "drawAnswered", gameId, opponent, accepted });
    }
};

/** A finished game can be reset: the other side must agree first. */
export const proposeReset = (context: GameContext, gameId: number, sideId: number): void => {
    const game = loadGameForChange(context, gameId);
    const opponent = offerReset(game, sideId);
    saveGame(context, game);
    context.events.publish({ type: "resetOffered", gameId, opponent });
};

/** Accepting restarts the game; the proposer is told the answer either way. */
export const answerResetOffer = (context: GameContext, gameId: number, sideId: number, accepted: boolean): void => {
    const game = loadGameForChange(context, gameId);
    const opponent = answerReset(game, sideId, accepted);
    saveGame(context, game);
    if (accepted) {
        resetGame(context, gameId);
    }
    context.events.publish({ type: "resetAnswered", gameId, opponent, accepted });
};
