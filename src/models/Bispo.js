const Peca = require("./Peca");

module.exports = class Bispo extends Peca {
    constructor(ladoId) {
        super(
            ladoId,
            "Bispo",
            [
                {
                    direcao: "frenteEsquerda",
                    opcoes: ["anda", "captura"]
                },
                {
                    direcao: "frenteDireita",
                    opcoes: ["anda", "captura"]
                },
                {
                    direcao: "trasEsquerda",
                    opcoes: ["anda", "captura"]
                },
                {
                    direcao: "trasDireita",
                    opcoes: ["anda", "captura"]
                }
            ],
            8,
            3
        );
    }
}