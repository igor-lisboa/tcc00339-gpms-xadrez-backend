import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../../api/index";

describe("serverless entry", () => {
    it("serves the welcome message", async () => {
        const response = await request(app).get("/");
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    it("creates and reads a game", async () => {
        const created = await request(app).post("/jogos").send({ tipoJogo: 0 });
        const read = await request(app).get(`/jogos/${created.body.data.id}`);
        expect(read.status).toBe(200);
        expect(read.body.data.id).toBe(created.body.data.id);
    });
});
