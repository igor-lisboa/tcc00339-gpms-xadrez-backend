const Peca = require("./Peca");

module.exports = class Torre extends Peca {
    constructor(ladoId) {
        super(
            ladoId,
            "Torre",
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
            9,
            5
        );
    }
}