const db = require("../database.json");

module.exports = {
    lista(req, res) {
        try {
            return res.json({
                message: "Lados do jogo retornados com sucesso!",
                data: db.lados,
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
