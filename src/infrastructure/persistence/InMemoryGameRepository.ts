import type { GameRepository } from "../../application/ports/GameRepository";
import type { Game } from "../../domain/game/Game";

/** Keeps games in memory. A game's id is its position in the list, as it has always been. */
export class InMemoryGameRepository implements GameRepository {
    private readonly games: Game[] = [];

    all(): Game[] {
        return [...this.games];
    }

    find(id: number): Game | undefined {
        return this.games[id];
    }

    save(game: Game): void {
        if (game.id === null) {
            game.id = this.games.length;
        }
        this.games[game.id] = game;
    }
}
