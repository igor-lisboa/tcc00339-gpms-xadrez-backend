const Peca = require("./Peca");

module.exports = class Bispo extends Peca {
    constructor(ladoId) {
        super(ladoId, "Bispo", false, true, false, false);
    }
}