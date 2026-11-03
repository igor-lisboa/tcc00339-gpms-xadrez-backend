import { DomainError } from "../domain/DomainError";
import type { Game } from "../domain/game/Game";
import { refreshForRead } from "../domain/game/judgement";
import type { EventPublisher } from "./ports/EventPublisher";
import type { GameRepository } from "./ports/GameRepository";
import type { Catalog } from "../domain/catalog";

export interface GameContext {
    readonly repository: GameRepository;
    readonly events: EventPublisher;
    readonly catalog: Catalog;
}

/** Reads a game. The derived state is brought up to date (the clock included), but nothing is saved or announced here. */
export const loadGame = (context: GameContext, gameId: number): Game => {
    const game = context.repository.find(gameId);
    if (game === undefined) {
        throw new DomainError("Jogo não encontrado");
    }
    refreshForRead(game);
    return game;
};

/**
 * Loads a game before a change. This is the explicit clock step: if time ran out, the ending is saved
 * and announced first, so the change then applies to a game that is already finished.
 */
export const loadGameForChange = (context: GameContext, gameId: number): Game => {
    const game = loadGame(context, gameId);
    if (game.hasPendingFinishedEvents()) {
        saveGame(context, game);
    }
    return game;
};

/** Saves a game, then announces what the change produced: pending requests first, then the ending. */
export const saveGame = (context: GameContext, game: Game): void => {
    const endings = game.takeFinishedEvents();
    context.repository.save(game);

    if (game.requestedActions.length > 0) {
        context.events.publish({
            type: "actionsRequested",
            gameId: game.id ?? -1,
            actions: game.requestedActions,
            sides: game.sides(),
        });
    }
    endings.forEach((ending) => {
        context.events.publish({
            type: "gameFinished",
            gameId: game.id ?? -1,
            ending,
            sides: game.sides(),
        });
    });
};
