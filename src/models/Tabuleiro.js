const Torre = require("./Torre");
const Peao = require("./Peao");
const Cavalo = require("./Cavalo");
const Bispo = require("./Bispo");
const Rei = require("./Rei");
const Rainha = require("./Rainha");

const TipoPecaService = require("../services/TipoPecaService");

const pecasTipos = { Torre, Peao, Cavalo, Bispo, Rei, Rainha };

module.exports = class Tabuleiro {

    constructor(ladoBrancoId, ladoPretoId, casas = []) {
        if (casas.length < 8) {
            casas = this.tabuleiroCasasInicio(ladoBrancoId, ladoPretoId);
        }
        this.setCasas(casas);
    }

    setCasas(casas = []) {
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

        this.transformaObjetosDasCasasEmPecas(casas);
    }

    tabuleiroCasasInicio(ladoBrancoId, ladoPretoId) {
        return [
            [new Torre(ladoPretoId), new Cavalo(ladoPretoId), new Bispo(ladoPretoId), new Rainha(ladoPretoId), new Rei(ladoPretoId), new Bispo(ladoPretoId), new Cavalo(ladoPretoId), new Torre(ladoPretoId)],
            [new Peao(ladoPretoId), new Peao(ladoPretoId), new Peao(ladoPretoId), new Peao(ladoPretoId), new Peao(ladoPretoId), new Peao(ladoPretoId), new Peao(ladoPretoId), new Peao(ladoPretoId)],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [new Peao(ladoBrancoId), new Peao(ladoBrancoId), new Peao(ladoBrancoId), new Peao(ladoBrancoId), new Peao(ladoBrancoId), new Peao(ladoBrancoId), new Peao(ladoBrancoId), new Peao(ladoBrancoId)],
            [new Torre(ladoBrancoId), new Cavalo(ladoBrancoId), new Bispo(ladoBrancoId), new Rainha(ladoBrancoId), new Rei(ladoBrancoId), new Bispo(ladoBrancoId), new Cavalo(ladoBrancoId), new Torre(ladoBrancoId)],
        ];
    }

    guardaEstado() {
        this.estadoAnterior = null;
        this.estadoAnterior = JSON.stringify(this);
    }

    reverteEstadoAnterior() {
        this.prencheTabuleiro(JSON.parse(this.estadoAnterior));
        this.estadoAnterior = null;
    }

    atualizaCasa(linha, coluna, novoItem) {
        this.casas[linha][coluna] = novoItem;
        this.transformaObjetosDasCasasEmPecas(this.casas);
        return this.casas[linha][coluna];
    }

    recuperaCasa(linha, coluna) {
        return this.casas[linha][coluna];
    }

    recuperaTabuleiro() {
        return this.casas;
    }

    transformaObjetosDasCasasEmPecas(casas = []) {
        const pecasClasses = TipoPecaService.lista();

        casas.forEach((linha, linhaIndex) => {
            linha.forEach((pecaObjeto, colunaIndex) => {

                if (pecaObjeto != null) {
                    const tipoPeca = pecasClasses.find(peca => peca.nome == pecaObjeto.tipo);

                    if (tipoPeca != undefined) {
                        const pecaClasse = new pecasTipos[tipoPeca.classe](pecaObjeto.ladoId);

                        [...pecaObjeto.jogadasRealizadas].forEach(jogadasRealizadas => {
                            pecaClasse.incluiMovimentoRealizado(jogadasRealizadas);
                        });

                        this.casas[linhaIndex][colunaIndex] = pecaClasse;
                    } else {
                        throw "Esse o tipo de peça escolhido para casa da linha:" + linhaIndex + " e coluna:" + colunaIndex + " é inválido (" + JSON.stringify(pecaObjeto) + ")";
                    }
                }

            });
        });
    }

    prencheTabuleiro(tabuleiro) {
        for (var chave in tabuleiro) {
            this[chave] = tabuleiro[chave];
        }
        this.transformaObjetosDasCasasEmPecas(this.casas);
    }
}