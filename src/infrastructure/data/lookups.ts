import database from "../../database.json";

/**
 * Read-only lookup tables from database.json. Only static data lives here; the list of
 * games is state and is kept elsewhere. Nothing in this module changes the data.
 */

export interface SideRecord {
    readonly id: number;
    readonly nome: string;
    readonly cabecaPraBaixo: boolean;
}

export interface PlayerTypeRecord {
    readonly id: number;
    readonly nome: string;
}

export interface GameTypeRecord {
    readonly id: number;
    readonly integranteLadoTipoIds: readonly number[];
}

export interface EndingRecord {
    readonly id: number;
    readonly tipo: string;
}

export interface PieceTypeRecord {
    readonly id: number;
    readonly nome: string;
    readonly classe: string;
    readonly unicodePreto: string;
    readonly unicodeBranco: string;
}

export interface SquareRecord {
    readonly casa: string; // names-check:ignore (key name in database.json)
    readonly linha: number;
    readonly coluna: number;
}

export const sides: readonly SideRecord[] = database.lados; // names-check:ignore (key name in database.json)
export const playerTypes: readonly PlayerTypeRecord[] = database.ladoTipos;
export const gameTypes: readonly GameTypeRecord[] = database.tiposJogo;
export const endings: readonly EndingRecord[] = database.tiposFinalizacao;
export const pieceTypes: readonly PieceTypeRecord[] = database.tiposPeca;
export const squares: readonly SquareRecord[] = database.tabelaEquivalencia;
