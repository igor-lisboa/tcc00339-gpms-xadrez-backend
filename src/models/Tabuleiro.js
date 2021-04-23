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
        this.fotografiasTabuleiro = [];
        this.qtdTurnosSemCapturaOuMovimentoDePeao = 0;
    }

    setCasas(casas = []) {
        this.casas = this.montaTabuleiroVazio();
        this.transformaObjetosDasCasasEmPecas(casas);
    }

    montaTabuleiroVazio() {
        return [
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null]
        ];
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
        this.limpaEstadoAnterior();
        this.estadoAnterior = JSON.stringify(this);
    }

    limpaEstadoAnterior() {
        this.estadoAnterior = null;
    }

    reverteEstadoAnterior() {
        this.prencheTabuleiro(JSON.parse(this.estadoAnterior));
        this.limpaEstadoAnterior();
    }

    atualizaCasa(linha, coluna, novoItem) {
        this.casas[linha][coluna] = novoItem;
        this.transformaObjetosDasCasasEmPecas(this.casas);
        return this.casas[linha][coluna];
    }

    recuperaCasa(linha, coluna) {
        return this.casas[linha][coluna];
    }

    transformaObjetosDasCasasEmPecas(casas = []) {
        const pecasClasses = TipoPecaService.lista();

        casas.forEach((linha, linhaIndex) => {
            linha.forEach((pecaObjeto, colunaIndex) => {

                if (pecaObjeto != null) {

                    if (typeof pecaObjeto == "string") {

                        pecaObjeto = pecaObjeto.split("-");
                        if (pecaObjeto.length != 2) {
                            throw "Peça na casa da linha:" + linhaIndex + " e coluna:" + colunaIndex + " inválida (" + JSON.stringify(pecaObjeto) + ")";
                        }

                        if (pecaObjeto[1] != "1" && pecaObjeto[1] != "0") {
                            throw "Peça na casa da linha:" + linhaIndex + " e coluna:" + colunaIndex + " tem o lado definido de forma incorreta (" + JSON.stringify(pecaObjeto) + ")";
                        }

                        pecaObjeto = {
                            tipo: pecaObjeto[0],
                            ladoId: pecaObjeto[1],
                            jogadasRealizadas: []
                        };
                    }


                    const tipoPeca = pecasClasses.find(peca => peca.nome == pecaObjeto.tipo);

                    if (tipoPeca != undefined) {
                        const pecaClasse = new pecasTipos[tipoPeca.classe](pecaObjeto.ladoId);

                        [...pecaObjeto.jogadasRealizadas].forEach(jogadasRealizadas => {
                            pecaClasse.incluiMovimentoRealizado(jogadasRealizadas);
                        });

                        this.casas[linhaIndex][colunaIndex] = pecaClasse;
                    } else {
                        throw "Esse tipo de peça escolhido para casa da linha:" + linhaIndex + " e coluna:" + colunaIndex + " é inválido (" + JSON.stringify(pecaObjeto) + ")";
                    }
                }

            });
        });
    }

    recuperaTabuleiroCasasSimplificado(superSimples = false) {
        let tabuleiro = this.montaTabuleiroVazio();

        this.casas.forEach((linha, linhaIndex) => {
            linha.forEach((pecaObjeto, colunaIndex) => {

                if (pecaObjeto != null) {
                    let pecaObjSimples = null;

                    if (superSimples) {
                        pecaObjSimples = pecaObjeto.tipo + "-" + pecaObjeto.ladoId;
                    } else {
                        pecaObjSimples = {};
                        pecaObjSimples.tipo = pecaObjeto.tipo;
                        pecaObjSimples.ladoId = pecaObjeto.ladoId;
                        pecaObjSimples.jogadasRealizadasLength = pecaObjeto.jogadasRealizadas.length;
                        pecaObjSimples.valor = pecaObjeto.valor;
                    }

                    tabuleiro[linhaIndex][colunaIndex] = pecaObjSimples;
                }

            });
        });

        return tabuleiro;
    }

    fotografaTabuleiro() {
        let novaFotografia = {
            tabuleiro: this.recuperaTabuleiroCasasSimplificado(true),
            qtdOcorrencias: 1
        };

        let indexFografiaJaRegistrada = null;

        this.fotografiasTabuleiro.forEach((fotografia, index) => {
            if (JSON.stringify(fotografia.tabuleiro) == JSON.stringify(novaFotografia.tabuleiro)) {
                indexFografiaJaRegistrada = index;
            }
        });

        if (indexFografiaJaRegistrada == null) {
            this.fotografiasTabuleiro.push(novaFotografia);
        } else {
            this.fotografiasTabuleiro[indexFografiaJaRegistrada].qtdOcorrencias++;
        }
    }

    prencheTabuleiro(tabuleiro) {
        for (var chave in tabuleiro) {
            this[chave] = tabuleiro[chave];
        }
        this.transformaObjetosDasCasasEmPecas(this.casas);
    }
}