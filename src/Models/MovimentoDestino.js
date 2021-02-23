module.exports = class MovimentoDestino {
    constructor(
        x,
        y,
        somenteCaptura = false
    ) {
        this.x = x;
        this.y = y;
        this.somenteCaptura = somenteCaptura;
    }
}