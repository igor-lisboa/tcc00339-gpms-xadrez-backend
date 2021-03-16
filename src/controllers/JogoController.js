const JogoService = require("../services/JogoService");

module.exports = {
    index(req, res) {
        try {
            return res.json({
                message: "Jogos retornados com sucesso!",
                data: JogoService.index(),
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
    find(req, res) {
        try {
            const { id } = req.params;
            return res.json({
                message: "Jogo retornado com sucesso!",
                data: JogoService.find(id),
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
    create(req, res) {
        try {
            const { tipoJogo } = req.body;
            return res.json({
                message: "Jogo incluído com sucesso!",
                data: JogoService.create(tipoJogo),
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
