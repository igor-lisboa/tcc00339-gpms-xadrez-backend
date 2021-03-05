module.exports = class PossivelJogada {
    constructor(
        casa,
        captura = false
    ) {
        this.casa = casa;
        this.captura = captura;
    }
}