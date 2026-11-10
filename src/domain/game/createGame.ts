import { DomainError } from "../DomainError";
import type { Catalog, GameTypeInfo } from "../catalog";
import { Board, gridFromNotation } from "../board/Board";
import { SquareLookup } from "../board/SquareLookup";
import { startingBoard } from "../board/startPosition";
import { Game } from "./Game";
import { applyGameType } from "./seating";
import { defineCurrentSide } from "./judgement";
import { recordPosition } from "./repetition";

export interface GameInput {
    readonly catalog: Catalog;
    readonly gameTypeId: number;
    readonly timeLimitMs: number;
    readonly sideId: number;
    /** Custom board rows; with fewer than 8 rows the standard opening is used. */
    readonly boardRows?: readonly (readonly unknown[])[];
}

/** Builds a game the way the API has always done: sides, board, the first side, then the game type. */
export const createGame = (input: GameInput): Game => {
    const squares = new SquareLookup(input.catalog.squares);
    const [white, black] = input.catalog.sides;
    const pieceNames = input.catalog.pieceTypes.map((piece) => piece.nome);

    const board =
        input.boardRows !== undefined && input.boardRows.length >= 8
            ? new Board(squares, gridFromNotation(input.boardRows, pieceNames))
            : startingBoard(squares, white.id, black.id);

    const gameType = resolveGameType(input.catalog, input.gameTypeId);
    const game = new Game(input.catalog, squares, input.timeLimitMs, board, gameType, input.catalog.sides);
    defineCurrentSide(game, input.sideId);
    // the starting position counts as the first appearance for the repetition rules
    recordPosition(game);
    applyGameType(game, gameType);
    return game;
};

const resolveGameType = (catalog: Catalog, gameTypeId: number): GameTypeInfo => {
    const gameType = catalog.gameTypes.find((type) => type.id === gameTypeId);
    if (gameType === undefined) {
        throw new DomainError("Não foi possível encontrar o tipo de jogo desejado");
    }
    return gameType;
};
