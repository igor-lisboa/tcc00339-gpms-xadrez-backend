import { DomainError } from "../DomainError";
import type { PlayerTypeInfo, SideInfo } from "../catalog";
import type { PieceWithMoves } from "../moves/rawMoves";
import type { PossibleMove } from "../moves/possibleMoves";
import type { MoveRecord } from "../moves/MoveRecord";

/** One of the two colours of a game, with the player on it and the state that belongs to it. */
export class Side {
    playerType: PlayerTypeInfo | null = null;
    remainingMs: number | null = null;
    pieces: PieceWithMoves[] = [];
    possibleMoves: PossibleMove[] = [];
    readonly performedMoves: MoveRecord[] = [];

    constructor(readonly info: SideInfo) {}

    get id(): number {
        return this.info.id;
    }

    get name(): string {
        return this.info.nome;
    }

    get headDown(): boolean {
        return this.info.cabecaPraBaixo;
    }

    defineType(playerType: PlayerTypeInfo): void {
        if (this.playerType !== null) {
            throw new DomainError("Esse lado já foi escolhido");
        }
        this.playerType = playerType;
    }

    removeType(): void {
        this.playerType = null;
    }
}
