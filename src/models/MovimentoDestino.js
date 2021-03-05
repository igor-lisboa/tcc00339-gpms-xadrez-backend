module.exports = class MovimentoDestino {
    constructor(
        casa,
        somenteCaptura = false
    ) {
        this.casa = casa;
        this.somenteCaptura = somenteCaptura;
    }
}