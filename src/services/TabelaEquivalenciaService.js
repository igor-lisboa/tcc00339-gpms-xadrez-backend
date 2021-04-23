const db = require("../database.json");

module.exports = {
    lista() {
        return db.tabelaEquivalencia;
    }, listaReverse() {
        return this.lista().reverse();
    }
};