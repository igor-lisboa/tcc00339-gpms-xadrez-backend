import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { io, type Socket } from "socket.io-client";
import { createApiClient, type ApiClient } from "./helpers/api";
import { startServer, type RunningServer } from "./helpers/server";
import { BLACK, WHITE, createGame, move, seatBothHumans } from "./helpers/game";

const connect = (url: string, jogador: string): Promise<Socket> =>
    new Promise((resolve, reject) => {
        const socket = io(url, { query: { jogador }, forceNew: true, transports: ["websocket"] });
        socket.once("connect", () => resolve(socket));
        socket.once("connect_error", reject);
    });

/** Resolves with the next payload of the event, or rejects if nothing arrives in time. */
const nextEvent = (socket: Socket, eventName: string, timeoutMs = 3000): Promise<any> =>
    new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`No "${eventName}" received`)), timeoutMs);
        socket.once(eventName, (payload?: any) => {
            clearTimeout(timer);
            resolve(payload);
        });
    });

describe("characterization: real-time events", () => {
    let server: RunningServer;
    let api: ApiClient;
    let sockets: Socket[] = [];

    const track = async (url: string, jogador: string): Promise<Socket> => {
        const socket = await connect(url, jogador);
        sockets.push(socket);
        return socket;
    };

    beforeAll(async () => {
        server = await startServer();
        api = createApiClient(server.url);
    });

    afterEach(() => {
        sockets.forEach((socket) => socket.disconnect());
        sockets = [];
    });

    afterAll(async () => {
        await server.stop();
    });

    it("tells the other side about a move, with the check flag and no promotion", async () => {
        const jogoId = await createGame(api);
        const brancas = await track(server.url, `${jogoId}-${WHITE}`);
        const pretas = await track(server.url, `${jogoId}-${BLACK}`);

        await seatBothHumans(api, jogoId);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const recebido = nextEvent(pretas, "jogadaRealizada");
        await move(api, jogoId, WHITE, "E2", "E4");
        const payload = await recebido;

        expect(payload.jogadaRealizada.casaOrigem.casa).toBe("E2");
        expect(payload.jogadaRealizada.casaDestino.casa).toBe("E4");
        expect(payload.chequeLadoAtual).toBe(false);
        expect(payload.promocaoPara).toBeNull();
        expect(brancas.connected).toBe(true);
    });

    it("tells the opponent about a draw offer with the offering side id", async () => {
        const jogoId = await createGame(api);
        await track(server.url, `${jogoId}-${WHITE}`);
        const pretas = await track(server.url, `${jogoId}-${BLACK}`);
        await seatBothHumans(api, jogoId);

        const recebido = nextEvent(pretas, "empateProposto");
        await api.put(`/jogos/${jogoId}/empate/propoe`, undefined, { lado: WHITE });
        const payload = await recebido;

        expect(payload).toEqual({ jogoId, ladoId: 1 });
    });

    it("notifies the AI worker when the game it plays in is created", async () => {
        const ia = await track(server.url, "I.A.");
        const recebido = nextEvent(ia, "jogoCriado");
        await createGame(api, { tipoJogo: 2 });
        await recebido;
    });

    it("asks the AI worker to run when /ia is called", async () => {
        const ia = await track(server.url, "I.A.");
        const recebido = nextEvent(ia, "forcaIa");
        await api.get("/ia");
        await recebido;
    });

    it("keeps the other players connected when one of them disconnects", async () => {
        // fixed in the TypeScript port: the old code removed the last connected player instead of the one that left
        const jogoId = await createGame(api);
        const brancas = await track(server.url, `${jogoId}-${WHITE}`);
        const pretas = await track(server.url, `${jogoId}-${BLACK}`);
        await seatBothHumans(api, jogoId);
        await new Promise((resolve) => setTimeout(resolve, 100));

        brancas.disconnect();
        await new Promise((resolve) => setTimeout(resolve, 100));

        const recebido = nextEvent(pretas, "jogadaRealizada");
        await move(api, jogoId, WHITE, "E2", "E4");
        await recebido;
    });
});
