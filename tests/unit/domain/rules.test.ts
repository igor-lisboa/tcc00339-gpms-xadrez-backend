import { describe, expect, it, vi } from "vitest";
import { DomainError } from "../../../src/domain/DomainError";
import { playMove } from "../../../src/domain/game/playMove";
import { offerDraw, answerDraw } from "../../../src/domain/game/drawOffers";
import { checkClocks } from "../../../src/domain/game/clock";
import { GameEnding } from "../../../src/shared/constants";
import { gameWith, movesFrom, play } from "./helpers";

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
    it("ends the game by the fifty-move rule when the side on turn claims it after 100 quiet plies, and sends no offer", () => {
        const game = gameWith({ E1: "Rei-0", A8: "Rei-1", H1: "Torre-0" });
        game.board.halfMoveClock = 100;

        const result = offerDraw(game, 0);

        expect(result.claimed).toBe(true);
        expect(game.ending?.id).toBe(GameEnding.FiftyMoveRule);
        expect(game.drawOfferedBy).toBeNull();
        expect(game.requestedActions).toEqual([]);
    });

    it("does not end the game when the side not on turn offers after 100 quiet plies: only the side on turn may claim", () => {
        const game = gameWith({ E1: "Rei-0", A8: "Rei-1", H1: "Torre-0" });
        game.board.halfMoveClock = 100;

        const result = offerDraw(game, 1);

        expect(result.claimed).toBe(false);
        expect(game.ending).toBeNull();
        expect(game.drawOfferedBy).toBe(1);
    });

    it("refuses a draw offer once the game has finished", () => {
        const game = gameWith({ E1: "Rei-0", A8: "Rei-1", H1: "Torre-0" });
        game.finish(GameEnding.Resignation);

        expect(() => offerDraw(game, 0)).toThrow("Esse jogo já foi finalizado");
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

/** A game with a 1 second turn limit whose first turn started 5 seconds ago, so White is out of time. */
const timedOutWhite = (placements: Record<string, string>) => {
    const game = gameWith(placements);
    const limited = Object.assign(game, { timeLimitMs: 1000 });
    Object.assign(limited.turns[0], { startedAtMs: Date.now() - 5000 });
    return limited;
};

describe("clock", () => {
    it("a time out is a loss when the opponent has mating material: a rook wins for Black", () => {
        const game = timedOutWhite({ E1: "Rei-0", A8: "Rei-1", H1: "Torre-1" });

        checkClocks(game);

        expect(game.ending?.id).toBe(GameEnding.BlackWins);
        expect(game.ending?.tipo).toBe("Vitória: Preto");
    });

    it("a time out is a loss for Black when White has mating material", () => {
        const game = gameWith({ E1: "Rei-0", A8: "Rei-1", H1: "Torre-0" });
        const limited = Object.assign(game, { timeLimitMs: 1000, currentSideId: 1 });
        Object.assign(limited.turns[0], { sideId: 1, startedAtMs: Date.now() - 5000 });

        checkClocks(limited);

        expect(limited.ending?.tipo).toBe("Vitória: Branco");
    });

    it("a time out is a draw when the opponent holds only a king", () => {
        // White has a rook, so the position is not dead; only the timeout decides it
        const game = timedOutWhite({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });

        checkClocks(game);

        expect(game.ending?.id).toBe(GameEnding.TimeoutDraw);
        expect(game.ending?.tipo).toBe("Empate: Tempo esgotado sem material");
    });

    it("a time out is a draw when the opponent holds only king and bishop", () => {
        const game = timedOutWhite({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1", C1: "Bispo-1" });

        checkClocks(game);

        expect(game.ending?.id).toBe(GameEnding.TimeoutDraw);
    });

    it("the remaining time of the side that ran out is shown as zero, not negative", () => {
        const game = timedOutWhite({ E1: "Rei-0", A8: "Rei-1", H1: "Torre-1" });

        checkClocks(game);

        expect(game.white.remainingMs).toBe(0);
    });

    it("the clocks do not change after the game has ended", () => {
        vi.useFakeTimers();
        try {
            const game = gameWith({ E1: "Rei-0", A8: "Rei-1", H1: "Torre-0" });
            Object.assign(game, { timeLimitMs: 60_000 });
            vi.setSystemTime(game.turns[0].startedAtMs + 2_000);
            game.finish(GameEnding.Resignation);
            const frozen = game.turns.at(-1)?.totalMs;

            vi.setSystemTime(game.turns[0].startedAtMs + 30_000);
            checkClocks(game);

            expect(game.turns.at(-1)?.totalMs).toBe(frozen);
            expect(game.white.remainingMs).toBe(58_000);
        } finally {
            vi.useRealTimers();
        }
    });
});

describe("insufficient material", () => {
    it("a side with king and two rooks against a bare king is not a draw", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", H2: "Torre-0", A8: "Rei-1" });
        expect(game.ending).toBeNull();
    });

    it("king and bishop against a bare king is a draw", () => {
        const game = gameWith({ E1: "Rei-0", C1: "Bispo-0", A8: "Rei-1" });
        expect(game.ending?.id).toBe(GameEnding.InsufficientMaterial);
    });

    it("king and knight against a bare king is a draw", () => {
        const game = gameWith({ E1: "Rei-0", C3: "Cavalo-0", A8: "Rei-1" });
        expect(game.ending?.id).toBe(GameEnding.InsufficientMaterial);
    });

    it("king and queen against a bare king is not a draw", () => {
        const game = gameWith({ E1: "Rei-0", D1: "Rainha-0", A8: "Rei-1" });
        expect(game.ending).toBeNull();
    });

    it("king and a pawn against a bare king is not a draw", () => {
        const game = gameWith({ E1: "Rei-0", E2: "Peão-0", A8: "Rei-1" });
        expect(game.ending).toBeNull();
    });

    it("king and two knights against a bare king is not a draw: a mate is still possible (FIDE 5.2.2)", () => {
        const game = gameWith({ E1: "Rei-0", C3: "Cavalo-0", D3: "Cavalo-0", A8: "Rei-1" });
        expect(game.ending).toBeNull();
    });

    it("king and bishop against king and bishop on the same colour is a draw", () => {
        // C1 and B8 are both dark squares
        const game = gameWith({ E1: "Rei-0", C1: "Bispo-0", A8: "Rei-1", B8: "Bispo-1" });
        expect(game.ending?.id).toBe(GameEnding.InsufficientMaterial);
    });

    it("king and bishop against king and bishop on the other colour is not a draw", () => {
        const game = gameWith({ E1: "Rei-0", C1: "Bispo-0", A8: "Rei-1", C8: "Bispo-1" });
        expect(game.ending).toBeNull();
    });

    it("king and knight against king and bishop, or against king and knight, is not a draw", () => {
        expect(gameWith({ E1: "Rei-0", C3: "Cavalo-0", A8: "Rei-1", C8: "Bispo-1" }).ending).toBeNull();
        expect(gameWith({ E1: "Rei-0", C3: "Cavalo-0", A8: "Rei-1", B8: "Cavalo-1" }).ending).toBeNull();
    });

    it("king and bishop against king and rook is not a draw", () => {
        const game = gameWith({ E1: "Rei-0", C1: "Bispo-0", A8: "Rei-1", H8: "Torre-1" });
        expect(game.ending).toBeNull();
    });
});
