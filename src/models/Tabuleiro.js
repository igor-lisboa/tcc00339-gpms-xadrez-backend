module.exports = class Tabuleiro {
    constructor(casas = []) {
        this.casas = [
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
        ];

        casas.forEach((linha, linhaIndex) => {
            linha.forEach((coluna, colunaIndex) => {
                this.casas[linhaIndex][colunaIndex] = coluna;
            });
        })
    }

    atualizaCasa(linha, coluna, novoItem) {
        this.casas[linha][coluna] = novoItem;
    }

    recuperaCasa(linha, coluna) {
        return this.casas[linha][coluna];
    }

    recuperaTabuleiro() {
        return this.casas;
    }
}