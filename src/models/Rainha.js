const Peca = require("./Peca");

module.exports = class Rainha extends Peca {
    constructor(ladoId) {
        super(
            ladoId,
            "Rainha",
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
            8,
            9
        );
    }
}