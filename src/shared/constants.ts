/** Ids are the same as the lookup tables in database.json. Use these names instead of magic numbers. */

/** The two sides of a game. */
export enum Side {
    White = 0,
    Black = 1,
}

/** Who controls a side. */
export enum PlayerType {
    Human = 0,
    Ai = 1,
}

/** The kind of game, decided when it is created. */
export enum GameType {
    HumanVsHuman = 0,
    HumanVsAi = 1,
    AiVsAi = 2,
}

/** How a game ended. */
export enum GameEnding {
    WhiteWins = 0,
    BlackWins = 1,
    /** Claimed by the side on turn after 50 moves each without a capture or a pawn move (FIDE 9.3). */
    FiftyMoveRule = 2,
    /** A dead position by material: neither side could ever checkmate (FIDE 5.2.2). */
    InsufficientMaterial = 3,
    Stalemate = 4,
    MutualAgreement = 5,
    /** Claimed by the side on turn when the position has appeared three times (FIDE 9.2). */
    ThreefoldRepetition = 6,
    /** A player left; the opponent wins when seated and able to mate (FIDE 5.1.2). The winner is on the game. */
    Resignation = 7,
    /** The side on the move ran out of time and the other side could never checkmate (FIDE 6.9). */
    TimeoutDraw = 8,
    /** Automatic: the same position appeared five times (FIDE 9.6.1). */
    FivefoldRepetition = 9,
    /** Automatic: 75 moves each without a capture or a pawn move (FIDE 9.6.2). */
    SeventyFiveMoveRule = 10,
    /** Automatic: a dead position that is not about material, such as kings behind fully blocked pawns (FIDE 5.2.2). */
    DeadPosition = 11,
}

/**
 * Why a game ended. The two winning endings do not say how the side won, and a draw can also come
 * from a clock or a resignation, so the game carries the reason next to its ending.
 */
export enum EndingReason {
    Checkmate = "checkmate",
    Timeout = "timeout",
    Resignation = "resignation",
    Stalemate = "stalemate",
    MutualAgreement = "mutualAgreement",
    FiftyMoveRule = "fiftyMoveRule",
    SeventyFiveMoveRule = "seventyFiveMoveRule",
    ThreefoldRepetition = "threefoldRepetition",
    FivefoldRepetition = "fivefoldRepetition",
    InsufficientMaterial = "insufficientMaterial",
    DeadPosition = "deadPosition",
}

/** The reason an ending has when the caller of `finish` names none. A win is a checkmate unless said otherwise. */
export const DEFAULT_ENDING_REASON: Record<GameEnding, EndingReason> = {
    [GameEnding.WhiteWins]: EndingReason.Checkmate,
    [GameEnding.BlackWins]: EndingReason.Checkmate,
    [GameEnding.FiftyMoveRule]: EndingReason.FiftyMoveRule,
    [GameEnding.InsufficientMaterial]: EndingReason.InsufficientMaterial,
    [GameEnding.Stalemate]: EndingReason.Stalemate,
    [GameEnding.MutualAgreement]: EndingReason.MutualAgreement,
    [GameEnding.ThreefoldRepetition]: EndingReason.ThreefoldRepetition,
    [GameEnding.Resignation]: EndingReason.Resignation,
    [GameEnding.TimeoutDraw]: EndingReason.Timeout,
    [GameEnding.FivefoldRepetition]: EndingReason.FivefoldRepetition,
    [GameEnding.SeventyFiveMoveRule]: EndingReason.SeventyFiveMoveRule,
    [GameEnding.DeadPosition]: EndingReason.DeadPosition,
};

/** Piece ids that a pawn may be promoted to (see tiposPeca in database.json). */
export enum PromotionPiece {
    Queen = 1,
    Rook = 2,
    Bishop = 3,
    Knight = 4,
}
