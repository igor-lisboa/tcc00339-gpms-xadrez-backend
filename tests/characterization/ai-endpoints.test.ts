import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApiClient, type ApiClient } from "./helpers/api";
import { startServer, type RunningServer } from "./helpers/server";
import { WHITE, AI, boardWith, createGame, createGameWithHumans } from "./helpers/game";

describe("characterization: AI endpoints", () => {
    let server: RunningServer;
    let api: ApiClient;

    beforeAll(async () => {
        server = await startServer();
        api = createApiClient(server.url);
    });

    afterAll(async () => {
        await server.stop();
    });

    it("a human-vs-AI game seats the AI on the other side when the human joins", async () => {
        const jogoId = await createGame(api, { tipoJogo: 1 });
        await api.post(`/jogos/${jogoId}/jogadores`, { ladoId: 0, tipoId: 0 });

        const { body } = await api.get(`/jogos/${jogoId}/lados`);
        expect(body.data.preto.tipo).toEqual({ id: AI, nome: "I.A." });

        const ias = await api.get(`/jogos/${jogoId}/ias`);
        expect(ias.body.data.map((ia: any) => ia.lado.id)).toEqual([1]);
    });

    it("GET /jogos/ia lists only unfinished games that have AI sides", async () => {
        const humanos = await createGameWithHumans(api);
        const ia = await createGame(api, { tipoJogo: 2 });

        const { body } = await api.get("/jogos/ia");
        const ids = body.data.map((item: any) => item.jogo.id);
        expect(ids).toContain(ia);
        expect(ids).not.toContain(humanos);
        expect(body.data.find((item: any) => item.jogo.id === ia).ladosIa.map((item: any) => item.lado.id)).toEqual([0, 1]);
    });

    it("POST /jogos/ia/executa plays one move for the side on turn in each AI-only game", async () => {
        const ia = await createGame(api, { tipoJogo: 2 });

        // other AI games may exist from earlier tests in this server, so look only at this one
        const { status, body } = await api.post("/jogos/ia/executa");
        expect(status).toBe(200);
        expect(body.message).toBe("Jogadas da I.A. executadas com sucesso!");
        expect(body.data.jogadasErros).toEqual([]);
        expect(body.data.jogadasExecutadas.filter((jogada: any) => jogada.jogoId === ia)).toEqual([
            expect.objectContaining({ jogoId: ia, ladoId: 0 }),
        ]);

        const jogo = await api.get(`/jogos/${ia}`);
        expect(jogo.body.data.ladoIdAtual).toBe(1);
    });

    it("POST /jogos/ia runs the moves it is given and reports the ones that fail", async () => {
        const ia = await createGame(api, { tipoJogo: 2 });

        const { body } = await api.post("/jogos/ia", {
            jogadas: [
                { jogoId: ia, ladoId: WHITE, casaOrigem: "E2", casaDestino: "E4" },
                { jogoId: ia, ladoId: WHITE, casaOrigem: "D2", casaDestino: "D4" },
            ],
        });
        expect(body.data.jogadasExecutadas).toHaveLength(1);
        expect(body.data.jogadasErros).toHaveLength(1);
        expect(body.data.jogadasErros[0].erro).toBe("Não está na sua vez de jogar, espere sua vez");
    });

    it("POST /jogos/ia with no moves answers an empty result", async () => {
        const { body } = await api.post("/jogos/ia", {});
        expect(body.data).toEqual({ jogadasExecutadas: [], jogadasErros: [] });
    });

    it("the AI promotes a pawn by picking one of the four allowed pieces at random", async () => {
        const ia = await createGame(api, {
            tipoJogo: 2,
            tabuleiroCasas: boardWith({ A7: "Peão-0", E1: "Rei-0", H8: "Rei-1" }),
        });
        await api.post("/jogos/ia", {
            jogadas: [{ jogoId: ia, ladoId: WHITE, casaOrigem: "A7", casaDestino: "A8" }],
        });

        const { status, body } = await api.post(`/jogos/${ia}/ia/promove-peao`, undefined, { lado: WHITE });
        expect(status).toBe(200);
        expect(["Rainha", "Torre", "Bispo", "Cavalo"]).toContain(body.data.tipo);
    });

    it("GET /ia asks the AI player to run (acknowledged even with no AI games)", async () => {
        const { status, body } = await api.get("/ia");
        expect(status).toBe(200);
        expect(body.message).toBe("Tentativa de forçar a I.A. a executar executada com sucesso!");
    });
});
