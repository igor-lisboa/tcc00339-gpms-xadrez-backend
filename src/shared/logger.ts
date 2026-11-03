import pino from "pino";
import { env } from "../config/env";

/** Application logger. Every line is JSON with an ISO timestamp, so log lines always show the real time. */
export const logger = pino({
    level: env.LOG_LEVEL,
    timestamp: pino.stdTimeFunctions.isoTime,
});
