# Chess rules as implemented

Each rule links to its spec, where the tests are listed.

| Area | Rule | Spec |
|---|---|---|
| Movement | sliding pieces, knight jumps, king steps, own pieces block | [move-generation](../specs/move-generation.md) |
| Legality | a move cannot leave the own king in check | [move-generation](../specs/move-generation.md) |
| Pawn | double step on the first move; en passant; promotion to Queen, Rook, Bishop or Knight | [special-moves](../specs/special-moves.md), [pawn-promotion](../specs/pawn-promotion.md) |
| Castling | kingside and queenside; known deviation: the path may be attacked | [special-moves](../specs/special-moves.md) |
| Check | `chequeLadoAtual` flag | [check-checkmate-stalemate](../specs/check-checkmate-stalemate.md) |
| Ending | checkmate, stalemate; checkmate is judged before every draw | [check-checkmate-stalemate](../specs/check-checkmate-stalemate.md) |
| Draws | FIDE Laws: threefold repetition and 50 moves are claims by the side on turn; fivefold repetition (type 9) and 75 moves (type 10) are automatic; claims may name an intended move; dead position by material (type 3) or by blocked pawns (type 11); agreement (an offer never blocks a move) | [draw-conditions](../specs/draw-conditions.md), [draw-and-reset-negotiation](../specs/draw-and-reset-negotiation.md) |
| Time | per-side clock; timeout: a win for the opponent if it could ever mate (both sides' pieces count), otherwise type 8 draw | [turn-clock](../specs/turn-clock.md) |
| Resignation | type 7, only by the side itself (`lado` header); the seated opponent wins (`ladoIdVencedor`) | [game-lifecycle](../specs/game-lifecycle.md) |
