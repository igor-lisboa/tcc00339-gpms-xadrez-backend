---
name: add-chess-rule
description: Add or change a chess rule in the domain (move generation, special move, check, draw condition). Use when a rule must change or be added. Enforces spec first, failing test first, rule as a pure function.
---

# Add or change a chess rule

1. Read `docs/domain/rules.md` and the matching file in `docs/specs/`.
2. Update the spec first: write the rule as Given/When/Then, and mark the old behaviour under "Known deviations" if it changes.
3. Write a failing unit test in `tests/domain/` using the board builder (`boardFrom({ E1: "Rei-0", ... })`). One test per rule case.
4. Implement the rule as a pure function in `src/domain/rules/` or `src/domain/moves/`. No I/O, no imports from `application` or `http`.
5. Wire it into the game through the existing move or check step. Keep the file under 150 lines; split if needed.
6. Run the characterization suite. A failure there means a behaviour change: either it is intended (update the characterization test and the spec) or it is a bug (fix the rule).
7. Run `npm run typecheck && npm run lint && npm test`.
