const db = require("../database.json");
const helper = require("../helper");
const Jogo = require("../models/Jogo");
const TipoPecaService = require("./TipoPecaService");

module.exports = {
    lista() {
        return db.jogos;
    }, encontra(id) {
        return new Jogo().encontra(id);
    }, encontraSimples(id, tabuleiroSuperSimplificado = false) {
        const jogo = this.encontra(id);

        let retorno = {};
        retorno.id = jogo.id;
        retorno.ladoIdAtual = jogo.ladoIdAtual;
        retorno.ladoBrancoTempoMilisegundosRestante = jogo.ladoBranco.tempoMilisegundosRestante;
        retorno.ladoPretoTempoMilisegundosRestante = jogo.ladoPreto.tempoMilisegundosRestante;
        retorno.tempoDeTurnoEmMilisegundos = jogo.tempoDeTurnoEmMilisegundos;
        retorno.chequeLadoAtual = jogo.chequeLadoAtual;
        retorno.acoesSolicitadas = jogo.acoesSolicitadas;
        retorno.casaPeaoPromocao = jogo.casaPeaoPromocao;
        retorno.empatePropostoPeloLadoId = jogo.empatePropostoPeloLadoId;
        retorno.resetPropostoPeloLadoId = jogo.resetPropostoPeloLadoId;
        retorno.jogadoresOk = jogo.recuperaLadosDeslogados().length == 0;

        let enPassantCasaCaptura = null;
        if (jogo.enPassantCasaCaptura != null) {
            enPassantCasaCaptura = {
                casaCaptura: jogo.enPassantCasaCaptura.casaCaptura.casa,
                casaPeao: jogo.enPassantCasaCaptura.casaPeao.casa
            };
        }
        retorno.enPassantCasaCaptura = enPassantCasaCaptura;

        let finalizado = null;
        if (jogo.finalizado != null) {
            finalizado = jogo.finalizado.tipo;
        }
        retorno.finalizado = finalizado;

        let tipoJogo = "";
        jogo.tipoJogo.integranteLadoTipo.forEach(tipo => {
            tipoJogo += (tipoJogo != "" ? " X " : "") + tipo.nome;
        });
        retorno.tipoJogo = tipoJogo;

        retorno.tabuleiro = jogo.tabuleiro.recuperaTabuleiroCasasSimplificado(tabuleiroSuperSimplificado);

        return retorno;
    }, recuperaTurnos(jogoId) {
        return this.encontra(jogoId).turnos;
    }, recuperaLados(jogoId) {
        const jogo = this.encontra(jogoId);
        let lados = {};
        lados.branco = jogo.ladoBranco;
        lados.preto = jogo.ladoPreto;
        return lados;
    }, resetJogo(jogoId) {
        const jogoAntigo = this.encontra(jogoId);
        const novoJogo = new Jogo(jogoAntigo.tipoJogo.id, jogoAntigo.tempoDeTurnoEmMilisegundos);
        novoJogo.id = jogoAntigo.id;
        novoJogo.salva();
        universalEmitter.emit("jogoResetado", { jogoId: novoJogo.id });
        return novoJogo;
    }, cria(tipoJogoId, tempoDeTurnoEmMilisegundos = -1, tabuleiroCasas = [], ladoId = 0) {
        const jogo = new Jogo(tipoJogoId, tempoDeTurnoEmMilisegundos, tabuleiroCasas, ladoId).cria();
        universalEmitter.emit("jogoCriado");
        return jogo;
    }, iaPromovePeao(jogoId, ladoId) {
        const pecas = TipoPecaService.listaPromocaoPeao();

        let idsPecasParaSeremEscolhidas = [];

        // percorre pecas
        pecas.forEach((peca) => {
            idsPecasParaSeremEscolhidas.push(peca.id);
        });

        const pecaIdEscolhida = idsPecasParaSeremEscolhidas[Math.floor(Math.random() * idsPecasParaSeremEscolhidas.length)];
        return this.promovePeao(jogoId, ladoId, pecaIdEscolhida);
    }, promovePeao(jogoId, ladoId, pecaEscolhida) {
        const jogo = this.encontra(jogoId);
        const { pecaPromovida, jogadaRealizada, ladoAdversario } = jogo.promovePeao(ladoId, pecaEscolhida);

        // finaliza promocao do peao e fecha jogada de um lado
        universalEmitter.emit("jogadaRealizada", { jogoId: jogo.id, jogadaRealizada, ladoAdversario, pecaPromovida, chequeLadoAtual: jogo.chequeLadoAtual });

        return pecaPromovida;
    }, propoeReset(jogoId, ladoId) {
        const jogo = this.encontra(jogoId);
        const ladoAdversario = jogo.propoeReset(ladoId);

        universalEmitter.emit("resetProposto", {
            jogoId: jogo.id,
            ladoAdversario
        });
    }, recuperaLadoAtual(jogoId) {
        const jogo = this.encontra(jogoId);
        return jogo.recuperaLadoPeloId(jogo.ladoIdAtual);
    }, listaPecasDeUmLado(jogoId, ladoId) {
        const jogo = this.encontra(jogoId);
        return jogo.recuperaLadoPeloId(ladoId).pecas;
    }, respondeResetProposto(jogoId, ladoId, resposta) {
        const jogo = this.encontra(jogoId);
        const ladoAdversario = jogo.respondeResetProposto(ladoId, resposta);

        // se a reposta tiver sido positiva executa o reset
        if (resposta) {
            this.resetJogo(jogoId);
        }
        universalEmitter.emit("resetPropostoResposta", {
            jogoId: jogo.id,
            ladoAdversario,
            resposta
        });
    },
    propoeEmpate(jogoId, ladoId) {
        const jogo = this.encontra(jogoId);
        const ladoAdversario = jogo.propoeEmpate(ladoId);

        universalEmitter.emit("empateProposto", {
            jogoId: jogo.id,
            ladoAdversario
        });
    }, respondeEmpateProposto(jogoId, ladoId, resposta) {
        const jogo = this.encontra(jogoId);
        const ladoAdversario = jogo.respondeEmpateProposto(ladoId, resposta);

        // se a reposta tiver sido negativa p empate avisa o adversario caso contrario o evento d finalizacao d jogo avisara
        if (!resposta) {
            universalEmitter.emit("empatePropostoResposta", {
                jogoId: jogo.id,
                ladoAdversario
            });
        }
    }, insereJogador(jogoId, ladoId, tipoId) {
        const jogo = this.encontra(jogoId);
        const lado = jogo.defineJogador(ladoId, db.ladoTipos[tipoId]);
        const ladoAdversario = jogo.recuperaLadoAdversarioPeloId(lado.id);

        universalEmitter.emit("jogadorEntrou", {
            jogoId: jogo.id,
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
            universalEmitter.emit("jogadaRealizada", { jogadaRealizada, jogoId: jogo.id, ladoAdversario, pecaPromovida: null, chequeLadoAtual: jogo.chequeLadoAtual });
        }

        return jogadaRealizada;
    }, executaJogadasIa() {
        const jogosIa = this.listaIa();

        let jogadasParaSeremFeitasPelaIa = [];

        // percorre jogos
        jogosIa.forEach((jogoIa) => {
            // recupera lado atual do jogo
            const ladoIa = jogoIa.ladosIa.find(ladoIa => ladoIa.lado.id == jogoIa.jogo.ladoIdAtual);

            // checa se o ladoIa foi encontrado
            if (ladoIa != undefined) {

                // escolhe uma jogada para realizar
                let novasPossibilidadesJogadas = [];
                let possiveisJogadas = ladoIa.possiveisJogadas;

                // escolhePossivelJogada

                // capturar pecas (se possivel)
                novasPossibilidadesJogadas = possiveisJogadas.filter(possivelJogada =>
                    possivelJogada.captura == true
                );
                // se com o filtro as novasPossibilidadesJogadas estiverem diferente de 0 define possiveisJogadas
                if (novasPossibilidadesJogadas.length != 0) {
                    possiveisJogadas = novasPossibilidadesJogadas;
                }

                // evitar se mover p um lugar onde possa ser capturado (se possivel)
                novasPossibilidadesJogadas = possiveisJogadas.filter(possivelJogada =>
                    possivelJogada.capturavel == false
                );
                // se com o filtro as novasPossibilidadesJogadas estiverem diferente de 0 define possiveisJogadas
                if (novasPossibilidadesJogadas.length != 0) {
                    possiveisJogadas = novasPossibilidadesJogadas;
                }

                // evitar deixar pecas q podem ser capturadas nas casas onde estao
                novasPossibilidadesJogadas = possiveisJogadas.filter(possivelJogada =>
                    possivelJogada.pecaAmeacadaNaPosicaoAtual == true
                );
                // se com o filtro as novasPossibilidadesJogadas estiverem diferente de 0 define possiveisJogadas
                if (novasPossibilidadesJogadas.length != 0) {
                    possiveisJogadas = novasPossibilidadesJogadas;
                }

                const numerosCasaReiAdversario = helper.recuperaNumerosDoNomeDeUmaCasa(this.recuperaPecaReiAdversario(jogoIa.jogo.id, ladoIa.lado.id).casa);

                // insere distancia ate o rei adversario
                possiveisJogadas.forEach(possivelJogada => {
                    // preenche o custo ate o rei adversario do destino da jogada
                    const numerosCasaPara = helper.recuperaNumerosDoNomeDeUmaCasa(possivelJogada.para);
                    const diffLetraNumeroCasaPara = Math.abs(numerosCasaPara.letraNumeroCasa - numerosCasaReiAdversario.letraNumeroCasa);
                    const diffNumeroCasaPara = Math.abs(numerosCasaPara.numeroCasa - numerosCasaReiAdversario.numeroCasa);
                    possivelJogada.custoAteReiAdversarioSimplesPara = diffLetraNumeroCasaPara + diffNumeroCasaPara;
                    // preenche o custo ate o rei adversario da origem da peca
                    const numerosCasaDe = helper.recuperaNumerosDoNomeDeUmaCasa(possivelJogada.de);
                    const diffLetraNumeroCasaDe = Math.abs(numerosCasaDe.letraNumeroCasa - numerosCasaReiAdversario.letraNumeroCasa);
                    const diffNumeroCasaDe = Math.abs(numerosCasaDe.numeroCasa - numerosCasaReiAdversario.numeroCasa);
                    possivelJogada.custoAteReiAdversarioSimplesDe = diffLetraNumeroCasaDe + diffNumeroCasaDe;
                });

                // pega somente jogadas q se aproximam mais do rei adversario
                novasPossibilidadesJogadas = possiveisJogadas.filter(possivelJogada =>
                    possivelJogada.custoAteReiAdversarioSimplesDe <= possivelJogada.custoAteReiAdversarioSimplesPara
                );
                // se com o filtro as novasPossibilidadesJogadas estiverem diferente de 0 define possiveisJogadas
                if (novasPossibilidadesJogadas.length != 0) {
                    possiveisJogadas = novasPossibilidadesJogadas;
                }

                const jogadaEscolhida = possiveisJogadas[Math.floor(Math.random() * possiveisJogadas.length)];

                // se escolheu alguma jogada... adiciona na lista de jogadas p executar
                if (jogadaEscolhida != undefined) {
                    // insere jogada escolhida no array de jogadasParaSeremFeitasPelaIa
                    jogadasParaSeremFeitasPelaIa.push({
                        "jogoId": jogoIa.jogo.id,
                        "casaOrigem": jogadaEscolhida.de,
                        "casaDestino": jogadaEscolhida.para,
                        "ladoId": ladoIa.lado.id
                    });
                }
            }
        });

        return this.executaJogadas(jogadasParaSeremFeitasPelaIa);
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
        const possiveisJogadas = jogo.filtraPossiveisJogadasLadoPraNaoPorReiEmCheque(ladoId);

        let possiveisJogadasIa = [];

        possiveisJogadas.forEach((possivelJogada) => {

            let possivelJogadaIa = {};
            possivelJogadaIa.de = possivelJogada.casaOrigem.casa;
            possivelJogadaIa.para = possivelJogada.casaDestino.casa;
            possivelJogadaIa.capturavel = possivelJogada.capturavel;
            possivelJogadaIa.captura = possivelJogada.captura;
            possivelJogadaIa.nome = possivelJogada.nome;

            possiveisJogadasIa.push(possivelJogadaIa);
        });

        return possiveisJogadasIa;
    }, recuperaPossiveisJogadasDaPecaDeUmLado(jogoId, ladoId, casaNome) {
        const jogo = this.encontra(jogoId);
        if (jogo.ladoIdAtual != ladoId) {
            throw "Aguarde sua vez de interagir com suas peças";
        }
        return jogo.filtraPossiveisJogadasCasaPraNaoPorReiEmCheque(ladoId, casaNome);
    }, recuperaPecaReiAdversario(jogoId, ladoId) {
        const jogo = this.encontra(jogoId);
        if (jogo.ladoIdAtual != ladoId) {
            throw "Aguarde sua vez de interagir com o jogo";
        }
        return jogo.recuperaLadoAdversarioPeloId(ladoId).pecas.find(peca => peca.peca.tipo == "Rei");
    }, recuperaLadosSemJogador(jogoId) {
        return this.encontra(jogoId).recuperaLadosDeslogados();
    }
};