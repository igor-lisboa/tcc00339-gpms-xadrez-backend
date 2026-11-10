import { describe, expect, it, vi } from "vitest";
import type { Server } from "socket.io";
import { createInProcessAi } from "../../../src/ai/inProcessAi";
import type { GameService } from "../../../src/application/GameService";
import type { AiListener } from "../../../src/application/ports/AiListener";
import { SocketHub } from "../../../src/infrastructure/socket/SocketHub";

/** Only the service methods the AI calls; each one is a spy. */
const fakeService = () => {
    const service = {
        playAiTurns: vi.fn(() => ({ executed: [], failed: [] })),
        answerDraw: vi.fn(),
        answerReset: vi.fn(),
        aiPromote: vi.fn(),
        isDrawOfferOpenFor: vi.fn(() => true),
    };
    return { service, asService: service as unknown as GameService };
};

describe("in-process AI", () => {
    it("plays its turns when a move is made or a game is created", async () => {
        const { service, asService } = fakeService();
        const ai = createInProcessAi(asService, 0);

        ai.onEvent("jogadaRealizada");
        ai.onEvent("jogoCriado");

        await vi.waitFor(() => expect(service.playAiTurns).toHaveBeenCalledTimes(2));
    });

    it("plays once when it starts", async () => {
        const { service, asService } = fakeService();

        createInProcessAi(asService, 0).start();

        await vi.waitFor(() => expect(service.playAiTurns).toHaveBeenCalledTimes(1));
    });

    it("answers a draw offer for the side it plays", async () => {
        const { service, asService } = fakeService();

        createInProcessAi(asService, 0).onEvent("empateProposto", { jogoId: 4, ladoId: 1 });

        await vi.waitFor(() => expect(service.answerDraw).toHaveBeenCalledWith(4, 1, expect.any(Boolean)));
    });

    it("does not answer a draw offer that is no longer open, for example after its own move declined it", async () => {
        const { service, asService } = fakeService();
        service.isDrawOfferOpenFor.mockReturnValue(false);

        createInProcessAi(asService, 0).onEvent("empateProposto", { jogoId: 4, ladoId: 1 });

        await vi.waitFor(() => expect(service.isDrawOfferOpenFor).toHaveBeenCalledWith(4, 1));
        expect(service.answerDraw).not.toHaveBeenCalled();
    });

    it("answers a reset offer for the side it plays", async () => {
        const { service, asService } = fakeService();

        createInProcessAi(asService, 0).onEvent("resetProposto", { jogoId: 2, ladoId: 0 });

        await vi.waitFor(() => expect(service.answerReset).toHaveBeenCalledWith(2, 0, expect.any(Boolean)));
    });

    it("promotes a pawn for the side it plays", async () => {
        const { service, asService } = fakeService();

        createInProcessAi(asService, 0).onEvent("promocaoPeao", { jogoId: 3, ladoId: 1 });

        await vi.waitFor(() => expect(service.aiPromote).toHaveBeenCalledWith(3, 1));
    });

    it("ignores events it does not react to", async () => {
        const { service, asService } = fakeService();

        createInProcessAi(asService, 0).onEvent("jogoFinalizado", { jogoId: 1 });

        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(service.playAiTurns).not.toHaveBeenCalled();
        expect(service.answerDraw).not.toHaveBeenCalled();
    });
});

describe("socket hub routing to the AI", () => {
    const hubWith = (ai: AiListener) => {
        const hub = new SocketHub({ emit: vi.fn() } as unknown as Server);
        hub.attachAi(ai);
        return hub;
    };

    it("tells the AI when a game is created", () => {
        const ai = { onEvent: vi.fn() };

        hubWith(ai).publish({ type: "gameCreated" });

        expect(ai.onEvent).toHaveBeenCalledWith("jogoCriado");
    });

    it("tells the AI when it is asked to run", () => {
        const ai = { onEvent: vi.fn() };

        hubWith(ai).publish({ type: "aiForced" });

        expect(ai.onEvent).toHaveBeenCalledWith("forcaIa", undefined);
    });

    it("does not tell the AI about a game that is not its own", () => {
        const ai = { onEvent: vi.fn() };
        const hub = hubWith(ai);

        hub.publish({ type: "gameReset", gameId: 9 });

        expect(ai.onEvent).toHaveBeenCalledWith("jogoResetado", undefined);
    });
});
