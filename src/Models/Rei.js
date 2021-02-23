const Peca = require("./Peca");

module.exports = class Rei extends Peca {
    constructor(lado) {
        super(lado, "Rei", true, true, true, true, 1);
    }
}