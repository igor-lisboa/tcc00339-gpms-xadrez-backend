const Peca = require("./Peca");

module.exports = class Bispo extends Peca {
    constructor(ladoId) {
        super(
            ladoId,
            "Bispo",
            [
                {
                    direcao: "frenteEsquerda",
                    opcoes: []
                },
                {
                    direcao: "frenteDireita",
                    opcoes: []
                },
                {
                    direcao: "trasEsquerda",
                    opcoes: []
                },
                {
                    direcao: "trasDireita",
                    opcoes: []
                }
            ],
            8,
            3
        );
    }
}