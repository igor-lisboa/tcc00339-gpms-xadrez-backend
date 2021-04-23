const TipoPecaService = require("../services/TipoPecaService");

module.exports = {
    lista(req, res) {
        try {
            return res.json({
                message: "Tipos de peça retornados com sucesso!",
                data: TipoPecaService.lista(),
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
    listaPromocaoPeao(req, res) {
        try {
            return res.json({
                message: "Possíveis peças para promover um peão retornadas com sucesso!",
                data: TipoPecaService.listaPromocaoPeao(),
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
