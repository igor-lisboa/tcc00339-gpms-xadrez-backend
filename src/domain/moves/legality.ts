import { DomainError } from "../DomainError";
import type { Square } from "../board/SquareLookup";
import { PieceNames } from "../pieces/pieceNames";
import { opponentOf, movesRulesFor, type Position } from "../position";
import { executeMove } from "./executeMove";
import { rawMovesOf, piecesOfSide, sameSquare } from "./rawMoves";
import type { PossibleMove } from "./possibleMoves";

/** Square of the king of a side. Throws if the side has no king on the board. */
export const kingSquareOf = (position: Position, sideId: number): Square => {
    const king = position.board.occupiedSquares().find(({ piece }) => piece.type === PieceNames.King && piece.sideId === sideId);
    if (king === undefined) {
        throw new DomainError("Rei não encontrado no tabuleiro");
    }
    return king.square;
};

/**
 * True when an opponent piece can capture on the king's square.
 * Castling is switched off here: a castle never lands on the king, so it cannot give check.
 */
export const isKingAttacked = (position: Position, sideId: number): boolean => {
    const king = kingSquareOf(position, sideId);
    const opponent = opponentOf(position.geometry, sideId);
    const rules = movesRulesFor(position);
    const opponentPieces = piecesOfSide(position.board, opponent, rules);
    return rawMovesOf(opponentPieces, position.board, position.enPassant, false).some(
        (move) => sameSquare(move.to, king) && move.canCapture
    );
};

/** Keeps only the moves after which the side's own king is not attacked. Each move is played on a copy. */
export const legalMovesOf = (position: Position, sideId: number, possibleMoves: PossibleMove[]): PossibleMove[] =>
    possibleMoves.filter((move) => {
        const board = position.board.clone();
        executeMove(board, move.from, move.to, move.moveName, position.enPassant);
        return !isKingAttacked({ ...position, board }, sideId);
    });
