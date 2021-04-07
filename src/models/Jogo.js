const Lado = require("./Lado");
const Torre = require("./Torre");
const Peao = require("./Peao");
const Cavalo = require("./Cavalo");
const Bispo = require("./Bispo");
const Rei = require("./Rei");
const Rainha = require("./Rainha");

const db = require("../database.json");
const PossivelJogada = require("./PossivelJogada");
const MovimentoRealizado = require("./MovimentoRealizado");
const TipoJogoService = require("../services/TipoJogoService");
const AcaoSolicitada = require("./AcaoSolicitada");
const Turno = require("./Turno");

module.exports = class Jogo {
    constructor(tipoJogoId = 0, tempoDeTurnoEmMilisegundos = 300000) {
        this.id = null;

        this.ladoBranco = new Lado(db.lados[0]);
        this.ladoPreto = new Lado(db.lados[1]);
        this.tabuleiro = [
            [new Torre(this.ladoPreto.id), new Cavalo(this.ladoPreto.id), new Bispo(this.ladoPreto.id), new Rainha(this.ladoPreto.id), new Rei(this.ladoPreto.id), new Bispo(this.ladoPreto.id), new Cavalo(this.ladoPreto.id), new Torre(this.ladoPreto.id)],
            [new Peao(this.ladoPreto.id), new Peao(this.ladoPreto.id), new Peao(this.ladoPreto.id), new Peao(this.ladoPreto.id), new Peao(this.ladoPreto.id), new Peao(this.ladoPreto.id), new Peao(this.ladoPreto.id), new Peao(this.ladoPreto.id)],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [new Peao(this.ladoBranco.id), new Peao(this.ladoBranco.id), new Peao(this.ladoBranco.id), new Peao(this.ladoBranco.id), new Peao(this.ladoBranco.id), new Peao(this.ladoBranco.id), new Peao(this.ladoBranco.id), new Peao(this.ladoBranco.id)],
            [new Torre(this.ladoBranco.id), new Cavalo(this.ladoBranco.id), new Bispo(this.ladoBranco.id), new Rainha(this.ladoBranco.id), new Rei(this.ladoBranco.id), new Bispo(this.ladoBranco.id), new Cavalo(this.ladoBranco.id), new Torre(this.ladoBranco.id)],
        ];

        this.turnos = [];

        /**
        * O tempo de turno em milisegundos é usado pra verificar se o tempo de turno já foi
        * atingido, o valor padrão é referente a 5 minutos
        */
        this.tempoDeTurnoEmMilisegundos = tempoDeTurnoEmMilisegundos;

        this.defineLadoIdAtual(this.ladoBranco.id);

        /**
         * O REI do lado atual tem pessas q podem captura-lo mas ainda
         * possui modos de se defender obstruindo o ataque em questao
         * com outra peca ou se movendo
         */
        this.chequeLadoAtual = this.verificaReiLadoAtualCheque();

        /**
         * Objeto contendo a casa de captura do enPassant e a casa onde a peca se encontra
         * so eh valida por 1 jogada nessa jogada em questao o jogador adversario caso tenha
         * alguma peca q pode ir ate a casa armazenada nessa variavel ira realizar a captura
         * do PEÃO que executou o enPassant
         */
        this.enPassantCasaCaptura = null;

        this.finalizado = null;

        this.acoesPossiveis = ["promocaoPeao", "responderPropostaEmpate"];

        this.acoesSolicitadas = [];

        this.defineTipoJogo(tipoJogoId);
    }

    defineNovaAcaoSolicitada(acao, ladoId) {
        this.acoesSolicitadas.push(new AcaoSolicitada(acao, ladoId));
    }

    defineFinalizado(finalizacaoId) {
        const finalizacao = db.tiposFinalizacao.find(finalizacao => finalizacao.id == finalizacaoId);
        if (finalizacao != undefined) {
            this.finalizado = finalizacao;
            this.salva();
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

            // se os 2 lados tiverem logados inicia o turno
            if (this.ladoBranco.tipo != null && this.ladoPreto.tipo != null) {
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
        if (tempoRestante <= 0 && this.ladoIdAtual == ladoId) {
            // empata por Insuficiência material
            this.defineFinalizado(3);
        }
        this.recuperaLadoPeloId(ladoId).definetempoMilisegundosRestante(tempoRestante);
    }

    incluiNovoTurno() {
        this.verificaTempoRestanteLados();
        this.turnos.push(new Turno(this.ladoIdAtual));
    }

    defineTipoJogo(tipoJogoId) {
        this.tipoJogo = TipoJogoService.encontra(tipoJogoId);
        // se tipo de jogo for I.A. X I.A.
        if (this.tipoJogo.id == 2) {
            // insere I.A.'s
            this.defineJogador(0, db.ladoTipos[1]);
            this.defineJogador(1, db.ladoTipos[1]);
        }
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

        const jogadaEscolhida = this.move(casaOrigem, casaDestino, ladoId);

        // passa a vez p outro jogador
        this.defineLadoIdAtual(this.recuperaLadoAdversarioPeloId(this.ladoIdAtual).id);

        // verifica se a jogada colocou o rei do adversario em cheque
        this.chequeLadoAtual = this.verificaReiLadoAtualCheque();

        this.salva();

        return jogadaEscolhida;
    }

    encontra(jogoId) {
        const jogo = db.jogos[jogoId];
        if (jogo == undefined) {
            throw "Jogo não encontrado";
        }

        for (var chave in jogo) {
            this[chave] = jogo[chave];
        }

        this.chequeLadoAtual = this.verificaReiLadoAtualCheque();

        this.verificaTempoRestanteLados();

        return this;
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
        if (this.finalizado != null) {
            universalEmitter.emit("jogoFinalizado", { jogoId: this.id });
        }
    }

    cria() {
        this.salva();
        return this;
    }

    move(casaDe, casaPara, ladoId) {
        casaDe = this.recuperaCasaLinhaColuna(casaDe);
        casaPara = this.recuperaCasaLinhaColuna(casaPara);

        const casaPeca = this.recuperaCasaPecaDeUmLadoPelaCasaNome(ladoId, casaDe.casa);
        const jogadaEscolhida = this.verificaJogadaPossivel(casaPeca, casaPara, ladoId);

        const peca = this.recuperaPecaDaCasa(casaDe);
        const casaDestino = this.recuperaPecaDaCasa(casaPara);

        let pecaCapturada = casaDestino;

        const tabuleiroAntesAlteracoes = this.tabuleiro;

        let movimentosEspeciaisExecutados = [];

        const identificadorMovimento = this.turnos.length;

        try {
            // realiza movimento
            this.tabuleiro[casaDe.linha][casaDe.coluna] = null;
            this.tabuleiro[casaPara.linha][casaPara.coluna] = peca;

            if (this.enPassantCasaCaptura != null) {
                if (casaPara == this.enPassantCasaCaptura.casaCaptura) {
                    const pecaCasaPeaoEnPassant = this.recuperaPecaDaCasa(this.enPassantCasaCaptura.casaPeao);
                    if (pecaCasaPeaoEnPassant != null) {
                        pecaCapturada = pecaCasaPeaoEnPassant;
                        this.tabuleiro[this.enPassantCasaCaptura.casaPeao.linha][this.enPassantCasaCaptura.casaPeao.coluna] = null;
                    }
                }
            }

            // trata roques
            let casaTorreOrigem = null;
            let casaTorreDestino = null;
            if (jogadaEscolhida.nomeJogada == "Roque Menor") {
                casaTorreOrigem = "H1";
                casaTorreDestino = "F1";
                if (this.ladoIdAtual != 0) {
                    casaTorreOrigem = "H8";
                    casaTorreDestino = "F8";
                }
            } else if (jogadaEscolhida.nomeJogada == "Roque Maior") {
                casaTorreOrigem = "A1";
                casaTorreDestino = "D1";
                if (this.ladoIdAtual != 0) {
                    casaTorreOrigem = "A8";
                    casaTorreDestino = "D8";
                }
            }
            // se definiu casaTorreOrigem e casaTorreDestino executa o roque
            if (casaTorreOrigem != null && casaTorreDestino != null) {
                const torre = this.recuperaPecaDaCasa(casaTorreOrigem);
                if (torre != null && torre.tipo == "Torre" && torre.movimentosRealizados.length == 0) {
                    const destinoTorre = this.recuperaCasaLinhaColuna(casaTorreDestino);
                    const origemTorre = this.recuperaCasaLinhaColuna(casaTorreOrigem);

                    this.tabuleiro[origemTorre.linha][origemTorre.coluna] = null;
                    this.tabuleiro[destinoTorre.linha][destinoTorre.coluna] = torre;

                    const movimentoEspecialExecutado = new MovimentoRealizado(identificadorMovimento, origemTorre, destinoTorre, null, jogadaEscolhida.nomeJogada, []);
                    movimentosEspeciaisExecutados.push(movimentoEspecialExecutado);
                    torre.incluiMovimentoRealizado(movimentoEspecialExecutado);
                }
            }

            // verifica se a jogada colocou o rei em cheque
            const reiEmCheque = this.verificaReiLadoAtualCheque();

            if (reiEmCheque) {
                throw "A jogada não pode ser realizada pois coloca seu rei em cheque";
            }

            // se passar da validacao do rei define enPassantCasaCaptura como null
            this.enPassantCasaCaptura = null;

            if (jogadaEscolhida.nomeJogada == "Primeiro Movimento Peão") {
                const jogadaPadraoPeao = casaPeca.possiveisJogadas.find(jogadaPeao => jogadaPeao.nomeJogada == null);
                this.enPassantCasaCaptura = {
                    casaCaptura: jogadaPadraoPeao.casa,
                    casaPeao: casaPara
                };
            }

            const novoMovimento = new MovimentoRealizado(identificadorMovimento, casaDe, casaPara, pecaCapturada, jogadaEscolhida.nomeJogada, movimentosEspeciaisExecutados);


            this.recuperaPecaDaCasa(casaPara).incluiMovimentoRealizado(novoMovimento);

            this.recuperaLadoPeloId(this.ladoIdAtual).fazNovoMovimento(novoMovimento);

            return novoMovimento;
        } catch (e) {
            // desfaz alteracoes
            this.tabuleiro = tabuleiroAntesAlteracoes;
            throw e;
        }
    }

    insereCapturavelNasPossiveisJogadasDasPecasDosLados() {
        this.ladoBranco.pecas.forEach((item) => {
            item.possiveisJogadas.forEach((possivelJogada) => {
                possivelJogada.setCapturavel(this.verificaCasaCapturavelPeloAdversario(item.casa, item.peca.ladoId));
            });
        });
        this.ladoPreto.pecas.forEach((item) => {
            item.possiveisJogadas.forEach((possivelJogada) => {
                possivelJogada.setCapturavel(this.verificaCasaCapturavelPeloAdversario(item.casa, item.peca.ladoId));
            });
        });
    }

    verificaReiLadoAtualCheque() {
        this.atualizaPecasDosLados();

        const reiLadoAtual = this.recuperaLadoPeloId(this.ladoIdAtual).pecas.find(peca => peca.peca.tipo == "Rei");

        return this.verificaCasaCapturavelPeloAdversario(reiLadoAtual.casa, reiLadoAtual.peca.ladoId);
        // se o rei do lado atual estiver em cheque e n tiver nenhum movimento p impedir o cheque e o rei n tiver como fugir o lado adversario ganha
    }

    verificaCasaCapturavelPeloAdversario(casa, ladoId) {
        casa = this.recuperaCasaLinhaColuna(casa);

        const ladoAdversario = this.recuperaLadoAdversarioPeloId(ladoId);

        if (ladoAdversario.pecas == undefined) {
            return undefined;
        } else {
            ladoAdversario.pecas.forEach((casaPeca) => {
                // valida enPassants
                if (casaPeca.peca.tipo == "Peão" && this.enPassantCasaCaptura != null) {
                    if (casa == this.enPassantCasaCaptura.casaPeao) {
                        try {
                            this.verificaJogadaPossivel(casaPeca, this.enPassantCasaCaptura.casaCaptura, ladoAdversario.id);
                            return true;
                        } catch (e) {
                            // se deu excecao eh pq a casa informada nao eh capturavel pelo adversario
                        }
                    }
                }
                try {
                    this.verificaJogadaPossivel(casaPeca, casa, ladoAdversario.id);
                    return true;
                } catch (e) {
                    // se deu excecao eh pq a casa informada nao eh capturavel pelo adversario
                }
            });

            return false;
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

        let casaDestinoEhUmDestino = false;
        let movimentoDestinoEscolhido = null;

        casaPeca.possiveisJogadas.forEach((movimentoDestino) => {
            if (movimentoDestino.casa.casa == casaDestino.casa) {
                casaDestinoEhUmDestino = true;
                movimentoDestinoEscolhido = movimentoDestino;
            }
        });

        if (casaDestinoEhUmDestino == false) {
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

    atualizaPecasDosLados() {
        this.ladoBranco.definePecas(this.recuperaPecasDeUmLado(this.ladoBranco.id));
        this.ladoPreto.definePecas(this.recuperaPecasDeUmLado(this.ladoPreto.id));
        this.insereCapturavelNasPossiveisJogadasDasPecasDosLados();
        this.tiraMovimentosPossiveisCapturaveisDosReis();
    }

    tiraMovimentosPossiveisCapturaveisDosReis() {
        // tira jogadas nas quais o rei branco pode ser capturado
        let possiveisJogadasReiBranco = [];
        this.ladoBranco.pecas.find(peca => peca.peca.tipo == "Rei").possiveisJogadas.forEach((possivelJogada) => {
            if (possivelJogada.capturavel == false) {
                possiveisJogadasReiBranco.push(possivelJogada);
            }
        });
        this.ladoBranco.pecas.find(peca => peca.peca.tipo == "Rei").possiveisJogadas = possiveisJogadasReiBranco;

        // tira jogadas nas quais o rei preto pode ser capturado
        let possiveisJogadasReiPreto = [];
        this.ladoPreto.pecas.find(peca => peca.peca.tipo == "Rei").possiveisJogadas.forEach((possivelJogada) => {
            if (possivelJogada.capturavel == false) {
                possiveisJogadasReiPreto.push(possivelJogada);
            }
        });
        this.ladoPreto.pecas.find(peca => peca.peca.tipo == "Rei").possiveisJogadas = possiveisJogadasReiPreto;
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
        this.tabuleiro.forEach((linha, linhaIndice) => {
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
                            "possiveisJogadas": this.recuperaMovimentosPossiveisDaPecaDaCasa(casa)
                        };

                        pecas.push(peca);
                    }
                }
            });
        });

        return pecas;
    }

    recuperaPossiveisJogadasEmCasasVizinhas(casaAtual, vizinhoDesejado, repeticoesHabilitadas, peca, opcoes = [], casasEncontradas = []) {
        // verifica se ainda tem repeticoesHabilitadas
        if (repeticoesHabilitadas == 0) {
            return casasEncontradas;
        }

        // recupera casas vizinhas
        const casasVizinhas = this.encontraCasasVizinhas(casaAtual, peca.ladoId);

        // recupera o vizinho desejado
        const vizinho = casasVizinhas[vizinhoDesejado];

        // se vizinho eh null casa nao existe
        if (vizinho == null) {
            return casasEncontradas;
        }

        // recupera o item q ta na casa vizinha
        let itemCasa = this.recuperaPecaDaCasa(vizinho);

        let nomeJogada = null;
        let enPassant = false;

        // se a peca for um peao verifica o enPassant
        if (peca.tipo == "Peão") {
            if (this.enPassantCasaCaptura != null) {
                if (this.enPassantCasaCaptura.casaCaptura == vizinho) {
                    itemCasa = this.recuperaPecaDaCasa(this.enPassantCasaCaptura.casaPeao);
                    enPassant = true;
                }
            }
        }

        // se item casa ta vazio, adiciona na lista casasEncontradas e encontra proximo 
        if (itemCasa == null) {
            if (!opcoes.includes("somenteCaptura")) {
                casasEncontradas.push(new PossivelJogada(vizinho, false, nomeJogada, undefined, vizinhoDesejado));
            }
            return this.recuperaPossiveisJogadasEmCasasVizinhas(vizinho, vizinhoDesejado, repeticoesHabilitadas - 1, peca, opcoes, casasEncontradas);
        } else {
            // so adiciona possivel jogada se a peca for do adversario
            if (itemCasa.ladoId != peca.ladoId && !opcoes.includes("somenteAnda")) {
                if (enPassant) {
                    nomeJogada = "En Passant";
                }
                casasEncontradas.push(new PossivelJogada(vizinho, true, nomeJogada, undefined, vizinhoDesejado));
            }
            return casasEncontradas;
        }

    }

    recuperaPecaDaCasa(casa) {
        casa = this.recuperaCasaLinhaColuna(casa);
        return this.tabuleiro[casa.linha][casa.coluna];
    }

    recuperaMovimentosPossiveisDaPecaDaCasa(casa) {
        casa = this.recuperaCasaLinhaColuna(casa);

        const peca = this.recuperaPecaDaCasa(casa);

        if (peca == null) {
            throw "Não foi possível encontrar a peça desejada";
        }

        let movimentosPossiveis = [];

        peca.movimentacao.forEach((movimento) => {
            movimentosPossiveis = movimentosPossiveis.concat(this.recuperaPossiveisJogadasEmCasasVizinhas(casa, movimento.direcao, peca.passosHabilitados, peca, movimento.opcoes));
        });

        // se o peao n tiver movimento possivel eh pq tem algo obstruindo logo ele n pode ter o primeiro movimento c 2 casas pra frente
        if (!(peca.tipo == "Peão" && movimentosPossiveis.length == 0)) {
            // recupera movimentos especiais da peca
            const movimentosEspeciais = peca.movimentosEspeciais(casa.linha, casa.coluna);

            // faz veirificacoes p cada movimento especial
            movimentosEspeciais.forEach((movimentoDestino) => {
                let casaRecuperada = undefined;
                try {
                    casaRecuperada = this.recuperaCasaLinhaColuna(movimentoDestino.casa);
                } catch (ex) {
                    casaRecuperada = null;
                }

                if (casaRecuperada != null) {
                    const itemCasa = this.recuperaPecaDaCasa(casaRecuperada);

                    // casa vazia
                    if (itemCasa == null) {
                        // se o movimento n for apenas de captura, inclui possivel jogada
                        if (!movimentoDestino.somenteCaptura) {
                            movimentosPossiveis.push(new PossivelJogada(casaRecuperada, false, movimentoDestino.movimentoEspecialNome));
                        }
                    } else {
                        // so adiciona possivel jogada se a peca for do adversario
                        if (itemCasa.ladoId != peca.ladoId && !movimentoDestino.somenteAnda) {
                            movimentosPossiveis.push(new PossivelJogada(casaRecuperada, true, movimentoDestino.movimentoEspecialNome));
                        }
                    }
                }
            });
        }

        if (peca.tipo == "Rei" && peca.movimentosRealizados.length == 0 && this.verificaCasaCapturavelPeloAdversario(casa, peca.ladoId) == false) {
            // trata roques
            let torreRoqueMenorCasa = "H1";
            let casaCaminhoRoqueMenorUm = "F1";
            let casaCaminhoRoqueMenorDois = "G1";

            let torreRoqueMaiorCasa = "A1";
            let casaCaminhoRoqueMaiorUm = "D1";
            let casaCaminhoRoqueMaiorDois = "C1";
            let casaCaminhoRoqueMaiorTres = "B1";
            if (peca.ladoId != this.ladoBranco.id) {
                torreRoqueMenorCasa = "H8";
                casaCaminhoRoqueMenorUm = "F8";
                casaCaminhoRoqueMenorDois = "G8";

                torreRoqueMaiorCasa = "A8";
                casaCaminhoRoqueMaiorUm = "D8";
                casaCaminhoRoqueMaiorDois = "C8";
                casaCaminhoRoqueMaiorTres = "B8";
            }

            //Roque Menor
            //Verifica se as casas no caminho estão vazias
            if (this.recuperaPecaDaCasa(casaCaminhoRoqueMenorUm) == null && this.recuperaPecaDaCasa(casaCaminhoRoqueMenorDois) == null) {
                //Verifica se a Torre está na sua casa de origem
                const torre = this.recuperaPecaDaCasa(torreRoqueMenorCasa);
                if (torre != null) {
                    const casaRei = this.recuperaCasaLinhaColuna(casaCaminhoRoqueMenorDois);
                    const capturavel = this.verificaCasaCapturavelPeloAdversario(casaRei, peca.ladoId);
                    if (torre.tipo == "Torre" && torre.movimentosRealizados.length == 0 && capturavel == false) {
                        movimentosPossiveis.push(new PossivelJogada(casaRei, false, "Roque Menor", capturavel));
                    }
                }
            }
            //Roque Maior
            //Verifica se as casas no caminho estão vazias
            if (this.recuperaPecaDaCasa(casaCaminhoRoqueMaiorUm) == null && this.recuperaPecaDaCasa(casaCaminhoRoqueMaiorDois) == null && this.recuperaPecaDaCasa(casaCaminhoRoqueMaiorTres) == null) {
                //Verifica se a Torre está na sua casa de origem
                const torre = this.recuperaPecaDaCasa(torreRoqueMaiorCasa);
                if (torre != null) {
                    const casaRei = this.recuperaCasaLinhaColuna(casaCaminhoRoqueMaiorDois);
                    const capturavel = this.verificaCasaCapturavelPeloAdversario(casaRei, peca.ladoId);
                    if (torre.tipo == "Torre" && torre.movimentosRealizados.length == 0 && capturavel == false) {
                        movimentosPossiveis.push(new PossivelJogada(casaRei, false, "Roque Maior", capturavel));
                    }
                }
            }
        }

        return movimentosPossiveis;
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

    recuperaCasaPecaDeUmLadoPelaCasaNome(ladoId, casaNome) {
        const casaPeca = this.recuperaLadoPeloId(ladoId).pecas.find(casasPeca => casasPeca.casa.trim().toUpperCase() == casaNome.trim().toUpperCase());
        if (casaPeca == undefined) {
            throw "Não foi possível encontrar a peça na casa desejada";
        }
        return casaPeca;
    }
}