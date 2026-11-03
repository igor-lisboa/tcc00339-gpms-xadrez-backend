import { describe, expect, it } from "vitest";
import { loadGame, loadGameForChange, type GameContext } from "../../../src/application/persistence";
import type { GameEvent } from "../../../src/application/ports/EventPublisher";
import { InMemoryGameRepository } from "../../../src/infrastructure/persistence/InMemoryGameRepository";
import { catalog, gameWith } from "../domain/helpers";

/** A game whose side on turn has already run out of time, stored in a fresh repository. */
const expiredContext = () => {
    const game = gameWith({ E1: "Rei-0", A8: "Rei-1", H1: "Torre-0" });
    Object.assign(game, { timeLimitMs: 1000 });
    Object.assign(game.turns[0], { startedAtMs: Date.now() - 5000 });

    const repository = new InMemoryGameRepository();
    repository.save(game);

    const published: GameEvent[] = [];
    const context: GameContext = { repository, events: { publish: (event) => published.push(event) }, catalog };
    return { game, context, published };
};

describe("reading a game", () => {
    it("shows a timeout in the game it returns", () => {
        const { context } = expiredContext();

        expect(loadGame(context, 0).ending?.id).toBe(3);
    });

    it("does not announce the ending while reading", () => {
        const { context, published } = expiredContext();

        loadGame(context, 0);

        expect(published).toEqual([]);
    });
});

describe("changing a game", () => {
    it("announces the timeout ending before the change is applied", () => {
        const { context, published } = expiredContext();

        loadGameForChange(context, 0);

        expect(published.map((event) => event.type)).toEqual(["gameFinished"]);
    });

    it("announces the timeout only once", () => {
        const { context, published } = expiredContext();

        loadGameForChange(context, 0);
        loadGameForChange(context, 0);

        expect(published).toHaveLength(1);
    });
});
