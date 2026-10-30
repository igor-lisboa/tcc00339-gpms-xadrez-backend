---
name: write-tests
description: Write unit, integration or characterization tests for this project following its conventions (Vitest, Supertest, board builder, Given/When/Then names). Use when a change needs tests or when coverage is missing.
---

# Write tests

- **Domain rules:** unit tests, pure functions, board builder (`boardFrom({ E1: "Rei-0", ... })`). Name tests after the spec rule in plain words.
- **Use-cases:** unit tests with in-memory fakes of the ports (repository, event publisher, clock, random).
- **HTTP:** Supertest against the Express app factory, not against a running server. Cover success, validation error and domain refusal.
- **Socket:** `socket.io-client` against a server started on port 0.
- **Characterization** (`tests/characterization/`): do not change expectations to make them pass. If the behaviour is wrong, record it as a known deviation with `it.todo` and update the spec.
- Test names read as sentences. Avoid `it("works")`.
- Coverage target: 100% of `src/domain`, 90% overall.
- Run a single file with `npx vitest run <path>`.
