const TabelaEquivalenciaService = require("../services/TabelaEquivalenciaService");

module.exports = {
    lista(req, res) {
        try {
            return res.json({
                message: "Tabela de equivalência retornada com sucesso!",
                data: TabelaEquivalenciaService.listaReverse(),
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
