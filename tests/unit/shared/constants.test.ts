import { describe, expect, it } from "vitest";
import { GameEnding, GameType, PlayerType, PromotionPiece, Side } from "../../../src/shared/constants";
import { endings, gameTypes, pieceTypes, playerTypes, sides } from "../../../src/infrastructure/data/lookups";

// These tests keep the enums in step with database.json: if the data changes, they fail.
const numericValues = (enumObject: object) =>
    Object.values(enumObject)
        .filter((value): value is number => typeof value === "number")
        .sort((a, b) => a - b);

describe("constants match the lookup data", () => {
    it("Side matches the sides table", () => {
        expect(numericValues(Side)).toEqual(sides.map((side) => side.id).sort((a, b) => a - b));
    });

    it("PlayerType matches the player types table", () => {
        expect(numericValues(PlayerType)).toEqual(playerTypes.map((type) => type.id).sort((a, b) => a - b));
    });

    it("GameType matches the game types table", () => {
        expect(numericValues(GameType)).toEqual(gameTypes.map((type) => type.id).sort((a, b) => a - b));
    });

    it("GameEnding matches the endings table", () => {
        expect(numericValues(GameEnding)).toEqual(endings.map((ending) => ending.id).sort((a, b) => a - b));
    });

    it("PromotionPiece points to the right piece names", () => {
        const nameOf = (id: number) => pieceTypes.find((piece) => piece.id === id)?.nome;
        expect(nameOf(PromotionPiece.Queen)).toBe("Rainha"); // names-check:ignore (data values from database.json)
        expect(nameOf(PromotionPiece.Rook)).toBe("Torre"); // names-check:ignore (data values from database.json)
        expect(nameOf(PromotionPiece.Bishop)).toBe("Bispo"); // names-check:ignore (data values from database.json)
        expect(nameOf(PromotionPiece.Knight)).toBe("Cavalo"); // names-check:ignore (data values from database.json)
    });
});
