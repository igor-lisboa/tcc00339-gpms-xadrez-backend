import { DomainError } from "../domain/DomainError";
import type { Game } from "../domain/game/Game";
import { createGame as buildGame } from "../domain/game/createGame";
import { seatPlayer } from "../domain/game/seating";
import { playMove } from "../domain/game/playMove";
import { promotePawn } from "../domain/game/promotePawn";
import type { MoveRecord } from "../domain/moves/MoveRecord";
import type { Side } from "../domain/game/Side";
import { loadGameForChange, saveGame, type GameContext } from "./persistence";

export interface CreateGameInput {
    readonly tipoJogo?: number;
    readonly tempoDeTurnoEmMilisegundos?: number | null;
    readonly tabuleiroCasas?: readonly (readonly unknown[])[];
    readonly ladoId?: number;
}

/** Creates a game, records its first position, and announces it. */
export const createGame = (context: GameContext, input: CreateGameInput): Game => {
    const game = buildGame({
        catalog: context.catalog,
        gameTypeId: input.tipoJogo ?? 0,
        timeLimitMs: input.tempoDeTurnoEmMilisegundos ?? -1,
        sideId: input.ladoId ?? 0,
        boardRows: input.tabuleiroCasas ?? [],
    });
    game.board.recordPosition();
    saveGame(context, game);
    context.events.publish({ type: "gameCreated" });
    return game;
};

/** Starts the same game id again from the start position, with the same game type and time limit. */
export const resetGame = (context: GameContext, gameId: number): Game => {
    const old = loadGameForChange(context, gameId);
    const fresh = buildGame({
        catalog: context.catalog,
        gameTypeId: old.gameType.id,
        timeLimitMs: old.timeLimitMs,
        sideId: 0,
    });
    fresh.id = old.id;
    saveGame(context, fresh);
    context.events.publish({ type: "gameReset", gameId });
    return fresh;
};

/** Seats a player. The opponent is told someone joined. */
export const joinPlayer = (context: GameContext, gameId: number, sideId: number, playerTypeId: number): Side => {
    const game = loadGameForChange(context, gameId);
    const playerType = context.catalog.playerTypes.find((type) => type.id === playerTypeId);
    if (playerType === undefined) {
        throw new DomainError("Tipo de jogador inválido");
    }
    const side = seatPlayer(game, sideId, playerType);
    saveGame(context, game);
    context.events.publish({ type: "playerJoined", gameId, opponent: game.opponentOf(sideId) });
    return side;
};

/** Removes the player from a side, which resigns the game. */
export const leaveSide = (context: GameContext, gameId: number, sideId: number): Side => {
    const game = loadGameForChange(context, gameId);
    const side = seatPlayer(game, sideId, null);
    saveGame(context, game);
    return side;
};

/** A move by the side on turn. The opponent hears about it only if the turn has passed to them. */
export const makeMove = (context: GameContext, gameId: number, sideId: number, from: string, to: string): MoveRecord => {
    const game = loadGameForChange(context, gameId);
    const played = playMove(game, sideId, from, to);
    saveGame(context, game);

    if (played.opponentId === game.currentSideId) {
        context.events.publish({
            type: "moveMade",
            gameId,
            played,
            game,
            promotion: null,
            opponent: game.opponentOf(sideId),
        });
    }
    return played.move;
};

/** The side on turn picks the piece a promoted pawn becomes. */
export const choosePromotion = (context: GameContext, gameId: number, sideId: number, pieceTypeId: number) => {
    const game = loadGameForChange(context, gameId);
    const promoted = promotePawn(game, sideId, pieceTypeId);
    saveGame(context, game);

    context.events.publish({
        type: "moveMade",
        gameId,
        played: { move: promoted.move, opponentId: promoted.opponentId },
        game,
        promotion: promoted,
        opponent: game.opponentOf(sideId),
    });
    return promoted.piece;
};
