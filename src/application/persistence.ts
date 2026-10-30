import { DomainError } from "../domain/DomainError";
import type { Game } from "../domain/game/Game";
import type { EventPublisher } from "./ports/EventPublisher";
import type { GameRepository } from "./ports/GameRepository";
import type { Catalog } from "../domain/catalog";

export interface GameContext {
    readonly repository: GameRepository;
    readonly events: EventPublisher;
    readonly catalog: Catalog;
}

/** Loads a game, brings its derived state up to date, and saves it if the reads ended it (for example on timeout). */
export const loadGame = (context: GameContext, gameId: number): Game => {
    const game = context.repository.find(gameId);
    if (game === undefined) {
        throw new DomainError("Jogo não encontrado");
    }
    game.refreshForRead();
    // a read can end the game (time running out); that change must be saved and announced
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
