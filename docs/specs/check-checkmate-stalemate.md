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
- Once finished, every move is refused with "Esse jogo está finalizado".

## Tests
- `endings-draws-and-reset.test.ts`: "ends with a checkmate win for Black after fool's mate", "ends in a stalemate draw..."

## Known deviations
- Checkmate and stalemate are detected while the turn is being passed, inside a read path as well (`encontra` recomputes check on every read). Works, but it is a side effect of a GET.
- The code comment for the checkmate branch says "Empate: Rei afogado" in one place, but the id used is the win type. Only the data is trusted.
