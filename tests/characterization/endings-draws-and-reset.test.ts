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
        expect(body.data.ladoIdVencedor).toBe(1);
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

    /** Four plies that bring both kings back. The first one costs White its castling right, so the start position never returns. */
    const shuffleKings = async (jogoId: number, cycles: number) => {
        for (let ciclo = 0; ciclo < cycles; ciclo++) {
            await move(api, jogoId, WHITE, "E1", "E2");
            await move(api, jogoId, BLACK, "A8", "A7");
            await move(api, jogoId, WHITE, "E2", "E1");
            await move(api, jogoId, BLACK, "A7", "A8");
        }
    };

    it("a threefold repetition is a draw only when the side on turn claims it with a draw offer", async () => {
        const jogoId = await createGame(api, {
            tipoJogo: 0,
            tabuleiroCasas: boardWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1", H8: "Torre-1" }),
        });
        await seatBothHumans(api, jogoId);
        await shuffleKings(jogoId, 3);

        const antes = await api.get(`/jogos/${jogoId}`);
        expect(antes.body.data.finalizado).toBeNull();

        const claim = await api.put(`/jogos/${jogoId}/empate/propoe`, undefined, { lado: WHITE });
        expect(claim.body.message).toBe("Empate reivindicado com sucesso!");
        expect(claim.body.data).toEqual({ reivindicado: true, jogadaRealizada: null });

        const { body } = await api.get(`/jogos/${jogoId}`);
        expect(body.data.finalizado).toEqual({ id: 6, tipo: "Empate: Regra das 3 posições" });
        expect(body.data.ladoIdVencedor).toBeNull();
        expect(body.data.acoesSolicitadas).toEqual([]);
    });

    it("the side on turn claims a threefold repetition for the position its intended move would make", async () => {
        const jogoId = await createGame(api, {
            tipoJogo: 0,
            tabuleiroCasas: boardWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1", H8: "Torre-1" }),
        });
        await seatBothHumans(api, jogoId);
        // after two cycles the board position has appeared twice; White's E1-E2 would make its follower appear a third time
        await shuffleKings(jogoId, 2);

        const claim = await api.put(`/jogos/${jogoId}/empate/propoe`, { origem: "E1", destino: "E2" }, { lado: WHITE });

        expect(claim.body.message).toBe("Empate reivindicado com sucesso!");
        expect(claim.body.data).toEqual({ reivindicado: true, jogadaRealizada: null });
        const { body } = await api.get(`/jogos/${jogoId}`);
        expect(body.data.finalizado).toEqual({ id: 6, tipo: "Empate: Regra das 3 posições" });
        // the written move is not played: the white king is still on E1
        expect(body.data.tabuleiro.casas[7][4]?.tipo).toBe("Rei");
    });

    it("a claim with an intended move that is not valid plays the move and leaves a draw offer", async () => {
        const jogoId = await createGameWithHumans(api);

        const claim = await api.put(`/jogos/${jogoId}/empate/propoe`, { origem: "G1", destino: "F3" }, { lado: WHITE });

        expect(claim.body.message).toBe("Empate proposto ao lado adversário com sucesso!");
        expect(claim.body.data.reivindicado).toBe(false);
        expect(claim.body.data.jogadaRealizada.casaDestino.casa).toBe("F3");
        const { body } = await api.get(`/jogos/${jogoId}`);
        expect(body.data.finalizado).toBeNull();
        expect(body.data.ladoIdAtual).toBe(1);
        expect(body.data.empatePropostoPeloLadoId).toBe(0);
    });

    it("a claim with only one square of the intended move is refused", async () => {
        const jogoId = await createGameWithHumans(api);

        const { status, body } = await api.put(`/jogos/${jogoId}/empate/propoe`, { origem: "G1" }, { lado: WHITE });

        expect(status).toBe(500);
        expect(body.message).toBe("Informe a casa de origem e a casa de destino da jogada pretendida");
    });

    it("kings behind fully blocked pawns end the game as a dead position", async () => {
        // a zigzag wall of pawns across the board: no pawn can move and neither king can get through
        const deadId = await createGame(api, {
            tipoJogo: 0,
            tabuleiroCasas: boardWith({ A1: "Rei-0", A3: "Peão-0", B4: "Peão-0", C3: "Peão-0", D4: "Peão-0", E3: "Peão-0", F4: "Peão-0", G3: "Peão-0", H4: "Peão-0",
                A8: "Rei-1", A4: "Peão-1", B5: "Peão-1", C4: "Peão-1", D5: "Peão-1", E4: "Peão-1", F5: "Peão-1", G4: "Peão-1", H5: "Peão-1" }),
        });
        const { body } = await api.get(`/jogos/${deadId}`);
        expect(body.data.finalizado).toEqual({ id: 11, tipo: "Empate: Posição morta" });
    });

    it("the fifth appearance of a position ends the game without a claim", async () => {
        const jogoId = await createGame(api, {
            tipoJogo: 0,
            tabuleiroCasas: boardWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1", H8: "Torre-1" }),
        });
        await seatBothHumans(api, jogoId);
        await shuffleKings(jogoId, 4);
        await move(api, jogoId, WHITE, "E1", "E2");

        const { body } = await api.get(`/jogos/${jogoId}`);
        expect(body.data.finalizado).toEqual({ id: 9, tipo: "Empate: Regra das 5 posições" });
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


    it("after 50 moves each without a capture or a pawn move, the side on turn claims a draw and no offer is sent", async () => {
        const jogoId = await createGame(api, {
            tipoJogo: 0,
            tabuleiroCasas: boardWith({ C1: "Rei-0", H5: "Torre-0", A8: "Rei-1" }),
        });
        await seatBothHumans(api, jogoId);

        // White's king walks a loop of 13 squares while Black's king steps back and forth: no position appears 3 times
        const loop = ["C1", "D1", "E1", "F1", "G1", "H1", "H2", "G2", "F2", "E2", "D2", "C2", "B1"];
        for (let lance = 0; lance < 50; lance++) {
            await move(api, jogoId, WHITE, loop[lance % 13], loop[(lance + 1) % 13]);
            await move(api, jogoId, BLACK, lance % 2 === 0 ? "A8" : "B8", lance % 2 === 0 ? "B8" : "A8");
        }

        const antes = await api.get(`/jogos/${jogoId}`);
        expect(antes.body.data.finalizado).toBeNull();
        expect(antes.body.data.tabuleiro.qtdTurnosSemCapturaOuMovimentoDePeao).toBe(100);

        const claim = await api.put(`/jogos/${jogoId}/empate/propoe`, undefined, { lado: WHITE });
        expect(claim.body.message).toBe("Empate reivindicado com sucesso!");

        const { body } = await api.get(`/jogos/${jogoId}`);
        expect(body.data.finalizado).toEqual({ id: 2, tipo: "Empate: Regra 50 movimentos" });
        expect(body.data.acoesSolicitadas).toEqual([]);
        expect(body.data.empatePropostoPeloLadoId).toBeNull();
    });

    it("resigning finishes the game with the desistência result", async () => {
        const jogoId = await createGameWithHumans(api);
        await api.delete(`/jogos/${jogoId}/jogadores/${BLACK}`, { lado: BLACK });
        const { body } = await api.get(`/jogos/${jogoId}`);
        expect(body.data.finalizado.id).toBe(7);
        expect(body.data.ladoIdVencedor).toBe(0);
    });

    it("a time out is a win for the opponent when the opponent has a rook", async () => {
        const jogoId = await createGame(api, {
            tipoJogo: 0,
            tempoDeTurnoEmMilisegundos: 1,
            tabuleiroCasas: boardWith({ E1: "Rei-0", A8: "Rei-1", H8: "Torre-1" }),
        });
        await seatBothHumans(api, jogoId);
        await sleep(20);

        const { body } = await api.get(`/jogos/${jogoId}`);
        expect(body.data.finalizado).toEqual({ id: 1, tipo: "Vitória: Preto" });
        // the side that ran out stays on turn: the frontend reads it as the side that lost on time
        expect(body.data.ladoIdAtual).toBe(0);
    });

    it("a time out is a draw when the opponent holds only a king", async () => {
        const jogoId = await createGame(api, {
            tipoJogo: 0,
            tempoDeTurnoEmMilisegundos: 1,
            tabuleiroCasas: boardWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" }),
        });
        await seatBothHumans(api, jogoId);
        await sleep(20);

        const { body } = await api.get(`/jogos/${jogoId}`);
        expect(body.data.finalizado).toEqual({ id: 8, tipo: "Empate: Tempo esgotado sem material" });
        expect(body.data.ladoIdAtual).toBe(0);
    });

    it("the clocks stop when the game ends: the remaining time does not change afterwards", async () => {
        const jogoId = await createGame(api, { tipoJogo: 0, tempoDeTurnoEmMilisegundos: 60000 });
        await seatBothHumans(api, jogoId);
        await api.delete(`/jogos/${jogoId}/jogadores/${BLACK}`, { lado: BLACK });

        const primeiro = await api.get(`/jogos/${jogoId}/simples`);
        await sleep(30);
        const segundo = await api.get(`/jogos/${jogoId}/simples`);

        expect(primeiro.body.data.ladoBrancoTempoMilisegundosRestante).toBe(
            segundo.body.data.ladoBrancoTempoMilisegundosRestante
        );
        expect(primeiro.body.data.ladoPretoTempoMilisegundosRestante).toBe(
            segundo.body.data.ladoPretoTempoMilisegundosRestante
        );
        expect(segundo.body.data.ladoBrancoTempoMilisegundosRestante).toBeGreaterThanOrEqual(0);
    });
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

    it("the side that is not on turn may offer a draw too", async () => {
        const jogoId = await createGameWithHumans(api);
        const { status, body } = await api.put(`/jogos/${jogoId}/empate/propoe`, undefined, { lado: BLACK });
        expect(status).toBe(200);
        expect(body.message).toBe("Empate proposto ao lado adversário com sucesso!");
    });

    it("an open offer does not stop the proposer from moving, and the offer stands", async () => {
        const jogoId = await createGameWithHumans(api);
        await api.put(`/jogos/${jogoId}/empate/propoe`, undefined, { lado: WHITE });

        await move(api, jogoId, WHITE, "E2", "E4");

        const jogo = await api.get(`/jogos/${jogoId}`);
        expect(jogo.body.data.empatePropostoPeloLadoId).toBe(0);
    });

    it("the other side declines an offer by moving instead of answering", async () => {
        const jogoId = await createGameWithHumans(api);
        await move(api, jogoId, WHITE, "E2", "E4");
        await api.put(`/jogos/${jogoId}/empate/propoe`, undefined, { lado: WHITE });

        await move(api, jogoId, BLACK, "E7", "E5");

        const jogo = await api.get(`/jogos/${jogoId}`);
        expect(jogo.body.data.empatePropostoPeloLadoId).toBeNull();
        expect(jogo.body.data.acoesSolicitadas).toEqual([]);
        const resposta = await api.post(`/jogos/${jogoId}/empate/responde`, { resposta: true }, { lado: BLACK });
        expect(resposta.body.message).toBe("Nenhum empate foi proposto");
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

    it("refuses a draw offer once the game has finished", async () => {
        const jogoId = await createGameWithHumans(api);
        await api.delete(`/jogos/${jogoId}/jogadores/${BLACK}`, { lado: BLACK });
        const { status, body } = await api.put(`/jogos/${jogoId}/empate/propoe`, undefined, { lado: WHITE });
        expect(status).toBe(500);
        expect(body.message).toBe("Esse jogo já foi finalizado");
    });
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
        await api.delete(`/jogos/${jogoId}/jogadores/${WHITE}`, { lado: WHITE });

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
