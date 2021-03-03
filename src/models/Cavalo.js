const MovimentoDestino = require("./MovimentoDestino");
const Peca = require("./Peca");

module.exports = class Cavalo extends Peca {
    constructor(ladoId) {
        super(ladoId, "Cavalo", false, false, false, false, true);
    }

    movimentosEspeciais(xAtual, yAtual) {
        return [
            new MovimentoDestino(xAtual + 3, yAtual + 1),
            new MovimentoDestino(xAtual + 3, yAtual - 1),
            new MovimentoDestino(xAtual - 3, yAtual + 1),
            new MovimentoDestino(xAtual - 3, yAtual - 1),
            new MovimentoDestino(xAtual + 1, yAtual + 3),
            new MovimentoDestino(xAtual + 1, yAtual - 3),
            new MovimentoDestino(xAtual - 1, yAtual + 3),
            new MovimentoDestino(xAtual - 1, yAtual - 3)
        ];
    }
}