const MovimentoDestino = require("./MovimentoDestino");
const Peca = require("./Peca");

const db = require("../database.json");

module.exports = class Peao extends Peca {
    constructor(ladoId) {
        super(
            ladoId,
            "Peão",
            [
                {
                    direcao: "frente",
                    opcoes: ["somenteAnda"]
                },
                {
                    direcao: "frenteEsquerda",
                    opcoes: ["somenteCaptura"]
                },
                {
                    direcao: "frenteDireita",
                    opcoes: ["somenteCaptura"]
                }
            ],
            1,
            1
        );
    }

    // retorna possiveis posicoes de movimento
    movimentosEspeciais(linha, coluna) {
        let movimentosPossiveis = [];
        // pega o movimento de andar 2 vezes do peao
        if (this.movimentosRealizados.length == 0) {
            const linhaDaCaptura = linha + (1 * (db.lados[this.ladoId].cabecaPraBaixo ? -1 : 1));
            movimentosPossiveis.push(new MovimentoDestino({ "linha": linhaDaCaptura + (1 * (db.lados[this.ladoId].cabecaPraBaixo ? -1 : 1)), "coluna": coluna }, "Primeiro Movimento Peão", true));
        }
        return movimentosPossiveis;
    }
}