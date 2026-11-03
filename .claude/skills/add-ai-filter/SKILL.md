---
name: add-ai-filter
description: Add a filter step to the AI move choice (src/ai). Use when the AI should prefer or avoid a kind of move.
---

# Add an AI filter

1. Read `docs/ai.md` and `docs/specs/ai-opponent.md`.
2. Add the rule as one entry of the `rules` list in `narrowAiOptions` in `src/domain/ai/chooseAiMove.ts`.
3. The list already skips a rule that would leave no move. Keep that behaviour and test it.
4. Put the rule at the right position in the list, and document the order in `docs/ai.md`.
5. Tests: in `tests/unit/domain/board-and-ai.test.ts`, one for the rule, one for the "nothing left keeps the input" case, and one showing the order.
6. Update `docs/specs/ai-opponent.md`.
7. Run `npm run typecheck && npm run lint && npm test`.
