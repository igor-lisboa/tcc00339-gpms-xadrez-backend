const express = require('express');

const JogoController = require('./controllers/JogoController');

const routes = express.Router();

routes.get('/', (req, res) => {
    return res.json({
        message: 'Olá, esse é nosso XADREZ!',
        data: {
            grupo: [
                'Igor Lisboa',
                'Caio Wey',
                'Victor Marques',
                'Victor Matheus',
                'Milena Verissimo',
                'Matheus Baldas'
            ].sort()
        },
        success: true
    });
});

routes.get('/jogos', JogoController.index);
routes.get('/jogos/:id', JogoController.find);
routes.post('/jogos', JogoController.create);

module.exports = routes;