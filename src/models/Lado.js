module.exports = class Lado {
    constructor(lado) {
        this.id = lado.id;
        this.lado = lado.nome;
        this.cabecaPraBaixo = lado.cabecaPraBaixo;
        this.jogadasRealizadas = [];

        this.tipo = null;

        this.tempoMilisegundosRestante = null;

        this.possiveisJogadas = [];
    }

    definePossiveisJogadas(possiveisJogadas) {
        this.possiveisJogadas = possiveisJogadas;
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

    insereJogadaRealizada(jogada) {
        this.jogadasRealizadas.push(jogada);
    }

    definePecas(pecas) {
        this.pecas = pecas;
    }
}