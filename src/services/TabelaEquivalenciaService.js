const db = require("../database.json");

module.exports = {
    lista() {
        return db.tabelaEquivalencia;
    }, listaReverse() {
        const tabelaEquivalencia = [];
        this.lista().forEach(item => {
            tabelaEquivalencia.push(item);
        });
        return tabelaEquivalencia.reverse();
    }
};