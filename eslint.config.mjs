import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["node_modules/", "dist/", "coverage/"],
    },
    ...tseslint.configs.recommended,
    {
        rules: {
            "eqeqeq": "error",
            "no-var": "error",
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
        },
    },
    {
        // legacy JavaScript (index.js, ia.js, src/) is migrated to TypeScript in later phases and is not linted yet
        ignores: ["**/*.js"],
    },
    {
        // characterization tests read untyped JSON responses on purpose; the rule stays on for all other code
        files: ["tests/characterization/**/*.ts"],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
        },
    }
);
