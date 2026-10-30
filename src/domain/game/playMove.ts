import { DomainError } from "../DomainError";
import { executeMove } from "../moves/executeMove";
import { isKingAttacked } from "../moves/legality";
import { createMoveRecord, type MoveRecord } from "../moves/MoveRecord";
import { sameSquare } from "../moves/rawMoves";
import { MoveNames, PieceNames } from "../pieces/pieceNames";
import type { Game } from "./Game";
import { RequestedActionNames } from "./RequestedAction";

export interface PlayedMove {
    readonly move: MoveRecord;
    readonly opponentId: number;
}

/** Plays a move for the side on turn: checks the turn, the players and pending actions, then the move itself. */
export const playMove = (game: Game, sideId: number, fromName: string, toName: string): PlayedMove => {
    assertCanPlay(game, sideId);

    const move = performMove(game, sideId, fromName, toName);
    const opponent = game.opponentOf(sideId);

    // the turn only passes when no promotion choice is pending
    if (game.promotion === null) {
        game.defineCurrentSide(opponent.id);
    }
    game.refresh();
    game.board.recordPosition();
    game.judgeAfterMove();

    return { move, opponentId: opponent.id };
};

const assertCanPlay = (game: Game, sideId: number): void => {
    if (game.ending !== null) {
        throw new DomainError("Esse jogo está finalizado");
    }
    if (sideId !== game.currentSideId) {
        throw new DomainError("Não está na sua vez de jogar, espere sua vez");
    }
    if (game.sideById(sideId).playerType === null) {
        throw new DomainError("Para realizar essa jogada, faça o login adequadamente no lado desejado");
    }
    if (game.opponentOf(sideId).playerType === null) {
        throw new DomainError("Aguarde outro jogador se logar adequadamente no lado adversário");
    }
    if (game.hasRequestedActions()) {
        throw new DomainError("Tem ações solicitadas a serem executadas");
    }
};

const performMove = (game: Game, sideId: number, fromName: string, toName: string): MoveRecord => {
    const from = game.squares.fromName(fromName);
    const to = game.squares.fromName(toName);
    const side = game.sideById(sideId);

    if (!side.pieces.some((entry) => sameSquare(entry.square, from))) {
        throw new DomainError("Não foi possível encontrar a peça na casa desejada");
    }
    const target = game.board.pieceAt(to);
    if (target !== null && target.sideId === sideId) {
        throw new DomainError("Não é possível capturar uma peça que te pertence");
    }
    const option = side.possibleMoves.find((move) => sameSquare(move.from, from) && sameSquare(move.to, to));
    if (option === undefined) {
        throw new DomainError("A casa de destino da jogada escolhida não pode ser realizada pela peça escolhida");
    }

    // play on a copy first: a move that leaves the own king in check is refused and the board stays as it was
    const trial = game.board.clone();
    const executed = executeMove(trial, from, to, option.moveName, game.enPassant);
    if (isKingAttacked({ board: trial, enPassant: game.enPassant, geometry: game.geometry }, sideId)) {
        throw new DomainError("A jogada não pode ser realizada pois coloca seu rei em cheque");
    }
    game.board = trial;

    const identifier = game.turns.length;
    const rookMove = executed.castlingRook
        ? createMoveRecord(identifier, executed.castlingRook.from, executed.castlingRook.to, null, option.moveName, [])
        : null;
    if (executed.castlingRook !== null && rookMove !== null) {
        executed.castlingRook.piece.recordMove(rookMove);
    }

    const record = createMoveRecord(identifier, from, to, executed.capturedPiece, option.moveName, rookMove ? [rookMove] : []);
    game.board.pieceAt(to)?.recordMove(record);
    side.performedMoves.push(record);

    game.enPassant =
        option.moveName === MoveNames.PawnFirstMove
            ? {
                  captureSquare: game.squares.fromPosition((from.linha + to.linha) / 2, from.coluna),
                  pawnSquare: to,
              }
            : null;

    if (option.moveName === MoveNames.PawnPromotion) {
        game.promotion = { pawnSquare: to, move: record };
        game.requestedActions.push({
            acao: RequestedActionNames.PawnPromotion,
            ladoId: sideId,
            data: { ladoId: sideId, jogoId: game.id },
        });
    }

    if (option.pieceType === PieceNames.Pawn || executed.capturedPiece !== null) {
        game.board.halfMoveClock = 0;
    } else {
        game.board.halfMoveClock += 1;
    }

    return record;
};
