const tipoJogoService = require("../services/TipoJogoService");

module.exports = {
    index(req, res) {
        try {
            return res.json({
                message: "Tipos de jogo retornados com sucesso!",
                data: tipoJogoService.index(),
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
