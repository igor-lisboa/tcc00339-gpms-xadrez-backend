# 0003: Rename everything to English

Status: accepted

**Context.** Files, identifiers, comments, routes, JSON fields, socket events and data values mix Portuguese and English, sometimes inside one name (`recuperaLadoAdversarioPeloId`, `possiveisJogadas`). A junior developer has to learn both languages to follow the code.

**Decision.** All code, file names, comments, log and error messages, and new API names are English. The pt-br → English map lives in [glossary.md](../glossary.md). A word not in the glossary is added there before it is used.

**Consequences.** The frontend and the AI worker speak pt-br today, so the old names keep working through the legacy adapter ([0004](0004-legacy-adapter.md)). Lookup data values (for example the names of finishing types) change to English, and the adapter maps them back.
