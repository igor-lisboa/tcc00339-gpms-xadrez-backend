const db = require('../database.json');
const Jogo = require('../models/Jogo');

module.exports = {
    index() {
        return db.jogos;
    }, find(index) {
        const jogo = db.jogos[index];
        if (jogo === undefined) {
            throw 'Jogo não encontrado!';
        }
        return jogo;
    }, create() {
        const tamanhoAntesPush = db.jogos.length;
        const novoJogo = new Jogo();
        const tamanhoDepoisPush = db.jogos.push(novoJogo);
        if (tamanhoAntesPush >= tamanhoDepoisPush) {
            throw 'Falha ao incluir Jogo!';
        }
        const ultimoIndex = db.jogos.lastIndexOf(novoJogo);
        return {
            index: ultimoIndex,
            jogo: db.jogos[ultimoIndex]
        };
    }
};