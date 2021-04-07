module.exports = class MovimentoDestino {
    constructor(
        casa,
        movimentoEspecialNome = null,
        somenteAnda = false,
        somenteCaptura = false
    ) {
        this.casa = casa;
        this.movimentoEspecialNome = movimentoEspecialNome;
        this.somenteAnda = somenteAnda;
        this.somenteCaptura = somenteCaptura;
    }
}