const db = require('../database.json');

module.exports = {
    index(req, res) {
        try {
            return res.json({
                message: 'Tipos de jogo retornados com sucesso!',
                data: db.tiposJogo,
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
