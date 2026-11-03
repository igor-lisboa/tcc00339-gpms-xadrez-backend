# Chess rules as implemented

Each rule links to its spec, where the tests are listed.

| Area | Rule | Spec |
|---|---|---|
| Movement | sliding pieces, knight jumps, king steps, own pieces block | [move-generation](../specs/move-generation.md) |
| Legality | a move cannot leave the own king in check | [move-generation](../specs/move-generation.md) |
| Pawn | double step on the first move; en passant; promotion to Queen, Rook, Bishop or Knight | [special-moves](../specs/special-moves.md), [pawn-promotion](../specs/pawn-promotion.md) |
| Castling | kingside and queenside; known deviation: the path may be attacked | [special-moves](../specs/special-moves.md) |
| Check | `chequeLadoAtual` flag | [check-checkmate-stalemate](../specs/check-checkmate-stalemate.md) |
| Ending | checkmate, stalemate | [check-checkmate-stalemate](../specs/check-checkmate-stalemate.md) |
| Draws | threefold repetition, insufficient material, 50-move (known deviation), agreement | [draw-conditions](../specs/draw-conditions.md), [draw-and-reset-negotiation](../specs/draw-and-reset-negotiation.md) |
| Time | per-side clock; timeout (wrong label today) | [turn-clock](../specs/turn-clock.md) |
