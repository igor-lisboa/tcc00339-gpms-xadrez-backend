const JogoService = require("../services/JogoService");

module.exports = {
    insereJogador(req, res) {
        try {
            const { jogoId } = req.params;
            const { ladoId, tipoId } = req.body;
            const jogadorEntrou = JogoService.insereJogador(jogoId, ladoId, tipoId);

            // recupera lado adversario
            const ladoAdversario = JogoService.recuperaLadoTipo(jogoId, JogoService.recuperaIdLadoAdversarioPeloId(ladoId));

            let jogadorIdentificador = undefined;

            // define parametro q sera usado p buscar socket do adversario
            if (ladoAdversario.tipoId == 0) {
                jogadorIdentificador = jogoId + "-" + ladoAdversario.ladoId;
            } else {
                jogadorIdentificador = "I.A.";
            }

            // procura o adversario na lista de jogadores conectados
            const destinoEvento = req.jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador == jogadorIdentificador);

            // se encontrar o adversario na lista de jogadores conectados dispara evento p socket do adversario
            if (destinoEvento != undefined) {
                req.io.to(destinoEvento.socketId).emit('adversarioEntrou');
                if (req.verbose) {
                    console.log("Enviando mensagem de adversarioEntrou para " + destinoEvento.identificador + "...");
                }
            }

            return res.json({
                message: "Definições do jogador atualizadas com sucesso!",
                data: jogadorEntrou,
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
    }, recuperaLadosSemJogador(req, res) {
        try {
            const { jogoId } = req.params;
            return res.json({
                message: "Lados que estão sem jogador retornados com sucesso!",
                data: JogoService.recuperaLadosSemJogador(jogoId),
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
    removeJogador(req, res) {
        try {
            const { jogoId, ladoId } = req.params;
            const jogadorDesistiu = JogoService.removeJogador(jogoId, ladoId);
            return res.json({
                message: "Desistência do jogador realizada com sucesso!",
                data: jogadorDesistiu,
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
