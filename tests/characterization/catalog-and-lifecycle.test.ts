import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApiClient, type ApiClient } from "./helpers/api";
import { startServer, type RunningServer } from "./helpers/server";
import { BLACK, WHITE, createGame, createGameWithHumans } from "./helpers/game";

describe("characterization: catalog endpoints", () => {
    let server: RunningServer;
    let api: ApiClient;

    beforeAll(async () => {
        server = await startServer();
        api = createApiClient(server.url);
    });

    afterAll(async () => {
        await server.stop();
    });

    it("GET / returns the welcome message and sorted group list", async () => {
        const { status, body } = await api.get("/");
        expect(status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.message).toBe("Olá, esse é nosso XADREZ!");
        expect(body.data.grupo).toEqual([...body.data.grupo].sort());
    });

    it("GET / points documentacao to Swagger UI (/docs) on the host that answered", async () => {
        const { body } = await api.get("/");
        expect(body.data.documentacao).toBe(server.url + "/docs");
    });

    it("GET /tipos-de-jogo lists the three game types with resolved player types", async () => {
        const { body } = await api.get("/tipos-de-jogo");
        expect(body.data.map((tipo: any) => tipo.id)).toEqual([0, 1, 2]);
        expect(body.data[1].integranteLadoTipo.map((tipo: any) => tipo.nome)).toEqual(["Humano", "I.A."]);
    });

    it("GET /lados-do-jogo lists the two sides", async () => {
        const { body } = await api.get("/lados-do-jogo");
        expect(body.data).toEqual([
            { id: 0, nome: "Branco", cabecaPraBaixo: true },
            { id: 1, nome: "Preto", cabecaPraBaixo: false },
        ]);
    });

    it("GET /tipos-de-jogador lists human and AI player types", async () => {
        const { body } = await api.get("/tipos-de-jogador");
        expect(body.data).toEqual([
            { id: 0, nome: "Humano" },
            { id: 1, nome: "I.A." },
        ]);
    });

    it("GET /tipos-de-peca lists all six piece types", async () => {
        const { body } = await api.get("/tipos-de-peca");
        expect(body.data.map((peca: any) => peca.nome)).toEqual(["Rei", "Rainha", "Torre", "Bispo", "Cavalo", "Peão"]);
    });

    it("GET /tipos-de-peca/promocao-peao excludes king and pawn", async () => {
        const { body } = await api.get("/tipos-de-peca/promocao-peao");
        expect(body.data.map((peca: any) => peca.nome)).toEqual(["Rainha", "Torre", "Bispo", "Cavalo"]);
    });

    it("GET /tipos-de-finalizacao lists the nine endings with their category and winning side", async () => {
        const { status, body } = await api.get("/tipos-de-finalizacao");
        expect(status).toBe(200);
        expect(body.message).toBe("Tipos de finalização retornados com sucesso!");
        expect(body.data).toHaveLength(9);
        expect(body.data[0]).toEqual({ id: 0, tipo: "Vitória: Branco", categoria: "vitoria", ladoIdVencedor: 0 });
        expect(body.data[1]).toEqual({ id: 1, tipo: "Vitória: Preto", categoria: "vitoria", ladoIdVencedor: 1 });
        expect(body.data[7]).toEqual({
            id: 7,
            tipo: "Desistência: Um jogador deixou a partida",
            categoria: "desistencia",
            ladoIdVencedor: null,
        });
        expect(body.data[8]).toEqual({
            id: 8,
            tipo: "Empate: Tempo esgotado sem material",
            categoria: "empate",
            ladoIdVencedor: null,
        });
    });

    it("GET /enumeracoes lists the requested actions, move names and directions the API sends", async () => {
        const { status, body } = await api.get("/enumeracoes");
        expect(status).toBe(200);
        expect(body.data.acoesSolicitadas).toEqual(["responderPropostaEmpate", "responderPropostaReset", "promocaoPeao"]);
        expect(body.data.nomesJogada).toEqual([
            "Roque Menor",
            "Roque Maior",
            "Primeiro Movimento Peão",
            "Promoção do Peão",
            "En Passant",
            "L",
            null,
        ]);
        expect(body.data.direcoes).toEqual([
            "frente",
            "tras",
            "esquerda",
            "direita",
            "frenteEsquerda",
            "frenteDireita",
            "trasEsquerda",
            "trasDireita",
            "especial",
        ]);
    });

    it("GET /tabela-equivalencia returns 64 squares in reverse order (A8 first)", async () => {
        const { body } = await api.get("/tabela-equivalencia");
        expect(body.data).toHaveLength(64);
        expect(body.data[0]).toEqual({ casa: "A8", linha: 0, coluna: 0 });
        expect(body.data[63]).toEqual({ casa: "H1", linha: 7, coluna: 7 });
    });
});

describe("characterization: game lifecycle", () => {
    let server: RunningServer;
    let api: ApiClient;

    beforeAll(async () => {
        server = await startServer();
        api = createApiClient(server.url);
    });

    afterAll(async () => {
        await server.stop();
    });

    it("GET /jogos is empty before any game is created", async () => {
        const { status, body } = await api.get("/jogos");
        expect(status).toBe(200);
        expect(body).toEqual({ message: "Jogos retornados com sucesso!", data: [], success: true });
    });

    it("POST /jogos creates a game with no players and the standard start position", async () => {
        const { status, body } = await api.post("/jogos", { tipoJogo: 0 });
        expect(status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.id).toBe(0);
        expect(body.data.ladoIdAtual).toBe(0);
        expect(body.data.finalizado).toBeNull();
        expect(body.data.ladoBranco.tipo).toBeNull();
        expect(body.data.ladoPreto.tipo).toBeNull();
    });

    it("GET /jogos/:id/lado-sem-jogador lists both sides while nobody is seated", async () => {
        const jogoId = await createGame(api);
        const { body } = await api.get(`/jogos/${jogoId}/lado-sem-jogador`);
        expect(body.data.map((lado: any) => lado.lado)).toEqual(["Branco", "Preto"]);
    });

    it("POST /jogos/:id/jogadores seats a human and starts a turn once both sides are taken", async () => {
        const jogoId = await createGame(api);

        const first = await api.post(`/jogos/${jogoId}/jogadores`, { ladoId: 0, tipoId: 0 });
        expect(first.body.data.id).toBe(0);
        expect(first.body.data.tipo).toEqual({ id: 0, nome: "Humano" });

        const turnosAposPrimeiro = await api.get(`/jogos/${jogoId}/turnos`);
        expect(turnosAposPrimeiro.body.data).toEqual([]);

        await api.post(`/jogos/${jogoId}/jogadores`, { ladoId: 1, tipoId: 0 });
        const turnosAposSegundo = await api.get(`/jogos/${jogoId}/turnos`);
        expect(turnosAposSegundo.body.data).toHaveLength(1);
        expect(turnosAposSegundo.body.data[0].ladoId).toBe(0);
    });

    it("POST /jogos/:id/jogadores refuses to seat a side that is already taken", async () => {
        const jogoId = await createGame(api);
        await api.post(`/jogos/${jogoId}/jogadores`, { ladoId: 0, tipoId: 0 });

        const { status, body } = await api.post(`/jogos/${jogoId}/jogadores`, { ladoId: 0, tipoId: 0 });
        expect(status).toBe(500);
        expect(body).toEqual({ message: "Esse lado já foi escolhido", data: null, success: false });
    });

    it("GET /jogos/:id returns the full game state", async () => {
        const jogoId = await createGameWithHumans(api);
        const { status, body } = await api.get(`/jogos/${jogoId}`);
        expect(status).toBe(200);
        expect(body.data.id).toBe(jogoId);
        expect(body.data.ladoIdAtual).toBe(0);
        expect(body.data.tipoJogo.nome).toBeUndefined();
        expect(body.data.tabuleiro.casas).toHaveLength(8);
    });

    it("GET /jogos/:id/simples returns the summary view with the Human X Human label", async () => {
        const jogoId = await createGameWithHumans(api);
        const { body } = await api.get(`/jogos/${jogoId}/simples`);
        expect(body.data.tipoJogo).toBe("Humano X Humano");
        expect(body.data.ladoIdAtual).toBe(0);
        expect(body.data.finalizado).toBeNull();
        expect(body.data.ladosIdDeslogados).toEqual([]);
        expect(body.data.tabuleiro[0][0]).toEqual({ tipo: "Torre", ladoId: 1, jogadasRealizadasLength: 0, valor: 5 });
    });

    it("GET /jogos/:id/simples?tabuleiroSuperSimplificado=true returns 'Tipo-ladoId' strings", async () => {
        const jogoId = await createGameWithHumans(api);
        const { body } = await api.get(`/jogos/${jogoId}/simples?tabuleiroSuperSimplificado=true`);
        expect(body.data.tabuleiro[0][0]).toBe("Torre-1");
        expect(body.data.tabuleiro[7][4]).toBe("Rei-0");
    });

    it("GET /jogos/:id/simples ignores '1' in the query and keeps the verbose board (known deviation)", async () => {
        // JSON.parse("1") is the number 1, which is not a boolean, so the controller resets it to false.
        // See docs/specs/game-lifecycle.md, "Known deviations".
        const jogoId = await createGameWithHumans(api);
        const { body } = await api.get(`/jogos/${jogoId}/simples?tabuleiroSuperSimplificado=1`);
        expect(body.data.tabuleiro[0][0]).toMatchObject({ tipo: "Torre" });
    });

    it("GET /jogos/:id/lados returns both sides by colour", async () => {
        const jogoId = await createGameWithHumans(api);
        const { body } = await api.get(`/jogos/${jogoId}/lados`);
        expect(body.data.branco.id).toBe(0);
        expect(body.data.preto.id).toBe(1);
        expect(body.data.branco.tipo).toEqual({ id: 0, nome: "Humano" });
    });

    it("GET /jogos/:id/lado-atual returns the side whose turn it is", async () => {
        const jogoId = await createGameWithHumans(api);
        const { body } = await api.get(`/jogos/${jogoId}/lado-atual`);
        expect(body.data.id).toBe(0);
        expect(body.data.lado).toBe("Branco");
    });

    it("DELETE /jogos/:id/jogadores/:ladoId resigns the side and finishes the game as a desistência", async () => {
        const jogoId = await createGameWithHumans(api);
        const resign = await api.delete(`/jogos/${jogoId}/jogadores/${WHITE}`);
        expect(resign.status).toBe(200);
        expect(resign.body.data.tipo).toBeNull();

        const { body } = await api.get(`/jogos/${jogoId}`);
        expect(body.data.finalizado).toEqual({ id: 7, tipo: "Desistência: Um jogador deixou a partida" });
    });

    it("GET /jogos/:id with an unknown id returns 500 with the domain message", async () => {
        const { status, body } = await api.get("/jogos/999");
        expect(status).toBe(500);
        expect(body).toEqual({ message: "Jogo não encontrado", data: null, success: false });
    });

    it("GET /jogos/:id/rei-adversario is refused while it is not your turn", async () => {
        const jogoId = await createGameWithHumans(api);
        const { status, body } = await api.get(`/jogos/${jogoId}/rei-adversario`, { lado: BLACK });
        expect(status).toBe(500);
        expect(body.message).toBe("Aguarde sua vez de interagir com o jogo");
    });
});
