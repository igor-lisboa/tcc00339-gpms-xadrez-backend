# Adding or changing a chess rule

Use this when a rule must change or be added: move generation, a special move, check, or a draw condition. The `add-chess-rule` skill in `.claude/skills/` follows the same steps.

## Steps
1. **Spec first.** Write or change the Given/When/Then rule in the matching file under `docs/specs/`. A change of behaviour also goes in the spec's "Known deviations" or "Changed in the TypeScript port" section. The rules as implemented are in `docs/domain/rules.md`.
2. **Failing test.** Add the test to `tests/unit/domain/rules.test.ts`. Build the position with `gameWith({ E1: "Rei-0", ... })` from `tests/unit/domain/helpers.ts`, play moves with `play`, and read the moves with `movesFrom`. Run it and see it fail.
3. **Implement as a function.** Put the rule where it belongs:

   | Kind of rule | File |
   |---|---|
   | Which moves a piece can make (directions, steps) | `src/domain/moves/candidateMoves.ts` |
   | Name of a step (en passant, promotion, castling) | `src/domain/moves/stepNames.ts` |
   | Castling conditions | `src/domain/moves/castling.ts` |
   | Legal moves (king safety) | `src/domain/moves/legality.ts` |
   | Move played by a side | `src/domain/game/playMove.ts` |
   | Ending of a position (checkmate, stalemate, repetition) | `src/domain/game/judgement.ts` |
   | Clock and turns | `src/domain/game/clock.ts` |
   | Material | `src/domain/rules/material.ts` |

   Keep files under 150 lines. If a file grows past that, split it by responsibility.
4. **Refusals.** Throw `DomainError` with the message the client should see. Endings are set with `game.finish(GameEnding.X)`; the ids are in `src/shared/constants.ts`.
5. **Green.** Run the unit test, then `npm test` so the characterization tests run too. Do not weaken a test to make it pass.
6. **Docs.** Update the traceability table in the spec, and `docs/domain/rules.md` if the rule's summary changed.
7. **Checks.** `npm run typecheck`, `npm run lint`, `npm run check:names`, `npm test`.

## Known bugs
A known bug stays as `it.todo` in the test file until it is fixed. When it is fixed, the todo becomes a real test and the deviation is removed from the spec in the same change.
