const MovimentoDestino = require("./MovimentoDestino");
const Peca = require("./Peca");

const db = require("../database.json");

module.exports = class Peao extends Peca {
    constructor(ladoId) {
        super(ladoId, "Peão", false, false, true, false, false, 1);
    }

    // retorna possiveis posicoes de movimento
    movimentosEspeciais(linha, coluna) {
        const linhaDaCaptura = linha + (1 * (db.lados[this.ladoId].cabecaPraBaixo ? -1 : 1));

        // pega as capturas do peao
        let movimentosPossiveis = [
            new MovimentoDestino({ "linha": linhaDaCaptura, "coluna": coluna + 1 }, true),
            new MovimentoDestino({ "linha": linhaDaCaptura, "coluna": coluna - 1 }, true)
        ];

        // pega o movimento do enPassant
        if (this.movimentosRealizados.length === 0) {
            movimentosPossiveis.push(new MovimentoDestino({ "linha": linhaDaCaptura + (1 * (db.lados[this.ladoId].cabecaPraBaixo ? -1 : 1)), "coluna": coluna }));
        }

        return movimentosPossiveis;
    }
}