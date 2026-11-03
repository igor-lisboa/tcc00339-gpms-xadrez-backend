# Pawn promotion

## Purpose
A pawn that reaches the last rank is replaced by a piece the player chooses.

## Rules
- When a pawn reaches the last rank, the game waits. A `promocaoPeao` action is pending for that side, and the side on turn cannot move until it is answered.
- The choice is made with `POST /jogos/:id/promove-peao/:pecaId` (with header `lado`). Allowed choices: Rainha (1), Torre (2), Bispo (3), Cavalo (4). A King or a Pawn is refused.
- After the choice, the piece replaces the pawn and the turn passes to the other side.
- Asking to promote when none is pending gives 500 "Não é possível promover nenhum peão no momento".
- AI sides promote through `POST /jogos/:id/ia/promove-peao`, choosing one of the allowed pieces at random.

## Tests
- `moves-and-special-moves.test.ts`: "promotes a pawn...", "refuses promotion to a king or a pawn", "refuses a promotion choice when no pawn is waiting"
- `ai-endpoints.test.ts`: "the AI promotes a pawn..."
