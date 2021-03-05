const db = require("../database.json");
const Jogo = require("../models/Jogo");

module.exports = {
    index() {
        return db.jogos;
    }, find(index) {
        return new Jogo().find(index);
    }, create() {
        const tamanhoAntesPush = db.jogos.length;
        const novoJogo = new Jogo();
        const tamanhoDepoisPush = db.jogos.push(novoJogo);
        if (tamanhoAntesPush >= tamanhoDepoisPush) {
            throw "Falha ao incluir Jogo!";
        }
        const ultimoIndex = db.jogos.lastIndexOf(novoJogo);
        return {
            index: ultimoIndex,
            jogo: db.jogos[ultimoIndex]
        };
    }
};