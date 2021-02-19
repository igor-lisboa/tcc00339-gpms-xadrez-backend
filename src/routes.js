const express = require('express');

const JogoController = require('./controllers/JogoController');

const routes = express.Router();

routes.get('/jogos', JogoController.index);
routes.get('/jogos/:id', JogoController.find);
routes.post('/jogos', JogoController.create);

module.exports = routes;