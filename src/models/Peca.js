module.exports = class Peca {
    constructor(
        ladoId,
        tipo,
        permitirJogadaParaTras = false,
        permitirJogadaDiagonal = false,
        permitirJogadaFrente = false,
        permitirJogadaHorizontal = false,
        permitirJogadaCaptura = true,
        passosHabilitados = 8,
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

    movimentosEspeciais(linha, coluna) {
        return [];
    }
}