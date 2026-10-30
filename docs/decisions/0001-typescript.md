# 0001: Use TypeScript for all source code

Status: accepted (plan approved, implementation in progress)

**Context.** The code is about 3,300 lines of CommonJS with no types, no tests and loose comparisons. Bugs hide in implicit shapes (for example `ladoId` is sometimes a string, sometimes a number).

**Decision.** All source and tests use TypeScript with `strict` on. `allowJs` stays on only while legacy files exist, and is removed at the end of Phase 6.

**Consequences.** Types document the shapes for junior developers. The build step is `tsc` (or `tsx` in dev). Legacy JavaScript is excluded from lint until it is migrated.
