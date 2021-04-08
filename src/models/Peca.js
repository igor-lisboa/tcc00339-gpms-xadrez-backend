module.exports = class Peca {
    constructor(
        ladoId,
        tipo,
        movimentacao = [],
        passosHabilitados = 8,
        valor = 0
    ) {
        this.movimentosRealizados = [];

        this.ladoId = ladoId;
        this.tipo = tipo;

        this.movimentacao = movimentacao;

        this.passosHabilitados = passosHabilitados;

        this.valor = valor;
    }

    incluiMovimentoRealizado(movimento) {
        this.movimentosRealizados.push(movimento);
    }

    movimentosEspeciais(linha, coluna) {
        return [];
    }
}