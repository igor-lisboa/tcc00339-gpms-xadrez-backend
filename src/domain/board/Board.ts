import { DomainError } from "../DomainError";
import { Piece } from "../pieces/Piece";
import type { MoveRecord } from "../moves/MoveRecord";
import type { PieceName } from "../pieces/pieceNames";
import type { Square, SquareLookup } from "./SquareLookup";

export interface OccupiedSquare {
    readonly square: Square;
    readonly piece: Piece;
}

export type Grid = (Piece | null)[][];

/**
 * The 8 by 8 grid of pieces. Row 0 is rank 8, column 0 is file A.
 * It also counts moves without captures or pawn moves (fifty-move rule)
 * and how often each position has appeared (threefold repetition).
 */
export class Board {
    halfMoveClock = 0;
    private readonly repetitions = new Map<string, number>();

    constructor(
        readonly lookup: SquareLookup,
        private readonly grid: Grid
    ) {}

    static empty(): Grid {
        return Array.from({ length: 8 }, () => Array<Piece | null>(8).fill(null));
    }

    pieceAt(square: Square): Piece | null {
        return this.grid[square.linha][square.coluna];
    }

    place(square: Square, piece: Piece | null): void {
        this.grid[square.linha][square.coluna] = piece;
    }

    /** Copies of the rows, row 0 first. */
    rows(): (Piece | null)[][] {
        return this.grid.map((row) => [...row]);
    }

    occupiedSquares(): OccupiedSquare[] {
        return this.lookup
            .all()
            .flatMap((square) => {
                const piece = this.pieceAt(square);
                return piece === null ? [] : [{ square, piece }];
            });
    }

    /** A copy with its own piece objects, so a what-if move never changes this board. */
    clone(): Board {
        const grid = this.grid.map((row) => row.map((piece) => (piece === null ? null : piece.clone())));
        const copy = new Board(this.lookup, grid);
        copy.halfMoveClock = this.halfMoveClock;
        this.repetitions.forEach((count, key) => copy.repetitions.set(key, count));
        return copy;
    }

    /**
     * Remembers the current position. `context` holds what the grid cannot show and the rules
     * compare too (side to move, castling rights, en passant). Returns how many times it has now appeared.
     */
    recordPosition(context = ""): number {
        const key = this.repetitionKey(context);
        const count = (this.repetitions.get(key) ?? 0) + 1;
        this.repetitions.set(key, count);
        return count;
    }

    /** How many times the current position, with this context, has been recorded. */
    repetitionsOf(context = ""): number {
        return this.repetitions.get(this.repetitionKey(context)) ?? 0;
    }

    private repetitionKey(context: string): string {
        return `${this.positionKey()}#${context}`;
    }

    /** Placement identity: piece type and side of every square. Move history is not part of it. */
    positionKey(): string {
        return this.grid
            .map((row) => row.map((piece) => (piece === null ? "." : `${piece.type}-${piece.sideId}`)).join("|"))
            .join("/");
    }
}

/** Turns a custom board (rows of "Tipo-ladoId" or null) into a grid. Throws a DomainError with the cell position on bad input. */
export const gridFromNotation = (rows: readonly (readonly unknown[])[], pieceNames: readonly string[]): Grid => {
    const grid = Board.empty();
    rows.forEach((row, linhaIndex) => {
        row.forEach((cell, colunaIndex) => {
            if (cell === null || cell === undefined) {
                return;
            }
            grid[linhaIndex][colunaIndex] = pieceFromCell(cell, linhaIndex, colunaIndex, pieceNames);
        });
    });
    return grid;
};

const pieceFromCell = (cell: unknown, linha: number, coluna: number, pieceNames: readonly string[]): Piece => {
    const where = `linha:${linha} e coluna:${coluna}`;
    let tipo: string;
    let ladoId: string | number;
    let jogadasRealizadas: MoveRecord[] = [];

    if (typeof cell === "string") {
        const parts = cell.split("-");
        if (parts.length !== 2) {
            throw new DomainError(`Peça na casa da linha:${linha} e coluna:${coluna} inválida (${JSON.stringify(parts)})`);
        }
        if (parts[1] !== "1" && parts[1] !== "0") {
            throw new DomainError(`Peça na casa da linha:${linha} e coluna:${coluna} tem o lado definido de forma incorreta (${JSON.stringify(parts)})`);
        }
        [tipo, ladoId] = parts;
    } else {
        const objeto = cell as { tipo: string; ladoId: string | number; jogadasRealizadas?: unknown[] };
        tipo = objeto.tipo;
        ladoId = objeto.ladoId;
        jogadasRealizadas = [...(objeto.jogadasRealizadas ?? [])] as MoveRecord[];
    }

    if (!pieceNames.includes(tipo)) {
        const detalhe = typeof cell === "string" ? { tipo, ladoId, jogadasRealizadas: [] } : cell;
        throw new DomainError(`Esse tipo de peça escolhido para casa da ${where} é inválido (${JSON.stringify(detalhe)})`);
    }

    return new Piece(Number(ladoId), tipo as PieceName, jogadasRealizadas);
};
