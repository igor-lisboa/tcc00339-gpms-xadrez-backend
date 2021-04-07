const Peca = require("./Peca");

module.exports = class Rei extends Peca {
    constructor(ladoId) {
        super(
            ladoId,
            "Rei",
            [
                {
                    direcao: "frente",
                    opcoes: []
                },
                {
                    direcao: "tras",
                    opcoes: []
                },
                {
                    direcao: "esquerda",
                    opcoes: []
                },
                {
                    direcao: "direita",
                    opcoes: []
                },
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
            1,
            10
        );
    }
}