import { describe, expect, it } from "vitest";
import { DomainError } from "../../../src/domain/DomainError";
import { playMove } from "../../../src/domain/game/playMove";
import { offerDraw, answerDraw } from "../../../src/domain/game/drawOffers";
import { GameEnding } from "../../../src/shared/constants";
import { catalog, gameWith, movesFrom, play } from "./helpers";

describe("castling", () => {
    it("is offered only when the rook on the corner belongs to the king's side", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-1", A8: "Rei-1" });
        expect(movesFrom(game, 0, "E1")).not.toContain("G1");
    });

    it("is offered when the own rook is in its corner and the path is clear", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        expect(movesFrom(game, 0, "E1")).toContain("G1");
    });
});

describe("en passant", () => {
    it("is taken only by a pawn: a knight landing on the skipped square takes nothing", () => {
        const game = gameWith({ E1: "Rei-0", B5: "Cavalo-0", A8: "Rei-1", D7: "Peão-1" });
        play(game, [
            [0, "E1", "E2"],
            [1, "D7", "D5"],
        ]);

        playMove(game, 0, "B5", "D6");

        const pawn = game.board.pieceAt(game.squares.fromName("D5"));
        expect(pawn?.type).toBe("Peão");
        expect(pawn?.sideId).toBe(1);
    });
});

describe("legal moves", () => {
    it("does not let a pinned piece leave the line of its king", () => {
        const game = gameWith({ E1: "Rei-0", E2: "Bispo-0", E8: "Torre-1", A8: "Rei-1" });
        expect(movesFrom(game, 0, "E2")).not.toHaveLength(0);
        expect(game.legalMovesOf(0).filter((move) => move.from.name === "E2")).toHaveLength(0);
    });

    it("refuses a move that leaves the own king in check", () => {
        const game = gameWith({ E1: "Rei-0", E2: "Bispo-0", E8: "Torre-1", A8: "Rei-1" });
        expect(() => playMove(game, 0, "E2", "D3")).toThrow(DomainError);
    });
});

describe("draws", () => {
    it("ends the game by the fifty-move rule when a draw is offered after 100 quiet plies", () => {
        const game = gameWith({ E1: "Rei-0", A8: "Rei-1", H1: "Torre-0" });
        game.board.halfMoveClock = 100;

        offerDraw(game, 0);

        expect(game.ending?.id).toBe(GameEnding.FiftyMoveRule);
    });

    it("clears the offer when it is declined, so a new one can be made", () => {
        const game = gameWith({ E1: "Rei-0", A8: "Rei-1", H1: "Torre-0" });
        offerDraw(game, 0);

        answerDraw(game, 1, false);

        expect(game.drawOfferedBy).toBeNull();
        expect(() => offerDraw(game, 0)).not.toThrow();
    });

    it("refuses a second offer while one is open", () => {
        const game = gameWith({ E1: "Rei-0", A8: "Rei-1", H1: "Torre-0" });
        offerDraw(game, 0);
        expect(() => offerDraw(game, 0)).toThrow("Já tem um empate proposto pelo lado Branco");
    });
});

describe("clock", () => {
    it("ends the game when the side on turn has used up its time", () => {
        const game = gameWith({ E1: "Rei-0", A8: "Rei-1", H1: "Torre-0" });
        const limited = Object.assign(game, { timeLimitMs: 1000 });
        Object.assign(limited.turns[0], { startedAtMs: Date.now() - 5000 });

        limited.checkClocks();

        // known deviation: a timeout is reported with the insufficient-material ending (see docs/specs/turn-clock.md)
        expect(limited.ending?.tipo).toBe("Empate: Insuficiência material");
        expect(catalog.endings.map((ending) => ending.id)).toContain(GameEnding.InsufficientMaterial);
    });
});
