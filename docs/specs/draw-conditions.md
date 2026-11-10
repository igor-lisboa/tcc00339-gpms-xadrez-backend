# Draw conditions

## Purpose
Draws that do not depend on stalemate. The rules follow the FIDE Laws of Chess: some draws end the game by themselves, others must be claimed by the side on turn.

## Rules
- **Order of judging.** After a move the game checks, in this order: checkmate and stalemate (see [check-checkmate-stalemate.md](check-checkmate-stalemate.md)), dead position by material, dead position by blocked pawns, fivefold repetition, 75-move rule. A game ends once; the first ending found wins. A move that mates therefore wins even if it also leaves too little material, reaches a fifth repetition or completes 75 moves (FIDE 5.1.1, 9.6).
- **Same position** (FIDE 9.2.2): the same piece types of the same sides on the same squares, the same side to move, the same castling rights, and the same en passant possibility.
  - A castling right is lasting: the king and that rook are on their home squares and have never moved. A blocked path or a check does not remove it; moving the king or the rook does.
  - The en passant square counts only when a pawn of the side to move can really play the capture (a legal move).
  - Each position is recorded when a move is complete and the turn has passed: at the start of the game (also after a reset), after each move, and after a promotion once the piece is chosen. A pawn waiting on the last rank for its promotion is not a position.
- **Threefold repetition — claim** (type 6 "Empate: Regra das 3 posições", FIDE 9.2): the side on turn offers a draw (`PUT /jogos/:id/empate/propoe`) while the position on the board has appeared at least three times. The game ends at once; no offer is sent and the message is "Empate reivindicado com sucesso!". Without a claim the game goes on.
- **50-move rule — claim** (type 2 "Empate: Regra 50 movimentos", FIDE 9.3): the side on turn offers a draw after 100 plies (50 moves each) without a capture or a pawn move. Same effect as the threefold claim. If both claims are valid, the threefold one is used.
- **Claim with an intended move** (FIDE 9.2.1.1 and 9.3.1): the side on turn sends the move it would play as `{ origem, destino }` with the draw offer. The claim is valid when that move would make a position appear for the third time, or would complete 50 moves each without a capture or a pawn move. A valid claim ends the game and the move is not played. A pawn move or a capture never makes a valid claim. The move must be legal; otherwise the request is refused and nothing changes. A claim for the position on the board is checked first.
- **A claim that is not valid** counts as a draw offer (FIDE 9.1.2.4). With an intended move, the move is played first (FIDE 9.5.1), then the offer goes to the opponent; if that move ends the game (for example by checkmate), no offer is left.
- A claim is only for the side on turn. An offer by the other side is a normal draw offer, even when a claim would be valid.
- **Fivefold repetition — automatic** (type 9 "Empate: Regra das 5 posições", FIDE 9.6.1): the game ends when a position appears for the fifth time.
- **75-move rule — automatic** (type 10 "Empate: Regra 75 movimentos", FIDE 9.6.2): the game ends after 150 plies without a capture or a pawn move.
- **Dead position by material — automatic** (type 3 "Empate: Insuficiência material", FIDE 5.2.2): neither side could checkmate by any series of legal moves, even with the help of the other side. A side can mate when it has:
  - a pawn, a rook or a queen; or
  - a knight with a bishop, two or more knights, or bishops on both colours of square; or
  - a single knight, when the other side has any piece other than its king and queens (a piece that can block its own king); or
  - bishops all on one colour, when the other side has a pawn, a knight, or a bishop on the other colour.
  So these are draws: king against king; king and one bishop or one knight against a bare king; kings with bishops that all stand on one colour. These are not: king and two knights against a bare king; king and knight against king and knight or king and bishop; bishops on opposite colours.
- **Dead position by blocked pawns — automatic** (type 11 "Empate: Posição morta", FIDE 5.2.2): only kings and pawns are left, every pawn has a pawn right in front of it and no enemy piece on the squares it could capture on, no en passant right is open, and neither king can ever walk (never through its own pawns, never onto a square an enemy pawn attacks) to an enemy pawn it could take. Then the pawns never move again and no check can ever happen. The test says "dead" only when this is certain.
- **Time out** (type 8 "Empate: Tempo esgotado sem material", or a win for the other side): see [turn-clock.md](turn-clock.md). It uses the same "can mate" test.
- **Resignation** (type 7): see [game-lifecycle.md](game-lifecycle.md).

## Tests
- `tests/unit/domain/endings.test.ts`: describes "checkmate comes first", "repetition (FIDE 9.2 and 9.6.1)" (threefold is not automatic, the claim, fivefold, side to move, castling right, en passant, promotion), "seventy-five moves (FIDE 9.6.2)".
- `tests/unit/domain/rules.test.ts` (describes "draws" and "insufficient material"): the 50-move claim by the side on turn and its refusal for the other side; same-colour and other-colour bishops, two knights, knight against bishop or knight.
- `tests/unit/domain/board-and-ai.test.ts` (describe "mating material (canEverMate)"): every branch of the "can mate" test.
- `tests/unit/domain/drawClaims.test.ts`: claims with an intended move (threefold, fifty moves, a pawn move that is no claim and is played, an illegal move, out of turn, a move that mates, an open offer from the opponent).
- `tests/unit/domain/blockedPawns.test.ts`: a closed pawn wall is dead; a reachable enemy pawn, a possible pawn capture, another piece, or an open file is not.
- `endings-draws-and-reset.test.ts`: "a threefold repetition is a draw only when the side on turn claims it with a draw offer", "the fifth appearance of a position ends the game without a claim", "after 50 moves each without a capture or a pawn move, the side on turn claims a draw and no offer is sent", "the side on turn claims a threefold repetition for the position its intended move would make", "a claim with an intended move that is not valid plays the move and leaves a draw offer", "a claim with only one square of the intended move is refused", "kings behind fully blocked pawns end the game as a dead position", "ends as a draw for insufficient material when the last rook is captured".

## Known deviations
- Dead positions are found by material and by blocked pawns with only kings and pawns on the board. A dead position that also needs other pieces (for example a bishop locked behind its own blocked pawns) is not detected, and play goes on until another rule ends the game (at the latest the 75-move rule).

## Changed in the FIDE endings fix
- Before: threefold repetition ended the game automatically and compared only the pieces on their squares (not the side to move, castling or en passant), so the same pieces with a different side to move counted as a repetition. The position after a promotion was never recorded, and the start position was not recorded after a reset.
- Before: the 50-move rule was applied only through a draw offer, by any side on turn, and the offer was still stored and sent after the game had ended.
- Before: the material rule called king and two knights, king and knight against king and knight or bishop, and bishops on opposite colours a draw. It was also checked before checkmate, so a capture that mated and left such material was scored as a draw.
- Now: see the rules above. Endings 9 and 10 are new.
- Then: a claim could only cover the position on the board, and dead positions were found by material only. Now a claim may name an intended move, and kings behind fully blocked pawns end the game as the new type 11 "Empate: Posição morta".
