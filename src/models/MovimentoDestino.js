module.exports = class MovimentoDestino {
    constructor(
        casa,
        somenteCaptura = false,
        movimentoEspecialNome = null,
        permiteCaptura = true
    ) {
        this.casa = casa;
        this.somenteCaptura = somenteCaptura;
        this.movimentoEspecialNome = movimentoEspecialNome;
        this.permiteCaptura = permiteCaptura;
    }
}