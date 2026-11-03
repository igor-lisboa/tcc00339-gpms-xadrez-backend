# Adding an AI filter

Use this when the AI should prefer or avoid a kind of move. The `add-ai-filter` skill in `.claude/skills/` follows the same steps.

## How the filters work
`narrowAiOptions` in `src/domain/ai/chooseAiMove.ts` runs the rules in order on the AI's legal moves. Each rule keeps the options that pass it. A rule that would leave no option is skipped. `chooseAiMove` then picks one remaining option at random. See [ai.md](../ai.md).

## Steps
1. **Spec.** Add the rule to the list in `docs/specs/ai-opponent.md`, in the position where it applies, and describe it in the same words as the others.
2. **Field.** If the rule needs a fact that `AiOption` does not have yet, add the field to the interface and fill it where the options are built (`src/application/aiCommands.ts`). Keep the fact a plain value; the filter itself stays a pure function.
3. **Rule.** Add one predicate to the `rules` array in `narrowAiOptions`, in the order you chose. Keep it a single condition on an `AiOption`.
4. **Test.** Add a test to `tests/unit/domain/board-and-ai.test.ts`. Cover the case where the rule keeps the option, and the case where it leaves no option and is skipped.
5. **Docs.** Update `docs/ai.md` (the filter list) and the spec.
6. **Checks.** `npm run typecheck`, `npm run lint`, `npm test`.

## Keep in mind
- The order matters: the first rule that leaves options wins the most weight. Changing the order changes how the AI plays, so say so in the spec's "Changed in the TypeScript port" section.
- The AI does not look ahead and does not evaluate material. A filter is a heuristic, not a search.
