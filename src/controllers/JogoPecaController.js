const JogoService = require("../services/JogoService");

module.exports = {
    lista(req, res) {
        try {
            const { jogoId } = req.params;
            const ladoId = req.headers.lado;
            return res.json({
                message: "Peças retornadas com sucesso!",
                data: JogoService.recuperaTodasAsPecasDeUmLado(jogoId, ladoId),
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    },
    possiveisJogadas(req, res) {
        try {
            const { jogoId, casaNome } = req.params;
            const ladoId = req.headers.lado;
            return res.json({
                message: "Possíveis jogadas da peça na casa informada retornadas com sucesso!",
                data: JogoService.recuperaPossiveisMovimentosDaPecaDeUmLado(jogoId, ladoId, casaNome),
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    },
    realizaJogada(req, res) {
        try {
            const { jogoId, casaOrigem, casaDestino } = req.params;
            const ladoId = req.headers.lado;
            const jogadaRealizada = JogoService.realizaJogada(jogoId, ladoId, casaOrigem, casaDestino);

            // recupera lado adversario
            const ladoAdversario = JogoService.recuperaLadoTipo(jogoId, JogoService.recuperaIdLadoAdversarioPeloId(ladoId));

            let jogadorIdentificador = undefined;

            // define parametro q sera usado p buscar socket do adversario
            if (ladoAdversario.tipoId == 0) {
                jogadorIdentificador = jogoId + "-" + ladoId;
            } else {
                jogadorIdentificador = "I.A.";
            }

            // procura o adversario na lista de jogadores conectados
            const destinoEvento = req.jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador);

            // se encontrar o adversario na lista de jogadores conectados dispara evento p socket do adversario
            if (destinoEvento != undefined) {
                req.io.to(destinoEvento.socketId).emit('jogadaRealizada');
            }

            return res.json({
                message: "Jogada realizada com sucesso!",
                data: jogadaRealizada,
                success: true
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    }
}
