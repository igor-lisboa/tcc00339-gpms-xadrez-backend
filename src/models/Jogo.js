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
        this.cheque = this.verificaReiLadoAtualCheque();

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

    defineFinalizado(finalizacaoId) {
        const finalizacao = db.tiposFinalizacao.find(finalizacao => finalizacao.id == finalizacaoId);
        if (finalizacao != undefined) {
            this.finalizado = finalizacao;
            this.salva();
        }
    }

    defineJogador(ladoId, tipo) {
        let lado = this.recuperaLadoPeloId(ladoId);
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
        const reiEmCheque = this.verificaReiLadoAtualCheque();

        this.cheque = reiEmCheque;

        this.salva();

        return jogadaEscolhida;
    }

    encontra(jogoId) {
        const jogo = db.jogos[jogoId];
        if (jogo == undefined) {
            throw "Jogo não encontrado";
        }

        this.id = jogo.id;
        this.ladoBranco = jogo.ladoBranco;
        this.ladoPreto = jogo.ladoPreto;
        this.tabuleiro = jogo.tabuleiro;
        this.finalizado = jogo.finalizado;
        this.enPassantCasaCaptura = jogo.enPassantCasaCaptura;
        this.ladoIdAtual = jogo.ladoIdAtual;
        this.tipoJogo = jogo.tipoJogo;
        this.tempoDeTurnoEmMilisegundos = jogo.tempoDeTurnoEmMilisegundos;
        this.turnos = jogo.turnos;
        this.acoesSolicitadas = jogo.acoesSolicitadas;

        this.cheque = this.verificaReiLadoAtualCheque();

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

        const jogadaEscolhida = this.verificaJogadaPossivel(this.recuperaCasaPecaDeUmLadoPelaCasaNome(ladoId, casaDe.casa), casaPara, ladoId);

        const peca = this.recuperaPecaDaCasa(casaDe);
        const casaDestino = this.recuperaPecaDaCasa(casaPara);

        try {
            // realiza movimento
            this.tabuleiro[casaDe.linha][casaDe.coluna] = null;
            this.tabuleiro[casaPara.linha][casaPara.coluna] = peca;

            // verifica se a jogada colocou o rei em cheque
            const reiEmCheque = this.verificaReiLadoAtualCheque();

            if (reiEmCheque) {
                throw "A jogada não pode ser realizada pois coloca seu rei em cheque";
            }

            const novoMovimento = new MovimentoRealizado(casaDe, casaPara, casaDestino, jogadaEscolhida.nomeJogada);

            this.recuperaPecaDaCasa(casaPara).incluiMovimentoRealizado(novoMovimento);

            this.recuperaLadoPeloId(this.ladoIdAtual).fazNovoMovimento(novoMovimento);

            return novoMovimento;
        } catch (e) {
            // desfaz movimento
            this.tabuleiro[casaDe.linha][casaDe.coluna] = peca;
            this.tabuleiro[casaPara.linha][casaPara.coluna] = casaDestino;

            throw e;
        }
    }

    insereCapturavelNasPossiveisJogadasDasPecasDosLados() {
        this.ladoBranco.pecas.todas.forEach((item) => {
            item.possiveisJogadas.forEach((possivelJogada) => {
                possivelJogada.setCapturavel(this.verificaCasaCapturavelPeloAdversario(item.casa, item.peca.ladoId));
            });
        });
        this.ladoPreto.pecas.todas.forEach((item) => {
            item.possiveisJogadas.forEach((possivelJogada) => {
                possivelJogada.setCapturavel(this.verificaCasaCapturavelPeloAdversario(item.casa, item.peca.ladoId));
            });
        });
    }

    verificaReiLadoAtualCheque() {
        this.atualizaPecasDosLados();

        const ladoAtual = this.recuperaLadoPeloId(this.ladoIdAtual);
        const reiLadoAtual = ladoAtual.pecas.rei;

        return this.verificaCasaCapturavelPeloAdversario(reiLadoAtual.casa, ladoAtual.id);
        // se o rei do lado atual estiver em cheque e n tiver nenhum movimento p impedir o cheque e o rei n tiver como fugir o lado adversario ganha
    }

    verificaCasaCapturavelPeloAdversario(casa, ladoId) {
        casa = this.recuperaCasaLinhaColuna(casa);

        const ladoAdversario = this.recuperaLadoAdversarioPeloId(ladoId);

        if (ladoAdversario.pecas == undefined) {
            return undefined;
        } else {
            ladoAdversario.pecas.todas.forEach((casaPeca) => {
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
        this.ladoBranco.pecas.rei.possiveisJogadas.forEach((possivelJogada) => {
            if (possivelJogada.capturavel == false) {
                possiveisJogadasReiBranco.push(possivelJogada);
            }
        });
        this.ladoBranco.pecas.rei.possiveisJogadas = possiveisJogadasReiBranco;

        // tira jogadas nas quais o rei preto pode ser capturado
        let possiveisJogadasReiPreto = [];
        this.ladoPreto.pecas.rei.possiveisJogadas.forEach((possivelJogada) => {
            if (possivelJogada.capturavel == false) {
                possiveisJogadasReiPreto.push(possivelJogada);
            }
        });
        this.ladoPreto.pecas.rei.possiveisJogadas = possiveisJogadasReiPreto;
    }

    defineLadoIdAtual(ladoId) {
        // verifica se ja tem algum turno iniciado
        if (this.turnos.length > 0) {
            const indexTurnoAtual = this.turnos.length - 1;
            // finaliza o turno atual
            this.turnos[indexTurnoAtual].defineMomentoFim();
            // inicia novo turno
            this.incluiNovoTurno();
        }
        // define ladoIdAtual
        this.ladoIdAtual = ladoId;
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
        let rei = {};
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

                        // se for o rei define na variavel
                        if (coluna.tipo == "Rei") {
                            rei = peca;
                        }
                    }
                }
            });
        });

        return {
            "rei": rei,
            "todas": pecas
        };
    }

    recuperaPossiveisJogadasEmCasasVizinhas(casaAtual, vizinhoDesejado, repeticoesHabilitadas, capturaHabilitada, pecaLadoId, casasEncontradas = []) {
        // verifica se ainda tem repeticoesHabilitadas
        if (repeticoesHabilitadas == 0) {
            return casasEncontradas;
        }

        // recupera casas vizinhas
        const casasVizinhas = this.encontraCasasVizinhas(casaAtual, pecaLadoId);

        // recupera o vizinho desejado
        const vizinho = casasVizinhas[vizinhoDesejado];

        // se vizinho eh null casa nao existe
        if (vizinho == null) {
            return casasEncontradas;
        }

        // recupera o item q ta na casa vizinha
        const itemCasa = this.recuperaPecaDaCasa(vizinho);

        // se item casa ta vazio, adiciona na lista casasEncontradas e encontra proximo 
        if (itemCasa == null) {
            casasEncontradas.push(new PossivelJogada(vizinho, false));
            return this.recuperaPossiveisJogadasEmCasasVizinhas(vizinho, vizinhoDesejado, repeticoesHabilitadas - 1, capturaHabilitada, pecaLadoId, casasEncontradas);
        } else {
            // so adiciona possivel jogada se a peca for do adversario
            if (itemCasa.ladoId != pecaLadoId && capturaHabilitada) {
                casasEncontradas.push(new PossivelJogada(vizinho, true));
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

        if (peca.permitirJogadaDiagonal) {
            movimentosPossiveis = movimentosPossiveis.concat(this.recuperaPossiveisJogadasEmCasasVizinhas(casa, "frenteEsquerda", peca.passosHabilitados, peca.permitirJogadaCaptura, peca.ladoId));
            movimentosPossiveis = movimentosPossiveis.concat(this.recuperaPossiveisJogadasEmCasasVizinhas(casa, "frenteDireita", peca.passosHabilitados, peca.permitirJogadaCaptura, peca.ladoId));
            movimentosPossiveis = movimentosPossiveis.concat(this.recuperaPossiveisJogadasEmCasasVizinhas(casa, "trasEsquerda", peca.passosHabilitados, peca.permitirJogadaCaptura, peca.ladoId));
            movimentosPossiveis = movimentosPossiveis.concat(this.recuperaPossiveisJogadasEmCasasVizinhas(casa, "trasDireita", peca.passosHabilitados, peca.permitirJogadaCaptura, peca.ladoId));
        }

        if (peca.permitirJogadaFrente) {
            movimentosPossiveis = movimentosPossiveis.concat(this.recuperaPossiveisJogadasEmCasasVizinhas(casa, "frente", peca.passosHabilitados, peca.permitirJogadaCaptura, peca.ladoId));
        }

        if (peca.permitirJogadaHorizontal) {
            movimentosPossiveis = movimentosPossiveis.concat(this.recuperaPossiveisJogadasEmCasasVizinhas(casa, "esquerda", peca.passosHabilitados, peca.permitirJogadaCaptura, peca.ladoId));
            movimentosPossiveis = movimentosPossiveis.concat(this.recuperaPossiveisJogadasEmCasasVizinhas(casa, "direita", peca.passosHabilitados, peca.permitirJogadaCaptura, peca.ladoId));
        }

        if (peca.permitirJogadaParaTras) {
            movimentosPossiveis = movimentosPossiveis.concat(this.recuperaPossiveisJogadasEmCasasVizinhas(casa, "tras", peca.passosHabilitados, peca.permitirJogadaCaptura, peca.ladoId));
        }

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

            if (casaRecuperada == null) {
                return;
            }

            const itemCasa = this.recuperaPecaDaCasa(casaRecuperada);

            // casa vazia
            if (itemCasa == null) {
                // se o movimento n for apenas de captura, inclui possivel jogada
                if (!movimentoDestino.somenteCaptura) {
                    movimentosPossiveis.push(new PossivelJogada(casaRecuperada, false, movimentoDestino.movimentoEspecialNome));
                }
            } else {
                // so adiciona possivel jogada se a peca for do adversario
                if (itemCasa.ladoId != peca.ladoId) {
                    movimentosPossiveis.push(new PossivelJogada(casaRecuperada, true, movimentoDestino.movimentoEspecialNome));
                }
            }
        });

        //Aqui vai entrar uma função para incluir se o Rei pode realizar os Roques
        return this.recuperaMovimentosPossiveisValidos(movimentosPossiveis, peca, casa);
    }

    recuperaMovimentosPossiveisValidos(movimentosPossiveis, peca, pecaCasa) {
        if (peca.tipo != "Rei") {
            return movimentosPossiveis;
        }
        if (peca.movimentosRealizados.length == 0 && this.verificaCasaCapturavelPeloAdversario(pecaCasa, peca.ladoId) == false) {
            if (this.ladoIdAtual == this.ladoBranco.id) {
                //Roque Menor (Brancas)
                //Verifica se as casas no caminho estão vazias
                if (this.recuperaPecaDaCasa("F1") == null && this.recuperaPecaDaCasa("G1") == null) {
                    //Verifica se a Torre está na sua casa de origem
                    const torre = this.recuperaPecaDaCasa("H1");
                    if (torre != null) {
                        const g1 = this.recuperaCasaLinhaColuna("G1");
                        const capturavel = this.verificaCasaCapturavelPeloAdversario(g1, peca.ladoId);
                        if (torre.tipo == "Torre" && torre.movimentosRealizados.length == 0 && capturavel == false) {
                            movimentosPossiveis.push(new PossivelJogada(g1, false, "Roque Menor", capturavel));
                        }
                    }
                }
                //Roque Maior (brancas)
                //Verifica se as casas no caminho estão vazias
                if (this.recuperaPecaDaCasa("D1") == null && this.recuperaPecaDaCasa("C1") == null) {
                    //Verifica se a Torre está na sua casa de origem
                    const torre = this.recuperaPecaDaCasa("A1");
                    if (torre != null) {
                        const c1 = this.recuperaCasaLinhaColuna("C1");
                        const capturavel = this.verificaCasaCapturavelPeloAdversario(c1, peca.ladoId);
                        if (torre.tipo == "Torre" && torre.movimentosRealizados.length == 0 && capturavel == false) {
                            movimentosPossiveis.push(new PossivelJogada(c1, false, "Roque Maior", capturavel));
                        }
                    }
                }
            } else {
                //Roque Menor (Pretas)
                //Verifica se as casas no caminho estão vazias
                if (this.recuperaPecaDaCasa("F8") == null && this.recuperaPecaDaCasa("G8") == null) {
                    //Verifica se a Torre está na sua casa de origem
                    const torre = this.recuperaPecaDaCasa("H8");
                    if (torre != null) {
                        const g8 = this.recuperaCasaLinhaColuna("G8");
                        const capturavel = this.verificaCasaCapturavelPeloAdversario(g8, peca.ladoId);
                        if (torre.tipo == "Torre" && torre.movimentosRealizados.length == 0 && capturavel == false) {
                            movimentosPossiveis.push(new PossivelJogada(g8, false, "Roque Menor", capturavel));
                        }
                    }
                }
                //Roque Maior (Pretas)
                //Verifica se as casas no caminho estão vazias
                if (this.recuperaPecaDaCasa("D8") == null && this.recuperaPecaDaCasa("C8") == null) {
                    //Verifica se a Torre está na sua casa de origem
                    const torre = this.recuperaPecaDaCasa("A8");
                    if (torre != null) {
                        const c8 = this.recuperaCasaLinhaColuna("C8");
                        const capturavel = this.verificaCasaCapturavelPeloAdversario(c8, peca.ladoId);
                        if (torre.tipo == "Torre" && torre.movimentosRealizados.length == 0 && capturavel == false) {
                            movimentosPossiveis.push(new PossivelJogada(c8, false, "Roque Maior", capturavel));
                        }
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
        const casaPeca = this.recuperaLadoPeloId(ladoId).pecas.todas.find(casasPeca => casasPeca.casa.trim().toUpperCase() == casaNome.trim().toUpperCase());
        if (casaPeca == undefined) {
            throw "Não foi possível encontrar a peça na casa desejada";
        }
        return casaPeca;
    }
}