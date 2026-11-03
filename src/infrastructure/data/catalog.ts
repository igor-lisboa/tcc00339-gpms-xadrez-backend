import database from "../../database.json";
import type { Catalog } from "../../domain/catalog";

/** Builds the domain's static data from database.json. Game types get their player types resolved. */
export const buildCatalog = (): Catalog => ({
    sides: database.lados, // names-check:ignore (key in database.json)
    playerTypes: database.ladoTipos,
    gameTypes: database.tiposJogo.map((gameType: { id: number; integranteLadoTipoIds: number[] }) => ({
        id: gameType.id,
        integranteLadoTipo: gameType.integranteLadoTipoIds.map((playerTypeId: number) => database.ladoTipos[playerTypeId]),
    })),
    endings: database.tiposFinalizacao,
    pieceTypes: database.tiposPeca,
    squares: database.tabelaEquivalencia,
});
