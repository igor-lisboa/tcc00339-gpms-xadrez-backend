import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApiClient, type ApiClient } from "./helpers/api";
import { startServer, type RunningServer } from "./helpers/server";
import { BLACK, WHITE, boardWith, createGame, createGameWithHumans, move, seatBothHumans } from "./helpers/game";

describe("characterization: how a game ends", () => {
    let server: RunningServer;
    let api: ApiClient;

    beforeAll(async () => {
        server = await startServer();
        api = createApiClient(server.url);
    });

    afterAll(async () => {
        await server.stop();
    });

    it("ends with a checkmate win for Black after fool's mate", async () => {
        const jogoId = await createGameWithHumans(api);
        await move(api, jogoId, WHITE, "F2", "F3");
        await move(api, jogoId, BLACK, "E7", "E5");
        await move(api, jogoId, WHITE, "G2", "G4");
        await move(api, jogoId, BLACK, "D8", "H4");

        const { body } = await api.get(`/jogos/${jogoId}`);
        expect(body.data.finalizado).toEqual({ id: 1, tipo: "Vitória: Preto" });
        expect(body.data.chequeLadoAtual).toBe(true);

        const depois = await api.post(`/jogos/${jogoId}/pecas/A2/move/A3`, undefined, { lado: WHITE });
        expect(depois.body.message).toBe("Esse jogo está finalizado");
    });

    it("ends in a stalemate draw when the side to move has no legal move and is not in check", async () => {
        const jogoId = await createGame(api, {
            tipoJogo: 0,
            tabuleiroCasas: boardWith({ A8: "Rei-1", B6: "Rei-0", C1: "Rainha-0" }),
        });
        await seatBothHumans(api, jogoId);

        await move(api, jogoId, WHITE, "C1", "C7");

        const { body } = await api.get(`/jogos/${jogoId}`);
        expect(body.data.finalizado).toEqual({ id: 4, tipo: "Empate: Rei afogado" });
    });

    it("ends in a draw by threefold repetition", async () => {
        const jogoId = await createGame(api, {
            tipoJogo: 0,
            tabuleiroCasas: boardWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1", H8: "Torre-1" }),
        });
        await seatBothHumans(api, jogoId);

        // four plies return to the start position; eight plies make it appear for the third time
        for (let ciclo = 0; ciclo < 2; ciclo++) {
            await move(api, jogoId, WHITE, "E1", "E2");
            await move(api, jogoId, BLACK, "A8", "A7");
            await move(api, jogoId, WHITE, "E2", "E1");
            await move(api, jogoId, BLACK, "A7", "A8");
        }

        const { body } = await api.get(`/jogos/${jogoId}`);
        expect(body.data.finalizado).toEqual({ id: 6, tipo: "Empate: Regra das 3 posições" });
    });

    it("ends as a draw for insufficient material when the last rook is captured", async () => {
        // White: king + rook. Black: king + knight. After Ng3xh1 neither side can mate.
        const jogoId = await createGame(api, {
            tipoJogo: 0,
            tabuleiroCasas: boardWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1", G3: "Cavalo-1" }),
        });
        await seatBothHumans(api, jogoId);

        // E2 is attacked by the knight on G3, so the king steps to D2 instead
        await move(api, jogoId, WHITE, "E1", "D2");
        await move(api, jogoId, BLACK, "G3", "H1");

        const { body } = await api.get(`/jogos/${jogoId}`);
        expect(body.data.finalizado).toEqual({ id: 3, tipo: "Empate: Insuficiência material" });
    });

    it.todo("ends as a draw by the 50-move rule (needs 100 plies without capture or pawn move; covered once the TS rules are in place)");

    it("resigning finishes the game with the desistência result", async () => {
        const jogoId = await createGameWithHumans(api);
        await api.delete(`/jogos/${jogoId}/jogadores/${BLACK}`);
        const { body } = await api.get(`/jogos/${jogoId}`);
        expect(body.data.finalizado.id).toBe(7);
    });
});

describe("characterization: draw offers", () => {
    let server: RunningServer;
    let api: ApiClient;

    beforeAll(async () => {
        server = await startServer();
        api = createApiClient(server.url);
    });

    afterAll(async () => {
        await server.stop();
    });

    it("the side on turn offers a draw; the other side is notified by a pending action", async () => {
        const jogoId = await createGameWithHumans(api);

        const { status, body } = await api.put(`/jogos/${jogoId}/empate/propoe`, undefined, { lado: WHITE });
        expect(status).toBe(200);
        expect(body.message).toBe("Empate proposto ao lado adversário com sucesso!");

        const jogo = await api.get(`/jogos/${jogoId}`);
        expect(jogo.body.data.empatePropostoPeloLadoId).toBe(0); // was the string "0" before the TypeScript port
        expect(jogo.body.data.acoesSolicitadas).toEqual([
            { acao: "responderPropostaEmpate", ladoId: 1, data: { ladoId: 1, jogoId } },
        ]);
    });

    it("a second offer while one is open is refused", async () => {
        const jogoId = await createGameWithHumans(api);
        await api.put(`/jogos/${jogoId}/empate/propoe`, undefined, { lado: WHITE });

        const { body } = await api.put(`/jogos/${jogoId}/empate/propoe`, undefined, { lado: WHITE });
        expect(body.message).toBe("Já tem um empate proposto pelo lado Branco");
    });

    it("the side that is not on turn cannot offer a draw", async () => {
        const jogoId = await createGameWithHumans(api);
        const { body } = await api.put(`/jogos/${jogoId}/empate/propoe`, undefined, { lado: BLACK });
        expect(body.message).toBe("Aguarde sua vez para propor um empate");
    });

    it("while an offer is pending the side on turn cannot move", async () => {
        const jogoId = await createGameWithHumans(api);
        await api.put(`/jogos/${jogoId}/empate/propoe`, undefined, { lado: WHITE });

        const { body } = await api.post(`/jogos/${jogoId}/pecas/E2/move/E4`, undefined, { lado: WHITE });
        expect(body.message).toBe("Tem ações solicitadas a serem executadas");
    });

    it("declining clears the offer so a new one can be made", async () => {
        const jogoId = await createGameWithHumans(api);
        await api.put(`/jogos/${jogoId}/empate/propoe`, undefined, { lado: WHITE });

        const resposta = await api.post(`/jogos/${jogoId}/empate/responde`, { resposta: false }, { lado: BLACK });
        expect(resposta.body.data).toEqual({ resposta: false });

        const jogo = await api.get(`/jogos/${jogoId}`);
        expect(jogo.body.data.empatePropostoPeloLadoId).toBeNull();
        expect(jogo.body.data.acoesSolicitadas).toEqual([]);

        const novo = await api.put(`/jogos/${jogoId}/empate/propoe`, undefined, { lado: WHITE });
        expect(novo.status).toBe(200);
    });

    it("accepting ends the game as a draw by mutual agreement", async () => {
        const jogoId = await createGameWithHumans(api);
        await api.put(`/jogos/${jogoId}/empate/propoe`, undefined, { lado: WHITE });

        await api.post(`/jogos/${jogoId}/empate/responde`, { resposta: true }, { lado: BLACK });

        const jogo = await api.get(`/jogos/${jogoId}`);
        expect(jogo.body.data.finalizado).toEqual({ id: 5, tipo: "Empate: Comum acordo" });
    });

    it("responding when nothing was offered is refused", async () => {
        const jogoId = await createGameWithHumans(api);
        const { body } = await api.post(`/jogos/${jogoId}/empate/responde`, { resposta: true }, { lado: BLACK });
        expect(body.message).toBe("Nenhum empate foi proposto");
    });

    it.todo("known deviation: offering a draw after the 50-move limit finalizes the game and still sends the offer (see docs/specs/draw-and-reset-negotiation.md)");
});

describe("characterization: reset", () => {
    let server: RunningServer;
    let api: ApiClient;

    beforeAll(async () => {
        server = await startServer();
        api = createApiClient(server.url);
    });

    afterAll(async () => {
        await server.stop();
    });

    it("PUT /reset restarts the same game id with the start position and no players", async () => {
        const jogoId = await createGameWithHumans(api);
        await move(api, jogoId, WHITE, "E2", "E4");

        const { status, body } = await api.put(`/jogos/${jogoId}/reset`);
        expect(status).toBe(200);
        expect(body.message).toBe("Jogo resetado com sucesso!");
        expect(body.data.id).toBe(jogoId);

        const jogo = await api.get(`/jogos/${jogoId}`);
        expect(jogo.body.data.ladoIdAtual).toBe(0);
        expect(jogo.body.data.ladoBranco.tipo).toBeNull();
        expect(jogo.body.data.turnos).toEqual([]);
    });

    it("proposing a reset on a game that is still running is refused", async () => {
        const jogoId = await createGameWithHumans(api);
        const { body } = await api.put(`/jogos/${jogoId}/reset/propoe`, undefined, { lado: WHITE });
        expect(body.message).toBe("Não é possível resetar um jogo que não foi finalizado");
    });

    it("on a finished game, the other side proposes a reset and the reply restarts the game", async () => {
        const jogoId = await createGameWithHumans(api);
        await api.delete(`/jogos/${jogoId}/jogadores/${WHITE}`);

        const proposta = await api.put(`/jogos/${jogoId}/reset/propoe`, undefined, { lado: BLACK });
        expect(proposta.body.message).toBe("Reset proposto ao lado adversário com sucesso!");

        const resposta = await api.post(`/jogos/${jogoId}/reset/responde`, { resposta: true }, { lado: WHITE });
        expect(resposta.body.data).toEqual({ resposta: true });

        const jogo = await api.get(`/jogos/${jogoId}`);
        expect(jogo.body.data.finalizado).toBeNull();
        expect(jogo.body.data.ladoBranco.tipo).toBeNull();
    });

    it("responding to a reset that was never proposed is refused", async () => {
        const jogoId = await createGameWithHumans(api);
        const { body } = await api.post(`/jogos/${jogoId}/reset/responde`, { resposta: true }, { lado: BLACK });
        expect(body.message).toBe("Nenhum reset foi proposto");
    });
});
