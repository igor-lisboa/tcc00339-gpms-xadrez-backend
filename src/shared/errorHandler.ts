import type { ErrorRequestHandler } from "express";
import { AppError } from "./errors";
import { logger } from "./logger";

/**
 * Last middleware of the Express app. Turns AppError into its status code and
 * the usual envelope; anything else becomes a generic 500 and is logged in full.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message, data: null, success: false });
        return;
    }

    logger.error({ err: error }, "Unhandled error");
    res.status(500).json({ message: "Internal server error", data: null, success: false });
};
