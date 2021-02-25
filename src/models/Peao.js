const MovimentoDestino = require("./MovimentoDestino");
const Peca = require("./Peca");

module.exports = class Peao extends Peca {
    constructor(ladoId) {
        super(ladoId, "Peão", false, false, true, false, 1);
    }

    // retorna possiveis posicoes de movimento
    movimentosEspeciais(xAtual, yAtual) {
        if (this.lado.cabecaPraBaixo) {
            yDaCaptura = yAtual + 1;
        } else {
            yDaCaptura = yAtual - 1;
        }
        return [
            new MovimentoDestino(xAtual + 1, yDaCaptura, true),
            new MovimentoDestino(xAtual - 1, yDaCaptura, true)
        ];
    }
}