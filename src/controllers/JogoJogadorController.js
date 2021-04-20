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
            return res.json({
                message: "Desistência do jogador realizada com sucesso!",
                data: JogoService.removeJogador(jogoId, ladoId),
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
