const db = require("../database.json");
const Jogo = require("../models/Jogo");

module.exports = {
    index() {
        return db.jogos;
    }, find(index) {
        return new Jogo().find(index);
    }, create(tipoJogoId) {
        const tamanhoAntesPush = db.jogos.length;
        const novoJogo = new Jogo(tipoJogoId);
        const tamanhoDepoisPush = db.jogos.push(novoJogo);
        if (tamanhoAntesPush >= tamanhoDepoisPush) {
            throw "Falha ao incluir Jogo!";
        }
        const ultimoIndex = db.jogos.lastIndexOf(novoJogo);
        return {
            index: ultimoIndex,
            jogo: db.jogos[ultimoIndex]
        };
    }, realizaJogada(jogoId, ladoId, casaOrigem, casaDestino) {
        let jogo = this.find(jogoId);
        jogo = jogo.realizaJogada(ladoId, casaOrigem, casaDestino);
        db.jogos[jogoId] = jogo;
        return db.jogos[jogoId];
    }, insereJogador(jogoId, ladoId, tipoId) {
        let jogo = this.find(jogoId);
        const lado = jogo.defineJogador(ladoId, db.ladoTipos[tipoId]);
        db.jogos[jogoId] = jogo;
        return lado;
    }
};