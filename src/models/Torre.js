const Peca = require("./Peca");

module.exports = class Torre extends Peca {
    constructor(ladoId) {
        super(ladoId, "Torre", true, false, true, true, true, 8, 5);
    }
}