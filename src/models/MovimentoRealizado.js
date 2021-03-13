module.exports = class MovimentoRealizado {
    constructor(
        casaOrigem,
        casaDestino,
        pecaCapturada = null
    ) {
        this.casaOrigem = casaOrigem;
        this.casaDestino = casaDestino;
        this.pecaCapturada = pecaCapturada;
        this.momento = new Date().getTime();
    }
}