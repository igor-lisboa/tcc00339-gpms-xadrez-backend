# 0005: Keep the current wire format (replaces the legacy adapter plan of 0004)

Status: accepted

**Context.** The approved plan (ADR 0004) proposed new English routes, JSON fields and socket events, with an adapter that kept the Portuguese names alive. The frontend and the AI worker depend on the current names, and the adapter would have doubled the surface to build and test.

**Decision.** The API keeps its current wire format: route paths, JSON field names, socket event names, the `lado` header and the Portuguese messages. The code is in English. The mapping lives in the presenters (`src/http/presenters/`) and the route files, which are the only places allowed to use the wire names (`npm run check:names` enforces this).

**Consequences.**
- The frontend and `ia` keep working with no changes.
- English wire names are a separate, later step. It needs the frontend to move with it, so it is planned as its own change, not part of the refactor.
- Some internal JSON was not byte-identical in the port (see the "Changed in the TypeScript port" sections of the specs). Those changes are listed there and need the frontend team's review.
