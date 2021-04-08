module.exports = class MovimentoPossivel {
    constructor(
        casaDestino,
        nomeJogada = null,
        direcao = "especial",
        anda = false,
        captura = false,
        podeCapturavel = true,
        casas = 0
    ) {
        this.casaDestino = casaDestino;
        this.nomeJogada = nomeJogada;
        this.direcao = direcao;
        this.anda = anda;
        this.captura = captura;
        this.podeCapturavel = podeCapturavel;
        this.casas = casas;
    }
}