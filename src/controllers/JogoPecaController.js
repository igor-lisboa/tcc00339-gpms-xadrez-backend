const JogoService = require("../services/JogoService");

module.exports = {
    possiveisJogadas(req, res) {
        try {
            const { jogoId, casaNome } = req.params;
            const jogo = JogoService.find(jogoId);
            return res.json({
                message: "Possíveis jogadas da peça na casa informada retornadas com sucesso!",
                data: jogo.recuperaMovimentosPossiveisDaPecaDaCasa(casaNome),
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
