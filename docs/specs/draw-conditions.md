# Draw conditions

## Purpose
Automatic and negotiated draws that do not depend on checkmate.

## Rules
- **Threefold repetition** (type 6 "Empate: Regra das 3 posições"): the same board, counting only piece type and side (not history), appears three times. Checked after every move.
- **Insufficient material** (type 3 "Empate: Insuficiência material"): both sides fail the minimum-material test. A side cannot give checkmate only with a bare king, a king and one Bishop or Knight, or a king and two Knights. Any other side has enough material, including king and two Rooks, king and Queen, king and Pawn, and king with Bishop and Rook. Same-colour Bishops are not detected: king and Bishop against king and Bishop is a draw by this rule, and so is any pair of such sides. Checked after every move.
- **Time out** (type 8 "Empate: Tempo esgotado sem material", or a win for the other side): see [turn-clock.md](turn-clock.md).
- **50-move rule** (type 2 "Empate: Regra 50 movimentos"): 100 plies (50 moves each) without a capture or a pawn move. Today it is applied only when a side offers a draw: the offer then finishes the game as a draw and the request still goes out. The game is not finished automatically when the counter reaches the limit.
- **Resignation** (type 7): covered in [game-lifecycle.md](game-lifecycle.md).

## Tests
- `endings-draws-and-reset.test.ts`: "ends in a draw by threefold repetition", "ends as a draw for insufficient material when the last rook is captured", `it.todo` for the 50-move rule.
- `tests/unit/domain/rules.test.ts` (describe "insufficient material"): king and two rooks against a bare king is not a draw; king and bishop, king and knight, king and two knights against a bare king are draws; king and queen and king and pawn are not.
- `tests/unit/domain/board-and-ai.test.ts`: "counts king and two rooks, queen and knight, rook and bishop as enough to mate", "counts king and two knights as too little material to mate".

## Known deviations
- The 50-move rule is not applied automatically; it is applied only when a draw is offered. Target: finish the game when the counter reaches 100 plies, as the rule says.

## Changed in the material rule fix
- Before: a side had enough material only with a Queen, Rook or Pawn among 2 pieces, two Bishops or a Bishop and a Knight among 3, or more than 3 pieces. King and two Rooks, King and Queen and Knight, and similar were wrongly "cannot mate", so a game such as king and two rooks against a bare king was drawn at once.
- Now: a side cannot mate only with a bare king, king and one Bishop or Knight, or king and two Knights. Every other side can mate.
- The 3-piece rule is replaced by this list. Same-colour Bishops are still not detected (the simple rule, as agreed).
