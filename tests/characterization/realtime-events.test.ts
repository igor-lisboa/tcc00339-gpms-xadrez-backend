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

    it("tells the proposer the offer was declined when the opponent moves instead of answering", async () => {
        const jogoId = await createGame(api);
        const brancas = await track(server.url, `${jogoId}-${WHITE}`);
        await track(server.url, `${jogoId}-${BLACK}`);
        await seatBothHumans(api, jogoId);
        await move(api, jogoId, WHITE, "E2", "E4");
        await api.put(`/jogos/${jogoId}/empate/propoe`, undefined, { lado: WHITE });

        const recebido = nextEvent(brancas, "empatePropostoResposta");
        await move(api, jogoId, BLACK, "E7", "E5");
        // the event has no payload: receiving it means the offer was declined
        await expect(recebido).resolves.toBeUndefined();
    });

    it("sends the ending and the winning side when a game finishes", async () => {
        const jogoId = await createGame(api);
        const brancas = await track(server.url, `${jogoId}-${WHITE}`);
        await seatBothHumans(api, jogoId);

        const recebido = nextEvent(brancas, "jogoFinalizado");
        await api.delete(`/jogos/${jogoId}/jogadores/${BLACK}`, { lado: BLACK });
        const payload = await recebido;

        expect(payload).toEqual({ jogoFinalizacao: "Desistência: Um jogador deixou a partida", ladoIdVencedor: 0 });
    });

    it("notifies the AI player when the game it plays in is created", async () => {
        const ia = await track(server.url, "I.A.");
        const recebido = nextEvent(ia, "jogoCriado");
        await createGame(api, { tipoJogo: 2 });
        await recebido;
    });

    it("asks the AI player to run when /ia is called", async () => {
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
