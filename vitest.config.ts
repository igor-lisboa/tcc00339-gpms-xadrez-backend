import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["tests/**/*.test.ts"],
        // unit tests stay quiet; the characterization helper sets its own environment
        env: { LOG_LEVEL: "silent", AI_ENABLED: "false" },
        testTimeout: 20000,
        hookTimeout: 20000,
        // each characterization file boots its own server process, so run files one by one
        fileParallelism: false,
        coverage: {
        provider: "v8",
        // the unit tests cover the domain; the characterization tests run the server as a child process, which coverage does not see
        include: ["src/domain/**"],
        // ratchet: raise these as coverage grows; the plan target is 100% for the domain
        thresholds: { lines: 79, functions: 84, branches: 74, statements: 79 },
        },
    },
});
