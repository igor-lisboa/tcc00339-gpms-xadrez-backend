module.exports = class Peca {
    constructor(
        ladoId,
        tipo,
        permitirJogadaParaTras = false,
        permitirJogadaDiagonal = false,
        permitirJogadaFrente = false,
        permitirJogadaHorizontal = false,
        permitirJogadaCaptura = true,
        passosHabilitados = 1,
    ) {
        this.movimentosRealizados = [];

        this.ladoId = ladoId;
        this.tipo = tipo;

        this.permitirJogadaParaTras = permitirJogadaParaTras;
        this.permitirJogadaDiagonal = permitirJogadaDiagonal;
        this.permitirJogadaFrente = permitirJogadaFrente;
        this.permitirJogadaHorizontal = permitirJogadaHorizontal;

        this.passosHabilitados = passosHabilitados;

        this.permitirJogadaCaptura = permitirJogadaCaptura;
    }

    movimentosEspeciais() {
        // substituido nas classes de validação concretas
        // onde uma lógica especial eh necessária
    }
}