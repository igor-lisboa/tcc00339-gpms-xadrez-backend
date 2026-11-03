import { DomainError } from "../DomainError";
import { GameEnding } from "../../shared/constants";
import type { Side } from "./Side";
import type { Game } from "./Game";
import { RequestedActionNames } from "./RequestedAction";

/** Fifty moves each: 100 moves without a capture or a pawn move. */
const FIFTY_MOVE_LIMIT = 100;

/** Only the side on turn can offer a draw. Offering when the fifty-move limit is reached ends the game as a draw. */
export const offerDraw = (game: Game, sideId: number): Side => {
    if (game.ending !== null) {
        throw new DomainError("Esse jogo já foi finalizado");
    }
    if (game.drawOfferedBy !== null) {
        throw new DomainError(`Já tem um empate proposto pelo lado ${game.sideById(game.drawOfferedBy).name}`);
    }
    if (game.currentSideId !== sideId) {
        throw new DomainError("Aguarde sua vez para propor um empate");
    }
    if (game.board.halfMoveClock >= FIFTY_MOVE_LIMIT) {
        game.finish(GameEnding.FiftyMoveRule);
    }

    game.drawOfferedBy = sideId;
    const opponent = game.opponentOf(sideId);
    game.requestedActions.push({
        acao: RequestedActionNames.DrawOffer,
        ladoId: opponent.id,
        data: { ladoId: opponent.id, jogoId: game.id },
    });
    return opponent;
};

/** Accepting ends the game by agreement. Declining clears the offer. */
export const answerDraw = (game: Game, sideId: number, accepted: boolean): Side => {
    if (game.drawOfferedBy === null) {
        throw new DomainError("Nenhum empate foi proposto");
    }
    const pending = game.requestedActions.find(
        (action) => action.acao === RequestedActionNames.DrawOffer && action.ladoId === sideId
    );
    if (pending === undefined) {
        throw new DomainError("Não foi possível encontrar uma proposta de empate para responder");
    }

    const opponent = game.opponentOf(sideId);
    if (accepted) {
        game.finish(GameEnding.MutualAgreement);
    } else {
        game.drawOfferedBy = null;
    }
    game.requestedActions = game.requestedActions.filter((action) => action !== pending);
    return opponent;
};
