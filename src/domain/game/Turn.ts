/** A period in which one side is on the move. It ends when the turn passes. */
export class Turn {
    readonly startedAtMs: number;
    endedAtMs: number | null = null;
    totalMs: number | null = null;

    constructor(readonly sideId: number, nowMs: number = Date.now()) {
        this.startedAtMs = nowMs;
    }

    end(nowMs: number = Date.now()): void {
        this.endedAtMs = nowMs;
        this.totalMs = nowMs - this.startedAtMs;
    }

    /** Milliseconds used so far; a turn still running counts up to now. */
    elapsedMs(nowMs: number = Date.now()): number {
        return this.totalMs ?? nowMs - this.startedAtMs;
    }
}
