const LadoService = require("../services/LadoService");

module.exports = {
    lista(req, res) {
        try {
            return res.json({
                message: "Lados do jogo retornados com sucesso!",
                data: LadoService.lista(),
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
