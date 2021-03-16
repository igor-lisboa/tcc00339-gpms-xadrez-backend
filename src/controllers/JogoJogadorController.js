const JogoService = require("../services/JogoService");

module.exports = {
    insereJogador(req, res) {
        try {
            const { jogoId } = req.params;
            const { ladoId, tipoId } = req.body;
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
    },
}
