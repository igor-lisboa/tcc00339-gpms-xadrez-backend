const db = require("../database.json");
const Jogo = require("../models/Jogo");

module.exports = {
    index() {
        return db.jogos;
    }, find(index) {
        return new Jogo().find(index);
    }, create(tipoJogoId) {
        return new Jogo(tipoJogoId).create();
    }, realizaJogada(jogoId, ladoId, casaOrigem, casaDestino) {
        return this.find(jogoId).realizaJogada(ladoId, casaOrigem, casaDestino);
    }, insereJogador(jogoId, ladoId, tipoId) {
        return this.find(jogoId).defineJogador(ladoId, db.ladoTipos[tipoId]);
    }, recuperaLadoAtual(jogoId) {
        let jogo = this.find(jogoId);
        return jogo.recuperaLadoPeloId(jogo.ladoIdAtual);
    }, recuperaLadosIa(jogoId) {
        let jogo = this.find(jogoId);
        let ladosIa = [];
        if (jogo.ladoBranco.tipo != null) {
            if (jogo.ladoBranco.tipo.id == 1) {
                ladosIa.push(jogo.ladoBranco);
            }
        }
        if (jogo.ladoPreto.tipo != null) {
            if (jogo.ladoPreto.tipo.id == 1) {
                ladosIa.push(jogo.ladoPreto);
            }
        }
        return ladosIa;
    }, recuperaLadoPeloId(jogoId, ladoId) {
        return this.find(jogoId).recuperaLadoPeloId(ladoId);
    }
};