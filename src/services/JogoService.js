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
        const iaJogos = db.jogos.filter(jogo => [1, 2].includes(jogo.tipoJogo.id));
        let ias = [];
        iaJogos.forEach((iaJogo) => {
            let iaElement = {};
            iaElement.jogo = iaJogo;
            iaElement.ladosIa = this.recuperaLadosIa(iaJogo.id);
            ias.push(iaElement);
        });
        return ias;
    }, recuperaLadosIa(jogoId) {
        let jogo = this.encontra(jogoId);
        let ladosIa = [];
        if (jogo.ladoBranco.tipo != null) {
            if (jogo.ladoBranco.tipo.id == 1) {
                ladosIa.push(this.recuperaLadoIa(jogo, jogo.ladoBranco));
            }
        }
        if (jogo.ladoPreto.tipo != null) {
            if (jogo.ladoPreto.tipo.id == 1) {
                ladosIa.push(this.recuperaLadoIa(jogo, jogo.ladoPreto));
            }
        }
        return ladosIa;
    }, executaJogadas(jogadas = []) {
        let jogadasExecutadas = [];
        let jogadasErros = [];
        jogadas.forEach((jogada) => {
            try {
                jogadasExecutadas.push(this.realizaJogada(jogada.jogoId, jogada.ladoId, jogada.casaOrigem, jogada.casaDestino));
            } catch (ex) {
                jogadasErros.push({
                    "erro": ex,
                    "jogada": jogada
                })
            }
        });
        return {
            jogadasExecutadas,
            jogadasErros
        };
    }, recuperaLadoIa(jogo, lado) {
        if (lado.tipo != null) {
            if (lado.tipo.id == 1) {
                let ladoElement = {};
                ladoElement.lado = lado;
                ladoElement.possiveisJogadas = this.recuperaMovimentosPossiveisConsolidado(jogo, lado.id);

                const ladoAdversarioPossiveisJogadas = this.recuperaMovimentosPossiveisConsolidado(jogo, jogo.recuperaLadoAdversarioPeloId(lado.id).id);

                ladoElement.possiveisJogadas.forEach((possivelJogada) => {
                    let pecaAmeacadaNaPosicaoAtual = undefined;

                    const possivelJogadaLadoAdversario = ladoAdversarioPossiveisJogadas.find(jogadaAdversario => jogadaAdversario.para == possivelJogada.de);

                    // se n achou possivelJogadaLadoAdversario eh pq a peca n ta ameacada
                    if (possivelJogadaLadoAdversario == undefined) {
                        pecaAmeacadaNaPosicaoAtual = false;
                    } else {
                        pecaAmeacadaNaPosicaoAtual = true;
                    }

                    possivelJogada.pecaAmeacadaNaPosicaoAtual = pecaAmeacadaNaPosicaoAtual;
                });


                return ladoElement;
            }
        }
        throw "O lado solicitado não é uma I.A."
    }, recuperaMovimentosPossiveisConsolidado(jogo, ladoId) {
        const casaPecas = jogo.recuperaLadoPeloId(ladoId).pecas.todas;

        let possiveisJogadas = [];

        casaPecas.forEach((casaPeca) => {
            casaPeca.possiveisJogadas.forEach((possivelJogada) => {

                let possivelJogadaIa = {};
                possivelJogadaIa.de = casaPeca.casa;
                possivelJogadaIa.para = possivelJogada.casa.casa;
                possivelJogadaIa.capturavel = possivelJogada.capturavel;
                possivelJogadaIa.captura = possivelJogada.captura;

                possiveisJogadas.push(possivelJogadaIa);
            });

        });

        return possiveisJogadas;
    }, recuperaPossiveisMovimentosDaPecaDeUmLado(jogoId, ladoId, casaNome) {
        const pecaDoLado = this.recuperaTodasAsPecasDeUmLado(jogoId, ladoId).find(peca => peca.casa.trim().toUpperCase() == casaNome.trim().toUpperCase());
        if (pecaDoLado == undefined) {
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