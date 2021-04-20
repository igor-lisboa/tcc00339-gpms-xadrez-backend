const Peca = require("./Peca");

module.exports = class Rainha extends Peca {
    constructor(ladoId) {
        super(
            ladoId,
            "Rainha",
            [
                {
                    direcao: "frente",
                    opcoes: ["anda", "captura"]
                },
                {
                    direcao: "tras",
                    opcoes: ["anda", "captura"]
                },
                {
                    direcao: "esquerda",
                    opcoes: ["anda", "captura"]
                },
                {
                    direcao: "direita",
                    opcoes: ["anda", "captura"]
                },
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
            9
        );
    }
}