import { describe, expect, it } from "vitest";
import { AppError, ConflictError, NotFoundError, ValidationError } from "../../../src/shared/errors";

describe("application errors", () => {
    it("default to a server error (500) when no status is given", () => {
        expect(new AppError("boom").statusCode).toBe(500);
    });

    it("map each kind to its HTTP status", () => {
        expect(new ValidationError("bad input").statusCode).toBe(400);
        expect(new NotFoundError("no such game").statusCode).toBe(404);
        expect(new ConflictError("not your turn").statusCode).toBe(409);
    });

    it("keep the message and the class name", () => {
        const error = new ConflictError("not your turn");
        expect(error.message).toBe("not your turn");
        expect(error.name).toBe("ConflictError");
    });

    it("are ordinary errors that can be caught as AppError", () => {
        const error = new NotFoundError("no such game");
        expect(error).toBeInstanceOf(AppError);
        expect(error).toBeInstanceOf(Error);
    });
});
