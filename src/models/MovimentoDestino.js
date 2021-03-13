module.exports = class MovimentoDestino {
    constructor(
        casa,
        somenteCaptura = false,
        movimentoEspecialNome = null
    ) {
        this.casa = casa;
        this.somenteCaptura = somenteCaptura;
        this.movimentoEspecialNome = movimentoEspecialNome;
    }
}