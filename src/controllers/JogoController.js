const JogoService = require('../services/JogosService');

module.exports = {
    index(req, res) {
        return res.json(JogoService.index());
    },
    find(req, res) {
        const { id } = req.params;
        return res.json(JogoService.find(id));
    },
    create(req, res) {
        return res.json(JogoService.create());
    }
}
