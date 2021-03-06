module.exports = class PossivelJogada {
    constructor(
        casa,
        captura = false,
        nomeJogada = null
    ) {
        this.casa = casa;
        this.captura = captura;
        this.nomeJogada = nomeJogada;
    }
}