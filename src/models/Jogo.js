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
                        let peca = {
                            "linha": linhaIndex,
                            "coluna": colunaIndex,
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

    pegaLinhaColunaDeUmaCasa(casa) {
        let casaEncontrada = db.tabelaEquivalencia.find(element => element.casa.trim().toUpperCase() === casa.trim().toUpperCase());
        if (typeof (casaEncontrada) === undefined) {
            throw "Não foi possível encontrar a casa desejada";
        }
        return casaEncontrada;
    }
}

/**
 * this.tabuleiro = [
            [[0,0], [0,1], [0,2], [0,3], [0,4], [0,5], [0,6], [0,7]],
            [[1,0], [1,1], [1,2], [1,3], [1,4], [1,5], [1,6], [1,7]],
            [[2,0], [2,1], [2,2], [2,3], [2,4], [2,5], [2,6], [2,7]],
            [[3,0], [3,1], [3,2], [3,3], [3,4], [3,5], [3,6], [3,7]],
            [[4,0], [4,1], [4,2], [4,3], [4,4], [4,5], [4,6], [4,7]],
            [[5,0], [5,1], [5,2], [5,3], [5,4], [5,5], [5,6], [5,7]],
            [[6,0], [6,1], [6,2], [6,3], [6,4], [6,5], [6,6], [6,7]],
            [[7,0], [7,1], [7,2], [7,3], [7,4], [7,5], [7,6], [7,7]],
        ];
 *
A8,B8,C8,D8,E8,F8,G8,H8
A7,B7,C7,D7,E7,F7,G7,H7
A6,B6,C6,D6,E6,F6,G6,H6
A5,B5,C5,D5,E5,F5,G5,H5
A4,B4,C4,D4,E4,F4,G4,H4
A3,B3,C3,D3,E3,F3,G3,H3
A2,B2,C2,D2,E2,F2,G2,H2
A1,B1,C1,D1,E1,F1,G1,H1

PRETO,BRANCO,...

TORRE,CAVALO,BISPO,RAINHA,REI,BISPO,CAVALO,TORRE=>PRETO
TORRE,CAVALO,BISPO,RAINHA,REI,BISPO,CAVALO,TORRE=>BRANCO

 */