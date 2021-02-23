const MovimentoDestino = require("./MovimentoDestino");
const Peca = require("./Peca");

module.exports = class Cavalo extends Peca {
    constructor(lado) {
        super(lado, "Cavalo", false, false, false, false, 1);
    }

    movimentoEspecial(xAtual, yAtual) {
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