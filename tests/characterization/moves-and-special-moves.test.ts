import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApiClient, type ApiClient } from "./helpers/api";
import { startServer, type RunningServer } from "./helpers/server";
import { BLACK, WHITE, boardWith, createGame, createGameWithHumans, move, seatBothHumans } from "./helpers/game";

describe("characterization: moves, turn order and move generation", () => {
    let server: RunningServer;
    let api: ApiClient;

    beforeAll(async () => {
        server = await startServer();
        api = createApiClient(server.url);
    });

    afterAll(async () => {
        await server.stop();
    });

    it("lists the two pawn moves from E2 in the opening (E3 and E4)", async () => {
        const jogoId = await createGameWithHumans(api);
        const { status, body } = await api.get(`/jogos/${jogoId}/pecas/E2/possiveis-jogadas`, { lado: WHITE });
        expect(status).toBe(200);
        expect(body.data.map((jogada: any) => jogada.casaDestino.casa).sort()).toEqual(["E3", "E4"]);
    });

    it("lists the knight moves from B1 in the opening (A3 and C3)", async () => {
        const jogoId = await createGameWithHumans(api);
        const { body } = await api.get(`/jogos/${jogoId}/pecas/B1/possiveis-jogadas`, { lado: WHITE });
        expect(body.data.map((jogada: any) => jogada.casaDestino.casa).sort()).toEqual(["A3", "C3"]);
    });

    it("lists the piece itself on the side's own board (16 pieces for White at start)", async () => {
        const jogoId = await createGameWithHumans(api);
        const { body } = await api.get(`/jogos/${jogoId}/pecas`, { lado: WHITE });
        expect(body.data).toHaveLength(16);
    });

    it("refuses to list possible moves of a square that holds no piece of yours", async () => {
        const jogoId = await createGameWithHumans(api);
        const { status, body } = await api.get(`/jogos/${jogoId}/pecas/E7/possiveis-jogadas`, { lado: WHITE });
        expect(status).toBe(500);
        expect(body.message).toBe("Não foi possível encontrar a peça na casa desejada");
    });

    const contaJogadasLegais = async (jogoId: number, ladoId: string): Promise<number> => {
        const pecas = await api.get(`/jogos/${jogoId}/pecas`, { lado: ladoId });
        let total = 0;
        for (const peca of pecas.body.data) {
            const jogadas = await api.get(`/jogos/${jogoId}/pecas/${peca.casa}/possiveis-jogadas`, { lado: ladoId });
            total += jogadas.body.data.length;
        }
        return total;
    };

    it("perft: White has 20 legal moves in the opening position", async () => {
        const jogoId = await createGameWithHumans(api);
        expect(await contaJogadasLegais(jogoId, WHITE)).toBe(20);
    });

    it("perft: Black has 20 legal moves after 1.e4", async () => {
        const jogoId = await createGameWithHumans(api);
        await move(api, jogoId, WHITE, "E2", "E4");
        expect(await contaJogadasLegais(jogoId, BLACK)).toBe(20);
    });

    it("refuses a move from the side that is not on turn", async () => {
        const jogoId = await createGameWithHumans(api);
        const { status, body } = await api.post(`/jogos/${jogoId}/pecas/E7/move/E5`, undefined, { lado: BLACK });
        expect(status).toBe(500);
        expect(body.message).toBe("Não está na sua vez de jogar, espere sua vez");
    });

    it("refuses a move while the other side has not been seated", async () => {
        const jogoId = await createGame(api);
        await api.post(`/jogos/${jogoId}/jogadores`, { ladoId: 0, tipoId: 0 });
        const { body } = await api.post(`/jogos/${jogoId}/pecas/E2/move/E4`, undefined, { lado: WHITE });
        expect(body.message).toBe("Aguarde outro jogador se logar adequadamente no lado adversário");
    });

    it("refuses an illegal destination for the chosen piece", async () => {
        const jogoId = await createGameWithHumans(api);
        const { status, body } = await api.post(`/jogos/${jogoId}/pecas/E2/move/E5`, undefined, { lado: WHITE });
        expect(status).toBe(500);
        expect(body.message).toBe("A casa de destino da jogada escolhida não pode ser realizada pela peça escolhida");
    });

    it("refuses a move when the header lado is missing", async () => {
        const jogoId = await createGameWithHumans(api);
        const { body } = await api.post(`/jogos/${jogoId}/pecas/E2/move/E4`);
        expect(body.message).toBe("Não está na sua vez de jogar, espere sua vez");
    });

    it("plays a move, passes the turn, and records the move in the turn list", async () => {
        const jogoId = await createGameWithHumans(api);
        const response = await move(api, jogoId, WHITE, "E2", "E4");
        expect(response.body.data.nomeJogada).toBe("Primeiro Movimento Peão");
        expect(response.body.data.casaOrigem.casa).toBe("E2");
        expect(response.body.data.casaDestino.casa).toBe("E4");

        const { body } = await api.get(`/jogos/${jogoId}`);
        expect(body.data.ladoIdAtual).toBe(1);
        expect(body.data.chequeLadoAtual).toBe(false);

        const turnos = await api.get(`/jogos/${jogoId}/turnos`);
        expect(turnos.body.data.map((turno: any) => turno.ladoId)).toEqual([0, 1]);
    });

    it("reports the remaining time of each side once a time limit is set", async () => {
        const jogoId = await createGameWithHumans(api, { tipoJogo: 0, tempoDeTurnoEmMilisegundos: 60000 });
        const { body } = await api.get(`/jogos/${jogoId}/simples`);
        expect(body.data.tempoDeTurnoEmMilisegundos).toBe(60000);
        expect(body.data.ladoBrancoTempoMilisegundosRestante).toBeLessThanOrEqual(60000);
        expect(body.data.ladoBrancoTempoMilisegundosRestante).toBeGreaterThan(0);
    });

    it("accepts a board of 'Tipo-ladoId' strings and places the pieces as given", async () => {
        const jogoId = await createGameWithHumans(api, {
            tipoJogo: 0,
            tabuleiroCasas: boardWith({ E1: "Rei-0", A8: "Rei-1", H4: "Torre-0" }),
        });
        const { body } = await api.get(`/jogos/${jogoId}/simples?tabuleiroSuperSimplificado=true`);
        expect(body.data.tabuleiro[7][4]).toBe("Rei-0");
        expect(body.data.tabuleiro[0][0]).toBe("Rei-1");
        expect(body.data.tabuleiro[4][7]).toBe("Torre-0");
    });

    it("rejects an invalid piece string in the board with a domain message", async () => {
        const rows = boardWith({ E1: "Rei-0", A8: "Rei-1" });
        rows[4][4] = "Dama-0";
        const { status, body } = await api.post("/jogos", { tipoJogo: 0, tabuleiroCasas: rows });
        expect(status).toBe(500);
        expect(body.message).toContain("Esse tipo de peça escolhido para casa da linha:4 e coluna:4");
    });
});

describe("characterization: special moves", () => {
    let server: RunningServer;
    let api: ApiClient;

    beforeAll(async () => {
        server = await startServer();
        api = createApiClient(server.url);
    });

    afterAll(async () => {
        await server.stop();
    });

    it("castles kingside for White: the king goes to G1 and the rook to F1", async () => {
        const jogoId = await createGame(api, {
            tipoJogo: 0,
            tabuleiroCasas: boardWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" }),
        });
        await seatBothHumans(api, jogoId);

        const { body } = await api.get(`/jogos/${jogoId}/pecas/E1/possiveis-jogadas`, { lado: WHITE });
        const roque = body.data.find((jogada: any) => jogada.casaDestino.casa === "G1");
        expect(roque.nome).toBe("Roque Menor");

        const response = await move(api, jogoId, WHITE, "E1", "G1");
        expect(response.body.data.nomeJogada).toBe("Roque Menor");

        const tabuleiro = await api.get(`/jogos/${jogoId}/simples?tabuleiroSuperSimplificado=true`);
        expect(tabuleiro.body.data.tabuleiro[7][5]).toBe("Torre-0");
        expect(tabuleiro.body.data.tabuleiro[7][6]).toBe("Rei-0");
        expect(tabuleiro.body.data.tabuleiro[7][7]).toBeNull();
    });

    it("known deviation: castling is offered even when the king's path is attacked (see docs/specs/special-moves.md)", async () => {
        const jogoId = await createGame(api, {
            tipoJogo: 0,
            tabuleiroCasas: boardWith({ E1: "Rei-0", H1: "Torre-0", F8: "Torre-1", A8: "Rei-1" }),
        });
        await seatBothHumans(api, jogoId);

        const { body } = await api.get(`/jogos/${jogoId}/pecas/E1/possiveis-jogadas`, { lado: WHITE });
        expect(body.data.find((jogada: any) => jogada.casaDestino.casa === "G1").nome).toBe("Roque Menor");
    });

    it("does not offer castling once the rook has moved (no castling option in the list)", async () => {
        const jogoId = await createGame(api, {
            tipoJogo: 0,
            tabuleiroCasas: boardWith({ E1: "Rei-0", H1: "Torre-0", A8: "Rei-1" }),
        });
        await seatBothHumans(api, jogoId);
        await move(api, jogoId, WHITE, "H1", "H2");
        await move(api, jogoId, BLACK, "A8", "A7");
        await move(api, jogoId, WHITE, "H2", "H1");
        await move(api, jogoId, BLACK, "A7", "A8");

        const { body } = await api.get(`/jogos/${jogoId}/pecas/E1/possiveis-jogadas`, { lado: WHITE });
        expect(body.data.find((jogada: any) => jogada.casaDestino.casa === "G1")).toBeUndefined();
    });

    it("captures en passant: the pawn that double-stepped beside the capturing pawn is removed", async () => {
        const jogoId = await createGame(api, {
            tipoJogo: 0,
            tabuleiroCasas: boardWith({ E1: "Rei-0", A8: "Rei-1", E5: "Peão-0", D7: "Peão-1" }),
        });
        await seatBothHumans(api, jogoId);

        await move(api, jogoId, WHITE, "E1", "E2");
        await move(api, jogoId, BLACK, "D7", "D5");

        const { body } = await api.get(`/jogos/${jogoId}/pecas/E5/possiveis-jogadas`, { lado: WHITE });
        const enPassant = body.data.find((jogada: any) => jogada.casaDestino.casa === "D6");
        expect(enPassant.nome).toBe("En Passant");

        const response = await move(api, jogoId, WHITE, "E5", "D6");
        expect(response.body.data.nomeJogada).toBe("En Passant");

        const tabuleiro = await api.get(`/jogos/${jogoId}/simples?tabuleiroSuperSimplificado=true`);
        expect(tabuleiro.body.data.tabuleiro[3][3]).toBeNull();
        expect(tabuleiro.body.data.tabuleiro[2][3]).toBe("Peão-0");
    });

    it("promotes a pawn: the game waits for a choice, then the chosen piece replaces it", async () => {
        const jogoId = await createGame(api, {
            tipoJogo: 0,
            tabuleiroCasas: boardWith({ A7: "Peão-0", E1: "Rei-0", H8: "Rei-1" }),
        });
        await seatBothHumans(api, jogoId);

        await move(api, jogoId, WHITE, "A7", "A8");

        const pendente = await api.get(`/jogos/${jogoId}`);
        expect(pendente.body.data.ladoIdAtual).toBe(0);
        expect(pendente.body.data.acoesSolicitadas.map((acao: any) => acao.acao)).toEqual(["promocaoPeao"]);

        const bloqueada = await api.post(`/jogos/${jogoId}/pecas/E1/move/E2`, undefined, { lado: WHITE });
        expect(bloqueada.body.message).toBe("Tem ações solicitadas a serem executadas");

        const promovido = await api.post(`/jogos/${jogoId}/promove-peao/1`, undefined, { lado: WHITE });
        expect(promovido.body.data.tipo).toBe("Rainha");

        const depois = await api.get(`/jogos/${jogoId}/simples?tabuleiroSuperSimplificado=true`);
        expect(depois.body.data.tabuleiro[0][0]).toBe("Rainha-0");
        expect(depois.body.data.ladoIdAtual).toBe(1);
        expect(depois.body.data.acoesSolicitadas).toEqual([]);
    });

    it("refuses promotion to a king or a pawn", async () => {
        const jogoId = await createGame(api, {
            tipoJogo: 0,
            tabuleiroCasas: boardWith({ A7: "Peão-0", E1: "Rei-0", H8: "Rei-1" }),
        });
        await seatBothHumans(api, jogoId);
        await move(api, jogoId, WHITE, "A7", "A8");

        const { body } = await api.post(`/jogos/${jogoId}/promove-peao/0`, undefined, { lado: WHITE });
        expect(body.message).toBe("Peça inválida escolhida para a promoção do peão");
    });

    it("refuses a promotion choice when no pawn is waiting", async () => {
        const jogoId = await createGameWithHumans(api);
        const { body } = await api.post(`/jogos/${jogoId}/promove-peao/1`, undefined, { lado: WHITE });
        expect(body.message).toBe("Não é possível promover nenhum peão no momento");
    });
});
