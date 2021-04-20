module.exports = class AcaoSolicitada {
    constructor(
        acao,
        ladoId,
        data = {}
    ) {
        this.acao = acao;
        this.ladoId = ladoId;
        this.data = data;
    }
}