# HTTP endpoints (today)

Interactive version: `GET /docs` (Swagger UI) on a running API. The source is [openapi.yaml](openapi.yaml). All responses use the envelope `{ message, data, success }`. Refusals are HTTP 500 today (see [error-handling](../specs/error-handling.md)). The header `lado` carries the side id for player actions.

## Games

| Method | Path | What it does | Spec |
|---|---|---|---|
| GET | `/jogos` | list all games | [game-lifecycle](../specs/game-lifecycle.md) |
| POST | `/jogos` | create a game (`tipoJogo`, `tempoDeTurnoEmMilisegundos`, `tabuleiroCasas`, `ladoId`) | game-lifecycle |
| GET | `/jogos/:jogoId` | full game state (may finish the game on timeout) | game-lifecycle |
| GET | `/jogos/:jogoId/simples` | summary; `?tabuleiroSuperSimplificado=true` for string board | game-lifecycle |
| PUT | `/jogos/:jogoId/reset` | restart the same game id | game-lifecycle |
| GET | `/jogos/:jogoId/turnos` | list of turns | [turn-clock](../specs/turn-clock.md) |
| GET | `/jogos/:jogoId/lados` | both sides | [players-and-sides](../specs/players-and-sides.md) |
| GET | `/jogos/:jogoId/lado-atual` | side on turn | players-and-sides |
| GET | `/jogos/:jogoId/lado-sem-jogador` | sides without a player | players-and-sides |
| GET | `/jogos/:jogoId/rei-adversario` | opponent's king (only on your turn) | check-checkmate-stalemate |

## Players

| Method | Path | What it does |
|---|---|---|
| POST | `/jogos/:jogoId/jogadores` | seat a player (`ladoId`, `tipoId`) |
| DELETE | `/jogos/:jogoId/jogadores/:ladoId` | resign the side |

## Pieces and moves

| Method | Path | What it does | Spec |
|---|---|---|---|
| GET | `/jogos/:jogoId/pecas` | pieces of your side (`lado`) | board-and-pieces |
| GET | `/jogos/:jogoId/pecas/:casa/possiveis-jogadas` | legal moves of one piece | move-generation |
| POST | `/jogos/:jogoId/pecas/:origem/move/:destino` | play a move | move-generation |
| POST | `/jogos/:jogoId/promove-peao/:pecaIdEscolhida` | choose the promotion piece | pawn-promotion |

## Draws and resets

| Method | Path | What it does |
|---|---|---|
| PUT | `/jogos/:jogoId/empate/propoe` | offer a draw |
| POST | `/jogos/:jogoId/empate/responde` | answer a draw offer (`resposta`) |
| PUT | `/jogos/:jogoId/reset/propoe` | offer a reset (finished games only) |
| POST | `/jogos/:jogoId/reset/responde` | answer a reset offer (`resposta`) |

## AI

| Method | Path | What it does | Spec |
|---|---|---|---|
| GET | `/jogos/ia` | AI games and their legal moves | [ai-opponent](../specs/ai-opponent.md) |
| POST | `/jogos/ia` | play the given moves (`jogadas`) | ai-opponent |
| POST | `/jogos/ia/executa` | AI plays one move in every AI game | ai-opponent |
| GET | `/jogos/:jogoId/ias` | AI sides of a game | players-and-sides |
| POST | `/jogos/:jogoId/ia/promove-peao` | AI promotes a pawn | pawn-promotion |
| GET | `/ia` | ask the AI player to run | ai-opponent |

## Catalogues

| Method | Path | What it returns |
|---|---|---|
| GET | `/` | welcome message and group list |
| GET | `/tipos-de-jogo` | game types (0 Human X Human, 1 Human X AI, 2 AI X AI) |
| GET | `/lados-do-jogo` | sides (Branco, Preto) |
| GET | `/tipos-de-jogador` | player types (Humano, I.A.) |
| GET | `/tipos-de-peca` | piece types |
| GET | `/tipos-de-peca/promocao-peao` | pieces allowed for promotion |
| GET | `/tabela-equivalencia` | 64 squares, A8 first |

Target names for these routes are in [glossary](../glossary.md).
