const db = require("../database.json");
const Jogo = require("../models/Jogo");

module.exports = {
    lista() {
        return db.jogos;
    }, encontra(id) {
        return new Jogo().encontra(id);
    }, cria(tipoJogoId, tempoDeTurnoEmMilisegundos = -1) {
        return new Jogo(tipoJogoId, tempoDeTurnoEmMilisegundos).cria();
    }, promovePeao(jogoId, ladoId, pecaEscolhida) {
        return this.encontra(jogoId).promovePeao(ladoId, pecaEscolhida);
    }, realizaJogada(jogoId, ladoId, casaOrigem, casaDestino) {
        const { jogo, jogadaRealizada, ladoAdversario } = this.executaJogada(jogoId, ladoId, casaOrigem, casaDestino);
        universalEmitter.emit("jogadaRealizada", { jogadaRealizada, jogo, ladoAdversario });
        return jogadaRealizada;
    }, executaJogada(jogoId, ladoId, casaOrigem, casaDestino) {
        const jogo = this.encontra(jogoId);
        const jogadaRealizada = jogo.realizaJogada(ladoId, casaOrigem, casaDestino);
        const ladoAdversario = this.recuperaLadoTipoDoJogo(jogo, this.recuperaIdLadoAdversarioPeloId(ladoId));
        return { jogo, jogadaRealizada, ladoAdversario };
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
            };
            try {
                const { jogo, jogadaRealizada, ladoAdversario } = this.executaJogada(jogada.jogoId, jogada.ladoId, jogada.casaOrigem, jogada.casaDestino);
                jogadaRetorno.ladoAdversario = ladoAdversario;
                jogadaRetorno.jogada = jogadaRealizada;
                jogadaRetorno.jogo = jogo;
                jogadasExecutadas.push(jogadaRetorno);
            } catch (ex) {
                jogadaRetorno.erro = ex;
                jogadaRetorno.jogadaSolicitada = jogada;
                jogadasErros.push(jogadaRetorno)
            }
        });

        if (jogadasExecutadas.length > 0) {
            universalEmitter.emit("jogadasExecutadasIa", {
                jogadasExecutadas
            });
        }

        if (jogadasErros.length > 0) {
            this.forcaIa();
        }

        return {
            jogadasExecutadas,
            jogadasErros
        };
    }, forcaIa() {
        universalEmitter.emit("forcaIa");
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
        const possiveisJogadas = jogo.recuperaLadoPeloId(ladoId).possiveisJogadas;

        let possiveisJogadasIa = [];

        possiveisJogadas.forEach((possivelJogada) => {

            let possivelJogadaIa = {};
            possivelJogadaIa.de = possivelJogada.casaOrigem.casa;
            possivelJogadaIa.para = possivelJogada.casaDestino.casa;
            possivelJogadaIa.capturavel = possivelJogada.capturavel;
            possivelJogadaIa.captura = possivelJogada.captura;

            possiveisJogadasIa.push(possivelJogadaIa);
        });

        return possiveisJogadasIa;
    }, recuperaPossiveisJogadasDaPecaDeUmLado(jogoId, ladoId, casaNome) {
        const jogo = this.encontra(jogoId);
        if (jogo.ladoIdAtual != ladoId) {
            throw "Aguarde sua vez de interagir com suas peças";
        }
        const lado = jogo.recuperaLadoPeloId(ladoId);
        const pecaDoLado = lado.pecas.find(peca => peca.casa.trim().toUpperCase() == casaNome.trim().toUpperCase());
        if (pecaDoLado == undefined) {
            throw "Nenhuma peça pertencente a você foi encontrada na casa procurada";
        }
        return lado.possiveisJogadas.filter(possiveisJogadasPeca => possiveisJogadasPeca.casaOrigem.casa.trim().toUpperCase() == pecaDoLado.casa.trim().toUpperCase());
    }, recuperaPecaReiAdversario(jogoId, ladoId) {
        const jogo = this.encontra(jogoId);
        if (jogo.ladoIdAtual != ladoId) {
            throw "Aguarde sua vez de interagir com o jogo";
        }
        return jogo.recuperaLadoAdversarioPeloId(ladoId).pecas.find(peca => peca.peca.tipo == "Rei");
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
        return this.recuperaLadoTipoDoJogo(this.encontra(jogoId), ladoId);
    }, recuperaLadoTipoDoJogo(jogo, ladoId) {
        const lado = jogo.recuperaLadoPeloId(ladoId);
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