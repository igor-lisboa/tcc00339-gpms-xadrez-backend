import { buildCatalog } from "../../../src/infrastructure/data/catalog";
import { Game } from "../../../src/domain/game/Game";
import { playMove } from "../../../src/domain/game/playMove";
import { boardWith } from "../../characterization/helpers/game";

export const catalog = buildCatalog();

/** A game with the given pieces, both sides seated by humans and White to move. */
export const gameWith = (placements: Record<string, string>): Game => {
    const game = Game.create({
        catalog,
        gameTypeId: 0,
        timeLimitMs: -1,
        sideId: 0,
        boardRows: boardWith(placements),
    });
    game.joinSide(0, catalog.playerTypes[0]);
    game.joinSide(1, catalog.playerTypes[0]);
    game.id = 0;
    return game;
};

/** Plays a sequence of moves as (side, from, to) triples. */
export const play = (game: Game, moves: [number, string, string][]): void => {
    moves.forEach(([sideId, from, to]) => playMove(game, sideId, from, to));
};

export const movesFrom = (game: Game, sideId: number, from: string): string[] =>
    game
        .sideById(sideId)
        .possibleMoves.filter((move) => move.from.name === from)
        .map((move) => move.to.name)
        .sort();
