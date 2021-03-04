const MovimentoDestino = require("./MovimentoDestino");
const Peca = require("./Peca");

const db = require("../database.json");

module.exports = class Peao extends Peca {
    constructor(ladoId) {
        super(ladoId, "Peão", false, false, true, false, false);
    }

    // retorna possiveis posicoes de movimento
    movimentosEspeciais(xAtual, yAtual) {
        if (db.lados[this.ladoId].cabecaPraBaixo) {
            yDaCaptura = yAtual - 1;
        } else {
            yDaCaptura = yAtual + 1;
        }

        let movimentosPossiveis = [
            new MovimentoDestino(xAtual + 1, yDaCaptura, true),
            new MovimentoDestino(xAtual - 1, yDaCaptura, true)
        ];

        if (this.movimentosRealizados.length === 0) {
            movimentosPossiveis.push(new MovimentoDestino(xAtual, yAtual + 1));
        }

        return movimentosPossiveis;
    }
}