const db = require("../database.json");

module.exports = {
    index(req, res) {
        try {
            return res.json({
                message: "Tipos de jogador retornados com sucesso!",
                data: db.ladoTipos,
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
