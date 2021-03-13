const Peca = require("./Peca");

module.exports = class Rei extends Peca {
    constructor(ladoId) {
        super(ladoId, "Rei", true, true, true, true, true, 1, 10);
    }
}