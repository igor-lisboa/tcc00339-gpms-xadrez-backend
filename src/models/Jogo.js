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
            [new Torre(this.ladoPreto), new Cavalo(this.ladoPreto), new Bispo(this.ladoPreto), new Rainha(this.ladoPreto), new Rei(this.ladoPreto), new Bispo(this.ladoPreto), new Cavalo(this.ladoPreto), new Torre(this.ladoPreto)],
            [new Peao(this.ladoPreto), new Peao(this.ladoPreto), new Peao(this.ladoPreto), new Peao(this.ladoPreto), new Peao(this.ladoPreto), new Peao(this.ladoPreto), new Peao(this.ladoPreto), new Peao(this.ladoPreto)],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [new Peao(this.ladoBranco), new Peao(this.ladoBranco), new Peao(this.ladoBranco), new Peao(this.ladoBranco), new Peao(this.ladoBranco), new Peao(this.ladoBranco), new Peao(this.ladoBranco), new Peao(this.ladoBranco)],
            [new Torre(this.ladoBranco), new Cavalo(this.ladoBranco), new Bispo(this.ladoBranco), new Rainha(this.ladoBranco), new Rei(this.ladoBranco), new Bispo(this.ladoBranco), new Cavalo(this.ladoBranco), new Torre(this.ladoBranco)],
        ];
        this.ladoAtual = 0;
        this.cheque = false;
        this.chequeMate = false;
        this.enPassantCasa = null;
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
 A1,B1,C1,D1,E1,F1,G1,H1
 A2,B2,C2,D2,E2,F2,G2,H2
 A3,B3,C3,D3,E3,F3,G3,H3
 A4,B4,C4,D4,E4,F4,G4,H4
 A5,B5,C5,D5,E5,F5,G5,H5
 A6,B6,C6,D6,E6,F6,G6,H6
 A7,B7,C7,D7,E7,F7,G7,H7
 A8,B8,C8,D8,E8,F8,G8,H8

PRETO,BRANCO,...

TORRE,CAVALO,BISPO,RAINHA,REI,BISPO,CAVALO,TORRE=>PRETO
TORRE,CAVALO,BISPO,RAINHA,REI,BISPO,CAVALO,TORRE=>BRANCO

 */