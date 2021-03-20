const db = require("../database.json");
const Jogo = require("../models/Jogo");

module.exports = {
    lista() {
        return db.jogos;
    }, encontra(id) {
        return new Jogo().encontra(id);
    }, cria(tipoJogoId) {
        return new Jogo(tipoJogoId).cria();
    }, realizaJogada(jogoId, ladoId, casaOrigem, casaDestino) {
        return this.encontra(jogoId).realizaJogada(ladoId, casaOrigem, casaDestino);
    }, insereJogador(jogoId, ladoId, tipoId) {
        return this.encontra(jogoId).defineJogador(ladoId, db.ladoTipos[tipoId]);
    }, listaIa() {
        return db.jogos.filter(jogo => [1, 2].includes(jogo.tipoJogo.id));
    }, recuperaLadosIa(jogoId) {
        let jogo = this.encontra(jogoId);
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
        const pecaDoLado = this.recuperaTodasAsPecasDeUmLado(jogoId, ladoId).find(peca => peca.casa.trim().toUpperCase() == casaNome.trim().toUpperCase());
        if (typeof (pecaDoLado) == "undefined") {
            throw "Nenhuma peça pertencente a você foi encontrada na casa procurada";
        }
        return pecaDoLado.possiveisJogadas;
    }, recuperaPecaReiAdversario(jogoId, ladoId) {
        const jogo = this.encontra(jogoId);
        if (jogo.ladoIdAtual != ladoId) {
            throw "Aguarde sua vez de interagir com o jogo";
        }
        return jogo.recuperaLadoAdversarioPeloId(ladoId).pecas.rei;
    }, recuperaTodasAsPecasDeUmLado(jogoId, ladoId) {
        const jogo = this.encontra(jogoId);
        if (jogo.ladoIdAtual != ladoId) {
            throw "Aguarde sua vez de interagir com suas peças";
        }
        return jogo.recuperaLadoPeloId(ladoId).pecas.todas;
    }, recuperaLadosSemJogador(jogoId) {
        const jogo = this.encontra(jogoId);
        let ladosSemJogador = [];
        if (jogo.ladoBranco.tipo == null) {
            ladosSemJogador.push(jogo.ladoBranco);
        }
        if (jogo.ladoPreto.tipo == null) {
            ladosSemJogador.push(jogo.ladoPreto);
        }
        return ladosSemJogador;
    }
};