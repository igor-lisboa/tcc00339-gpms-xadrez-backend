import type { Game } from "../../domain/game/Game";

/** Where games are kept. The application only sees this interface. */
export interface GameRepository {
    all(): Game[];
    find(id: number): Game | undefined;
    /** Stores the game. A new game gets the next id; a known game replaces its stored state. */
    save(game: Game): void;
}
