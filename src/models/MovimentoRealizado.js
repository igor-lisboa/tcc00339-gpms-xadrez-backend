module.exports = class MovimentoRealizado {
    constructor(
        identificador,
        casaOrigem,
        casaDestino,
        pecaCapturada = null,
        nomeJogada = null,
        movimentosEspeciaisExecutados = []
    ) {
        this.identificador = identificador;
        this.casaOrigem = casaOrigem;
        this.casaDestino = casaDestino;
        this.pecaCapturada = pecaCapturada;
        this.nomeJogada = nomeJogada;
        this.movimentosEspeciaisExecutados = movimentosEspeciaisExecutados;
        this.momento = new Date().getTime();
    }
}