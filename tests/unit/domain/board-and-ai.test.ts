import { describe, expect, it } from "vitest";
import { DomainError } from "../../../src/domain/DomainError";
import { Board, gridFromNotation } from "../../../src/domain/board/Board";
import { SquareLookup } from "../../../src/domain/board/SquareLookup";
import { chooseAiMove, narrowAiOptions, squareDistance, type AiOption } from "../../../src/domain/ai/chooseAiMove";
import { canEverMate } from "../../../src/domain/rules/material";
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

    it("Given the same position recorded with a context, When counted, Then only the same context adds up", () => {
        const board = new Board(lookup, Board.empty());
        board.recordPosition("0|1111|-");
        board.recordPosition("0|1111|-");
        board.recordPosition("1|1111|-");

        expect(board.repetitionsOf("0|1111|-")).toBe(2);
        expect(board.repetitionsOf("1|1111|-")).toBe(1);
        expect(board.repetitionsOf("0|0000|-")).toBe(0);
    });
});

/** Pieces of one side on named squares, e.g. side(0, { E1: "Rei", C1: "Bispo" }). */
const side = (sideId: number, placements: Record<string, string>) =>
    Object.entries(placements).map(([name, type]) => ({ square: lookup.fromName(name), piece: new Piece(sideId, type as never) }));

describe("mating material (canEverMate)", () => {
    const bareBlack = side(1, { A8: "Rei" });

    it("Given a bare king, When judged, Then it can never mate", () => {
        expect(canEverMate(side(0, { E1: "Rei" }), side(1, { A8: "Rei", D8: "Rainha" }))).toBe(false);
    });

    it("Given a pawn, a rook or a queen, When judged, Then the side can mate", () => {
        expect(canEverMate(side(0, { E1: "Rei", E2: "Peão" }), bareBlack)).toBe(true);
        expect(canEverMate(side(0, { E1: "Rei", H1: "Torre" }), bareBlack)).toBe(true);
        expect(canEverMate(side(0, { E1: "Rei", D1: "Rainha" }), bareBlack)).toBe(true);
    });

    it("Given knight and bishop, two knights, or bishops on both colours, When judged, Then the side can mate a bare king", () => {
        expect(canEverMate(side(0, { E1: "Rei", B1: "Cavalo", C1: "Bispo" }), bareBlack)).toBe(true);
        expect(canEverMate(side(0, { E1: "Rei", B1: "Cavalo", G1: "Cavalo" }), bareBlack)).toBe(true);
        expect(canEverMate(side(0, { E1: "Rei", C1: "Bispo", F1: "Bispo" }), bareBlack)).toBe(true);
    });

    it("Given a lone minor piece against a bare king, When judged, Then it cannot mate", () => {
        expect(canEverMate(side(0, { E1: "Rei", B1: "Cavalo" }), bareBlack)).toBe(false);
        expect(canEverMate(side(0, { E1: "Rei", C1: "Bispo" }), bareBlack)).toBe(false);
    });

    it("Given a lone knight, When the defender has a piece to block with, Then it can mate, except against queens only", () => {
        const knight = side(0, { E1: "Rei", B1: "Cavalo" });
        expect(canEverMate(knight, side(1, { A8: "Rei", H8: "Torre" }))).toBe(true);
        expect(canEverMate(knight, side(1, { A8: "Rei", C8: "Bispo" }))).toBe(true);
        expect(canEverMate(knight, side(1, { A8: "Rei", A7: "Peão" }))).toBe(true);
        expect(canEverMate(knight, side(1, { A8: "Rei", D8: "Rainha" }))).toBe(false);
    });

    it("Given bishops on one colour, When the defender has a pawn, a knight or an other-colour bishop, Then they can mate", () => {
        // C1 and F4 are both dark squares; C8 is light and F8 is dark
        const bishops = side(0, { E1: "Rei", C1: "Bispo", F4: "Bispo" });
        expect(canEverMate(bishops, bareBlack)).toBe(false);
        expect(canEverMate(bishops, side(1, { A8: "Rei", B8: "Cavalo" }))).toBe(true);
        expect(canEverMate(bishops, side(1, { A8: "Rei", A7: "Peão" }))).toBe(true);
        expect(canEverMate(bishops, side(1, { A8: "Rei", C8: "Bispo" }))).toBe(true);
        expect(canEverMate(bishops, side(1, { A8: "Rei", F8: "Bispo" }))).toBe(false);
        expect(canEverMate(bishops, side(1, { A8: "Rei", H8: "Torre" }))).toBe(false);
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
