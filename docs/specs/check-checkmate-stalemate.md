# Check, checkmate and stalemate

## Purpose
Tell the player on turn whether the king is in check, and end the game when the side on turn has no legal move.

## Rules
- **Check:** the king of the side on turn is attacked by an opponent piece. The game exposes this as `chequeLadoAtual`.
- A move that leaves the mover's own king in check is refused ("A jogada não pode ser realizada pois coloca seu rei em cheque").
- **Checkmate:** the side on turn is in check and has no legal move. The other side wins:
  - White checkmated: type 1 "Vitória: Preto".
  - Black checkmated: type 0 "Vitória: Branco".
- **Stalemate:** the side on turn is not in check and has no legal move. Type 4 "Empate: Rei afogado".
- Checkmate and stalemate are judged before every draw rule (dead position, fivefold repetition, 75 moves). A move that mates wins even if it also leaves material with which no side could mate, or completes the 75th move (FIDE 5.1.1, 9.6.2).
- A checkmate sets `ladoIdVencedor` on the game to the winning side.
- Once finished, every move is refused with "Esse jogo está finalizado".

## Tests
- `endings-draws-and-reset.test.ts`: "ends with a checkmate win for Black after fool's mate", "ends in a stalemate draw..."
- `tests/unit/domain/endings.test.ts` (describe "checkmate comes first (FIDE 5.1.1)"): a capture that mates and leaves king and knight against king and bishop wins; a mate on the 150th quiet ply wins over the 75-move rule.

## Known deviations
- Checkmate and stalemate are detected while the turn is being passed, inside a read path as well (`encontra` recomputes check on every read). Works, but it is a side effect of a GET.
- The code comment for the checkmate branch says "Empate: Rei afogado" in one place, but the id used is the win type. Only the data is trusted.

## Changed in the FIDE endings fix
- Before: insufficient material was checked before checkmate, so a capture that mated and left little material (for example king and knight against king and bishop) was scored as type 3 "Empate: Insuficiência material".
- Now: checkmate and stalemate are judged first.

## Changed in the ending reasons fix
- A checkmate sets `motivoFinalizacao` to `xequeMate`; a stalemate sets it to `reiAfogado`.
- Before: `possiveisJogadas` of a side listed moves before the king-safety rule, so a stalemated side could still show a move (for example a king taking a protected pawn), and a pinned piece showed its moves.
- Now: `possiveisJogadas` lists legal moves only. A side with no legal move shows an empty list. Tests: `endings-draws-and-reset.test.ts` ("ends in a stalemate draw..."), `moves-and-special-moves.test.ts` ("lists only legal moves in possiveisJogadas: a pinned piece has none"), `tests/unit/domain/endings.test.ts` (describe "recorded games").
