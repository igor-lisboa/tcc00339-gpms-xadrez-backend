module.exports = class Turno {
    constructor(
        ladoId
    ) {
        this.ladoId = ladoId;
        this.momentoInicio = new Date().getTime();
        this.momentoFim = null;
        this.totalMilisegundos = null;
    }

    defineMomentoFim() {
        this.momentoFim = new Date().getTime();
        this.totalMilisegundos = this.momentoFim - this.momentoInicio;
    }
}