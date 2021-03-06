module.exports = class PossivelJogada {
    constructor(
        casaOrigem,
        casaDestino,
        nome = null,
        pecaCaptura = null,
        pecasCapturantes = [],
        peca = null,
        pecaValor = 0
    ) {
        this.casaOrigem = casaOrigem;
        this.casaDestino = casaDestino;
        this.nome = nome;
        this.peca = peca;
        this.pecaValor = pecaValor;
        this.definePecaCaptura(pecaCaptura);
        this.defineCapturantes(pecasCapturantes);
    }

    defineCapturantes(capturantes = []) {
        this.capturantes = capturantes;
        if (this.capturantes.length > 0) {
            this.defineCapturavel(true);
        } else {
            this.defineCapturavel(false);
        }
    }

    verificaCaptura() {
        if (this.pecaCaptura != null) {
            this.captura = true;
        } else {
            this.captura = false;
        }
    }

    defineCapturavel(capturavel) {
        this.capturavel = capturavel;
    }

    definePecaCaptura(pecaCaptura) {
        this.pecaCaptura = pecaCaptura;
        this.verificaCaptura();
    }
}