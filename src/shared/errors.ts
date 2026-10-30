/**
 * Base class for errors the application expects and can explain to the client.
 * Anything that is not an AppError is treated as a server fault.
 */
export class AppError extends Error {
    readonly statusCode: number;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.name = new.target.name;
        this.statusCode = statusCode;
    }
}

/** The request itself is malformed (missing or invalid data). */
export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}

/** The thing asked for does not exist (for example an unknown game). */
export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404);
    }
}

/** The request is valid but conflicts with the current state (for example, not your turn). */
export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409);
    }
}
