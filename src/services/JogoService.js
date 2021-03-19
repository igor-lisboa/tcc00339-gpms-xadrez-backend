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
    }, indexIa() {
        return db.jogos.filter(jogo => [1, 2].includes(jogo.tipoJogo.id));
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
    }, recuperaPossiveisMovimentosDaPecaDeUmLado(jogoId, ladoId, casaNome) {
        const jogo = this.find(jogoId);
        if (jogo.ladoIdAtual != ladoId) {
            throw "Aguarde sua vez de interagir com suas peças";
        }
        const pecaDoLado = jogo.recuperaLadoPeloId(ladoId).pecas.todas.find(peca => peca.casa.trim().toUpperCase() == casaNome.trim().toUpperCase());
        if (typeof (pecaDoLado) == "undefined") {
            throw "Nenhuma peça pertencente a você foi encontrada na casa procurada";
        }
        return pecaDoLado.possiveisJogadas;
    }
};