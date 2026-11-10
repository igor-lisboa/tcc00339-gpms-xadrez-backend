import { describe, expect, it } from "vitest";
import { offerDraw } from "../../../src/domain/game/drawOffers";
import { claimWithMove } from "../../../src/domain/game/drawClaims";
import { GameEnding } from "../../../src/shared/constants";
import { gameWith, play } from "./helpers";

type Ply = [number, string, string];

/** Four plies that bring both kings back: White E1-E2-E1, Black A8-A7-A8. */
const kingShuffle: Ply[] = [
    [0, "E1", "E2"],
    [1, "A8", "A7"],
    [0, "E2", "E1"],
    [1, "A7", "A8"],
];

const pieceOn = (game: ReturnType<typeof gameWith>, name: string) => game.board.pieceAt(game.squares.fromName(name));

describe("claims with an intended move (FIDE 9.2.1.1 and 9.3.1)", () => {
    it("Given a move that would make a position appear for the third time, When claimed, Then the game is drawn and the move is not played", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        play(game, [...kingShuffle, ...kingShuffle]);

        const result = offerDraw(game, 0, { from: "E1", to: "E2" });

        expect(result.claimed).toBe(true);
        expect(result.played).toBeNull();
        expect(game.ending?.id).toBe(GameEnding.ThreefoldRepetition);
        expect(pieceOn(game, "E1")?.type).toBe("Rei");
    });

    it("Given 99 quiet plies, When a quiet move is claimed, Then it is a draw by the fifty-move rule and the move is not played", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        game.board.halfMoveClock = 99;

        const result = offerDraw(game, 0, { from: "H1", to: "H2" });

        expect(result.claimed).toBe(true);
        expect(game.ending?.id).toBe(GameEnding.FiftyMoveRule);
        expect(pieceOn(game, "H1")?.type).toBe("Torre");
    });

    it("Given 99 quiet plies, When a pawn move is claimed, Then the claim is not valid: the move is played and a draw offer is left", () => {
        const game = gameWith({ E1: "Rei-0", H2: "Peão-0", A8: "Rei-1" });
        game.board.halfMoveClock = 99;

        const result = offerDraw(game, 0, { from: "H2", to: "H3" });

        expect(result.claimed).toBe(false);
        expect(result.offered).toBe(true);
        expect(result.played?.move.to.name).toBe("H3");
        expect(game.ending).toBeNull();
        expect(game.currentSideId).toBe(1);
        expect(game.drawOfferedBy).toBe(0);
    });

    it("Given a first king move, When it is tried for a claim, Then it is no claim and the real king is not marked as moved", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });

        expect(claimWithMove(game, 0, { from: "E1", to: "F1" })).toBeNull();
        expect(pieceOn(game, "E1")?.hasMoved()).toBe(false);
    });

    it("Given an intended move that is not legal, When claimed, Then it is refused and the game is unchanged", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });

        expect(() => offerDraw(game, 0, { from: "E1", to: "E3" })).toThrow(
            "A casa de destino da jogada escolhida não pode ser realizada pela peça escolhida"
        );
        expect(game.drawOfferedBy).toBeNull();
        expect(game.currentSideId).toBe(0);
    });

    it("Given it is not their turn, When a side claims with a move, Then it is refused like any move out of turn", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });

        expect(() => offerDraw(game, 1, { from: "A8", to: "A7" })).toThrow("Não está na sua vez de jogar, espere sua vez");
        expect(game.drawOfferedBy).toBeNull();
    });

    it("Given an invalid claim whose move mates, When claimed, Then the mate ends the game and no offer is left", () => {
        const game = gameWith({ B6: "Rei-0", H1: "Torre-0", A8: "Rei-1" });

        const result = offerDraw(game, 0, { from: "H1", to: "H8" });

        expect(result.offered).toBe(false);
        expect(game.ending?.id).toBe(GameEnding.WhiteWins);
        expect(game.drawOfferedBy).toBeNull();
    });

    it("Given the opponent's open offer, When the side on turn claims with a move that is not valid, Then the move declines it and a new offer goes the other way", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        offerDraw(game, 1);

        const result = offerDraw(game, 0, { from: "H1", to: "H2" });

        expect(result.played?.declinedDrawOffer).toBe(true);
        expect(game.drawOfferedBy).toBe(0);
        expect(game.requestedActions.map((action) => action.ladoId)).toEqual([1]);
    });
});
