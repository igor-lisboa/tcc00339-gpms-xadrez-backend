import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApiClient, type ApiClient } from "./helpers/api";
import { startServer, type RunningServer } from "./helpers/server";

describe("characterization: messages in the language of Accept-Language", () => {
    let server: RunningServer;
    let api: ApiClient;

    beforeAll(async () => {
        server = await startServer();
        api = createApiClient(server.url);
    });

    afterAll(async () => {
        await server.stop();
    });

    it("GET / without Accept-Language answers in pt-BR", async () => {
        const { body } = await api.get("/");
        expect(body.message).toBe("Olá, esse é nosso XADREZ!");
    });

    it("GET / with Accept-Language en answers the message in English", async () => {
        const { body } = await api.get("/", { "Accept-Language": "en" });
        expect(body.message).toBe("Hello, this is our CHESS!");
        expect(body.success).toBe(true);
    });

    it("GET / with Accept-Language fr answers the message in French", async () => {
        const { body } = await api.get("/", { "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8" });
        expect(body.message).toBe("Bonjour, voici notre ÉCHECS !");
    });

    it("GET / with Accept-Language pt answers in Portuguese", async () => {
        const { body } = await api.get("/", { "Accept-Language": "pt" });
        expect(body.message).toBe("Olá, esse é nosso XADREZ!");
    });

    it("GET /jogos/:id with an unknown id answers the refusal in German and keeps status 500", async () => {
        const { status, body } = await api.get("/jogos/999", { "Accept-Language": "de" });
        expect(status).toBe(500);
        expect(body).toEqual({ message: "Partie nicht gefunden", data: null, success: false });
    });

    it("GET /jogos/:id with an unknown language keeps the Portuguese refusal", async () => {
        const { body } = await api.get("/jogos/999", { "Accept-Language": "ja" });
        expect(body.message).toBe("Jogo não encontrado");
    });
});
