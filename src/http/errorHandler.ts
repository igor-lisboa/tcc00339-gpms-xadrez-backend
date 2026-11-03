import type { ErrorRequestHandler } from "express";
import { DomainError } from "../domain/DomainError";
import { errorHandler as serverErrorHandler } from "../shared/errorHandler";
import { failure } from "./envelope";

/**
 * Turns a refused rule into the envelope with status 500, as the API has always done.
 * Other errors go to the shared handler. Malformed JSON keeps Express's own response.
 */
export const httpErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
    if (error instanceof DomainError) {
        res.status(500).json(failure(error.message));
        return;
    }
    if (error?.type === "entity.parse.failed") {
        next(error);
        return;
    }
    serverErrorHandler(error, req, res, next);
};
