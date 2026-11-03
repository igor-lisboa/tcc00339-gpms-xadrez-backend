import { describe, expect, it } from "vitest";
import { parseEnv } from "../../../src/config/env";

describe("parseEnv", () => {
    it("uses the documented defaults when nothing is set", () => {
        expect(parseEnv({})).toEqual({
            PORT: 3333,
            APP_WAIT_MS: 3000,
            AI_ENABLED: true,
            LOG_LEVEL: "info",
        });
    });

    it("reads numbers from strings", () => {
        const settings = parseEnv({ PORT: "8080", APP_WAIT_MS: "250" });
        expect(settings.PORT).toBe(8080);
        expect(settings.APP_WAIT_MS).toBe(250);
    });

    it("turns AI_ENABLED=false into false", () => {
        expect(parseEnv({ AI_ENABLED: "false" }).AI_ENABLED).toBe(false);
        expect(parseEnv({ AI_ENABLED: "true" }).AI_ENABLED).toBe(true);
    });

    it("refuses a port that is not a positive whole number", () => {
        expect(() => parseEnv({ PORT: "abc" })).toThrow(/PORT/);
        expect(() => parseEnv({ PORT: "0" })).toThrow(/PORT/);
    });

    it("refuses an unknown log level", () => {
        expect(() => parseEnv({ LOG_LEVEL: "loud" })).toThrow(/LOG_LEVEL/);
    });

    it("refuses AI_ENABLED values other than true or false", () => {
        expect(() => parseEnv({ AI_ENABLED: "yes" })).toThrow(/AI_ENABLED/);
    });
});
