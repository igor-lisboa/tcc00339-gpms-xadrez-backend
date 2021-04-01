module.exports = class Turno {
    constructor(
        ladoId,
        momentoInicio,
        momentoFim = null
    ) {
        this.ladoId = ladoId;
        this.momentoInicio = momentoInicio;
        this.momentoFim = momentoFim;
        this.totalMilisegundos = 0;
    }

    defineMomentoFim(momentoFim) {
        this.momentoFim = momentoFim;
        this.totalMilisegundos = this.momentoFim - this.momentoInicio;
    }
}