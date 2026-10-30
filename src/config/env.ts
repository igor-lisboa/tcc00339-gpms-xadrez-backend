import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const booleanFlag = z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true");

export const envSchema = z.object({
    PORT: z.coerce.number().int().positive().default(3333),
    APP_URL: z.url().default("http://localhost:3333"),
    APP_WAIT_MS: z.coerce.number().int().nonnegative().default(3000),
    APP_VERBOSE: booleanFlag,
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

/** Validates a set of variables and returns typed settings. Throws with a readable list of problems. */
export const parseEnv = (source: NodeJS.ProcessEnv): Env => {
    const result = envSchema.safeParse(source);
    if (!result.success) {
        const problems = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
        throw new Error("Invalid environment configuration: " + problems.join("; "));
    }
    return result.data;
};

export const env: Env = parseEnv(process.env);
