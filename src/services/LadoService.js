const db = require("../database.json");

module.exports = {
    lista() {
        return db.lados;
    }, tipos() {
        return db.ladoTipos;
    }
};