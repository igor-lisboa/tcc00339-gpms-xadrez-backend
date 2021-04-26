module.exports = {
    posicaoNoAlfabeto(text) {
        var result = "";
        for (var i = 0; i < text.length; i++) {
            var code = text.toUpperCase().charCodeAt(i)
            if (code > 64 && code < 91) result += (code - 64) + " ";
        }

        return result.slice(0, result.length - 1);
    }, recuperaNumerosDoNomeDeUmaCasa(casa) {
        casa = casa.split("");
        const letraNumeroCasa = parseInt(this.posicaoNoAlfabeto(casa[0]));
        const numeroCasa = parseInt(casa[1]);
        return { letraNumeroCasa, numeroCasa };
    }
};