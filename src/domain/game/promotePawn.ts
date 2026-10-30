import { DomainError } from "../DomainError";
import { Piece } from "../pieces/Piece";
import { PieceNames, type PieceName } from "../pieces/pieceNames";
import type { MoveRecord } from "../moves/MoveRecord";
import type { Game } from "./Game";
import { RequestedActionNames } from "./RequestedAction";

export interface PromotedPawn {
    readonly piece: Piece;
    readonly move: MoveRecord;
    readonly opponentId: number;
}

/** Replaces the pawn that reached the last rank with the chosen piece, then passes the turn. */
export const promotePawn = (game: Game, sideId: number, pieceTypeId: number): PromotedPawn => {
    if (game.promotion === null) {
        throw new DomainError("Não é possível promover nenhum peão no momento");
    }

    const pending = game.requestedActions.find(
        (action) => action.acao === RequestedActionNames.PawnPromotion && action.ladoId === sideId
    );
    if (pending === undefined) {
        throw new DomainError("Promoção de peão inválida");
    }

    const choice = game.catalog.pieceTypes.find(
        (pieceType) => pieceType.id === pieceTypeId && pieceType.nome !== PieceNames.King && pieceType.nome !== PieceNames.Pawn
    );
    if (choice === undefined) {
        throw new DomainError("Peça inválida escolhida para a promoção do peão");
    }

    const { pawnSquare, move } = game.promotion;
    const pawn = game.board.pieceAt(pawnSquare);
    if (pawn === null) {
        throw new DomainError("Peão não encontrado para a promoção");
    }

    const piece = new Piece(sideId, choice.nome as PieceName, [...pawn.performedMoves]);
    game.board.place(pawnSquare, piece);
    game.promotion = null;

    const opponent = game.opponentOf(sideId);
    game.defineCurrentSide(opponent.id);
    game.requestedActions = game.requestedActions.filter((action) => action !== pending);

    return { piece, move, opponentId: opponent.id };
};
