# 0004: Keep a legacy adapter for the old API names

Status: accepted

**Context.** The current frontend and the `ia.js` worker call the pt-br routes, headers, fields and socket events. Renaming them breaks both. The frontend is maintained separately and cannot be changed in the same step.

**Decision.** Add `src/http/legacy/` (and the matching socket names) that maps the old names to the new ones:
- old route aliases that call the new routes;
- the `lado` header read as `side` and the other way round;
- old field names and socket event names in responses.

The adapter is marked clearly in the code and is removed once the frontend and `ia` worker use the English names.

**Consequences.** Two sets of names are live during the transition. Tests cover both: the new routes are the main contract, and the adapter has its own tests that replay the old characterization suite.
