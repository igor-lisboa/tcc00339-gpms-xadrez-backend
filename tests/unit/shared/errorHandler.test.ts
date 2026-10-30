import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { errorHandler } from "../../../src/shared/errorHandler";
import { ConflictError, NotFoundError } from "../../../src/shared/errors";

const buildApp = () => {
    const app = express();
    app.get("/conflict", () => {
        throw new ConflictError("Not your turn");
    });
    app.get("/missing", () => {
        throw new NotFoundError("Game not found");
    });
    app.get("/crash", () => {
        throw new Error("database exploded");
    });
    app.use(errorHandler);
    return app;
};

describe("errorHandler", () => {
    it("answers an application error with its status and the usual envelope", async () => {
        const response = await request(buildApp()).get("/conflict");
        expect(response.status).toBe(409);
        expect(response.body).toEqual({ message: "Not your turn", data: null, success: false });
    });

    it("answers a not-found error with 404", async () => {
        const response = await request(buildApp()).get("/missing");
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Game not found");
    });

    it("hides the details of an unexpected error behind a generic 500", async () => {
        const response = await request(buildApp()).get("/crash");
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Internal server error", data: null, success: false });
    });
});
