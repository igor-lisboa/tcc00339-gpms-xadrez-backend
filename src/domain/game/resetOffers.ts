import { DomainError } from "../DomainError";
import type { Side } from "./Side";
import type { Game } from "./Game";
import { RequestedActionNames } from "./RequestedAction";

/** A reset can only be offered once the game has ended. */
export const offerReset = (game: Game, sideId: number): Side => {
    if (game.resetOfferedBy !== null) {
        throw new DomainError(`Já tem um reset proposto pelo lado ${game.sideById(game.resetOfferedBy).name}`);
    }
    if (game.ending === null) {
        throw new DomainError("Não é possível resetar um jogo que não foi finalizado");
    }
    // check the side before changing anything, so a bad side id leaves the game as it was
    game.sideById(sideId);
    const opponent = game.opponentOf(sideId);

    game.resetOfferedBy = sideId;
    game.requestedActions.push({
        acao: RequestedActionNames.ResetOffer,
        ladoId: opponent.id,
        data: { ladoId: opponent.id, jogoId: game.id },
    });
    return opponent;
};

/** Accepting is handled by the caller, which starts a fresh game. Declining clears the offer. */
export const answerReset = (game: Game, sideId: number, accepted: boolean): Side => {
    if (game.resetOfferedBy === null) {
        throw new DomainError("Nenhum reset foi proposto");
    }
    const pending = game.requestedActions.find(
        (action) => action.acao === RequestedActionNames.ResetOffer && action.ladoId === sideId
    );
    if (pending === undefined) {
        throw new DomainError("Não foi possível encontrar uma proposta de reset para responder");
    }

    const opponent = game.opponentOf(sideId);
    if (!accepted) {
        game.resetOfferedBy = null;
    }
    game.requestedActions = game.requestedActions.filter((action) => action !== pending);
    return opponent;
};
