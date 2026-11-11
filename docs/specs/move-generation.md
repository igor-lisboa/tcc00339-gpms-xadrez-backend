# Move generation

## Purpose
Which moves a piece can make, and which of them are legal.

## Rules
- A sliding piece (Rook, Bishop, Queen) moves along its lines until it meets a piece. It captures an opposing piece on the square where it stops.
- The Knight moves in L shapes and can jump over pieces.
- The King moves one square in any direction and cannot move onto a square that the opponent attacks.
- A move is refused if it leaves the own king in check.
- A move onto an own piece is refused.
- A player on turn sees only its own pieces; asking for another side's piece gives 500.
- `GET /jogos/:id/pecas/:casa/possiveis-jogadas` (with header `lado`) lists the legal moves of the piece on that square. A square with no own piece gives "Não foi possível encontrar a peça na casa desejada".
- A move is played with `POST /jogos/:id/pecas/:origem/move/:destino` (with header `lado`).
- Moves are refused when it is not your turn, when there are pending actions, when the game is finished, or when the other side is not seated.

## Tests
- `moves-and-special-moves.test.ts`: "lists the two pawn moves from E2...", "lists the knight moves from B1...", "perft: White has 20 legal moves in the opening position", "perft: Black has 20 legal moves after 1.e4", "refuses an illegal destination...", "refuses a move from the side that is not on turn", "refuses a move while the other side has not been seated"
- `moves-and-special-moves.test.ts` (describe "legal moves of one piece"): a pinned knight has no moves, a pinned rook moves only along the pin, and a stalemated side and a checkmated side get an empty list (200, not an error).

## Known deviations
- Legality is checked by playing each candidate move on a copy of the board (`Board.clone`) and asking whether the own king is attacked. The copy is made per move, so large move lists are slow. Make/unmake would be faster.
