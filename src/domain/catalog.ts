/**
 * Static data the domain needs (sides, player types, game types, endings, piece types).
 * It is passed in when a game is created, so the domain never reads a file itself.
 */

export interface SideInfo {
    readonly id: number;
    readonly nome: string;
    readonly cabecaPraBaixo: boolean;
}

export interface PlayerTypeInfo {
    readonly id: number;
    readonly nome: string;
}

export interface GameTypeInfo {
    readonly id: number;
    readonly integranteLadoTipo: readonly PlayerTypeInfo[];
}

export interface EndingInfo {
    readonly id: number;
    readonly tipo: string;
}

export interface PieceTypeInfo {
    readonly id: number;
    readonly nome: string;
    readonly classe: string;
    readonly unicodePreto: string;
    readonly unicodeBranco: string;
}

export interface SquareInfo {
    readonly casa: string; // names-check:ignore (key in database.json)
    readonly linha: number;
    readonly coluna: number;
}

export interface Catalog {
    readonly sides: readonly SideInfo[];
    readonly playerTypes: readonly PlayerTypeInfo[];
    readonly gameTypes: readonly GameTypeInfo[];
    readonly endings: readonly EndingInfo[];
    readonly pieceTypes: readonly PieceTypeInfo[];
    readonly squares: readonly SquareInfo[];
}
