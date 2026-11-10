import { DomainError } from "../domain/DomainError";
import type { IntendedMove } from "../domain/game/drawClaims";
import { answerDraw, offerDraw } from "../domain/game/drawOffers";
import { answerReset, offerReset } from "../domain/game/resetOffers";
import type { MoveRecord } from "../domain/moves/MoveRecord";
import { loadGameForChange, saveGame, type GameContext } from "./persistence";
import { announceMove, resetGame } from "./gameCommands";

/** The squares of the move a claimant writes down; both or neither must be given. */
export interface IntendedMoveInput {
    readonly from?: string;
    readonly to?: string;
}

export interface DrawProposal {
    /** True when the offer was a valid claim that ended the game; then nothing is sent to the opponent. */
    readonly claimed: boolean;
    /** The intended move, when the claim was not valid and the move was played instead. */
    readonly played: MoveRecord | null;
}

/** A side offers a draw, or the side on turn claims one, optionally for the position its intended move would make. */
export const proposeDraw = (context: GameContext, gameId: number, sideId: number, input: IntendedMoveInput = {}): DrawProposal => {
    const intended = intendedMoveOf(input);
    const game = loadGameForChange(context, gameId);
    const { opponent, claimed, offered, played } = offerDraw(game, sideId, intended);
    saveGame(context, game);
    if (played !== null) {
        announceMove(context, game, sideId, played);
    }
    if (offered) {
        context.events.publish({ type: "drawOffered", gameId, opponent });
    }
    return { claimed, played: played?.move ?? null };
};

const intendedMoveOf = ({ from, to }: IntendedMoveInput): IntendedMove | undefined => {
    if (from === undefined && to === undefined) {
        return undefined;
    }
    if (from === undefined || to === undefined) {
        throw new DomainError("Informe a casa de origem e a casa de destino da jogada pretendida");
    }
    return { from, to };
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
