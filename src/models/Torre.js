const Peca = require("./Peca");

module.exports = class Torre extends Peca {
    constructor(lado) {
        super(lado, "Torre", true, false, true, true, 8);
    }
}