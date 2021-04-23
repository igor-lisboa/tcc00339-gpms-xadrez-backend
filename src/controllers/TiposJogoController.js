const TipoJogoService = require("../services/TipoJogoService");

module.exports = {
    lista(req, res) {
        try {
            return res.json({
                message: "Tipos de jogo retornados com sucesso!",
                data: TipoJogoService.lista(),
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
