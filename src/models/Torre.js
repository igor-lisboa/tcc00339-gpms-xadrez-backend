const Peca = require("./Peca");

module.exports = class Torre extends Peca {
    constructor(ladoId) {
        super(
            ladoId,
            "Torre",
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
                }
            ],
            9,
            5
        );
    }
}