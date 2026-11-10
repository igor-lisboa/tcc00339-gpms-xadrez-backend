import { describe, expect, it } from "vitest";
import { playMove } from "../../../src/domain/game/playMove";
import { promotePawn } from "../../../src/domain/game/promotePawn";
import { answerDraw, offerDraw } from "../../../src/domain/game/drawOffers";
import { offerReset } from "../../../src/domain/game/resetOffers";
import { seatPlayer } from "../../../src/domain/game/seating";
import { checkClocks } from "../../../src/domain/game/clock";
import { repetitionContext, timesPositionAppeared } from "../../../src/domain/game/repetition";
import { GameEnding, PromotionPiece } from "../../../src/shared/constants";
import { gameWith, play } from "./helpers";

type Ply = [number, string, string];

/** Four plies that bring both kings back: White E1-E2-E1, Black A8-A7-A8. */
const kingShuffle: Ply[] = [
    [0, "E1", "E2"],
    [1, "A8", "A7"],
    [0, "E2", "E1"],
    [1, "A7", "A8"],
];

const repeat = (plies: Ply[], times: number): Ply[] => Array.from({ length: times }, () => plies).flat();

describe("checkmate comes first (FIDE 5.1.1)", () => {
    it("Given a capture that mates and leaves K+N against K+B, When played, Then White wins instead of a draw", () => {
        const game = gameWith({ F8: "Rei-0", D6: "Cavalo-0", H8: "Rei-1", H7: "Bispo-1", F7: "Peão-1" });

        playMove(game, 0, "D6", "F7");

        expect(game.ending?.id).toBe(GameEnding.WhiteWins);
        expect(game.winnerSideId).toBe(0);
    });

    it("Given 149 quiet plies, When the 150th ply mates, Then the mate wins over the 75-move rule (FIDE 9.6.2)", () => {
        const game = gameWith({ B6: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        game.board.halfMoveClock = 149;

        playMove(game, 0, "H1", "H8");

        expect(game.ending?.id).toBe(GameEnding.WhiteWins);
    });
});

describe("repetition (FIDE 9.2 and 9.6.1)", () => {
    it("Given a position seen three times, When nobody claims, Then the game goes on", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        play(game, repeat(kingShuffle, 3));

        expect(timesPositionAppeared(game)).toBe(3);
        expect(game.ending).toBeNull();
    });

    it("Given a position seen three times, When the side on turn offers a draw, Then it is a valid claim", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        play(game, repeat(kingShuffle, 3));

        const result = offerDraw(game, 0);

        expect(result.claimed).toBe(true);
        expect(game.ending?.id).toBe(GameEnding.ThreefoldRepetition);
        expect(game.requestedActions).toEqual([]);
    });

    it("Given the same position five times, When the fifth appears, Then the game is drawn without a claim", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        play(game, repeat(kingShuffle, 4));
        expect(game.ending).toBeNull();

        // the position after White's first king step appears for the fifth time
        playMove(game, 0, "E1", "E2");

        expect(game.ending?.id).toBe(GameEnding.FivefoldRepetition);
        expect(game.ending?.tipo).toBe("Empate: Regra das 5 posições");
    });

    it("Given the same pieces with a different side to move, When counted, Then they are different positions", () => {
        // the rook takes three moves to come back while the king takes two, so the side to move alternates
        const game = gameWith({ D1: "Rei-0", A2: "Torre-0", E8: "Rei-1" });
        const cycle: Ply[] = [
            [0, "A2", "A3"], [1, "E8", "D8"], [0, "A3", "A4"], [1, "D8", "E8"], [0, "A4", "A2"], [1, "E8", "D8"],
            [0, "A2", "A3"], [1, "D8", "E8"], [0, "A3", "A4"], [1, "E8", "D8"], [0, "A4", "A2"], [1, "D8", "E8"],
        ];
        play(game, cycle);

        expect(timesPositionAppeared(game)).toBe(2);
        expect(offerDraw(game, 0).claimed).toBe(false);
    });

    it("Given a king that left and came back, When counted, Then the lost castling right makes it a new position", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        play(game, kingShuffle);

        expect(timesPositionAppeared(game)).toBe(1);
    });

    it("Given a double step, When an en passant capture is possible, Then it is part of the position, otherwise not", () => {
        const capturable = gameWith({ E1: "Rei-0", E5: "Peão-0", E8: "Rei-1", D7: "Peão-1" });
        play(capturable, [[0, "E1", "E2"], [1, "D7", "D5"]]);
        expect(repetitionContext(capturable)).toContain("D6");

        const notCapturable = gameWith({ E1: "Rei-0", E4: "Peão-0", E8: "Rei-1", D7: "Peão-1" });
        play(notCapturable, [[0, "E1", "E2"], [1, "D7", "D5"]]);
        expect(repetitionContext(notCapturable).endsWith("|-")).toBe(true);
    });

    it("Given a promotion, When the piece is chosen, Then the new position counts as its first appearance", () => {
        const game = gameWith({ E1: "Rei-0", A7: "Peão-0", H5: "Rei-1" });
        playMove(game, 0, "A7", "A8");
        promotePawn(game, 0, PromotionPiece.Rook);
        expect(timesPositionAppeared(game)).toBe(1);

        play(game, repeat([[1, "H5", "H4"], [0, "E1", "E2"], [1, "H4", "H5"], [0, "E2", "E1"]], 2));

        expect(offerDraw(game, 1).claimed).toBe(true);
        expect(game.ending?.id).toBe(GameEnding.ThreefoldRepetition);
    });
});

describe("seventy-five moves (FIDE 9.6.2)", () => {
    it("Given 149 quiet plies, When one more quiet ply is played, Then the game is drawn without a claim", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        game.board.halfMoveClock = 149;

        playMove(game, 0, "H1", "H2");

        expect(game.ending?.id).toBe(GameEnding.SeventyFiveMoveRule);
        expect(game.ending?.tipo).toBe("Empate: Regra 75 movimentos");
    });

    it("Given 149 quiet plies, When a pawn moves, Then the counter starts again and the game goes on", () => {
        const game = gameWith({ E1: "Rei-0", H2: "Peão-0", A8: "Rei-1" });
        game.board.halfMoveClock = 149;

        playMove(game, 0, "H2", "H3");

        expect(game.ending).toBeNull();
        expect(game.board.halfMoveClock).toBe(0);
    });
});

describe("draw offers (FIDE 9.1.2)", () => {
    it("Given an open offer, When the proposer moves, Then the move is played and the offer stands", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        offerDraw(game, 0);

        const played = playMove(game, 0, "H1", "H2");

        expect(played.declinedDrawOffer).toBe(false);
        expect(game.drawOfferedBy).toBe(0);
        expect(() => answerDraw(game, 1, true)).not.toThrow();
        expect(game.ending?.id).toBe(GameEnding.MutualAgreement);
    });

    it("Given an open offer, When the other side moves instead of answering, Then the offer is declined", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        playMove(game, 0, "H1", "H2");
        offerDraw(game, 0);

        const played = playMove(game, 1, "A8", "B8");

        expect(played.declinedDrawOffer).toBe(true);
        expect(game.drawOfferedBy).toBeNull();
        expect(game.requestedActions).toEqual([]);
    });

    it("Given it is not their turn, When a side offers a draw, Then the offer is sent", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });

        expect(offerDraw(game, 1).claimed).toBe(false);
        expect(game.drawOfferedBy).toBe(1);
    });

    it("Given an open offer, When the game ends another way, Then the offer lapses", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        offerDraw(game, 0);
        Object.assign(game, { timeLimitMs: 1000 });
        Object.assign(game.turns[0], { startedAtMs: Date.now() - 5000 });

        checkClocks(game);

        expect(game.ending).not.toBeNull();
        expect(game.drawOfferedBy).toBeNull();
        expect(game.requestedActions).toEqual([]);
    });

    it("Given an unknown side, When it offers a draw, Then it is refused and the game is unchanged", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });

        expect(() => offerDraw(game, Number.NaN)).toThrow("O lado desejado não existe");
        expect(game.drawOfferedBy).toBeNull();
    });
});

describe("timeout (FIDE 6.9)", () => {
    /** White's 1 second has run out. */
    const timedOutWhite = (placements: Record<string, string>) => {
        const game = gameWith(placements);
        Object.assign(game, { timeLimitMs: 1000 });
        Object.assign(game.turns[0], { startedAtMs: Date.now() - 5000 });
        return game;
    };

    it("Given White runs out with a rook against king and knight, When judged, Then Black wins: the rook could block", () => {
        const game = timedOutWhite({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1", C6: "Cavalo-1" });

        checkClocks(game);

        expect(game.ending?.id).toBe(GameEnding.BlackWins);
        expect(game.winnerSideId).toBe(1);
    });

    it("Given White runs out with a queen against king and knight, When judged, Then it is a draw", () => {
        const game = timedOutWhite({ E1: "Rei-0", D1: "Rainha-0", A8: "Rei-1", C6: "Cavalo-1" });

        checkClocks(game);

        expect(game.ending?.id).toBe(GameEnding.TimeoutDraw);
        expect(game.winnerSideId).toBeNull();
    });
});

describe("resignation (FIDE 5.1.2)", () => {
    it("Given both sides seated, When Black resigns, Then White is the winner", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });

        seatPlayer(game, 1, null);

        expect(game.ending?.id).toBe(GameEnding.Resignation);
        expect(game.winnerSideId).toBe(0);
    });

    it("Given the opponent's seat is empty, When a side leaves, Then nobody wins", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        game.white.removeType();

        seatPlayer(game, 1, null);

        expect(game.ending?.id).toBe(GameEnding.Resignation);
        expect(game.winnerSideId).toBeNull();
    });
});

describe("reset offers", () => {
    it("Given an unknown side, When it offers a reset, Then it is refused and a real side can still offer", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        game.finish(GameEnding.MutualAgreement);

        expect(() => offerReset(game, Number.NaN)).toThrow("O lado desejado não existe");
        expect(game.resetOfferedBy).toBeNull();
        expect(() => offerReset(game, 0)).not.toThrow();
    });
});
