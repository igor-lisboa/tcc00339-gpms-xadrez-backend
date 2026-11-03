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
    FiftyMoveRule = 2,
    InsufficientMaterial = 3,
    Stalemate = 4,
    MutualAgreement = 5,
    ThreefoldRepetition = 6,
    Resignation = 7,
}

/** Piece ids that a pawn may be promoted to (see tiposPeca in database.json). */
export enum PromotionPiece {
    Queen = 1,
    Rook = 2,
    Bishop = 3,
    Knight = 4,
}
