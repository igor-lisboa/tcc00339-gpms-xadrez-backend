import { describe, expect, it } from "vitest";
import { parseEnv } from "../../../src/config/env";

describe("parseEnv", () => {
    it("uses the documented defaults when nothing is set", () => {
        expect(parseEnv({})).toEqual({
            PORT: 3333,
            APP_URL: "http://localhost:3333",
            APP_WAIT_MS: 3000,
            APP_VERBOSE: true,
            LOG_LEVEL: "info",
        });
    });

    it("reads numbers from strings", () => {
        const settings = parseEnv({ PORT: "8080", APP_WAIT_MS: "250" });
        expect(settings.PORT).toBe(8080);
        expect(settings.APP_WAIT_MS).toBe(250);
    });

    it("turns APP_VERBOSE=false into false (the old code could never turn it off)", () => {
        expect(parseEnv({ APP_VERBOSE: "false" }).APP_VERBOSE).toBe(false);
        expect(parseEnv({ APP_VERBOSE: "true" }).APP_VERBOSE).toBe(true);
    });

    it("refuses a port that is not a positive whole number", () => {
        expect(() => parseEnv({ PORT: "abc" })).toThrow(/PORT/);
        expect(() => parseEnv({ PORT: "0" })).toThrow(/PORT/);
    });

    it("refuses an APP_URL that is not a URL", () => {
        expect(() => parseEnv({ APP_URL: "not a url" })).toThrow(/APP_URL/);
    });

    it("refuses an unknown log level", () => {
        expect(() => parseEnv({ LOG_LEVEL: "loud" })).toThrow(/LOG_LEVEL/);
    });

    it("refuses APP_VERBOSE values other than true or false", () => {
        expect(() => parseEnv({ APP_VERBOSE: "yes" })).toThrow(/APP_VERBOSE/);
    });
});
