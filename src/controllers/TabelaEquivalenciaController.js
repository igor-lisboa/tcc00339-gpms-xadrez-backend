const db = require("../database.json");

module.exports = {
    lista(req, res) {
        try {
            return res.json({
                message: "Tabela de equivalência retornada com sucesso!",
                data: db.tabelaEquivalencia.reverse(),
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
