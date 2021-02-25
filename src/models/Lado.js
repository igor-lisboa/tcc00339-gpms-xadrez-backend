module.exports = class Lado {
    constructor(lado) {
        this.id = lado.id;
        this.lado = lado.nome;
        this.cabecaPraBaixo = lado.cabecaPraBaixo;
        this.movimentosRealizados = [];
    }

    fazNovoMovimento(movimento) {
        this.movimentosRealizados.push(movimento);
    }

    definePecas(pecas) {
        this.pecas = pecas;
    }
}