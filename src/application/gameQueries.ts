import { DomainError } from "../domain/DomainError";
import type { Game } from "../domain/game/Game";
import { RequestedActionNames } from "../domain/game/RequestedAction";
import type { PieceWithMoves } from "../domain/moves/rawMoves";
import { legalMovesOf } from "../domain/moves/legality";
import { sameSquare } from "../domain/moves/rawMoves";
import type { PossibleMove } from "../domain/moves/possibleMoves";
import { loadGame, type GameContext } from "./persistence";

/** Every stored game, as it is (no derived state is refreshed). */
export const listGames = (context: GameContext): Game[] => context.repository.all();

export const getGame = (context: GameContext, gameId: number): Game => loadGame(context, gameId);

export const getTurns = (context: GameContext, gameId: number) => loadGame(context, gameId).turns;

export const getSides = (context: GameContext, gameId: number) => {
    const game = loadGame(context, gameId);
    return { white: game.white, black: game.black };
};

export const getCurrentSide = (context: GameContext, gameId: number) => {
    const game = loadGame(context, gameId);
    return game.sideById(game.currentSideId);
};

export const getSidesWithoutPlayer = (context: GameContext, gameId: number) => {
    const game = loadGame(context, gameId);
    if (game.ending !== null) {
        throw new DomainError("Esse jogo já foi finalizado");
    }
    return game.sidesWithoutPlayer();
};

export const getPiecesOfSide = (context: GameContext, gameId: number, sideId: number): PieceWithMoves[] =>
    loadGame(context, gameId).sideById(sideId).pieces;

/** Legal moves of the piece on one square. Only the side on turn may ask. */
export const getPossibleMovesOfPiece = (
    context: GameContext,
    gameId: number,
    sideId: number,
    squareName: string
): PossibleMove[] => {
    const game = loadGame(context, gameId);
    if (game.currentSideId !== sideId) {
        throw new DomainError("Aguarde sua vez de interagir com suas peças");
    }
    const square = game.squares.fromName(squareName);
    const side = game.sideById(sideId);
    if (!side.pieces.some((entry) => sameSquare(entry.square, square))) {
        throw new DomainError("Não foi possível encontrar a peça na casa desejada");
    }
    const legal = legalMovesOf(game.position(), sideId, side.possibleMoves);
    return legal.filter((move) => sameSquare(move.from, square));
};

/** Whether a draw offer is waiting for this side's answer. */
export const isDrawOfferOpenFor = (context: GameContext, gameId: number, sideId: number): boolean =>
    loadGame(context, gameId).requestedActions.some(
        (action) => action.acao === RequestedActionNames.DrawOffer && action.ladoId === sideId
    );

/** The opposing king, asked for by the side on turn. */
export const getOpponentKing = (context: GameContext, gameId: number, sideId: number) => {
    const game = loadGame(context, gameId);
    if (game.currentSideId !== sideId) {
        throw new DomainError("Aguarde sua vez de interagir com o jogo");
    }
    return game.opponentKingOf(sideId);
};
