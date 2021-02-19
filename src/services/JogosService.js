const db = require('../database.json');

module.exports = {
    index() {
        return db.jogos;
    }, find(index) {
        return db.jogos[index];
    }, create() {
        let novoJogo = {
            tabuleiro: [
                [null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null]
            ],
            ladoAtual: 0,
            movimentos: []
        };
        return db.jogos.push(novoJogo);
    }
};