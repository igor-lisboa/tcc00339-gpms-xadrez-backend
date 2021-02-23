const Peca = require('./Peca');

module.exports = class Bispo extends Peca {
    constructor(lado) {
        super(lado, "Bispo", false, true, false, false, 8);
    }
}