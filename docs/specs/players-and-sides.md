# Players and sides

## Purpose
Each game has two sides: White (id 0) and Black (id 1). A side is taken by a player: a human, or the AI.

## Rules
- `POST /jogos/:id/jogadores` with `ladoId` and `tipoId` (0 Human, 1 AI) seats a player on a free side. Seating a taken side gives 500 "Esse lado já foi escolhido".
- In a Human X AI game (`tipoJogo` 1), when a human takes a side, the AI takes the other side automatically.
- In an AI X AI game (`tipoJogo` 2), both sides are AI from the start.
- Once both sides are seated, the first turn starts.
- `GET /jogos/:id/lados` returns `{branco, preto}` with each side's player type.
- `GET /jogos/:id/lado-sem-jogador` lists the sides with no player (refused for finished games with "Esse jogo já foi finalizado").
- `GET /jogos/:id/ias` lists the AI sides of a game.

## Tests
- `catalog-and-lifecycle.test.ts`: "POST /jogos/:id/jogadores seats a human...", "refuses to seat a side that is already taken", "GET /jogos/:id/lado-sem-jogador lists both sides..."
- `ai-endpoints.test.ts`: "a human-vs-AI game seats the AI on the other side..."

## Known deviations
- Side ids are numbers on the standard board but strings when the value comes from a header or from a custom board string. Comparisons use `==`.

## Changed in the TypeScript port
- An unknown `tipoId` is refused (see game-lifecycle). Before the port it resigned the side.
- Side ids are always numbers now. The side id from the `lado` header is converted at the HTTP edge.
