import { describe, expect, it } from "vitest";
import { clocksOf } from "../../../src/domain/game/clock";
import { Turn } from "../../../src/domain/game/Turn";
import { GameEnding } from "../../../src/shared/constants";
import { gameWith } from "./helpers";

const ONE_MINUTE = 60_000;

describe("clocks in milliseconds (clocksOf)", () => {
    it("Given a game with no time limit, When read, Then the time left is null and the time used counts up", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        const started = game.turns[0].startedAtMs;

        const clocks = clocksOf(game, started + 5000);

        expect(clocks.white).toEqual({ spentMs: 5000, remainingMs: null });
        expect(clocks.black).toEqual({ spentMs: 0, remainingMs: null });
    });

    it("Given a limit of one minute, When White has used five seconds, Then White has 55 seconds left and the two add up to the limit", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        Object.assign(game, { timeLimitMs: ONE_MINUTE });
        const started = game.turns[0].startedAtMs;

        const white = clocksOf(game, started + 5000).white;

        expect(white).toEqual({ spentMs: 5000, remainingMs: 55_000 });
        expect(white.spentMs + (white.remainingMs ?? 0)).toBe(ONE_MINUTE);
    });

    it("Given White used 2 seconds and Black is on turn, When Black has used 3 seconds, Then each side's time is summed over its own turns", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        Object.assign(game, { timeLimitMs: ONE_MINUTE });
        const started = game.turns[0].startedAtMs;
        Object.assign(game.turns[0], { totalMs: 2000, endedAtMs: started + 2000 });
        game.turns.push(new Turn(1, started + 2000));

        const clocks = clocksOf(game, started + 5000);

        expect(clocks.white).toEqual({ spentMs: 2000, remainingMs: 58_000 });
        expect(clocks.black).toEqual({ spentMs: 3000, remainingMs: 57_000 });
    });

    it("Given a game that has ended, When read at a later time, Then the clocks do not move", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        Object.assign(game, { timeLimitMs: ONE_MINUTE });
        const started = game.turns[0].startedAtMs;
        game.finish(GameEnding.MutualAgreement);

        const soon = clocksOf(game, started + 1);
        const later = clocksOf(game, started + 999_999);

        expect(later).toEqual(soon);
    });

    it("Given the time is gone, When read, Then the time left is zero, never negative, and the time used is not capped", () => {
        const game = gameWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" });
        Object.assign(game, { timeLimitMs: 1000 });
        const started = game.turns[0].startedAtMs;

        const white = clocksOf(game, started + 5000).white;

        expect(white).toEqual({ spentMs: 5000, remainingMs: 0 });
    });
});
