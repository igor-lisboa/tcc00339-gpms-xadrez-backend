const Peca = require("./Peca");

module.exports = class Rainha extends Peca {
    constructor(ladoId) {
        super(ladoId, "Rainha", true, true, true, true);
    }
}