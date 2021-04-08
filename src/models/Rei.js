const Peca = require("./Peca");

module.exports = class Rei extends Peca {
    constructor(ladoId) {
        super(
            ladoId,
            "Rei",
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
                    opcoes: ["anda", "captura", "brancoRoqueMenor", "pretoRoqueMaior"]
                },
                {
                    direcao: "direita",
                    opcoes: ["anda", "captura", "pretoRoqueMenor", "brancoRoqueMaior"]
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
            1,
            10
        );
    }
}