module.exports = class MovimentoDestino {
    constructor(
        casaDestino,
        movimentoEspecialNome = null,
        anda = false,
        captura = false
    ) {
        this.casaDestino = casaDestino;
        this.movimentoEspecialNome = movimentoEspecialNome;
        this.anda = anda;
        this.captura = captura;
    }
}