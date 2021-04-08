const db = require("../database.json");
const Jogo = require("../models/Jogo");

module.exports = {
    lista() {
        return db.jogos;
    }, encontra(id) {
        return new Jogo().encontra(id);
    }, cria(tipoJogoId, tempoDeTurnoEmMilisegundos = 300000) {
        return new Jogo(tipoJogoId, tempoDeTurnoEmMilisegundos).cria();
    }, realizaJogada(jogoId, ladoId, casaOrigem, casaDestino) {
        return this.encontra(jogoId).realizaJogada(ladoId, casaOrigem, casaDestino);
    }, insereJogador(jogoId, ladoId, tipoId) {
        return this.encontra(jogoId).defineJogador(ladoId, db.ladoTipos[tipoId]);
    }, removeJogador(jogoId, ladoId) {
        return this.encontra(jogoId).defineJogador(ladoId, null);
    }, listaIa() {
        const iaJogos = db.jogos.filter(jogo => [1, 2].includes(jogo.tipoJogo.id) && jogo.finalizado == null);
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
            let jogadaRetorno = {
                "jogoId": jogada.jogoId,
                "ladoId": jogada.ladoId,
                "ladoAdversario": this.recuperaLadoTipo(jogada.jogoId, this.recuperaIdLadoAdversarioPeloId(jogada.ladoId))
            };
            try {
                jogadaRetorno.jogada = this.realizaJogada(jogada.jogoId, jogada.ladoId, jogada.casaOrigem, jogada.casaDestino);
                jogadasExecutadas.push(jogadaRetorno);
            } catch (ex) {
                jogadaRetorno.erro = ex;
                jogadaRetorno.jogadaSolicitada = jogada;
                jogadasErros.push(jogadaRetorno)
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
        const casaPecas = jogo.recuperaLadoPeloId(ladoId).pecas;

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
        return jogo.recuperaLadoAdversarioPeloId(ladoId).pecas.find(peca => peca.peca.tipo == "Rei");
    }, recuperaTodasAsPecasDeUmLado(jogoId, ladoId) {
        const jogo = this.encontra(jogoId);
        if (jogo.ladoIdAtual != ladoId) {
            throw "Aguarde sua vez de interagir com suas peças";
        }
        return jogo.recuperaLadoPeloId(ladoId).pecas;
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
    }, recuperaIdLadoAdversarioPeloId(ladoId) {
        if (ladoId == 0) {
            return 1;
        }
        return 0;
    }, recuperaLadoTipo(jogoId, ladoId) {
        const lado = this.encontra(jogoId).recuperaLadoPeloId(ladoId);
        let ladoRetorno = {
            "ladoId": lado.id,
            "lado": lado.lado,
        };
        if (lado.tipo != null) {
            ladoRetorno.tipoId = lado.tipo.id;
            ladoRetorno.tipoNome = lado.tipo.nome;
        } else {
            ladoRetorno.tipoId = null;
            ladoRetorno.tipoNome = null;
        }
        return ladoRetorno;
    }, recuperaTabuleiro(jogoId) {
        return this.encontra(jogoId).recuperaTabuleiro();
    }
};