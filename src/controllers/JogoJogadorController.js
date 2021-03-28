const JogoService = require("../services/JogoService");

module.exports = {
    insereJogador(req, res) {
        try {
            const { jogoId } = req.params;
            const { ladoId, tipoId, jogadorId } = req.body;
            const jogo = JogoService.encontra(jogoId);
            if(jogo.ladoSemJogador == null){
                req.io.emit('entraJogador');
            }
            if(jogo.ladoSemJogador != null && jogo.ladoSemJogador != -1){
                // procura o adversario na lista de jogadores conectados
                let index = req.jogadoresConectados.indexOf(req.jogadoresConectados.find(jogadorConectado => jogadorConectado.identificador != jogadorId && jogadorConectado.jogoId == jogoId));
                req.jogadoresConectados[index].jogoId = jogo.id;
                const destinoEvento = req.jogadoresConectados[index];

                // se encontrar o adversario na lista de jogadores conectados dispara evento p socket do adversario
                if (destinoEvento != undefined) {
                    req.io.to(destinoEvento.socketId).emit('entraAdversario');
                }
            }
            return res.json({
                message: "Definições do jogador atualizadas com sucesso!",
                data: JogoService.insereJogador(jogoId, ladoId, tipoId),
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
    }
}
