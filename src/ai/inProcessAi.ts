import type { GameService } from "../application/GameService";
import type { AiListener } from "../application/ports/AiListener";
import { logger } from "../shared/logger";

/** The part of an event that names a game and the side the AI must act for. */
interface GameRef {
    readonly jogoId: number;
    readonly ladoId: number;
}

export interface InProcessAi extends AiListener {
    /** Plays once at start-up, as the separate worker did when it connected. */
    start(): void;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const report = (context: string, error: unknown): void => {
    logger.error({ message: error instanceof Error ? error.message : String(error) }, context);
};

/**
 * The AI player, running inside the API process. It reacts to the events the "I.A." identifier
 * used to receive, and calls the game service directly instead of over HTTP. It waits
 * `waitMs` before it acts, as the worker did. It stops when the API process stops.
 */
export const createInProcessAi = (service: GameService, waitMs: number): InProcessAi => {
    const runTurns = async (): Promise<void> => {
        await sleep(waitMs);
        try {
            const result = service.playAiTurns();
            logger.info({ executed: result.executed.length, failed: result.failed.length }, "AI turns played");
        } catch (error) {
            report("AI turn failed", error);
        }
    };

    const answerProposal = async (ref: GameRef, kind: "reset" | "empate"): Promise<void> => {
        await sleep(waitMs);
        const accepted = Math.random() < 0.5;
        try {
            if (kind === "reset") {
                service.answerReset(ref.jogoId, ref.ladoId, accepted);
            } else {
                service.answerDraw(ref.jogoId, ref.ladoId, accepted);
            }
        } catch (error) {
            report(`AI answer to ${kind} failed`, error);
        }
    };

    const promote = async (ref: GameRef): Promise<void> => {
        await sleep(waitMs);
        try {
            service.aiPromote(ref.jogoId, ref.ladoId);
        } catch (error) {
            report("AI promotion failed", error);
        }
    };

    return {
        start() {
            void runTurns();
        },
        onEvent(eventName, payload) {
            switch (eventName) {
                case "jogoCriado":
                case "adversarioEntrou":
                case "jogadaRealizada":
                case "forcaIa":
                    void runTurns();
                    return;
                case "promocaoPeao":
                    void promote(payload as GameRef);
                    return;
                case "resetProposto":
                    void answerProposal(payload as GameRef, "reset");
                    return;
                case "empateProposto":
                    void answerProposal(payload as GameRef, "empate");
                    return;
            }
        },
    };
};
