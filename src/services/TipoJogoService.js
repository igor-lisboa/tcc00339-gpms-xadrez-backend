const db = require("../database.json");

module.exports = {
    index() {
        // tratando o array de ids e retornando os objetos
        let tiposDeJogo = db.tiposJogo;
        tiposDeJogo.forEach((tipoDeJogo) => {
            const integranteLadoTipoIds = tipoDeJogo.integranteLadoTipoIds;
            if (integranteLadoTipoIds != undefined) {
                integranteLadoTipoIds.forEach((integranteLadoTipoId) => {
                    let listaLadosDoTipoDeJogo = tipoDeJogo.integranteLadoTipo;
                    const ladoTipoRecuperado = db.ladoTipos[integranteLadoTipoId];
                    if (listaLadosDoTipoDeJogo == undefined) {
                        tipoDeJogo.integranteLadoTipo = [ladoTipoRecuperado];
                    } else {
                        tipoDeJogo.integranteLadoTipo.push(ladoTipoRecuperado);
                    }
                });
                delete tipoDeJogo.integranteLadoTipoIds;
            }
        });
        return tiposDeJogo;
    }, find(tipoJogoId) {
        const tipoJogoEncontrado = this.index().find(tipoJogo => tipoJogo.id == tipoJogoId);
        if (typeof (tipoJogoEncontrado) === "undefined") {
            throw "Não foi possível encontrar o tipo de jogo desejado";
        }
        return tipoJogoEncontrado;
    }
};