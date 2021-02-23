const Peca = require("./Peca");

module.exports = class Rainha extends Peca {
    constructor(lado) {
        super(lado, "Rainha", true, true, true, true, 8);
    }
}