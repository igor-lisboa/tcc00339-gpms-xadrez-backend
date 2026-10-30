import axios, { type AxiosInstance } from "axios";
import { io as connect } from "socket.io-client";
import { env } from "../config/env";
import { logger } from "../shared/logger";

/**
 * The AI worker. It connects to the API as player "I.A." and asks the API to play
 * whenever the game changes or the API asks for it. It never plays on its own clock.
 */
const api: AxiosInstance = axios.create({ baseURL: env.APP_URL });
const socket = connect(env.APP_URL, { query: { jogador: "I.A." } }); // names-check:ignore (query key of the wire protocol)

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Reports a failed request. Network errors have no response, so the message is read defensively. */
const reportFailure = (context: string, error: unknown): void => {
    const data = (error as { response?: { data?: { message?: string } } }).response?.data;
    logger.error({ message: data?.message ?? String(error) }, context);
};

const runAi = async (): Promise<void> => {
    await sleep(env.APP_WAIT_MS);
    try {
        const response = await api.post("/jogos/ia/executa");
        if (env.APP_VERBOSE) {
            logger.info({ data: response.data }, "AI turn requested");
        }
    } catch (error) {
        reportFailure("AI turn failed", error);
    }
};

const answerProposal = async (gameId: number, sideId: number, kind: "reset" | "empate"): Promise<void> => {
    await sleep(env.APP_WAIT_MS);
    const resposta = Math.random() < 0.5;
    try {
        await api.post(`/jogos/${gameId}/${kind}/responde`, { resposta }, { headers: { lado: sideId } }); // names-check:ignore (header of the wire protocol)
    } catch (error) {
        reportFailure(`AI answer to ${kind} failed`, error);
    }
};

const promote = async (gameId: number, sideId: number): Promise<void> => {
    await sleep(env.APP_WAIT_MS);
    try {
        await api.post(`/jogos/${gameId}/ia/promove-peao`, {}, { headers: { lado: sideId } }); // names-check:ignore (header of the wire protocol)
    } catch (error) {
        reportFailure("AI promotion failed", error);
    }
};

socket.on("uncaughtException", (error: unknown) => logger.error({ err: error }, "AI socket error"));

socket.on("promocaoPeao", (args: { jogoId: number; ladoId: number }) => {
    void promote(args.jogoId, args.ladoId);
});

socket.on("resetProposto", (args: { jogoId: number; ladoId: number }) => {
    void answerProposal(args.jogoId, args.ladoId, "reset");
});

socket.on("empateProposto", (args: { jogoId: number; ladoId: number }) => {
    void answerProposal(args.jogoId, args.ladoId, "empate");
});

["jogoCriado", "adversarioEntrou", "jogadaRealizada", "forcaIa"].forEach((eventName) => {
    socket.on(eventName, () => void runAi());
});

logger.info("AI worker started");
void runAi();
