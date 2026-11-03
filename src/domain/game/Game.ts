import { DomainError } from "../DomainError";
import type { Catalog, EndingInfo, GameTypeInfo, SideInfo } from "../catalog";
import type { Board } from "../board/Board";
import type { SquareLookup, Square } from "../board/SquareLookup";
import type { EnPassantTarget } from "../moves/candidateMoves";
import { legalMovesOf as filterLegalMoves, isKingAttacked as isAttacked } from "../moves/legality";
import type { PossibleMove } from "../moves/possibleMoves";
import type { MoveRecord } from "../moves/MoveRecord";
import { piecesOfSide, type PieceWithMoves } from "../moves/rawMoves";
import { possibleMovesOfSide } from "../moves/possibleMoves";
import { castlingPathClear } from "../moves/castling";
import { movesRulesFor, type Geometry, type Position } from "../position";
import type { RequestedAction } from "./RequestedAction";
import { Side } from "./Side";
import type { Turn } from "./Turn";
import { PieceNames } from "../pieces/pieceNames";

/**
 * A chess game: both sides, the board, the turns and the state of offers and promotion.
 * It holds the state and the checks that apply to every change. Each action (play a move,
 * offer a draw, ...) lives in its own file under this folder; setup, the clock and the
 * judging of positions are in createGame.ts, seating.ts, clock.ts and judgement.ts.
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

    get geometry(): Geometry {
        return { whiteSideId: this.white.id, blackSideId: this.black.id, headsDown: (id) => this.sideById(id).headDown };
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

    /** Whether any move must be answered before the game goes on. */
    hasRequestedActions(): boolean {
        return this.requestedActions.length > 0;
    }

    /** The opposing king, as seen by the side that is asking. */
    opponentKingOf(sideId: number): PieceWithMoves | undefined {
        return this.opponentOf(sideId).pieces.find((entry) => entry.piece.type === PieceNames.King);
    }
}
