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

module.exports = class Jogo {
    constructor(tipoJogoId = 0) {
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

        this.defineLadoIdAtual(this.ladoBranco.id);

        /**
         * O REI do lado atual tem pessas q podem captura-lo mas ainda
         * possui modos de se defender obstruindo o ataque em questao
         * com outra peca ou se movendo
         */
        this.cheque = false;

        /**
         * O REI do lado atual nao consegue obstruir os ataques direcionados
         * a ele e nem consegue se mover para escapar do ataque dando a vitoria
         * para o outro lado
         */
        this.chequeMate = false;

        /**
         * Objeto contendo a casa de captura do enPassant e a casa onde a peca se encontra
         * so eh valida por 1 jogada nessa jogada em questao o jogador adversario caso tenha
         * alguma peca q pode ir ate a casa armazenada nessa variavel ira realizar a captura
         * do PEÃO que executou o enPassant
         */
        this.enPassantCasaCaptura = null;

        this.defineTipoJogo(tipoJogoId);

        this.atualizaPecasDosLados();
    }

    defineJogador(ladoId, tipo) {
        let lado = undefined;
        if (this.ladoBranco.id == ladoId) {
            this.ladoBranco.defineTipo(tipo);
            lado = this.ladoBranco;
        } else {
            this.ladoPreto.defineTipo(tipo);
            lado = this.ladoPreto;
        }

        // se tipo de jogo for Humano X I.A. & tipo for Humano
        if (this.tipoJogo.id == 1 && tipo.id == 0) {
            // inclui jogador I.A. no lado adversario
            let ladoAdversario = this.recuperaLadoAdversarioPeloId(ladoId);
            this.defineJogador(ladoAdversario.id, db.ladoTipos[1]);
        }

        this.salva();

        return lado;
    }

    defineTipoJogo(tipoJogoId) {
        this.tipoJogo = TipoJogoService.find(tipoJogoId);
        // se tipo de jogo for I.A. X I.A.
        if (this.tipoJogo.id == 2) {
            // insere I.A.'s
            this.defineJogador(0, db.ladoTipos[1]);
            this.defineJogador(1, db.ladoTipos[1]);
        }
    }

    realizaJogada(ladoId, casaOrigem, casaDestino) {
        if (ladoId != this.ladoIdAtual) {
            throw "Não está na sua vez de jogar, espere sua vez";
        }

        const jogadaEscolhida = this.move(casaOrigem, casaDestino, ladoId);

        // passa a vez p outro jogador
        const ladoAdversario = this.recuperaLadoAdversarioPeloId(this.ladoIdAtual);
        this.defineLadoIdAtual(ladoAdversario.id);

        // verifica se a jogada colocou o rei em cheque
        const reiEmCheque = this.verificaReiLadoAtualCheque();

        this.cheque = reiEmCheque;

        this.salva();

        return jogadaEscolhida;
    }

    find(jogoId) {
        const jogo = db.jogos[jogoId];
        if (jogo === undefined) {
            throw "Jogo não encontrado";
        }

        this.id = jogo.id;
        this.ladoBranco = jogo.ladoBranco;
        this.ladoPreto = jogo.ladoPreto;
        this.tabuleiro = jogo.tabuleiro;
        this.chequeMate = jogo.chequeMate;
        this.enPassantCasaCaptura = jogo.enPassantCasaCaptura;
        this.ladoIdAtual = jogo.ladoIdAtual;
        this.tipoJogo = jogo.tipoJogo;

        this.cheque = this.verificaReiLadoAtualCheque();

        return this;
    }

    salva() {
        if (this.id == null) {
            const tamanhoAntesPush = db.jogos.length;
            const tamanhoDepoisPush = db.jogos.push(this);
            if (tamanhoAntesPush >= tamanhoDepoisPush) {
                throw "Falha ao incluir Jogo";
            }
            const ultimoIndex = db.jogos.lastIndexOf(this);
            this.id = ultimoIndex;
        }
        db.jogos[this.id] = this;
    }

    create() {
        this.salva();
        return this;
    }

    move(casaDe, casaPara, ladoId) {
        casaDe = this.recuperaCasaLinhaColuna(casaDe);
        casaPara = this.recuperaCasaLinhaColuna(casaPara);

        const jogadaEscolhida = this.verificaJogadaPossivel(casaDe, casaPara, ladoId);

        const peca = this.tabuleiro[casaDe.linha][casaDe.coluna];
        const casaDestino = this.tabuleiro[casaPara.linha][casaPara.coluna];

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

            this.tabuleiro[casaPara.linha][casaPara.coluna].incluiMovimentoRealizado(novoMovimento);

            if (this.ladoBranco.id == this.ladoIdAtual) {
                this.ladoBranco.fazNovoMovimento(novoMovimento);
            } else if (this.ladoPreto.id == this.ladoIdAtual) {
                this.ladoPreto.fazNovoMovimento(novoMovimento);
            }

            return novoMovimento;
        } catch (e) {
            // desfaz movimento
            this.tabuleiro[casaDe.linha][casaDe.coluna] = peca;
            this.tabuleiro[casaPara.linha][casaPara.coluna] = casaDestino;

            throw e;
        }
    }

    verificaReiLadoAtualCheque() {
        this.atualizaPecasDosLados();

        const ladoAtual = this.recuperaLadoPeloId(this.ladoIdAtual);
        const ladoAdversario = this.recuperaLadoAdversarioPeloId(this.ladoIdAtual);

        const reiLadoAtual = ladoAtual.pecas.rei;

        let reiEmPerigo = false;
        ladoAdversario.pecas.todas.forEach((peca) => {
            try {
                this.verificaJogadaPossivel(peca.casa, reiLadoAtual.casa, ladoAdversario.id);
                reiEmPerigo = true;
            } catch (e) {
                // se deu excecao eh pq o rei nao esta em cheque
            }
        });

        return reiEmPerigo;
    }

    verificaJogadaPossivel(casaOrigemPeca, casaDestino, ladoId) {
        casaOrigemPeca = this.recuperaCasaLinhaColuna(casaOrigemPeca);
        casaDestino = this.recuperaCasaLinhaColuna(casaDestino);

        // verificacoes casa origem
        const casaOrigem = this.tabuleiro[casaOrigemPeca.linha][casaOrigemPeca.coluna];
        if (casaOrigem === null) {
            throw "Não foi possível encontrar uma peça na casa de origem do movimento";
        }

        if (casaOrigem.ladoId !== ladoId) {
            throw "A peça escolhida para o movimento pertence ao adversário, escolha outra peça";
        }

        // verificacoes casa destino p ver se tem peca nela
        const casaPecaDestino = this.tabuleiro[casaDestino.linha][casaDestino.coluna];

        // se tiver peca
        if (casaPecaDestino != null) {
            if (casaPecaDestino.ladoId === ladoId) {
                throw "Não é possível capturar uma peça que te pertence";
            }
        }

        const possiveisMovimentosDaPeca = this.recuperaMovimentosPossiveisDaPecaDaCasa(casaOrigemPeca);
        let casaDestinoEhUmDestino = false;
        let movimentoDestinoEscolhido = null;

        possiveisMovimentosDaPeca.forEach((movimentoDestino) => {
            if (movimentoDestino.casa.casa === casaDestino.casa) {
                casaDestinoEhUmDestino = true;
                movimentoDestinoEscolhido = movimentoDestino;
            }
        });

        if (casaDestinoEhUmDestino === false) {
            throw "A casa de destino da jogada escolhida não pode ser realizada pela peça escolhida";
        }

        return movimentoDestinoEscolhido;
    }

    recuperaLadoPeloId(ladoId) {
        if (this.ladoBranco.id == ladoId) {
            return this.ladoBranco;
        }
        if (this.ladoPreto.id == ladoId) {
            return this.ladoPreto;
        }
        throw "O lado desejado não existe";
    }

    recuperaLadoAdversarioPeloId(ladoId) {
        if (this.ladoBranco.id == ladoId) {
            return this.ladoPreto;
        }
        if (this.ladoPreto.id == ladoId) {
            return this.ladoBranco;
        }
        throw "O lado adversário desejado não existe";
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
    }

    defineLadoIdAtual(ladoId) {
        this.ladoIdAtual = ladoId;
    }

    recuperaPecasDeUmLado(ladoId) {
        let pecas = [];
        let rei = {};
        this.tabuleiro.forEach((linha, linhaIndex) => {
            linha.forEach((coluna, colunaIndex) => {
                // verifica se a casa esta vazia ou nao
                if (coluna !== null) {
                    // se o id do lado da peca q esta na casa for igual ao id do lado informado insere na lista de pecas
                    if (coluna.ladoId === ladoId) {

                        let casa = this.recuperaCasaLinhaColuna({ "linha": linhaIndex, "coluna": colunaIndex });

                        let peca = {
                            "casa": casa.casa,
                            "linha": casa.linha,
                            "coluna": casa.coluna,
                            "peca": coluna,
                            "possiveisJogadas": this.recuperaMovimentosPossiveisDaPecaDaCasa(casa)
                        };

                        pecas.push(peca);

                        // se for o rei define na variavel
                        if (coluna.tipo === "Rei") {
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
        if (repeticoesHabilitadas === 0) {
            return casasEncontradas;
        }

        // recupera casas vizinhas
        const casasVizinhas = this.encontraCasasVizinhas(casaAtual, pecaLadoId);

        // recupera o vizinho desejado
        const vizinho = casasVizinhas[vizinhoDesejado];

        // se vizinho eh null casa nao existe
        if (vizinho === null) {
            return casasEncontradas;
        }

        // pega o item q ta na casa vizinha
        const itemCasa = this.tabuleiro[vizinho.linha][vizinho.coluna];

        // se item casa ta vazio, adiciona na lista casasEncontradas e encontra proximo 
        if (itemCasa === null) {
            casasEncontradas.push(new PossivelJogada(vizinho));
            return this.recuperaPossiveisJogadasEmCasasVizinhas(vizinho, vizinhoDesejado, repeticoesHabilitadas - 1, capturaHabilitada, pecaLadoId, casasEncontradas);
        } else {
            // so adiciona possivel jogada se a peca for do adversario
            if (itemCasa.ladoId !== pecaLadoId && capturaHabilitada) {
                casasEncontradas.push(new PossivelJogada(vizinho, true));
            }
            return casasEncontradas;
        }

    }

    recuperaMovimentosPossiveisDaPecaDaCasa(casa) {
        casa = this.recuperaCasaLinhaColuna(casa);

        const peca = this.tabuleiro[casa.linha][casa.coluna];

        if (peca === null) {
            throw "Não foi possível encontrar a peça desejada";
        }

        let movimentosPossiveis = [];

        if (peca.permitirJogadaDiagonal) {
            movimentosPossiveis = movimentosPossiveis.concat(this.recuperaPossiveisJogadasEmCasasVizinhas(casa, 'frenteEsquerda', peca.passosHabilitados, peca.permitirJogadaCaptura, peca.ladoId));
            movimentosPossiveis = movimentosPossiveis.concat(this.recuperaPossiveisJogadasEmCasasVizinhas(casa, 'frenteDireita', peca.passosHabilitados, peca.permitirJogadaCaptura, peca.ladoId));
            movimentosPossiveis = movimentosPossiveis.concat(this.recuperaPossiveisJogadasEmCasasVizinhas(casa, 'trasEsquerda', peca.passosHabilitados, peca.permitirJogadaCaptura, peca.ladoId));
            movimentosPossiveis = movimentosPossiveis.concat(this.recuperaPossiveisJogadasEmCasasVizinhas(casa, 'trasDireita', peca.passosHabilitados, peca.permitirJogadaCaptura, peca.ladoId));
        }

        if (peca.permitirJogadaFrente) {
            movimentosPossiveis = movimentosPossiveis.concat(this.recuperaPossiveisJogadasEmCasasVizinhas(casa, 'frente', peca.passosHabilitados, peca.permitirJogadaCaptura, peca.ladoId));
        }

        if (peca.permitirJogadaHorizontal) {
            movimentosPossiveis = movimentosPossiveis.concat(this.recuperaPossiveisJogadasEmCasasVizinhas(casa, 'esquerda', peca.passosHabilitados, peca.permitirJogadaCaptura, peca.ladoId));
            movimentosPossiveis = movimentosPossiveis.concat(this.recuperaPossiveisJogadasEmCasasVizinhas(casa, 'direita', peca.passosHabilitados, peca.permitirJogadaCaptura, peca.ladoId));
        }

        if (peca.permitirJogadaParaTras) {
            movimentosPossiveis = movimentosPossiveis.concat(this.recuperaPossiveisJogadasEmCasasVizinhas(casa, 'tras', peca.passosHabilitados, peca.permitirJogadaCaptura, peca.ladoId));
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

            if (casaRecuperada === null) {
                return;
            }

            const itemCasa = this.tabuleiro[casaRecuperada.linha][casaRecuperada.coluna];

            // casa vazia
            if (itemCasa === null) {
                // se o movimento n for apenas de captura, inclui possivel jogada
                if (!movimentoDestino.somenteCaptura) {
                    movimentosPossiveis.push(new PossivelJogada(casaRecuperada, false, movimentoDestino.movimentoEspecialNome));
                }
            } else {
                // so adiciona possivel jogada se a peca for do adversario
                if (itemCasa.ladoId !== peca.ladoId) {
                    movimentosPossiveis.push(new PossivelJogada(casaRecuperada, true, movimentoDestino.movimentoEspecialNome));
                }
            }
        });

        return movimentosPossiveis;
    }

    recuperaCasaLinhaColuna(casa) {
        if (typeof casa === "string") {
            return this.pegaLinhaColunaDeUmaCasa(casa);
        }

        return this.pegaCasaDeUmaLinhaColuna(casa);
    }

    pegaLinhaColunaDeUmaCasa(casa) {
        const casaEncontrada = db.tabelaEquivalencia.find(element => element.casa.trim().toUpperCase() === casa.trim().toUpperCase());
        if (typeof (casaEncontrada) === "undefined") {
            throw "Não foi possível encontrar a casa desejada buscando pelo nome da casa";
        }
        return casaEncontrada;
    }

    pegaCasaDeUmaLinhaColuna(casa) {
        const casaEncontrada = db.tabelaEquivalencia.find(element => element.linha == casa.linha && element.coluna == casa.coluna);
        if (typeof (casaEncontrada) === "undefined") {
            throw "Não foi possível encontrar a casa desejada buscando pela linha e coluna";
        }
        return casaEncontrada;
    }


    /*    

    //Roque Menor
    //Verifica lado
    if(this.ladoIdAtual === this.ladoBranco.id) {
        //Verifica peça e casa (Branca)
        if (peca === "Rei" && this.tabuleiro[casa.linha][casa.coluna] === this.tabuleiro[7][4]) {
            //Verifica se as casas no caminho estão vazias
            if (this.tabuleiro[7][5] === null && this.tabuleiro[7][6] === null) {
                //Verifica se a Torre está na sua casa de origem
                if (this.tabuleiro[7][7] === "Torre") {
                    //Verifica se o jogador pretende mover o Rei para [7][6]
                    if (casaDestino === this.tabuleiro[7][6]) {
                        //Mover Rei para [7][6]
                        realizaJogada(this.ladoBranco.id, this.tabuleiro[casa.linha][casa.coluna], casaDestino);
                        //Mover Torre manualmente para [7][5]
                        const peca = this.tabuleiro[7][7];
                        this.tabuleiro[7][7] = null;
                        this.tabuleiro[7][5] = peca;
                    }
                }
            }
        }

    } else {
        //Verifica peça e casa (Preta)
        if (peca === "Rei" && this.tabuleiro[casa.linha][casa.coluna] === this.tabuleiro[0][4]) {
            //Verifica se as casa no caminho estão vazias
            if (this.tabuleiro[0][5] === null && this.tabuleiro[0][6] === null) {
                //Verifica se a Torre está na sua casa de origem
                if (this.tabuleiro[0][7] === "Torre") {
                    //Verifica se o jogador pretende mover o Rei para [0][6]
                    if (casaDestino === this.tabuleiro[0][6]) {
                        //Mover Rei para [0][6]
                        realizaJogada(this.ladoPreto.id, this.tabuleiro[casa.linha][casa.coluna], casaDestino);
                        //Mover Torre manualmente para [0][5]
                        const peca = this.tabuleiro[0][7];
                        this.tabuleiro[0][7] = null;
                        this.tabuleiro[0][5] = peca;
                    }
                }
            }
        }
    }

    //Roque Maior
    //Verifica lado
    if(this.ladoIdAtual === this.ladoBranco.id) {
        //Verifica peça e casa (Branca)
        if (peca === "Rei" && this.tabuleiro[casa.linha][casa.coluna] === this.tabuleiro[7][4]) {
            //Verifica se as casas no caminho estão vazias
            if (this.tabuleiro[7][3] === null & this.tabuleiro[7][2] === null && this.tabuleiro[7][1] === null) {
                //Verifica se a Torre está na sua casa de origem
                if (this.tabuleiro[7][0] === "Torre") {
                    //Verifica se o jogador pretende mover o Rei para [7][2]
                    if (casaDestino === this.tabuleiro[7][2]) {
                        //Mover Rei para [7][2]
                        realizaJogada(this.ladoBranco.id, this.tabuleiro[casa.linha][casa.coluna], casaDestino);
                        //Mover Torre manualmente para [7][3]
                        const peca = this.tabuleiro[7][0];
                        this.tabuleiro[7][0] = null;
                        this.tabuleiro[7][3] = peca;
                    }
                }
            }
        }

    } else {
        //Verifica peça e casa (Branca)
        if (peca === "Rei" && this.tabuleiro[casa.linha][casa.coluna] === this.tabuleiro[0][4]) {
            //Verifica se as casas no camniho estão vazias
            if (this.tabuleiro[0][3] === null && this.tabuleiro[0][2] === null && this.tabuleiro[0][1] === null) {
                //Verifica se a Torre está na sua casa de origem
                if (this.tabuleiro[0][0] === "Torre") {
                    //Verifica se o jogador pretende mover o Rei para [0][2]
                    if (casaDestino === this.tabuleiro[0][2]) {
                        //Mover Rei para [0][2]
                        realizaJogada(this.ladoPreto.id, this.tabuleiro[casa.linha][casa.coluna], casaDestino);
                        //Mover Torre manualmente para [0][3]
                        const peca = this.tabuleiro[0][0];
                        this.tabuleiro[0][0] = null;
                        this.tabuleiro[0][3] = peca;
                    }
                }
            }
        }
    }

    */    
}