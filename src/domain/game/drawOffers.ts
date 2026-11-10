import { DomainError } from "../DomainError";
import { GameEnding } from "../../shared/constants";
import type { Side } from "./Side";
import type { Game } from "./Game";
import { RequestedActionNames } from "./RequestedAction";
import { claimOnBoard, claimWithMove, type IntendedMove } from "./drawClaims";
import { playMove, type PlayedMove } from "./playMove";

export interface DrawOfferResult {
    readonly opponent: Side;
    /** True when the offer was a valid claim and ended the game. */
    readonly claimed: boolean;
    /** True when an offer now waits for the opponent's answer. */
    readonly offered: boolean;
    /** The intended move, when a claim with a move was not valid and the move was played instead (FIDE 9.5.1). */
    readonly played: PlayedMove | null;
}

/**
 * A draw offer (FIDE 9.1.2). Either side may offer while the game runs; the offer stands until the
 * opponent answers it, declines it by moving, or the game ends.
 * The side on turn may claim a draw (threefold repetition, FIDE 9.2, or fifty moves, FIDE 9.3) for the
 * position on the board or, with `intended`, for the position its next move would make. A valid claim
 * ends the game. A claim that is not valid counts as a draw offer (FIDE 9.1.2.4); with `intended`,
 * the move is played first (FIDE 9.5.1).
 */
export const offerDraw = (game: Game, sideId: number, intended?: IntendedMove): DrawOfferResult => {
    if (game.ending !== null) {
        throw new DomainError("Esse jogo já foi finalizado");
    }
    game.sideById(sideId);
    const opponent = game.opponentOf(sideId);

    const claim = validClaim(game, sideId, intended);
    if (claim !== null) {
        game.finish(claim);
        return { opponent, claimed: true, offered: false, played: null };
    }
    if (game.drawOfferedBy === sideId || (game.drawOfferedBy !== null && intended === undefined)) {
        throw new DomainError(`Já tem um empate proposto pelo lado ${game.sideById(game.drawOfferedBy).name}`);
    }

    // playing the move declines an offer the opponent had made, so the new offer below is the only one
    const played = intended === undefined ? null : playMove(game, sideId, intended.from, intended.to);
    if (game.ending !== null) {
        return { opponent, claimed: false, offered: false, played };
    }
    game.drawOfferedBy = sideId;
    game.requestedActions.push({
        acao: RequestedActionNames.DrawOffer,
        ladoId: opponent.id,
        data: { ladoId: opponent.id, jogoId: game.id },
    });
    return { opponent, claimed: false, offered: true, played };
};

/** Only the side on turn may claim: first for the position on the board, then for the one its intended move would make. */
const validClaim = (game: Game, sideId: number, intended: IntendedMove | undefined): GameEnding | null => {
    if (game.currentSideId !== sideId) {
        return null;
    }
    const onBoard = claimOnBoard(game);
    if (onBoard !== null || intended === undefined) {
        return onBoard;
    }
    return claimWithMove(game, sideId, intended);
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
