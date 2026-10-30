const db = require("../database.json");

module.exports = {
    lista() {
        // builds new objects with the player types resolved; the lookup table itself is not changed
        return db.tiposJogo.map((tipoDeJogo) => {
            const { integranteLadoTipoIds, ...dados } = tipoDeJogo;
            if (integranteLadoTipoIds == undefined) {
                return { ...dados };
            }
            return {
                ...dados,
                integranteLadoTipo: integranteLadoTipoIds.map((integranteLadoTipoId) => db.ladoTipos[integranteLadoTipoId])
            };
        });
    }, encontra(tipoJogoId) {
        const tipoJogoEncontrado = this.lista().find(tipoJogo => tipoJogo.id == tipoJogoId);
        if (tipoJogoEncontrado == undefined) {
            throw "Não foi possível encontrar o tipo de jogo desejado";
        }
        return tipoJogoEncontrado;
    }
};
