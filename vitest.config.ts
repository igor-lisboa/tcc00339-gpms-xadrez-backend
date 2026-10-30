import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["tests/**/*.test.ts"],
        // unit tests stay quiet; the characterization helper sets its own environment
        env: { LOG_LEVEL: "silent", APP_VERBOSE: "false" },
        testTimeout: 20000,
        hookTimeout: 20000,
        // each characterization file boots its own server process, so run files one by one
        fileParallelism: false,
    },
});
