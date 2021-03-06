const db = require("../database.json");
const TipoJogoService = require("../services/TipoJogoService");
const TipoPecaService = require("../services/TipoPecaService");

const Lado = require("./Lado");

const PossivelJogada = require("./PossivelJogada");
const MovimentoRealizado = require("./MovimentoRealizado");
const MovimentoPossivel = require("./MovimentoPossivel");
const AcaoSolicitada = require("./AcaoSolicitada");
const Turno = require("./Turno");
const Tabuleiro = require("./Tabuleiro");

module.exports = class Jogo {
    constructor(tipoJogoId = 0, tempoDeTurnoEmMilisegundos = -1, tabuleiroCasas = [], ladoId = 0) {
        this.id = null;

        this.ladoBranco = new Lado(db.lados[0]);
        this.ladoPreto = new Lado(db.lados[1]);

        this.tabuleiro = new Tabuleiro(this.ladoBranco.id, this.ladoPreto.id, tabuleiroCasas);

        this.turnos = [];

        /**
        * O tempo de turno em milisegundos é usado pra verificar se o tempo de turno já foi
        * atingido
        */
        this.tempoDeTurnoEmMilisegundos = tempoDeTurnoEmMilisegundos;

        this.defineLadoIdAtual(ladoId);

        /**
         * Objeto contendo a casa de captura do enPassant e a casa onde a peca se encontra
         * so eh valida por 1 jogada nessa jogada em questao o jogador adversario caso tenha
         * alguma peca q pode ir ate a casa armazenada nessa variavel ira realizar a captura
         * do PEÃO que executou o enPassant
         */
        this.enPassantCasaCaptura = null;

        this.finalizado = null;

        // promocaoPeao, responderPropostaEmpate
        this.acoesSolicitadas = [];

        this.casaPeaoPromocao = null;

        this.empatePropostoPeloLadoId = null;
        this.resetPropostoPeloLadoId = null;


        this.defineTipoJogo(tipoJogoId);
    }

    propoeReset(ladoId) {
        if (this.resetPropostoPeloLadoId == null) {
            if (this.finalizado == null) {
                throw "Não é possível resetar um jogo que não foi finalizado";
            }
            this.resetPropostoPeloLadoId = ladoId;
            const ladoAdversario = this.recuperaLadoAdversarioPeloId(ladoId);
            this.defineNovaAcaoSolicitada("responderPropostaReset", ladoAdversario.id, { ladoId: ladoAdversario.id, jogoId: this.id });
            this.salva();
            return ladoAdversario;
        } else {
            throw "Já tem um reset proposto pelo lado " + this.recuperaLadoPeloId(this.resetPropostoPeloLadoId).lado;
        }
    }

    respondeResetProposto(ladoId, resposta) {
        if (this.resetPropostoPeloLadoId != null) {
            const acaoRespondePropostaReset = this.acoesSolicitadas.find(acaoRespondeResetProposto => acaoRespondeResetProposto.acao == "responderPropostaReset" && acaoRespondeResetProposto.ladoId == ladoId);
            if (acaoRespondePropostaReset != undefined) {
                const ladoAdversario = this.recuperaLadoAdversarioPeloId(ladoId);
                if (!resposta) {
                    this.resetPropostoPeloLadoId = null;
                }

                // remove acao da lista de solicitadas
                const indexAcaoSolicitada = this.acoesSolicitadas.indexOf(acaoRespondePropostaReset);
                this.acoesSolicitadas.splice(indexAcaoSolicitada, 1);
                this.salva();
                return ladoAdversario;
            } else {
                throw "Não foi possível encontrar uma proposta de reset para responder";
            }
        } else {
            throw "Nenhum reset foi proposto"
        }
    }

    propoeEmpate(ladoId) {
        if (this.empatePropostoPeloLadoId == null) {
            if (this.ladoIdAtual != ladoId) {
                throw "Aguarde sua vez para propor um empate";
            }
            // 1 lance = 2 turnos entao 50 lances == 100 turnos
            if (this.tabuleiro.qtdTurnosSemCapturaOuMovimentoDePeao >= 100) {
                // Empate: Regra 50 movimentos
                this.defineFinalizado(2);
            }
            this.empatePropostoPeloLadoId = ladoId;
            const ladoAdversario = this.recuperaLadoAdversarioPeloId(ladoId);
            this.defineNovaAcaoSolicitada("responderPropostaEmpate", ladoAdversario.id, { ladoId: ladoAdversario.id, jogoId: this.id });
            this.salva();
            return ladoAdversario;
        } else {
            throw "Já tem um empate proposto pelo lado " + this.recuperaLadoPeloId(this.empatePropostoPeloLadoId).lado;
        }
    }

    respondeEmpateProposto(ladoId, resposta) {
        if (this.empatePropostoPeloLadoId != null) {
            const acaoRespondePropostaEmpate = this.acoesSolicitadas.find(acaoRespondeEmpateProposto => acaoRespondeEmpateProposto.acao == "responderPropostaEmpate" && acaoRespondeEmpateProposto.ladoId == ladoId);
            if (acaoRespondePropostaEmpate != undefined) {
                const ladoAdversario = this.recuperaLadoAdversarioPeloId(ladoId);
                if (resposta) {
                    // empate comum acordo
                    this.defineFinalizado(5);
                } else {
                    this.empatePropostoPeloLadoId = null;
                }

                // remove acao da lista de solicitadas
                const indexAcaoSolicitada = this.acoesSolicitadas.indexOf(acaoRespondePropostaEmpate);
                this.acoesSolicitadas.splice(indexAcaoSolicitada, 1);
                this.salva();
                return ladoAdversario;
            } else {
                throw "Não foi possível encontrar uma proposta de empate para responder";
            }
        } else {
            throw "Nenhum empate foi proposto"
        }
    }

    defineNovaAcaoSolicitada(acao, ladoId, data = null) {
        this.acoesSolicitadas.push(new AcaoSolicitada(acao, ladoId, data));
    }

    defineFinalizado(finalizacaoId) {
        // so define finlizado se o jogo n tiver sido finalizado ainda
        if (this.finalizado == null) {
            const finalizacao = db.tiposFinalizacao.find(finalizacao => finalizacao.id == finalizacaoId);
            if (finalizacao != undefined) {
                this.finalizado = finalizacao;
                this.salva();
                universalEmitter.emit("jogoFinalizado", { jogoId: this.id, jogoFinalizado: this.finalizado.tipo });
            }
        }
    }

    defineJogador(ladoId, tipo) {
        let lado = this.recuperaLadoPeloId(ladoId);

        // se tiver desistindo o tipo vai pra null no metodo removeTipo()
        if (tipo != null) {
            lado.defineTipo(tipo);

            // se tipo de jogo for Humano X I.A. & tipo for Humano
            if (this.tipoJogo.id == 1 && tipo.id == 0) {
                // inclui jogador I.A. no lado adversario
                this.defineJogador(this.recuperaLadoAdversarioPeloId(ladoId).id, db.ladoTipos[1]);
            }

            // se os 2 lados tiverem logados e n tiver nenhum turno gravado inicia o turno
            if (this.ladoBranco.tipo != null && this.ladoPreto.tipo != null && this.turnos.length == 0) {
                this.incluiNovoTurno();
            }
        } else {
            lado.removeTipo();
            // finalizacao por desistencia de jogador
            this.defineFinalizado(7);
        }

        this.salva();

        return lado;
    }

    verificaTempoRestanteLados() {
        this.recuperaTempoRestanteLado(this.ladoBranco.id);
        this.recuperaTempoRestanteLado(this.ladoPreto.id);
    }

    recuperaTempoRestanteLado(ladoId) {
        const turnosLado = this.turnos.filter(turno => turno.ladoId == ladoId);
        let totalMilisegundosGastos = 0;
        turnosLado.forEach((turno) => {
            const turnoTotalMilisegundos = turno.totalMilisegundos;
            if (turnoTotalMilisegundos == null) {
                const agora = new Date().getTime();
                const tempoGastoAteAgora = agora - turno.momentoInicio;
                totalMilisegundosGastos += tempoGastoAteAgora;
            } else {
                totalMilisegundosGastos += turnoTotalMilisegundos;
            }
        });
        let tempoRestante = this.tempoDeTurnoEmMilisegundos - totalMilisegundosGastos;
        if (tempoRestante <= 0 && this.ladoIdAtual == ladoId && this.tempoDeTurnoEmMilisegundos != -1) {
            // empata por Insuficiência material
            this.defineFinalizado(3);
        }
        this.recuperaLadoPeloId(ladoId).definetempoMilisegundosRestante(tempoRestante);
    }

    incluiNovoTurno() {
        this.verificaTempoRestanteLados();
        if (this.finalizado == null) {
            this.turnos.push(new Turno(this.ladoIdAtual));
        }
    }

    defineTipoJogo(tipoJogoId) {
        this.tipoJogo = TipoJogoService.encontra(tipoJogoId);
        // se tipo de jogo for I.A. X I.A.
        if (this.tipoJogo.id == 2) {
            // insere I.A.s
            this.defineJogador(0, db.ladoTipos[1]);
            this.defineJogador(1, db.ladoTipos[1]);
        }
    }

    recuperaLadosDeslogados() {
        let ladosSemJogador = [];
        if (this.ladoBranco.tipo == null) {
            ladosSemJogador.push(this.ladoBranco);
        }
        if (this.ladoPreto.tipo == null) {
            ladosSemJogador.push(this.ladoPreto);
        }
        return ladosSemJogador;
    }

    realizaJogada(ladoId, casaOrigem, casaDestino) {
        if (this.finalizado != null) {
            throw "Esse jogo está finalizado";
        }

        if (ladoId != this.ladoIdAtual) {
            throw "Não está na sua vez de jogar, espere sua vez";
        }

        if (this.recuperaLadoPeloId(ladoId).tipo == null) {
            throw "Para realizar essa jogada, faça o login adequadamente no lado desejado";
        }

        if (this.recuperaLadoAdversarioPeloId(ladoId).tipo == null) {
            throw "Aguarde outro jogador se logar adequadamente no lado adversário";
        }

        if (this.acoesSolicitadas.length > 0) {
            throw "Tem ações solicitadas a serem executadas";
        }

        const jogadaRealizada = this.move(casaOrigem, casaDestino, ladoId);

        const ladoAdversario = this.recuperaLadoAdversarioPeloId(ladoId);

        // so define o lado p adversario se n tiver q promover o peao
        if (this.casaPeaoPromocao == null) {
            // passa a vez p outro jogador
            this.defineLadoIdAtual(ladoAdversario.id);
        }

        this.tabuleiro.fotografaTabuleiro();
        this.verificaTabuleiro();

        this.salva();

        return { jogadaRealizada, ladoAdversario };
    }

    encontra(jogoId) {
        const jogo = db.jogos[jogoId];
        if (jogo == undefined) {
            throw "Jogo não encontrado";
        }

        this.prencheJogo(jogo);

        this.chequeLadoAtual = this.verificaReiLadoCheque(this.ladoIdAtual);

        this.verificaTempoRestanteLados();

        return this;
    }

    verificaAcoesSolicitadas() {
        if (this.acoesSolicitadas.length > 0) {
            let acoesSolicitadasConsolidado = [];

            this.acoesSolicitadas.forEach(acaoSolicitada => {
                const lado = this.recuperaLadoPeloId(acaoSolicitada.ladoId);
                acoesSolicitadasConsolidado.push(
                    {
                        acaoItem: acaoSolicitada,
                        lado
                    }
                );
            });

            universalEmitter.emit(
                "acoesSolicitadas",
                {
                    acoesSolicitadas: acoesSolicitadasConsolidado,
                    jogoId: this.id
                }
            );
        }
    }

    salva() {
        if (this.id == null) {
            const tamanhoAntesPush = db.jogos.length;
            const tamanhoDepoisPush = db.jogos.push(this);
            if (tamanhoAntesPush >= tamanhoDepoisPush) {
                throw "Falha ao incluir Jogo";
            }
            const ultimoIndice = db.jogos.lastIndexOf(this);
            this.id = ultimoIndice;
        }
        db.jogos[this.id] = this;

        this.verificaAcoesSolicitadas();
    }

    verificaTabuleiro() {
        const fotografiaRepetidaTresVezesOuMais = this.tabuleiro.fotografiasTabuleiro.find(estado => estado.qtdOcorrencias >= 3);
        if (fotografiaRepetidaTresVezesOuMais != undefined) {
            // Empate: Regra das 3 posições
            this.defineFinalizado(6);
        }
        this.verificaPecasMinimas();
    }

    cria() {
        // registra estado inicial do tabuleiro
        this.tabuleiro.fotografaTabuleiro();
        this.salva();
        return this;
    }

    filtraPossiveisJogadasCasaPraNaoPorReiEmCheque(ladoId, casa) {
        casa = this.recuperaCasaLinhaColuna(casa);
        const lado = this.recuperaLadoPeloId(ladoId);

        const pecaDoLado = this.recuperaCasaPecaDeUmLadoPelaCasaNome(ladoId, casa);

        const possiveisJogadas = lado.possiveisJogadas.filter(possivelJogada => possivelJogada.casaOrigem.casa == pecaDoLado.casa);

        return this.filtraPossiveisJogadasPraNaoPorReiEmCheque(possiveisJogadas, ladoId);
    }

    filtraPossiveisJogadasLadoPraNaoPorReiEmCheque(ladoId) {
        return this.filtraPossiveisJogadasPraNaoPorReiEmCheque(this.recuperaLadoPeloId(ladoId).possiveisJogadas, ladoId);
    }

    filtraPossiveisJogadasPraNaoPorReiEmCheque(possiveisJogadas, ladoId) {
        let possiveisJogadasValidas = [];
        possiveisJogadas.forEach(possivelJogada => {
            try {
                this.move(possivelJogada.casaOrigem, possivelJogada.casaDestino, ladoId, true);
                possiveisJogadasValidas.push(possivelJogada);
            } catch (e) {
                // se deu erro eh pq colocou rei em cheque
            }
            this.atualizaPecasDosLados();
        });
        return possiveisJogadasValidas;
    }

    promovePeao(ladoId, pecaEscolhidaId) {
        if (this.casaPeaoPromocao != null) {
            const acaoPromovePeao = this.acoesSolicitadas.find(acaoPromovePeao => acaoPromovePeao.acao == "promocaoPeao" && acaoPromovePeao.ladoId == ladoId);
            if (acaoPromovePeao != undefined) {
                const pecaEscolhida = TipoPecaService.listaPromocaoPeao().find(tipoPeca => tipoPeca.id == pecaEscolhidaId);
                if (pecaEscolhida != undefined) {
                    const pecaDaCasaDePromocao = this.recuperaPecaDaCasa(this.casaPeaoPromocao.casaPeao);

                    let pecaPromovida = {
                        ladoId,
                        jogadasRealizadas: [...pecaDaCasaDePromocao.jogadasRealizadas],
                        tipo: pecaEscolhida.nome
                    };

                    pecaPromovida = this.tabuleiro.atualizaCasa(this.casaPeaoPromocao.casaPeao.linha, this.casaPeaoPromocao.casaPeao.coluna, pecaPromovida);

                    const jogadaRealizada = this.casaPeaoPromocao.jogadaPromocao;

                    this.casaPeaoPromocao = null;

                    const ladoAdversario = this.recuperaLadoAdversarioPeloId(ladoId);

                    // passa a vez p outro jogador
                    this.defineLadoIdAtual(ladoAdversario.id);

                    // remove acao da lista de solicitadas
                    const indexAcaoSolicitada = this.acoesSolicitadas.indexOf(acaoPromovePeao);
                    this.acoesSolicitadas.splice(indexAcaoSolicitada, 1);

                    this.salva();

                    return { pecaPromovida, jogadaRealizada, ladoAdversario };
                } else {
                    throw "Peça inválida escolhida para a promoção do peão";
                }
            } else {
                throw "Promoção de peão inválida";
            }
        } else {
            throw "Não é possível promover nenhum peão no momento";
        }
    }

    move(casaDe, casaPara, ladoId, apenasTesteReiEmRiscoAposMovimento = false) {
        casaDe = this.recuperaCasaLinhaColuna(casaDe);
        casaPara = this.recuperaCasaLinhaColuna(casaPara);

        const casaPeca = this.recuperaCasaPecaDeUmLadoPelaCasaNome(ladoId, casaDe.casa);
        const jogadaEscolhida = this.verificaJogadaPossivel(casaPeca, casaPara, ladoId);

        const lado = this.recuperaLadoPeloId(ladoId);

        const peca = this.recuperaPecaDaCasa(casaDe);
        const casaDestino = this.recuperaPecaDaCasa(casaPara);

        let pecaCapturada = casaDestino;

        let movimentosEspeciaisExecutados = [];

        const identificadorMovimento = this.turnos.length;

        this.tabuleiro.guardaEstado();

        try {
            // realiza movimento
            this.tabuleiro.atualizaCasa(casaDe.linha, casaDe.coluna, null);
            this.tabuleiro.atualizaCasa(casaPara.linha, casaPara.coluna, peca);

            if (this.enPassantCasaCaptura != null) {
                if (casaPara == this.enPassantCasaCaptura.casaCaptura) {
                    const pecaCasaPeaoEnPassant = this.recuperaPecaDaCasa(this.enPassantCasaCaptura.casaPeao);
                    if (pecaCasaPeaoEnPassant != null) {
                        pecaCapturada = pecaCasaPeaoEnPassant;
                        this.tabuleiro.atualizaCasa(this.enPassantCasaCaptura.casaPeao.linha, this.enPassantCasaCaptura.casaPeao.coluna, null);
                    }
                }
            }

            // trata roques
            let casaTorreOrigem = null;
            let casaTorreDestino = null;
            if (jogadaEscolhida.nome == "Roque Menor") {
                casaTorreOrigem = "H1";
                casaTorreDestino = "F1";
                if (ladoId != 0) {
                    casaTorreOrigem = "H8";
                    casaTorreDestino = "F8";
                }
            } else if (jogadaEscolhida.nome == "Roque Maior") {
                casaTorreOrigem = "A1";
                casaTorreDestino = "D1";
                if (ladoId != 0) {
                    casaTorreOrigem = "A8";
                    casaTorreDestino = "D8";
                }
            }
            // se definiu casaTorreOrigem e casaTorreDestino executa o roque
            if (casaTorreOrigem != null && casaTorreDestino != null) {
                const torre = this.recuperaPecaDaCasa(casaTorreOrigem);
                if (torre != null && torre.tipo == "Torre" && torre.jogadasRealizadas.length == 0) {
                    const destinoTorre = this.recuperaCasaLinhaColuna(casaTorreDestino);
                    const origemTorre = this.recuperaCasaLinhaColuna(casaTorreOrigem);

                    this.tabuleiro.atualizaCasa(origemTorre.linha, origemTorre.coluna, null);
                    this.tabuleiro.atualizaCasa(destinoTorre.linha, destinoTorre.coluna, torre);

                    const movimentoEspecialExecutado = new MovimentoRealizado(identificadorMovimento, origemTorre, destinoTorre, null, jogadaEscolhida.nome, []);
                    movimentosEspeciaisExecutados.push(movimentoEspecialExecutado);
                    torre.incluiMovimentoRealizado(movimentoEspecialExecutado);
                }
            }

            let jogadaPadraoPeao = undefined;
            if (jogadaEscolhida.nome == "Primeiro Movimento Peão") {
                jogadaPadraoPeao = lado.possiveisJogadas.find(jogadaPeao => jogadaPeao.nome == null && jogadaPeao.casaOrigem == casaDe);
            }

            // verifica se a jogada colocou o rei em cheque
            const reiEmCheque = this.verificaReiLadoCheque(ladoId);

            if (reiEmCheque) {
                throw "A jogada não pode ser realizada pois coloca seu rei em cheque";
            }

            // caso seja apenas um teste volta tabuleiro para estado anterior e retorna
            if (apenasTesteReiEmRiscoAposMovimento) {
                this.tabuleiro.reverteEstadoAnterior();
                return;
            }

            // se passar da validacao do rei define enPassantCasaCaptura como null
            this.enPassantCasaCaptura = null;

            if (jogadaPadraoPeao != undefined) {
                this.enPassantCasaCaptura = {
                    casaCaptura: jogadaPadraoPeao.casaDestino,
                    casaPeao: casaPara
                };
            }

            const novoMovimento = new MovimentoRealizado(identificadorMovimento, casaDe, casaPara, pecaCapturada, jogadaEscolhida.nome, movimentosEspeciaisExecutados);

            this.recuperaPecaDaCasa(casaPara).incluiMovimentoRealizado(novoMovimento);

            lado.insereJogadaRealizada(novoMovimento);

            // trata promocao do peao
            if (jogadaEscolhida.nome == "Promoção do Peão") {
                this.casaPeaoPromocao = {
                    casaPeao: casaPara,
                    jogadaPromocao: novoMovimento
                };
                this.defineNovaAcaoSolicitada("promocaoPeao", ladoId, { ladoId: lado.id, jogoId: this.id });
            }

            // se a peca movimentada for peao ou tiver captura entao zera a contagem
            if (peca.tipo == "Peão" || pecaCapturada != null) {
                this.tabuleiro.qtdTurnosSemCapturaOuMovimentoDePeao = 0;
            } else {
                this.tabuleiro.qtdTurnosSemCapturaOuMovimentoDePeao++;
            }

            this.tabuleiro.limpaEstadoAnterior();

            return novoMovimento;
        } catch (e) {
            // desfaz alteracoes
            this.tabuleiro.reverteEstadoAnterior();
            throw e;
        }
    }

    prencheJogo(jogo) {
        for (var chave in jogo) {
            this[chave] = jogo[chave];
        }
    }

    verificaReiLadoCheque(ladoId, fazVerificacoesPecas = false) {
        this.atualizaPecasDosLados(fazVerificacoesPecas);

        const reiLadoAtual = this.recuperaLadoPeloId(ladoId).pecas.find(peca => peca.peca.tipo == "Rei");

        const capturavel = this.verificaCasaCapturavelPeloAdversario(reiLadoAtual.casa, reiLadoAtual.peca.ladoId);

        // se o rei nao tiver jogadas possiveis e for o lado da vez eh o empate de rei afogado
        if (ladoId == this.ladoIdAtual && fazVerificacoesPecas) {
            const possiveisJogadas = this.filtraPossiveisJogadasLadoPraNaoPorReiEmCheque(ladoId);
            if (possiveisJogadas.length == 0) {
                if (capturavel == false) {
                    // Empate: Rei afogado
                    this.defineFinalizado(4);
                } else if (capturavel == true) {
                    if (ladoId == 0) {
                        // Empate: Rei afogado
                        this.defineFinalizado(1);
                    } else if (ladoId == 1) {
                        // Vitória: Branco
                        this.defineFinalizado(0);
                    }

                }
            }
        }

        return capturavel;
    }

    verificaCasaCapturavelPeloAdversario(casa, ladoId) {
        casa = this.recuperaCasaLinhaColuna(casa);

        const ladoAdversario = this.recuperaLadoAdversarioPeloId(ladoId);

        let capturavel = undefined;

        if (ladoAdversario.pecas == undefined) {
            return capturavel;
        } else {
            capturavel = false;
            for (let casaPeca of ladoAdversario.pecas) {
                try {
                    this.verificaJogadaPossivel(casaPeca, casa, ladoAdversario.id);
                    capturavel = true;
                    break;
                } catch (e) {
                    // se deu excecao eh pq a casa informada nao eh capturavel pelo adversario
                }
            }

            return capturavel;
        }
    }

    verificaJogadaPossivel(casaPeca, casaDestino, ladoId) {
        casaDestino = this.recuperaCasaLinhaColuna(casaDestino);

        if (casaPeca["peca"] == undefined) {
            throw "Não foi possível encontrar uma peça na casa de origem do movimento";
        }

        if (casaPeca.peca.ladoId != ladoId) {
            throw "A peça escolhida para o movimento pertence ao adversário, escolha outra peça";
        }

        // verificacoes casa destino p ver se tem peca nela
        const casaPecaDestino = this.recuperaPecaDaCasa(casaDestino);

        // se tiver peca
        if (casaPecaDestino != null) {
            if (casaPecaDestino.ladoId == ladoId) {
                throw "Não é possível capturar uma peça que te pertence";
            }
        }

        const lado = this.recuperaLadoPeloId(ladoId);


        const movimentoDestinoEscolhido = lado.possiveisJogadas.find(possivelJogada => possivelJogada.casaOrigem.casa == casaPeca.casa && possivelJogada.casaDestino.casa == casaDestino.casa);

        if (movimentoDestinoEscolhido == undefined) {
            throw "A casa de destino da jogada escolhida não pode ser realizada pela peça escolhida";
        }

        return movimentoDestinoEscolhido;
    }

    encontraCasasVizinhas(casa, ladoId) {
        casa = this.recuperaCasaLinhaColuna(casa);

        let ladoAtual = this.recuperaLadoPeloId(ladoId);

        let casasVizinhas = [];

        try {
            casasVizinhas["frente"] = this.recuperaCasaLinhaColuna({ linha: casa.linha + (1 * (ladoAtual.cabecaPraBaixo ? -1 : 1)), coluna: casa.coluna });
        } catch (ex) {
            casasVizinhas["frente"] = null;
        }
        try {
            casasVizinhas["tras"] = this.recuperaCasaLinhaColuna({ linha: casa.linha + (1 * (ladoAtual.cabecaPraBaixo ? 1 : -1)), coluna: casa.coluna });
        } catch (ex) {
            casasVizinhas["tras"] = null;
        }
        try {
            casasVizinhas["esquerda"] = this.recuperaCasaLinhaColuna({ linha: casa.linha, coluna: casa.coluna + (1 * (ladoAtual.cabecaPraBaixo ? -1 : 1)) });
        } catch (ex) {
            casasVizinhas["esquerda"] = null;
        }
        try {
            casasVizinhas["direita"] = this.recuperaCasaLinhaColuna({ linha: casa.linha, coluna: casa.coluna + (1 * (ladoAtual.cabecaPraBaixo ? 1 : -1)) });
        } catch (ex) {
            casasVizinhas["direita"] = null;
        }
        try {
            casasVizinhas["frenteEsquerda"] = this.recuperaCasaLinhaColuna({ linha: casa.linha + (1 * (ladoAtual.cabecaPraBaixo ? -1 : 1)), coluna: casa.coluna + (1 * (ladoAtual.cabecaPraBaixo ? -1 : 1)) });
        } catch (ex) {
            casasVizinhas["frenteEsquerda"] = null;
        }
        try {
            casasVizinhas["frenteDireita"] = this.recuperaCasaLinhaColuna({ linha: casa.linha + (1 * (ladoAtual.cabecaPraBaixo ? -1 : 1)), coluna: casa.coluna + (1 * (ladoAtual.cabecaPraBaixo ? 1 : -1)) });
        } catch (ex) {
            casasVizinhas["frenteDireita"] = null;
        }
        try {
            casasVizinhas["trasEsquerda"] = this.recuperaCasaLinhaColuna({ linha: casa.linha + (1 * (ladoAtual.cabecaPraBaixo ? 1 : -1)), coluna: casa.coluna + (1 * (ladoAtual.cabecaPraBaixo ? -1 : 1)) });
        } catch (ex) {
            casasVizinhas["trasEsquerda"] = null;
        }
        try {
            casasVizinhas["trasDireita"] = this.recuperaCasaLinhaColuna({ linha: casa.linha + (1 * (ladoAtual.cabecaPraBaixo ? 1 : -1)), coluna: casa.coluna + (1 * (ladoAtual.cabecaPraBaixo ? 1 : -1)) });
        } catch (ex) {
            casasVizinhas["trasDireita"] = null;
        }

        return casasVizinhas;
    }

    atualizaPecasDosLados(verificacoes = false) {
        this.ladoBranco.definePecas(this.recuperaPecasDeUmLado(this.ladoBranco.id));
        this.ladoPreto.definePecas(this.recuperaPecasDeUmLado(this.ladoPreto.id));
        this.trataJogadasPossiveis();
        if (verificacoes) {
            this.verificaPecasMinimas();
        }
    }

    verificaPecasMinimas() {
        if (!this.temQtdMinumaPecas(this.ladoBranco.id) && !this.temQtdMinumaPecas(this.ladoPreto.id)) {
            // empata por Insuficiência material
            this.defineFinalizado(3);
        }
    }

    temQtdMinumaPecas(ladoId) {
        const lado = this.recuperaLadoPeloId(ladoId);
        const cavalos = lado.pecas.filter(pecaLado => pecaLado.peca.tipo == "Cavalo");
        const bispos = lado.pecas.filter(pecaLado => pecaLado.peca.tipo == "Bispo");
        const peoes = lado.pecas.filter(pecaLado => pecaLado.peca.tipo == "Peão");
        const torres = lado.pecas.filter(pecaLado => pecaLado.peca.tipo == "Torre");
        const rainha = lado.pecas.filter(pecaLado => pecaLado.peca.tipo == "Rainha");
        if (lado.pecas.length < 2) {
            return false;
        } else if (lado.pecas.length == 2) {
            if (rainha.length > 0 || torres.length > 0 || peoes.length > 0) {
                return true;
            } else {
                return false;
            }
        } else if (lado.pecas.length == 3) {
            if (bispos.length == 2 || (bispos.length > 0 && cavalos.length > 0)) {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    }

    trataJogadasPossiveis() {
        // preenche possiveis jogadas
        this.ladoBranco.definePossiveisJogadas(this.montaPossiveisJogadas(this.ladoBranco.id));
        this.ladoPreto.definePossiveisJogadas(this.montaPossiveisJogadas(this.ladoPreto.id));
    }

    filtraPossiveisMovimentos(pecas, apenasParaChecarAmeacas = false) {
        let possiveisJogadas = [];
        pecas.forEach((ladoPeca) => {
            let grupoMovimentosPossiveis = [];

            ladoPeca.movimentosPossiveis.forEach((movimentoPossivel) => {

                (grupoMovimentosPossiveis[movimentoPossivel.direcao] || (grupoMovimentosPossiveis[movimentoPossivel.direcao] = [])).push({
                    ladoPeca,
                    movimentoPossivel,
                    casa: movimentoPossivel.casas
                });

            });

            for (let direcaoMovimentosPossiveis in grupoMovimentosPossiveis) {
                direcaoMovimentosPossiveis = grupoMovimentosPossiveis[direcaoMovimentosPossiveis];

                direcaoMovimentosPossiveis.sort((a, b) => {
                    if (a.casa < b.casa) {
                        return -1;
                    }
                    if (a.casa > b.casa) {
                        return 1;
                    }
                    // a deve ser igual a b
                    return 0;
                });

                for (let movimentoPossivelDirecao of direcaoMovimentosPossiveis) {
                    const casaOrigem = this.recuperaCasaLinhaColuna(movimentoPossivelDirecao.ladoPeca.casa);
                    const casaDestino = this.recuperaCasaLinhaColuna(movimentoPossivelDirecao.movimentoPossivel.casaDestino);
                    const nomeJogada = movimentoPossivelDirecao.movimentoPossivel.nomeJogada;
                    const direcao = movimentoPossivelDirecao.movimentoPossivel.direcao;

                    let pecaCasaDestino = this.recuperaPecaDaCasa(casaDestino);


                    if (this.enPassantCasaCaptura != null && pecaCasaDestino == null) {
                        if (movimentoPossivelDirecao.ladoPeca.peca.tipo == "Peão" && this.enPassantCasaCaptura.casaCaptura == casaDestino) {
                            pecaCasaDestino = this.recuperaPecaDaCasa(this.enPassantCasaCaptura.casaPeao);
                        }
                    }

                    let pecasMesmoLado = false;
                    if (pecaCasaDestino != null) {
                        pecasMesmoLado = movimentoPossivelDirecao.ladoPeca.peca.ladoId == pecaCasaDestino.ladoId;
                    }

                    if (pecasMesmoLado && direcao != "especial") {
                        break;
                    }

                    if (!pecasMesmoLado && !movimentoPossivelDirecao.movimentoPossivel.captura && pecaCasaDestino != null) {
                        break;
                    }

                    const quebraRegraNaoCaptura = (pecaCasaDestino != null && !movimentoPossivelDirecao.movimentoPossivel.captura);
                    const quebraRegraNaoAnda = (pecaCasaDestino == null && !movimentoPossivelDirecao.movimentoPossivel.anda);

                    if (!quebraRegraNaoCaptura && (!quebraRegraNaoAnda || apenasParaChecarAmeacas) && !pecasMesmoLado) {
                        possiveisJogadas.push(
                            {
                                casaOrigem,
                                casaDestino,
                                nomeJogada,
                                podeCapturavel: movimentoPossivelDirecao.movimentoPossivel.podeCapturavel,
                                pecaCaptura: pecaCasaDestino,
                                captura: movimentoPossivelDirecao.movimentoPossivel.captura,
                                anda: movimentoPossivelDirecao.movimentoPossivel.anda,
                                peca: ladoPeca.peca.tipo,
                                pecaValor: ladoPeca.peca.valor
                            }
                        );
                        if (pecaCasaDestino != null && direcao != "especial") {
                            break;
                        }
                    }
                }
            }
        });
        return possiveisJogadas;
    }

    montaPossiveisJogadas(ladoId) {

        const pecas = this.recuperaLadoPeloId(ladoId).pecas;
        const pecasAdversario = this.recuperaLadoAdversarioPeloId(ladoId).pecas;

        let possiveisJogadas = [];

        const possiveisMovimentos = this.filtraPossiveisMovimentos(pecas);
        const possiveisMovimentosAdversario = this.filtraPossiveisMovimentos(pecasAdversario, true);

        possiveisMovimentos.forEach(possivelMovimento => {

            const capturantesAdversarios = possiveisMovimentosAdversario.filter(possivelMovimentoAdversario => possivelMovimentoAdversario.casaDestino == possivelMovimento.casaDestino && possivelMovimentoAdversario.captura == true);
            const capturavel = capturantesAdversarios.length > 0;

            // regras para o filtro
            const quebraRegraNaoCapturavel = (capturavel && !possivelMovimento.podeCapturavel);

            if (!quebraRegraNaoCapturavel) {
                possiveisJogadas.push(
                    new PossivelJogada(
                        possivelMovimento.casaOrigem,
                        possivelMovimento.casaDestino,
                        possivelMovimento.nomeJogada,
                        possivelMovimento.pecaCaptura,
                        capturantesAdversarios,
                        possivelMovimento.peca,
                        possivelMovimento.pecaValor
                    )
                );
            }

        });


        return possiveisJogadas;
    }

    defineLadoIdAtual(ladoId) {
        // define ladoIdAtual
        this.ladoIdAtual = ladoId;
        // verifica se ja tem algum turno iniciado
        if (this.turnos.length > 0) {
            const indexTurnoAtual = this.turnos.length - 1;

            const turnoAtual = this.turnos[indexTurnoAtual];

            // se o lado id do turno atual for diferente do lado id pedido
            if (turnoAtual.ladoId != ladoId) {
                // finaliza o turno atual
                turnoAtual.defineMomentoFim();
                // inicia novo turno
                this.incluiNovoTurno();
            }
        }

        // verifica se a jogada colocou o rei em cheque
        this.chequeLadoAtual = this.verificaReiLadoCheque(ladoId, true);
    }

    recuperaLadoPeloId(ladoId) {
        if (this.ladoBranco.id == ladoId) {
            return this.ladoBranco;
        } else if (this.ladoPreto.id == ladoId) {
            return this.ladoPreto;
        } else {
            throw "O lado desejado não existe";
        }
    }

    recuperaLadoAdversarioPeloId(ladoId) {
        if (this.ladoBranco.id == ladoId) {
            return this.ladoPreto;
        } else if (this.ladoPreto.id == ladoId) {
            return this.ladoBranco;
        } else {
            throw "O lado adversário desejado não existe";
        }
    }

    recuperaPecasDeUmLado(ladoId) {
        let pecas = [];
        this.tabuleiro.casas.forEach((linha, linhaIndice) => {
            linha.forEach((coluna, colunaIndice) => {
                // verifica se a casa esta vazia ou nao
                if (coluna != null) {
                    // se o id do lado da peca q esta na casa for igual ao id do lado informado insere na lista de pecas
                    if (coluna.ladoId == ladoId) {

                        let casa = this.recuperaCasaLinhaColuna({ "linha": linhaIndice, "coluna": colunaIndice });

                        let peca = {
                            "casa": casa.casa,
                            "linha": casa.linha,
                            "coluna": casa.coluna,
                            "peca": coluna,
                            "movimentosPossiveis": this.recuperaMovimentosPossiveisDaPecaDaCasa(casa)
                        };

                        pecas.push(peca);
                    }
                }
            });
        });

        return pecas;
    }

    recuperaPossiveisMovimentosEmCasasVizinhas(casaAtual, vizinhoDesejado, repeticoesHabilitadas, peca, opcoes = [], casasEncontradas = [], casas = 1) {
        // verifica se ainda tem repeticoesHabilitadas
        if (repeticoesHabilitadas == 0) {
            return casasEncontradas;
        }

        // recupera casas vizinhas
        const casasVizinhas = this.encontraCasasVizinhas(casaAtual, peca.ladoId);

        // recupera o vizinho desejado
        const vizinho = casasVizinhas[vizinhoDesejado];

        // se vizinho eh null casa nao existe
        if (vizinho == null || vizinho == undefined) {
            return casasEncontradas;
        }

        let nomeJogada = null;

        // se a peca for um peao verifica o enPassant e o primeiro movimento
        if (peca.tipo == "Peão") {
            if (this.enPassantCasaCaptura != null) {
                if (this.enPassantCasaCaptura.casaCaptura == vizinho) {
                    nomeJogada = "En Passant";
                }
            }

            if (opcoes.includes("primeiroMovimentoPeao") && casas == 2) {
                nomeJogada = "Primeiro Movimento Peão";
            }

            let ultimaLinha = 0;
            if (peca.ladoId != this.ladoBranco.id) {
                ultimaLinha = 7;
            }
            if (vizinho.linha == ultimaLinha) {
                nomeJogada = "Promoção do Peão";
            }
        }

        // se a peca for um rei verifica os roques
        if (peca.tipo == "Rei") {
            if ((opcoes.includes("brancoRoqueMenor") || opcoes.includes("pretoRoqueMenor")) && casas == 2) {
                if (peca.ladoId == 0 && vizinhoDesejado == 'direita') {
                    nomeJogada = "Roque Menor";
                }
                if (peca.ladoId == 1 && vizinhoDesejado == 'esquerda') {
                    nomeJogada = "Roque Menor";
                }
            }
            if ((opcoes.includes("brancoRoqueMaior") || opcoes.includes("pretoRoqueMaior")) && casas == 2) {
                if (peca.ladoId == 0 && vizinhoDesejado == 'esquerda') {
                    nomeJogada = "Roque Maior";
                }
                if (peca.ladoId == 1 && vizinhoDesejado == 'direita') {
                    nomeJogada = "Roque Maior";
                }
            }
        }

        casasEncontradas.push(new MovimentoPossivel(vizinho, nomeJogada, vizinhoDesejado, opcoes.includes("anda"), opcoes.includes("captura"), peca.tipo != "Rei", casas));
        return this.recuperaPossiveisMovimentosEmCasasVizinhas(vizinho, vizinhoDesejado, repeticoesHabilitadas - 1, peca, opcoes, casasEncontradas, casas + 1);
    }

    recuperaPecaDaCasa(casa) {
        casa = this.recuperaCasaLinhaColuna(casa);
        return this.tabuleiro.recuperaCasa(casa.linha, casa.coluna);
    }

    recuperaMovimentosPossiveisDaPecaDaCasa(casa) {
        casa = this.recuperaCasaLinhaColuna(casa);

        const peca = this.recuperaPecaDaCasa(casa);

        if (peca == null) {
            throw "Não foi possível encontrar a peça desejada";
        }

        let movimentosPossiveis = [];

        peca.movimentacao.forEach((movimento) => {
            let passosHabilitados = peca.passosHabilitados;

            if (movimento.opcoes.includes("primeiroMovimentoPeao")) {
                if (this.verificaPeaoPrimeiroMovimentoDuplo(casa)) {
                    passosHabilitados += 1;
                }
            }

            if (this.ladoBranco.id == peca.ladoId) {
                if (movimento.opcoes.includes("brancoRoqueMenor")) {
                    if (this.verificaRoqueExecutavel(casa, peca.ladoId, false)) {
                        passosHabilitados += 1;
                    }
                }
                if (movimento.opcoes.includes("brancoRoqueMaior")) {
                    if (this.verificaRoqueExecutavel(casa, peca.ladoId, true)) {
                        passosHabilitados += 1;
                    }
                }
            } else {
                if (movimento.opcoes.includes("pretoRoqueMaior")) {
                    if (this.verificaRoqueExecutavel(casa, peca.ladoId, true)) {
                        passosHabilitados += 1;
                    }
                }
                if (movimento.opcoes.includes("pretoRoqueMenor")) {
                    if (this.verificaRoqueExecutavel(casa, peca.ladoId, false)) {
                        passosHabilitados += 1;
                    }
                }
            }

            movimentosPossiveis = movimentosPossiveis.concat(this.recuperaPossiveisMovimentosEmCasasVizinhas(casa, movimento.direcao, passosHabilitados, peca, movimento.opcoes));
        });

        // recupera movimentos especiais da peca
        const movimentosEspeciais = peca.movimentosEspeciais(casa.linha, casa.coluna);

        movimentosEspeciais.forEach((movimentoDestino) => {
            let casaRecuperada = undefined;
            try {
                casaRecuperada = this.recuperaCasaLinhaColuna(movimentoDestino.casaDestino);
            } catch (ex) {
                casaRecuperada = null;
            }

            if (casaRecuperada != null && casaRecuperada != undefined) {
                movimentosPossiveis.push(new MovimentoPossivel(casaRecuperada, movimentoDestino.movimentoEspecialNome, "especial", movimentoDestino.anda, movimentoDestino.captura, peca.tipo != "Rei"));
            }
        });

        return movimentosPossiveis;
    }

    verificaPeaoPrimeiroMovimentoDuplo(peaoCasa) {
        peaoCasa = this.recuperaCasaLinhaColuna(peaoCasa);

        let habilitado = false;

        const peao = this.recuperaPecaDaCasa(peaoCasa);
        if (peao != null) {
            if (peao.tipo == "Peão" && peao.jogadasRealizadas.length == 0) {
                habilitado = true;
            }
        }

        return habilitado;
    }

    verificaRoqueExecutavel(reiCasa, ladoId, roqueMaior = false) {
        reiCasa = this.recuperaCasaLinhaColuna(reiCasa);

        let habilitado = false;

        const rei = this.recuperaPecaDaCasa(reiCasa);

        if (ladoId == this.ladoIdAtual && this.chequeLadoAtual) {
            return habilitado;
        }

        if (rei != null) {

            // trata roques
            let torreRoqueMenorCasa = "H1";
            let casaCaminhoRoqueMenorUm = "F1";
            let casaCaminhoRoqueMenorDois = "G1";

            let torreRoqueMaiorCasa = "A1";
            let casaCaminhoRoqueMaiorUm = "D1";
            let casaCaminhoRoqueMaiorDois = "C1";
            let casaCaminhoRoqueMaiorTres = "B1";

            if (ladoId != this.ladoBranco.id) {
                torreRoqueMenorCasa = "H8";
                casaCaminhoRoqueMenorUm = "F8";
                casaCaminhoRoqueMenorDois = "G8";

                torreRoqueMaiorCasa = "A8";
                casaCaminhoRoqueMaiorUm = "D8";
                casaCaminhoRoqueMaiorDois = "C8";
                casaCaminhoRoqueMaiorTres = "B8";
            }

            if (rei.tipo == "Rei" && rei.jogadasRealizadas.length == 0) {
                if (!roqueMaior) {
                    //Roque Menor
                    //Verifica se as casas no caminho estão vazias
                    if (this.recuperaPecaDaCasa(casaCaminhoRoqueMenorUm) == null && this.recuperaPecaDaCasa(casaCaminhoRoqueMenorDois) == null) {
                        //Verifica se a Torre está na sua casa de origem
                        const torre = this.recuperaPecaDaCasa(torreRoqueMenorCasa);
                        if (torre != null) {
                            if (torre.tipo == "Torre" && torre.jogadasRealizadas.length == 0) {
                                habilitado = true;
                            }
                        }
                    }
                } else {
                    //Roque Maior
                    //Verifica se as casas no caminho estão vazias
                    if (this.recuperaPecaDaCasa(casaCaminhoRoqueMaiorUm) == null && this.recuperaPecaDaCasa(casaCaminhoRoqueMaiorDois) == null && this.recuperaPecaDaCasa(casaCaminhoRoqueMaiorTres) == null) {
                        //Verifica se a Torre está na sua casa de origem
                        const torre = this.recuperaPecaDaCasa(torreRoqueMaiorCasa);
                        if (torre != null) {
                            if (torre.tipo == "Torre" && torre.jogadasRealizadas.length == 0) {
                                habilitado = true;
                            }
                        }
                    }
                }
            }
        }

        return habilitado;
    }

    recuperaCasaLinhaColuna(casa) {
        if (typeof casa == "string") {
            return this.recuperaLinhaColunaDeUmaCasa(casa);
        }

        return this.recuperaCasaDeUmaLinhaColuna(casa);
    }

    recuperaLinhaColunaDeUmaCasa(casa) {
        const casaEncontrada = db.tabelaEquivalencia.find(element => element.casa.trim().toUpperCase() == casa.trim().toUpperCase());
        if (casaEncontrada == undefined) {
            throw "Não foi possível encontrar a casa desejada buscando pelo nome da casa";
        }
        return casaEncontrada;
    }

    recuperaCasaDeUmaLinhaColuna(casa) {
        const casaEncontrada = db.tabelaEquivalencia.find(element => element.linha == casa.linha && element.coluna == casa.coluna);
        if (casaEncontrada == undefined) {
            throw "Não foi possível encontrar a casa desejada buscando pela linha e coluna";
        }
        return casaEncontrada;
    }

    recuperaCasaPecaDeUmLadoPelaCasaNome(ladoId, casa) {
        casa = this.recuperaCasaLinhaColuna(casa);
        const casaPeca = this.recuperaLadoPeloId(ladoId).pecas.find(casasPeca => casasPeca.casa == casa.casa);
        if (casaPeca == undefined) {
            throw "Não foi possível encontrar a peça na casa desejada";
        }
        return casaPeca;
    }
}