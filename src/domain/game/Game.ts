import { DomainError } from "../DomainError";
import type { Catalog, EndingInfo, GameTypeInfo, PlayerTypeInfo, SideInfo } from "../catalog";
import { Board, gridFromNotation } from "../board/Board";
import { SquareLookup, type Square } from "../board/SquareLookup";
import { startingBoard } from "../board/startPosition";
import { GameEnding } from "../../shared/constants";
import type { EnPassantTarget } from "../moves/candidateMoves";
import { legalMovesOf as filterLegalMoves, isKingAttacked as isAttacked } from "../moves/legality";
import type { PossibleMove } from "../moves/possibleMoves";
import type { MoveRecord } from "../moves/MoveRecord";
import { piecesOfSide, type PieceWithMoves } from "../moves/rawMoves";
import { possibleMovesOfSide } from "../moves/possibleMoves";
import { castlingPathClear } from "../moves/candidateMoves";
import { movesRulesFor, type Geometry, type Position } from "../position";
import { isInsufficientMaterial } from "../rules/material";
import type { RequestedAction } from "./RequestedAction";
import { Side } from "./Side";
import { Turn } from "./Turn";
import { PieceNames } from "../pieces/pieceNames";

export interface GameInput {
    readonly catalog: Catalog;
    readonly gameTypeId: number;
    readonly timeLimitMs: number;
    readonly sideId: number;
    /** Custom board rows; with fewer than 8 rows the standard opening is used. */
    readonly boardRows?: readonly (readonly unknown[])[];
}

/**
 * A chess game: both sides, the board, the turns and the state of offers and promotion.
 * It holds the state and the checks that apply to every change. Each action (play a move,
 * offer a draw, ...) lives in its own file under this folder and works through the methods below.
 */
export class Game {
    id: number | null = null;
    readonly white: Side;
    readonly black: Side;
    board: Board;
    readonly turns: Turn[] = [];
    currentSideId = 0;
    enPassant: EnPassantTarget | null = null;
    ending: EndingInfo | null = null;
    requestedActions: RequestedAction[] = [];
    promotion: { readonly pawnSquare: Square; readonly move: MoveRecord } | null = null;
    drawOfferedBy: number | null = null;
    resetOfferedBy: number | null = null;
    currentInCheck = false;
    gameType: GameTypeInfo;
    private finishedEvents: string[] = [];

    constructor(
        readonly catalog: Catalog,
        readonly squares: SquareLookup,
        readonly timeLimitMs: number,
        board: Board,
        gameType: GameTypeInfo,
        sides: readonly SideInfo[]
    ) {
        this.white = new Side(sides[0]);
        this.black = new Side(sides[1]);
        this.board = board;
        this.gameType = gameType;
    }

    /** Builds a game the way the API has always done: sides, board, the first side, then the game type. */
    static create(input: GameInput): Game {
        const squares = new SquareLookup(input.catalog.squares);
        const [white, black] = input.catalog.sides;
        const pieceNames = input.catalog.pieceTypes.map((piece) => piece.nome);

        const board =
            input.boardRows !== undefined && input.boardRows.length >= 8
                ? new Board(squares, gridFromNotation(input.boardRows, pieceNames))
                : startingBoard(squares, white.id, black.id);

        const gameType = resolveGameType(input.catalog, input.gameTypeId);
        const game = new Game(input.catalog, squares, input.timeLimitMs, board, gameType, input.catalog.sides);
        game.defineCurrentSide(input.sideId);
        game.assignGameType(gameType);
        return game;
    }

    get geometry(): Geometry {
        return {
            whiteSideId: this.white.id,
            blackSideId: this.black.id,
            headsDown: (sideId) => this.sideById(sideId).headDown,
        };
    }

    position(): Position {
        return { board: this.board, enPassant: this.enPassant, geometry: this.geometry };
    }

    sides(): Side[] {
        return [this.white, this.black];
    }

    sideById(sideId: number): Side {
        if (this.white.id === sideId) {
            return this.white;
        }
        if (this.black.id === sideId) {
            return this.black;
        }
        throw new DomainError("O lado desejado não existe");
    }

    opponentOf(sideId: number): Side {
        if (this.white.id === sideId) {
            return this.black;
        }
        if (this.black.id === sideId) {
            return this.white;
        }
        throw new DomainError("O lado adversário desejado não existe");
    }

    sidesWithoutPlayer(): Side[] {
        return this.sides().filter((side) => side.playerType === null);
    }

    /** Legal moves of a side, from the position as it is now. */
    legalMovesOf(sideId: number): PossibleMove[] {
        return filterLegalMoves(this.position(), sideId, this.sideById(sideId).possibleMoves);
    }

    isKingAttacked(sideId: number): boolean {
        return isAttacked(this.position(), sideId);
    }

    /** Whether a side may castle on one wing. Castling needs an unmoved king and rook, a clear path, and no check. */
    castlingAllowed(sideId: number, queenside: boolean): boolean {
        return castlingPathClear(this.board, sideId, this.white.id, queenside) && !this.isKingAttacked(sideId);
    }

    /** Recomputes the pieces and the possible moves of both sides. */
    refresh(): void {
        const rules = movesRulesFor(this.position(), (sideId, queenside) => this.castlingAllowed(sideId, queenside));
        for (const side of this.sides()) {
            side.pieces = piecesOfSide(this.board, side.id, rules);
        }
        for (const side of this.sides()) {
            side.possibleMoves = possibleMovesOfSide(side.pieces, this.opponentOf(side.id).pieces, this.board, this.enPassant);
        }
    }

    /** Sets whose turn it is, starting a new turn if the side changed. Judges the position for the new side. */
    defineCurrentSide(sideId: number): void {
        this.currentSideId = sideId;
        const last = this.turns.at(-1);
        if (last !== undefined && last.sideId !== sideId) {
            last.end();
            this.startTurn();
        }
        this.refresh();
        if (isInsufficientMaterial(piecesOf(this.white), piecesOf(this.black))) {
            this.finish(GameEnding.InsufficientMaterial);
        }
        this.judgeSide(sideId);
    }

    /** Recomputes the check flag and the clocks, as a read of the game needs. */
    refreshForRead(): void {
        this.refresh();
        this.currentInCheck = this.isKingAttacked(this.currentSideId);
        this.checkClocks();
    }

    /** Checkmate or stalemate for the side on the move. */
    private judgeSide(sideId: number): void {
        this.currentInCheck = this.isKingAttacked(sideId);
        if (sideId !== this.currentSideId || this.legalMovesOf(sideId).length > 0) {
            return;
        }
        if (!this.currentInCheck) {
            this.finish(GameEnding.Stalemate);
        } else {
            this.finish(sideId === this.white.id ? GameEnding.BlackWins : GameEnding.WhiteWins);
        }
    }

    startTurn(): void {
        this.checkClocks();
        if (this.ending === null) {
            this.turns.push(new Turn(this.currentSideId));
        }
    }

    /** Remaining time of each side. A side that runs out on its own turn loses the game. */
    checkClocks(): void {
        this.checkClock(this.white.id);
        this.checkClock(this.black.id);
    }

    private checkClock(sideId: number): void {
        const spent = this.turns
            .filter((turn) => turn.sideId === sideId)
            .reduce((total, turn) => total + turn.elapsedMs(), 0);
        const remaining = this.timeLimitMs - spent;
        if (remaining <= 0 && this.currentSideId === sideId && this.timeLimitMs !== -1) {
            this.finish(GameEnding.InsufficientMaterial);
        }
        this.sideById(sideId).remainingMs = remaining;
    }

    /** Ends the game once. Later calls do nothing. */
    finish(endingId: number): void {
        if (this.ending !== null) {
            return;
        }
        const ending = this.catalog.endings.find((item) => item.id === endingId);
        if (ending === undefined) {
            return;
        }
        this.ending = ending;
        this.finishedEvents.push(ending.tipo);
    }

    hasPendingFinishedEvents(): boolean {
        return this.finishedEvents.length > 0;
    }

    /** Endings reached since the last call, for the caller to announce. */
    takeFinishedEvents(): string[] {
        const events = this.finishedEvents;
        this.finishedEvents = [];
        return events;
    }

    /** Game-type setup: the AI X AI type seats an AI on both sides. */
    assignGameType(gameType: GameTypeInfo): void {
        this.gameType = gameType;
        if (gameType.id === 2) {
            const ai = this.catalog.playerTypes.find((type) => type.id === 1);
            if (ai !== undefined) {
                this.joinSide(this.white.id, ai);
                this.joinSide(this.black.id, ai);
            }
        }
    }

    /** Seats a player on a side. Passing null removes the player and resigns the game. */
    joinSide(sideId: number, playerType: PlayerTypeInfo | null): Side {
        const side = this.sideById(sideId);
        if (playerType === null) {
            side.removeType();
            this.finish(GameEnding.Resignation);
            return side;
        }

        side.defineType(playerType);

        // a human against the computer: the computer takes the other side
        if (this.gameType.id === 1 && playerType.id === 0) {
            const ai = this.catalog.playerTypes.find((type) => type.id === 1);
            if (ai !== undefined) {
                this.joinSide(this.opponentOf(sideId).id, ai);
            }
        }

        if (this.white.playerType !== null && this.black.playerType !== null && this.turns.length === 0) {
            this.startTurn();
        }
        return side;
    }

    /** Whether any move must be answered before the game goes on. */
    hasRequestedActions(): boolean {
        return this.requestedActions.length > 0;
    }

    /** Detects threefold repetition and insufficient material after a move. */
    judgeAfterMove(): void {
        if (this.board.isThreefoldRepetition()) {
            this.finish(GameEnding.ThreefoldRepetition);
        }
        if (isInsufficientMaterial(piecesOf(this.white), piecesOf(this.black))) {
            this.finish(GameEnding.InsufficientMaterial);
        }
    }

    /** The opposing king, as seen by the side that is asking. */
    opponentKingOf(sideId: number): PieceWithMoves | undefined {
        return this.opponentOf(sideId).pieces.find((entry) => entry.piece.type === PieceNames.King);
    }
}

const piecesOf = (side: Side) => side.pieces.map((entry) => entry.piece);

const resolveGameType = (catalog: Catalog, gameTypeId: number): GameTypeInfo => {
    const gameType = catalog.gameTypes.find((type) => type.id === gameTypeId);
    if (gameType === undefined) {
        throw new DomainError("Não foi possível encontrar o tipo de jogo desejado");
    }
    return gameType;
};
