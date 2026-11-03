# 0002: Keep games in memory behind a repository interface

Status: accepted

**Context.** Games are stored in `database.json` in memory and lost on restart. No database is part of the project today, and adding one would be a separate decision.

**Decision.** Keep the in-memory store for now, but hide it behind a `GameRepository` port. The application layer only sees the port. A database can replace the in-memory implementation later without touching the domain.

**Consequences.** Tests use the in-memory implementation. Restarts still lose games. The repository must return real `Game` objects, not shallow copies, to avoid the current shared-reference bugs.
