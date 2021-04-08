const MovimentoDestino = require("./MovimentoDestino");
const Peca = require("./Peca");

module.exports = class Cavalo extends Peca {
    constructor(ladoId) {
        super(
            ladoId,
            "Cavalo",
            [],
            1,
            3
        );
    }

    movimentosEspeciais(linha, coluna) {
        return [
            new MovimentoDestino({ "linha": linha + 2, "coluna": coluna + 1 }),
            new MovimentoDestino({ "linha": linha + 2, "coluna": coluna - 1 }),
            new MovimentoDestino({ "linha": linha - 2, "coluna": coluna + 1 }),
            new MovimentoDestino({ "linha": linha - 2, "coluna": coluna - 1 }),
            new MovimentoDestino({ "linha": linha + 1, "coluna": coluna + 2 }),
            new MovimentoDestino({ "linha": linha + 1, "coluna": coluna - 2 }),
            new MovimentoDestino({ "linha": linha - 1, "coluna": coluna + 2 }),
            new MovimentoDestino({ "linha": linha - 1, "coluna": coluna - 2 })
        ];
    }
}