/**
 * Piece and move names as they appear in the board notation ("Torre-0") and in API responses.
 * They are the values of the lookup data, so they stay in Portuguese until the data is renamed (Phase 3).
 */

export const PieceNames = {
    King: "Rei", // names-check:ignore (data value)
    Queen: "Rainha", // names-check:ignore (data value)
    Rook: "Torre", // names-check:ignore (data value)
    Bishop: "Bispo", // names-check:ignore (data value)
    Knight: "Cavalo", // names-check:ignore (data value)
    Pawn: "Peão", // names-check:ignore (data value)
} as const;

export type PieceName = (typeof PieceNames)[keyof typeof PieceNames];

export const MoveNames = {
    KingsideCastle: "Roque Menor", // names-check:ignore (data value)
    QueensideCastle: "Roque Maior", // names-check:ignore (data value)
    PawnFirstMove: "Primeiro Movimento Peão", // names-check:ignore (data value)
    PawnPromotion: "Promoção do Peão", // names-check:ignore (data value)
    EnPassant: "En Passant",
    Knight: "L",
} as const;
