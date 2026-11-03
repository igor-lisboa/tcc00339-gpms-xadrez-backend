/**
 * Something one side must answer before the game goes on: a draw offer, a reset offer, or a pawn promotion.
 * The fields keep the names used by the API today ("acao", "ladoId", "data").
 */
export interface RequestedAction {
    readonly acao: string;
    readonly ladoId: number;
    readonly data: Record<string, unknown>;
}

export const RequestedActionNames = {
    DrawOffer: "responderPropostaEmpate",
    ResetOffer: "responderPropostaReset",
    PawnPromotion: "promocaoPeao",
} as const;
