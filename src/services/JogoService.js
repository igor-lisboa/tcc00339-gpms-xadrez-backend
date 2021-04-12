const db = require("../database.json");
const Jogo = require("../models/Jogo");

module.exports = {
    lista() {
        return db.jogos;
    }, encontra(id) {
        return new Jogo().encontra(id);
    }, cria(tipoJogoId, tempoDeTurnoEmMilisegundos = -1) {
        const jogo = new Jogo(tipoJogoId, tempoDeTurnoEmMilisegundos).cria();
        universalEmitter.emit("jogoCriado", { jogo });
        return jogo;
    }, promovePeao(jogoId, ladoId, pecaEscolhida) {
        const jogo = this.encontra(jogoId);
        const { pecaPromovida, jogadaRealizada, ladoAdversario } = jogo.promovePeao(ladoId, pecaEscolhida);

        // finaliza promocao do peao e fecha jogada de um lado
        universalEmitter.emit("jogadaRealizada", { jogo, jogadaRealizada, ladoAdversario, pecaPromovida });

        return pecaPromovida;
    }, propoeEmpate(jogoId, ladoId) {
        const jogo = this.encontra(jogoId);
        const ladoAdversario = jogo.propoeEmpate(ladoId);

        universalEmitter.emit("empateProposto", {
            jogo,
            ladoAdversario
        });
    }, respondeEmpateProposto(jogoId, ladoId, resposta) {
        const jogo = this.encontra(jogoId);
        const ladoAdversario = jogo.respondeEmpateProposto(ladoId, resposta);

        // se a reposta tiver sido negativa p empate avisa o adversario caso contrario o evento d finalizacao d jogo avisara
        if (!resposta) {
            universalEmitter.emit("empatePropostoResposta", {
                jogo,
                ladoAdversario
            });
        }
    }, insereJogador(jogoId, ladoId, tipoId) {
        const jogo = this.encontra(jogoId);
        const lado = jogo.defineJogador(ladoId, db.ladoTipos[tipoId]);
        const ladoAdversario = jogo.recuperaLadoAdversarioPeloId(lado.id);

        universalEmitter.emit("jogadorEntrou", {
            jogo,
            ladoAdversario
        });

        return lado;
    }, removeJogador(jogoId, ladoId) {
        return this.encontra(jogoId).defineJogador(ladoId, null);
    }, realizaJogada(jogoId, ladoId, casaOrigem, casaDestino) {
        const jogo = this.encontra(jogoId);
        const { jogadaRealizada, ladoAdversario } = jogo.realizaJogada(ladoId, casaOrigem, casaDestino);

        // so dispara evento se o lado atual eh o lado adversario
        if (ladoAdversario.id == jogo.ladoIdAtual) {
            universalEmitter.emit("jogadaRealizada", { jogadaRealizada, jogo, ladoAdversario, pecaPromovida: null });
        }

        return jogadaRealizada;
    }, executaJogadas(jogadas = []) {
        let jogadasExecutadas = [];
        let jogadasErros = [];
        jogadas.forEach((jogada) => {
            let jogadaRetorno = {
                "jogoId": jogada.jogoId,
                "ladoId": jogada.ladoId,
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

        if (jogadasErros.length > 0) {
            this.forcaIa();
        }

        return {
            jogadasExecutadas,
            jogadasErros
        };
    }, forcaIa() {
        universalEmitter.emit("forcaIa");
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
        return jogo.filtraPossiveisJogadasPraNaoPorReiEmCheque(ladoId, casaNome);
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
    }
};