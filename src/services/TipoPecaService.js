const db = require("../database.json");

module.exports = {
    lista() {
        return db.tiposPeca;
    },
    listaPromocaoPeao() {
        return db.tiposPeca.filter(peca => peca.nome != "Rei" && peca.nome != "Peão");
    }
};