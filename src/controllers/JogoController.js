const JogoService = require('../services/JogoService');

module.exports = {
    index(req, res) {
        try {
            const jogos = JogoService.index();
            return res.json({
                message: 'Jogos retornados com sucesso!',
                data: jogos,
                success: true
            });
        } catch (e) {
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
            const jogo = JogoService.find(id);
            return res.json({
                message: 'Jogo retornado com sucesso!',
                data: jogo,
                success: true
            });
        } catch (e) {
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    },
    create(req, res) {
        try {
            const jogo = JogoService.create();
            return res.json({
                message: 'Jogo incluído com sucesso!',
                data: jogo,
                success: true
            });
        } catch (e) {
            return res.status(500).json({
                message: e,
                data: null,
                success: false
            });
        }
    }
}
