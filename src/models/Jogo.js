const Lado = require("./Lado");
const Torre = require("./Torre");
const Peao = require("./Peao");
const Cavalo = require("./Cavalo");
const Bispo = require('./Bispo');
const Rei = require('./Rei');
const Rainha = require('./Rainha');

const db = require('../database.json');

module.exports = class Jogo {
    constructor() {
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
         * A casa de captura do enPassant so eh valida por 1 jogada
         * nessa jogada em questao o jogador adversario caso tenha
         * alguma peca q pode ir ate a casa armazenada nessa variavel
         * ira realizar a captura do PEÃO que executou o enPassant
         */
        this.enPassantCasaCaptura = null;

        this.atualizaPecasDosLados();
    }

    find(jogoId) {
        const jogo = db.jogos[jogoId];
        if (jogo === undefined) {
            throw 'Jogo não encontrado!';
        }

        this.ladoBranco = jogo.ladoBranco;
        this.ladoPreto = jogo.ladoPreto;
        this.tabuleiro = jogo.tabuleiro;
        this.cheque = jogo.cheque;
        this.chequeMate = jogo.chequeMate;
        this.enPassantCasaCaptura = jogo.enPassantCasaCaptura;

        return this;
    }

    move(casaDe, casaPara) {
        casaDe = this.recuperaCasaLinhaColuna(casaDe);
        casaPara = this.recuperaCasaLinhaColuna(casaPara);

        // verifica linhas e colunas de destino e origem
        if (casaDe.linha > 7 || casaDe.linha < 0 || casaPara.linha > 7 || casaPara.linha < 0) {
            throw "Dados inválidos para realizar esse movimento";
        }

        // verificacoes casa origem
        const casaOrigem = this.tabuleiro[casaDe.linha][casaDe.coluna];
        if (casaOrigem === null) {
            throw "Não foi possível encontrar uma peça na casa de origem do movimento";
        }

        if (casaOrigem.ladoId !== this.ladoIdAtual) {
            throw "A peça escolhida para o movimento pertence ao adversário, escolha outra peça";
        }

        // verificacoes casa destino
        const casaDestino = this.tabuleiro[casaPara.linha][casaPara.coluna];
        if (casaDestino.ladoId === this.ladoIdAtual) {
            throw "Não é possível capturar uma peça que te pertence";
        }

        // caso passou pelos ifs executa movimento mas primeiro limpando a casa de origem e a casa de destino
        this.tabuleiro[casaDe.linha][casaDe.coluna] = null;
        this.tabuleiro[casaPara.linha][casaPara.coluna] = casaOrigem;
    }

    recuperaLadoPeloId(ladoId) {
        if (this.ladoBranco.id == ladoId) {
            return this.ladoBranco;
        }
        return this.ladoPreto;
    }

    encontraCasasVizinhas(casa) {
        casa = this.recuperaCasaLinhaColuna(casa);

        let ladoAtual = this.recuperaLadoPeloId(this.ladoIdAtual);
        let casasVizinhas = [];

        if (ladoAtual.cabecaPraBaixo) {
            casasVizinhas['frente'] = { linha: casa.linha - 1, coluna: casa.coluna };
            casasVizinhas['tras'] = { linha: casa.linha + 1, coluna: casa.coluna };
            casasVizinhas['esquerda'] = { linha: casa.linha, coluna: casa.coluna - 1 };
            casasVizinhas['direita'] = { linha: casa.linha, coluna: casa.coluna + 1 };
            casasVizinhas['frenteEsquerda'] = { linha: casa.linha - 1, coluna: casa.coluna - 1 };
            casasVizinhas['frenteDireita'] = { linha: casa.linha - 1, coluna: casa.coluna + 1 };
            casasVizinhas['trasEsquerda'] = { linha: casa.linha + 1, coluna: casa.coluna - 1 };
            casasVizinhas['trasDireita'] = { linha: casa.linha + 1, coluna: casa.coluna + 1 };
        } else {
            casasVizinhas['frente'] = { linha: casa.linha + 1, coluna: casa.coluna };
            casasVizinhas['tras'] = { linha: casa.linha - 1, coluna: casa.coluna };
            casasVizinhas['esquerda'] = { linha: casa.linha, coluna: casa.coluna + 1 };
            casasVizinhas['direita'] = { linha: casa.linha, coluna: casa.coluna - 1 };
            casasVizinhas['frenteEsquerda'] = { linha: casa.linha + 1, coluna: casa.coluna + 1 };
            casasVizinhas['frenteDireita'] = { linha: casa.linha + 1, coluna: casa.coluna - 1 };
            casasVizinhas['trasEsquerda'] = { linha: casa.linha - 1, coluna: casa.coluna + 1 };
            casasVizinhas['trasDireita'] = { linha: casa.linha - 1, coluna: casa.coluna - 1 };
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

                        let casa = this.recuperaCasaLinhaColuna({
                            "linha": linhaIndex,
                            "coluna": colunaIndex
                        });

                        let peca = {
                            "casa": casa.casa,
                            "linha": casa.linha,
                            "coluna": casa.coluna,
                            "peca": coluna
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

    recuperaCasaLinhaColuna(casa) {
        if (typeof casa === "string") {
            return this.pegaLinhaColunaDeUmaCasa(casa);
        }
        return this.pegaCasaDeUmaLinhaColuna(casa);
    }

    pegaLinhaColunaDeUmaCasa(casa) {
        let casaEncontrada = db.tabelaEquivalencia.find(element => element.casa.trim().toUpperCase() === casa.trim().toUpperCase());
        if (typeof (casaEncontrada) === undefined) {
            throw "Não foi possível encontrar a casa desejada";
        }
        return casaEncontrada;
    }

    pegaCasaDeUmaLinhaColuna(casa) {
        let casaEncontrada = db.tabelaEquivalencia.find(element => element.linha == casa.linha && element.coluna == casa.coluna);
        if (typeof (casaEncontrada) === undefined) {
            throw "Não foi possível encontrar a casa desejada";
        }
        return casaEncontrada;
    }
}