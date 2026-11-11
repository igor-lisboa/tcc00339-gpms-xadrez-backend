import { describe, expect, it } from "vitest";
import { playMove } from "../../../src/domain/game/playMove";
import { promotePawn } from "../../../src/domain/game/promotePawn";
import { answerDraw, offerDraw } from "../../../src/domain/game/drawOffers";
import { offerReset } from "../../../src/domain/game/resetOffers";
import { seatPlayer } from "../../../src/domain/game/seating";
import { checkClocks } from "../../../src/domain/game/clock";
import { repetitionContext, timesPositionAppeared } from "../../../src/domain/game/repetition";
import { DEFAULT_ENDING_REASON, EndingReason, GameEnding, PromotionPiece } from "../../../src/shared/constants";
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
        expect(game.endingReason).toBe(EndingReason.Timeout);
        expect(game.winnerSideId).toBe(1);
    });

    it("Given White runs out with a queen against king and knight, When judged, Then it is a draw", () => {
        const game = timedOutWhite({ E1: "Rei-0", D1: "Rainha-0", A8: "Rei-1", C6: "Cavalo-1" });

        checkClocks(game);

        expect(game.ending?.id).toBe(GameEnding.TimeoutDraw);
        expect(game.endingReason).toBe(EndingReason.Timeout);
        expect(game.winnerSideId).toBeNull();
    });
});

describe("ending reason", () => {
    it("Given a running game, When read, Then it has no reason", () => {
        expect(gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" }).endingReason).toBeNull();
    });

    it("Given a mating move, When played, Then the reason is checkmate", () => {
        const game = gameWith({ B6: "Rei-0", H1: "Torre-0", A8: "Rei-1" });

        playMove(game, 0, "H1", "H8");

        expect(game.ending?.id).toBe(GameEnding.WhiteWins);
        expect(game.endingReason).toBe(EndingReason.Checkmate);
    });

    it("Given every ending, When finished without a named reason, Then a default reason exists", () => {
        Object.values(GameEnding)
            .filter((value): value is GameEnding => typeof value === "number")
            .forEach((ending) => {
                const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
                game.finish(ending);
                expect(game.endingReason).toBe(DEFAULT_ENDING_REASON[ending]);
            });
    });

    it("Given a finished game, When finished again, Then the first ending and its reason stay", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        game.finish(GameEnding.MutualAgreement);

        seatPlayer(game, 1, null);

        expect(game.endingReason).toBe(EndingReason.MutualAgreement);
    });
});

/**
 * The last moves of two real AI against AI games, taken from the games list. Both ended in stalemate, and in the first
 * the stalemated king stood next to a protected pawn that the old move list still offered as a capture.
 */
describe("recorded games", () => {
    it("Given Black's king on G7 hemmed in by king, bishop, pawn and rook, When the rook goes to E8, Then it is stalemate", () => {
        const game = gameWith({ G5: "Rei-0", F5: "Bispo-0", G6: "Peão-0", D7: "Torre-0", G8: "Rei-1" });
        play(game, [[0, "D7", "D8"], [1, "G8", "G7"]]);
        // the pawn on G6 is protected, so taking it is not a move
        playMove(game, 0, "D8", "E8");

        expect(game.ending?.id).toBe(GameEnding.Stalemate);
        expect(game.endingReason).toBe(EndingReason.Stalemate);
        expect(game.black.legalMoves).toEqual([]);
        expect(game.currentInCheck).toBe(false);
    });

    it("Given White's bare king on D3, When the queen goes to C1, Then it is stalemate", () => {
        const game = gameWith({ E3: "Rei-0", D5: "Rei-1", G1: "Rainha-1", G2: "Bispo-1", B2: "Torre-1" });
        play(game, [[0, "E3", "D3"], [1, "G1", "C1"]]);

        expect(game.ending?.id).toBe(GameEnding.Stalemate);
        expect(game.white.legalMoves).toEqual([]);
    });
});

describe("castling across an attacked square (FIDE 3.8.2.2.2)", () => {
    it("Given a rook attacking F1, When White's moves are listed, Then kingside castling is not offered", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", F8: "Torre-1", A8: "Rei-1" });

        expect(game.white.legalMoves.some((move) => move.from.name === "E1" && move.to.name === "G1")).toBe(false);
        expect(() => playMove(game, 0, "E1", "G1")).toThrow();
    });

    it("Given a rook attacking D1, When White's moves are listed, Then queenside castling is not offered", () => {
        const game = gameWith({ E1: "Rei-0", A1: "Torre-0", D8: "Torre-1", H8: "Rei-1" });

        expect(game.white.legalMoves.some((move) => move.to.name === "C1" && move.from.name === "E1")).toBe(false);
    });

    it("Given a rook attacking only B1, When White's moves are listed, Then queenside castling is offered: the king does not cross B1", () => {
        const game = gameWith({ E1: "Rei-0", A1: "Torre-0", B8: "Torre-1", H8: "Rei-1" });

        expect(game.white.legalMoves.some((move) => move.to.name === "C1" && move.from.name === "E1")).toBe(true);
    });
});

describe("resignation (FIDE 5.1.2)", () => {
    it("Given both sides seated, When Black resigns, Then White is the winner", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });

        seatPlayer(game, 1, null);

        expect(game.ending?.id).toBe(GameEnding.Resignation);
        expect(game.endingReason).toBe(EndingReason.Resignation);
        expect(game.winnerSideId).toBe(0);
    });

    it("Given the opponent has only king and knight against a queen, When the queen's side resigns, Then it is a draw", () => {
        const game = gameWith({ E1: "Rei-0", D1: "Rainha-0", A8: "Rei-1", C6: "Cavalo-1" });

        seatPlayer(game, 0, null);

        expect(game.ending?.id).toBe(GameEnding.InsufficientMaterial);
        expect(game.endingReason).toBe(EndingReason.Resignation);
        expect(game.winnerSideId).toBeNull();
    });

    it("Given the opponent has king and knight against a rook, When the rook's side resigns, Then the opponent wins: a mate was possible", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1", C6: "Cavalo-1" });

        seatPlayer(game, 0, null);

        expect(game.ending?.id).toBe(GameEnding.Resignation);
        expect(game.winnerSideId).toBe(1);
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
