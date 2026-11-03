# Board and pieces

## Purpose
An 8 by 8 board, the starting position, and the piece lists per side.

## Rules
- Squares are named `A1`..`H8`. Index 0 of the rows is rank 8 and index 7 is rank 1; columns A to H map to 0 to 7.
- Start position: standard layout, White on ranks 1 and 2, Black on ranks 7 and 8.
- Custom boards (`tabuleiroCasas`) are 8 rows of `"Tipo-ladoId"` or `null`. A board with fewer than 8 rows falls back to the start position.
- Piece types: Rei (King), Rainha (Queen), Torre (Rook), Bispo (Bishop), Cavalo (Knight), Peão (Pawn). Values: King 10, Queen 9, Rook 5, Bishop 3, Knight 3, Pawn 1.
- An invalid piece name or side in a custom board is refused, with a message naming the row and column.
- `GET /jogos/:id/pecas` (with header `lado`) lists the pieces of that side.
- `GET /tabela-equivalencia` lists the 64 squares, A8 first.

## Tests
- `catalog-and-lifecycle.test.ts`: "GET /tabela-equivalencia returns 64 squares..."
- `moves-and-special-moves.test.ts`: "lists the piece itself on the side's own board...", "accepts a board of 'Tipo-ladoId' strings...", "rejects an invalid piece string..."

## Known deviations
- The board keeps the side id as given: strings from custom boards, numbers otherwise.
