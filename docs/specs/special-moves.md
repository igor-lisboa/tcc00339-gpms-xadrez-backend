# Special moves

## Purpose
Castling, en passant and the pawn's double step.

## Rules
- **Double step:** a pawn that has not moved may move two squares. The move is named "Primeiro Movimento Peão". The skipped square is recorded for en passant.
- **En passant:** right after an opponent's double step, a pawn standing beside the stopped pawn may capture it by moving onto the skipped square. The captured pawn is removed. The right lasts one move.
- **Castling kingside** ("Roque Menor") and **queenside** ("Roque Maior"): the king and the rook must not have moved, the squares between them must be empty, and the king moves two squares. The rook jumps over the king.
- Castling is offered only when the own king is not in check.

## Tests
- `moves-and-special-moves.test.ts`: "castles kingside for White...", "does not offer castling once the rook has moved...", "captures en passant...", "plays a move, passes the turn..." (checks the double-step name)

## Known deviations
- Confirmed: castling does not check the squares the king passes through. With a black rook on F8 (attacking F1), White can still castle kingside. Pinned as a characterization test; the target is to refuse it.
- The en passant check compares square objects by identity. It works only because the lookup table is shared. Fragile.
