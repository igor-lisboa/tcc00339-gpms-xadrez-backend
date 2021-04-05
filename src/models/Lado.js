module.exports = class Lado {
    constructor(lado) {
        this.id = lado.id;
        this.lado = lado.nome;
        this.cabecaPraBaixo = lado.cabecaPraBaixo;
        this.movimentosRealizados = [];

        this.tipo = null;

        this.tempoMilisegundosRestante = null;
    }

    definetempoMilisegundosRestante(tempoMilisegundosRestante) {
        this.tempoMilisegundosRestante = tempoMilisegundosRestante;
    }

    removeTipo() {
        this.tipo = null;
    }

    defineTipo(tipo) {
        if (this.tipo != null) {
            throw "Esse lado já foi escolhido";
        }
        this.tipo = tipo;
    }

    fazNovoMovimento(movimento) {
        this.movimentosRealizados.push(movimento);
    }

    definePecas(pecas) {
        this.pecas = pecas;
    }
}