module.exports = class MovimentoRealizado {
    constructor(
        casaOrigem,
        casaDestino,
        pecaCapturada = null,
        nomeJogada = null
    ) {
        this.casaOrigem = casaOrigem;
        this.casaDestino = casaDestino;
        this.pecaCapturada = pecaCapturada;
        this.nomeJogada = nomeJogada;
        this.momento = new Date().getTime();
    }
}