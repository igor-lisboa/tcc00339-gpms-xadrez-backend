# Draw conditions

## Purpose
Automatic and negotiated draws that do not depend on checkmate.

## Rules
- **Threefold repetition** (type 6 "Empate: Regra das 3 posições"): the same board, counting only piece type and side (not history), appears three times. Checked after every move.
- **Insufficient material** (type 3 "Empate: Insuficiência material"): both sides fail the minimum-material test. A side has enough material if it has a Queen, Rook or Pawn among 2 pieces, two Bishops or a Bishop and a Knight among 3, and more than 3 pieces otherwise. Checked after every move.
- **50-move rule** (type 2 "Empate: Regra 50 movimentos"): 100 plies (50 moves each) without a capture or a pawn move. Today it is applied only when a side offers a draw: the offer then finishes the game as a draw and the request still goes out. The game is not finished automatically when the counter reaches the limit.
- **Resignation** (type 7): covered in [game-lifecycle.md](game-lifecycle.md).
- **Time out** (type 3 today): see [turn-clock.md](turn-clock.md).

## Tests
- `endings-draws-and-reset.test.ts`: "ends in a draw by threefold repetition", "ends as a draw for insufficient material when the last rook is captured", `it.todo` for the 50-move rule.

## Known deviations
- The 50-move rule is not applied automatically; it is applied only when a draw is offered. Target: finish the game when the counter reaches 100 plies, as the rule says.
- A timeout is labelled type 3 "Insuficiência material", which is the wrong reason. Target: its own type.
