import { DomainError } from "../DomainError";
import type { SquareInfo } from "../catalog";

/** A square of the board, for example E4. Row 0 is rank 8 and column 0 is file A. */
export interface Square {
    readonly name: string;
    readonly linha: number;
    readonly coluna: number;
}

const keyOf = (linha: number, coluna: number) => `${linha}:${coluna}`;

/** Finds squares by name ("E4") or by row and column. Every square is one shared object. */
export class SquareLookup {
    private readonly byName = new Map<string, Square>();
    private readonly byPosition = new Map<string, Square>();

    constructor(squares: readonly SquareInfo[]) {
        squares.forEach((info) => {
            const square: Square = { name: info.casa, linha: info.linha, coluna: info.coluna }; // names-check:ignore (key in database.json)
            this.byName.set(square.name.trim().toUpperCase(), square);
            this.byPosition.set(keyOf(square.linha, square.coluna), square);
        });
    }

    all(): Square[] {
        return [...this.byPosition.values()];
    }

    /** Finds a square by its name. Throws a DomainError if the name is unknown. */
    fromName(name: string): Square {
        const square = this.byName.get(name.trim().toUpperCase());
        if (square === undefined) {
            throw new DomainError("Não foi possível encontrar a casa desejada buscando pelo nome da casa");
        }
        return square;
    }

    /** Finds a square by row and column. Throws a DomainError if it is off the board. */
    fromPosition(linha: number, coluna: number): Square {
        const square = this.tryFromPosition(linha, coluna);
        if (square === null) {
            throw new DomainError("Não foi possível encontrar a casa desejada buscando pela linha e coluna");
        }
        return square;
    }

    /** Like fromPosition, but returns null when the position is off the board. */
    tryFromPosition(linha: number, coluna: number): Square | null {
        return this.byPosition.get(keyOf(linha, coluna)) ?? null;
    }

    /** Accepts either a square name or an object with row and column. */
    resolve(target: string | { linha: number; coluna: number }): Square {
        if (typeof target === "string") {
            return this.fromName(target);
        }
        return this.fromPosition(target.linha, target.coluna);
    }
}
