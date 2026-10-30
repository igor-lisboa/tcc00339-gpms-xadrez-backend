import { describe, expect, it } from "vitest";
import { DomainError } from "../../../src/domain/DomainError";
import { Board, gridFromNotation } from "../../../src/domain/board/Board";
import { SquareLookup } from "../../../src/domain/board/SquareLookup";
import { chooseAiMove, narrowAiOptions, squareDistance, type AiOption } from "../../../src/domain/ai/chooseAiMove";
import { hasMinimumMaterial } from "../../../src/domain/rules/material";
import { Piece } from "../../../src/domain/pieces/Piece";
import { catalog } from "./helpers";

const lookup = new SquareLookup(catalog.squares);

describe("SquareLookup", () => {
    it("finds a square by name regardless of case and spaces", () => {
        expect(lookup.fromName(" e4 ").linha).toBe(4);
    });

    it("refuses an unknown name with the usual message", () => {
        expect(() => lookup.fromName("Z9")).toThrow("Não foi possível encontrar a casa desejada buscando pelo nome da casa");
    });

    it("refuses a position off the board", () => {
        expect(() => lookup.fromPosition(8, 0)).toThrow(DomainError);
        expect(lookup.tryFromPosition(-1, 0)).toBeNull();
    });
});

describe("board notation", () => {
    const names = catalog.pieceTypes.map((piece) => piece.nome);

    it("explains which cell has a malformed piece", () => {
        const rows = Array.from({ length: 8 }, () => Array<string | null>(8).fill(null));
        rows[2][3] = "Torre";
        expect(() => gridFromNotation(rows, names)).toThrow("Peça na casa da linha:2 e coluna:3 inválida");
    });

    it("refuses a side that is not 0 or 1", () => {
        const rows = Array.from({ length: 8 }, () => Array<string | null>(8).fill(null));
        rows[0][0] = "Rei-7";
        expect(() => gridFromNotation(rows, names)).toThrow("tem o lado definido de forma incorreta");
    });

    it("refuses an unknown piece name", () => {
        const rows = Array.from({ length: 8 }, () => Array<string | null>(8).fill(null));
        rows[1][1] = "Dama-0";
        expect(() => gridFromNotation(rows, names)).toThrow("Esse tipo de peça escolhido para casa da linha:1 e coluna:1 é inválido");
    });
});

describe("pieces and boards", () => {
    it("a cloned board can be changed without touching the original", () => {
        const grid = Board.empty();
        grid[0][0] = new Piece(1, "Rei");
        const original = new Board(lookup, grid);
        const copy = original.clone();

        copy.place(lookup.fromName("A8"), null);

        expect(original.pieceAt(lookup.fromName("A8"))).not.toBeNull();
    });

    it("counts repeated positions", () => {
        const board = new Board(lookup, Board.empty());
        board.recordPosition();
        board.recordPosition();
        expect(board.isThreefoldRepetition()).toBe(false);
        board.recordPosition();
        expect(board.isThreefoldRepetition()).toBe(true);
    });

    it("knows when a side has too little material to mate", () => {
        const king = new Piece(0, "Rei");
        expect(hasMinimumMaterial([king])).toBe(false);
        expect(hasMinimumMaterial([king, new Piece(0, "Bispo")])).toBe(false);
        expect(hasMinimumMaterial([king, new Piece(0, "Torre")])).toBe(true);
        expect(hasMinimumMaterial([king, new Piece(0, "Bispo"), new Piece(0, "Bispo")])).toBe(true);
    });
});

describe("AI move choice", () => {
    const option = (overrides: Partial<AiOption>): AiOption => ({
        from: "A2",
        to: "A3",
        moveName: null,
        pieceType: "Torre",
        isThreatened: false,
        isCapturable: false,
        isCapture: false,
        distanceFrom: 5,
        distanceTo: 5,
        ...overrides,
    });

    it("prefers a move that saves a threatened piece", () => {
        const saved = option({ from: "B2", isThreatened: true });
        const other = option({ from: "C2" });
        expect(narrowAiOptions([other, saved])).toEqual([saved]);
    });

    it("keeps everything when no option passes a rule", () => {
        const options = [option({ from: "A2" }), option({ from: "B2" })];
        expect(narrowAiOptions(options)).toEqual(options);
    });

    it("prefers captures and moves that approach the opponent king", () => {
        const capture = option({ from: "A2", isCapture: true, distanceFrom: 4, distanceTo: 3 });
        const plain = option({ from: "B2" });
        expect(narrowAiOptions([plain, capture])).toEqual([capture]);

        const approaching = option({ from: "C2", distanceFrom: 4, distanceTo: 3 });
        const retreating = option({ from: "D2", distanceFrom: 3, distanceTo: 4 });
        expect(narrowAiOptions([retreating, approaching])).toEqual([approaching]);
    });

    it("chooses at random among what is left, and nothing when there is no move", () => {
        const options = [option({ from: "A2" }), option({ from: "B2" })];
        expect(chooseAiMove(options, () => 0.99)?.from).toBe("B2");
        expect(chooseAiMove([])).toBeUndefined();
    });

    it("measures distance between squares in files and ranks", () => {
        expect(squareDistance("A1", "C3")).toBe(4);
        expect(squareDistance("E4", "E4")).toBe(0);
    });
});
