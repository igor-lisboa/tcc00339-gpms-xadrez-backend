---
name: add-ai-filter
description: Add a filter step to the AI move choice (src/ai). Use when the AI should prefer or avoid a kind of move.
---

# Add an AI filter

1. Read `docs/ai.md` and `docs/specs/ai-opponent.md`.
2. Write the filter as a small named function `(moves, context) => moves` in `src/domain/ai/filters/<name>.ts`.
3. Rule: if the filter would leave no move, return the input unchanged. Keep this behaviour and test it.
4. Add the filter to the pipeline in `src/domain/ai/aiMoveSelector.ts` at the right position, and document the order in `docs/ai.md`.
5. Tests: one unit test for the filter, one for the "empty result keeps input" rule, and one pipeline test showing the order.
6. Update `docs/specs/ai-opponent.md`.
7. Run `npm run typecheck && npm run lint && npm test`.
