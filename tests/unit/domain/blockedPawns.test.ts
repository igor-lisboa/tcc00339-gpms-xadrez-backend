import { describe, expect, it } from "vitest";
import { isBlockedPawnDeadPosition } from "../../../src/domain/rules/blockedPawns";
import { GameEnding } from "../../../src/shared/constants";
import { gameWith } from "./helpers";

/** A zigzag wall of pawns across the board: every pawn is blocked, and the attacked squares close every gap. */
const WALL: Record<string, string> = {
    A3: "Peão-0", B4: "Peão-0", C3: "Peão-0", D4: "Peão-0", E3: "Peão-0", F4: "Peão-0", G3: "Peão-0", H4: "Peão-0",
    A4: "Peão-1", B5: "Peão-1", C4: "Peão-1", D5: "Peão-1", E4: "Peão-1", F5: "Peão-1", G4: "Peão-1", H5: "Peão-1",
};

describe("dead position by blocked pawns (FIDE 5.2.2)", () => {
    it("Given kings on both sides of a closed pawn wall, When judged, Then the game is drawn as a dead position", () => {
        const game = gameWith({ A1: "Rei-0", A8: "Rei-1", ...WALL });

        expect(isBlockedPawnDeadPosition(game.position())).toBe(true);
        expect(game.ending?.id).toBe(GameEnding.DeadPosition);
        expect(game.ending?.tipo).toBe("Empate: Posição morta");
    });

    it("Given blocked pawns, When a king can walk round to an enemy pawn nobody defends, Then it is not dead", () => {
        const game = gameWith({ E1: "Rei-0", D4: "Peão-0", H8: "Rei-1", D5: "Peão-1" });

        expect(isBlockedPawnDeadPosition(game.position())).toBe(false);
        expect(game.ending).toBeNull();
    });

    it("Given a pawn with an enemy pawn on its diagonal, When judged, Then it is not dead: that pawn can capture", () => {
        const game = gameWith({ A1: "Rei-0", D4: "Peão-0", A8: "Rei-1", D5: "Peão-1", E5: "Peão-1" });

        expect(isBlockedPawnDeadPosition(game.position())).toBe(false);
    });

    it("Given the wall, When any piece other than kings and pawns is on the board, Then it is not judged dead", () => {
        const game = gameWith({ A1: "Rei-0", B1: "Cavalo-0", A8: "Rei-1", ...WALL });

        expect(isBlockedPawnDeadPosition(game.position())).toBe(false);
        expect(game.ending).toBeNull();
    });

    it("Given a pawn with an empty square ahead, When judged, Then it is not dead: the pawn can still move", () => {
        const openWall = Object.fromEntries(Object.entries(WALL).filter(([square]) => square !== "H5"));
        const game = gameWith({ A1: "Rei-0", A8: "Rei-1", ...openWall });

        expect(isBlockedPawnDeadPosition(game.position())).toBe(false);
    });
});
