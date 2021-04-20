const Peca = require("./Peca");

module.exports = class Peao extends Peca {
    constructor(ladoId) {
        super(
            ladoId,
            "Peão",
            [
                {
                    direcao: "frente",
                    opcoes: ["anda", "primeiroMovimentoPeao"]
                },
                {
                    direcao: "frenteEsquerda",
                    opcoes: ["captura"]
                },
                {
                    direcao: "frenteDireita",
                    opcoes: ["captura"]
                }
            ],
            1,
            1
        );
    }
}