module.exports = class PossivelJogada {
    constructor(
        casa,
        captura = false,
        nomeJogada = null,
        capturavel = undefined,
        direcao = "Especial"
    ) {
        this.casa = casa;
        this.captura = captura;
        this.nomeJogada = nomeJogada;
        this.direcao = direcao;
        this.setCapturavel(capturavel);
    }

    setCapturavel(capturavel) {
        this.capturavel = capturavel;
    }
}