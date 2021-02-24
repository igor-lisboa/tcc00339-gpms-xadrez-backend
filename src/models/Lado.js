module.exports = class Lado {
    constructor(lado) {
        this.id = lado.id;
        this.lado = lado.nome;
        this.cabecaPraBaixo = false;
        this.movimentosRealizados = [];
        if (lado.id === 1) {
            this.cabecaPraBaixo = true;
        }
    }
}