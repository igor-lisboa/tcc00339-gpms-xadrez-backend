module.exports = class PossivelJogada {
    constructor(
        casa,
        captura = false,
        nomeJogada = null,
        capturavel = undefined
    ) {
        this.casa = casa;
        this.captura = captura;
        this.nomeJogada = nomeJogada;
        this.setCapturavel(capturavel);
    }

    setCapturavel(capturavel) {
        this.capturavel = capturavel;
    }
}