# Special moves

## Purpose
Castling, en passant and the pawn's double step.

## Rules
- **Double step:** a pawn that has not moved may move two squares. The move is named "Primeiro Movimento Peão". The skipped square is recorded for en passant.
- **En passant:** right after an opponent's double step, a pawn standing beside the stopped pawn may capture it by moving onto the skipped square. The captured pawn is removed. The right lasts one move.
- **Castling kingside** ("Roque Menor") and **queenside** ("Roque Maior"): the king and the rook must not have moved, the squares between them must be empty, and the king moves two squares. The rook jumps over the king.
- Castling is offered only when the own king is not in check, the square the king crosses is not attacked, and the square it lands on is not attacked (FIDE 3.8.2.2.2). A square only the rook crosses (B1 or B8) may be attacked.

## Tests
- `moves-and-special-moves.test.ts`: "castles kingside for White...", "does not offer castling when the square the king crosses is attacked, and refuses the move", "does not offer castling once the rook has moved...", "captures en passant...", "plays a move, passes the turn..." (checks the double-step name)
- `tests/unit/domain/endings.test.ts` (describe "castling across an attacked square"): F1 attacked, D1 attacked, B1 attacked (still allowed), G1 attacked (the landing square) and C1 attacked (the landing square).
- `moves-and-special-moves.test.ts` (describe "legal moves of one piece"): G1 and C1 attacked, not offered through the endpoint.

## Known deviations
- The en passant check compares square objects by identity. It works only because the lookup table is shared. Fragile.

## Changed in the TypeScript port
- **Castling needs your own rook.** An enemy rook on the corner no longer allows castling.
- **Castling is not offered to a side in check.** Before, only the side on turn was checked, using a flag that could be stale.
- **En passant is taken by pawns only.** A knight landing on the skipped square no longer removes the pawn beside it.
- **The rook's castling move is recorded on the rook.** A castled rook now shows one performed move; before the port it showed none.

## Changed in the ending reasons fix
- Before: castling did not look at the square the king crosses. With a black rook on F8 (attacking F1), White could still castle kingside.
- Now: that castle is not offered and the move is refused.
