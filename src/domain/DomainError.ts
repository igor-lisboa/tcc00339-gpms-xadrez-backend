/**
 * A refusal raised by the chess rules (wrong turn, illegal move, finished game...).
 * The message is shown to the client as it is today, so keep the wording stable.
 */
export class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DomainError";
    }
}
